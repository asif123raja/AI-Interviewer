import os
import asyncio
import requests
import json
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
import google.generativeai as genai

VECTOR_DB_URL = os.getenv("VECTOR_DB_URL", "http://localhost:6333")
NEST_API_URL = os.getenv("NEST_API_URL", "http://localhost:3000")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def store_timeline_in_qdrant_and_summarize(user_id: str, face_metrics: dict, payload_metrics: dict) -> str:
    if not face_metrics:
        print("[ML PIPELINE] No face_metrics provided. Skipping Vector DB.")
        return ""

    timeline = face_metrics.get('timeline', [])
    summary_str = ""

    try:
        client = QdrantClient(url=VECTOR_DB_URL)
        collection_name = "user_behaviors"
        if not client.collection_exists(collection_name=collection_name):
            client.create_collection(
                collection_name=collection_name,
                vectors_config={"size": 5, "distance": "Cosine"}
            )

        points = []
        emotion_durations = {}

        # 1. Process Timeline
        for item in timeline:
            time_sec = item.get("timestampSec", 0)
            emotion = item.get("emotion", "Neutral")
            anx_score = item.get("anxietyScore", 0)
            
            # Simple 5D vector: [time_sec, anx_score, 0, 0, 0]
            vector = [float(time_sec), float(anx_score), 0.0, 0.0, 0.0]
            
            points.append(PointStruct(
                id=abs(hash(f"{user_id}_{time_sec}_{emotion}")),
                vector=vector,
                payload={"user_id": user_id, "time_sec": time_sec, "emotion": emotion, "type": "timeline_snapshot"}
            ))
            
            emotion_durations[emotion] = emotion_durations.get(emotion, 0) + 2 # We snapshot every 2 seconds

        if points:
            client.upsert(collection_name=collection_name, points=points)
            print(f"[ML PIPELINE] Stored {len(points)} timeline snapshots in Qdrant temporarily.")

        # 2. Build Summary String for LLM
        if emotion_durations:
            summary_str = "\\n".join([f"- {emo}: {sec} seconds" for emo, sec in emotion_durations.items()])

        # 3. Clean up (Delete the vectors) because we only use Qdrant temporarily as requested
        # Wait until after we generated the summary to delete
        try:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            client.delete(
                collection_name=collection_name,
                points_selector=Filter(
                    must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
                )
            )
            print(f"[ML PIPELINE] Deleted temporary Qdrant vectors for user {user_id}")
        except Exception as del_e:
            print(f"[ML PIPELINE] Could not delete vectors: {del_e}")

    except Exception as e:
        print(f"[ML PIPELINE] Qdrant Error: {e}")

    return summary_str

async def execute_ml_pipeline(
    user_id: str, 
    metrics: dict, 
    interview_type: str,
    domain: str = "General",
    subtopic: str = None,
    custom_prompt: str = None,
    face_metrics: dict = None,
    facial_analysis_enabled: bool = True
):
    print(f"\n🚀 --- STARTING LLM ANALYTICS FOR USER {user_id} --- ")
    print(f"📊 CONTEXT   -> Domain: {domain} | Subtopic: {subtopic} | Custom: {custom_prompt}")
    print(f"📈 METRICS   -> {metrics}")
    
    if not facial_analysis_enabled:
        print(f"[ML PIPELINE] Skipping facial analysis features due to subscription tier limits.")
        face_metrics = None
    
    # 1. Vector DB Temporary Storage & Timeline Calculation
    # The frontend extracted FaceMetrics via MediaPipe timeline snapshots
    emotion_summary = store_timeline_in_qdrant_and_summarize(user_id, face_metrics, metrics)

    # 2. Extract Master Prompt Configurations
    master_config = metrics.get('masterPromptConfig', {})
    experience_level = master_config.get('experienceLevel', 'intermediate')
    difficulty = master_config.get('difficulty', 'medium')
    interview_time_limit = master_config.get('timeLimitMinutes', 30)
    
    # 3. Construct Master Prompt
    system_instruction = f"""
    ## ROLE
    You are an advanced AI Interviewer and Evaluation Agent.
    You conduct structured, domain-specific interviews across multiple professional domains, evaluate responses technically and behaviorally, and provide detailed feedback.
    You must behave like a professional human interviewer.
    
    ## INPUT CONTEXT
    - Domain: {domain}
    - Subtopic: {subtopic}
    - Experience Level: {experience_level}
    - Interview Type: {interview_type}
    - Difficulty: {difficulty}
    - Custom Focus: {custom_prompt or 'None'}
    """
    system_instruction += f"""
    ## CONFIDENCE / NERVOUSNESS ML SIGNALS
    The user's client-side behavioral algorithm reported:
    - Average Confidence: {metrics.get('avgConfidenceScore')}
    - Nervous Moments: {metrics.get('nervousMoments')}
    - Eye Contact Ratio: {metrics.get('eyeContactRatio')}
    - Smile Frequency: {metrics.get('smileFrequency')}
    """

    if face_metrics:
        system_instruction += f"""
    ## HIGH-FIDELITY FACIAL ANALYSIS (MediaPipe + CNN)
    The client-side neural networks analyzed the user's face at 30fps and extracted these precise behavioral indicators:
    - Blink Rate: {face_metrics.get('blinkRate')} blinks/minute (Normal is 15-20. >30 indicates high anxiety).
    - Head Pitch: {face_metrics.get('avgHeadPitch')} degrees (Negative means looking down/avoidant, positive means looking up).
    - Gaze Centering Ratio: {face_metrics.get('avgGazeRatio')} (0 to 1. Higher means maintaining strong eye contact with the camera).
    - Composite ML Anxiety Score: {face_metrics.get('anxietyScore')} / 100
    - Composite ML Confidence Score: {face_metrics.get('confidenceScore')} / 100
    
    ### Emotion Timeline Tracking:
    The ML service tracked the duration of the user's facial emotions over time. Below is the total time spent in each emotion state:
    {emotion_summary}
    """

    system_instruction += """
    You must intelligently interpret these signals (e.g. high blink rate + looking down -> high anxiety) and incorporate them deeply into the final behavioral feedback.
    """

    qna_pairs = metrics.get('qnaPairs', [])
    if qna_pairs:
        system_instruction += "\n## INTERVIEW TRANSCRIPT\nHere are the Questions asked and the user's Answers:\n"
        for i, pair in enumerate(qna_pairs):
            system_instruction += f"Q{i+1}: {pair.get('question')}\nA{i+1}: {pair.get('answer')}\n\n"

    system_instruction += """
    ## EVALUATION CRITERIA & FINAL OUTPUT FORMAT
    Based on the above transcript and behavioral signals, calculate the final scores out of 100 for overall, technical, and behavioral performance.
    
    You MUST return ONLY a valid JSON object matching exactly this structure (no markdown block formatting, just raw JSON):
    {
      "overall_score": 78,
      "technical_score": 82,
      "behavioral_score": 74,
      "confidence_level": "Moderate",
      "summary": "Detailed overall summary...",
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1", "Weakness 2"],
      "improvements": [
        {"question_number": 1, "feedback": "Detailed feedback for answer 1..."}
      ],
      "recommended_learning_path": ["Study Topic A", "Review Topic B"]
    }
    """
    
    print(f"[LLM Core] Calling Gemini API...")
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(system_instruction)
        
        # Clean response string to ensure valid JSON mapping
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        llm_feedback = json.loads(response_text)
        print(f"[LLM Core] Successfully parsed Gemini Master Prompt feedback.")
    except Exception as e:
        print(f"[LLM Core] Failed to generate or parse Gemini feedback: {e}")
        llm_feedback = {
            "overall_score": 50,
            "technical_score": 50,
            "behavioral_score": 50,
            "confidence_level": "Unknown",
            "summary": "Failed to generate AI feedback.",
            "strengths": [],
            "weaknesses": [],
            "improvements": [],
            "recommended_learning_path": []
        }
    
    # 3. Post the Final Report back to NestJS Webhook
    try:
        report_payload = {
            "userId": user_id,
            "interviewType": interview_type,
            "domain": domain,
            "subtopic": subtopic,
            "customPrompt": custom_prompt,
            "metrics": metrics,
            "llmFeedback": llm_feedback,
            "fullReport": {"raw_prompt": system_instruction, "result": llm_feedback}
        }
        res = requests.post(f"{NEST_API_URL}/reports/webhook", json=report_payload)
        print(f"[ML PIPELINE] Successfully pushed final report to NestJS: Status {res.status_code}")
    except Exception as e:
        print(f"[ML PIPELINE] Webhook Error: {e}")

    print(f"✅ --- PIPELINE FINISHED FOR USER {user_id} --- \n")
