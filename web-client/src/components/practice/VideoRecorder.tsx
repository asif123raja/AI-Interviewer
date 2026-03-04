"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Camera, Square, VideoOff, Loader2, Eye, EyeOff } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { InterviewConfig } from "./InterviewSetup";
import { FaceAnalyzer, type FaceMetrics } from "@/lib/face_analyzer";

interface VideoRecorderProps {
    config: InterviewConfig;
}

export function VideoRecorder({ config }: VideoRecorderProps) {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const analyzerRef = useRef<FaceAnalyzer | null>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [time, setTime] = useState(0);
    const [overlayVisible, setOverlayVisible] = useState(false);
    const [overlayReady, setOverlayReady] = useState(false);

    // Interview flow state
    const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [totalQuestions] = useState(2); // 2 for testing
    const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [qnaPairs, setQnaPairs] = useState<{ question: string; answer: string }[]>([]);
    const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
    const [interviewResult, setInterviewResult] = useState<any>(null);

    // Refs for closure access
    const currentQuestionRef = useRef<string | null>(null);
    const questionNumberRef = useRef(0);
    const qnaPairsRef = useRef<{ question: string; answer: string }[]>([]);

    const updateQnaPairs = (pairs: { question: string; answer: string }[]) => {
        setQnaPairs(pairs);
        qnaPairsRef.current = pairs;
    };
    const updateCurrentQuestion = (q: string | null) => {
        setCurrentQuestion(q);
        currentQuestionRef.current = q;
    };
    const updateQuestionNumber = (n: number) => {
        setQuestionNumber(n);
        questionNumberRef.current = n;
    };

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecordingAnswer) interval = setInterval(() => setTime((t) => t + 1), 1000);
        else setTime(0);
        return () => clearInterval(interval);
    }, [isRecordingAnswer]);

    // Cleanup
    useEffect(() => {
        return () => {
            stream?.getTracks().forEach((t) => t.stop());
            analyzerRef.current?.destroy();
        };
    }, [stream]);

    // ── Face Overlay Toggle ──────────────────────────────────────────────────
    const initAnalyzer = useCallback(async () => {
        if (analyzerRef.current || !videoRef.current || !canvasRef.current) return;
        const analyzer = new FaceAnalyzer();
        await analyzer.init();
        analyzerRef.current = analyzer;
        setOverlayReady(true);
    }, []);

    const toggleOverlay = async () => {
        if (!overlayVisible) {
            // First time: initialise lazily
            if (!analyzerRef.current) {
                setIsProcessing(true);
                await initAnalyzer();
                setIsProcessing(false);
            }
            if (videoRef.current && canvasRef.current && analyzerRef.current) {
                analyzerRef.current.start(videoRef.current, canvasRef.current);
            }
            setOverlayVisible(true);
        } else {
            // Pause (don't fully stop — we still collect metrics)
            // Just hide the canvas; the analyzer keeps running for metrics
            setOverlayVisible(false);
        }
    };

    // ── Media Permissions ────────────────────────────────────────────────────
    const requestPermissions = async () => {
        try {
            stream?.getTracks().forEach((t) => t.stop());
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(mediaStream);
            setHasPermission(true);
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
        } catch (err) {
            console.error("Media devices error:", err);
            setHasPermission(false);
        }
    };

    // ── Interview Logic ──────────────────────────────────────────────────────
    const fetchNextQuestion = async (history: { question: string; answer: string }[]) => {
        setIsProcessing(true);
        try {
            const res = await fetchWithAuth("/interview-api/next-question", {
                method: "POST",
                body: JSON.stringify({
                    domain: config.domain,
                    subtopic: config.subtopic,
                    experienceLevel: config.experienceLevel,
                    difficulty: config.difficulty,
                    history,
                    customPrompt: config.customPrompt,
                }),
            });
            updateCurrentQuestion(res.question);
            updateQuestionNumber(questionNumberRef.current + 1);
            playQuestionTTS(res.question);
        } catch (e) {
            console.error("Failed to fetch next question", e);
            alert("Failed to load next question.");
        } finally {
            setIsProcessing(false);
        }
    };

    const startInterview = () => {
        if (!hasPermission) return;
        // Auto-start analyzer when interview begins
        initAnalyzer().then(() => {
            if (videoRef.current && canvasRef.current && analyzerRef.current) {
                analyzerRef.current.start(videoRef.current, canvasRef.current);
            }
        });
        fetchNextQuestion([]);
    };

    const playQuestionTTS = async (text: string) => {
        setIsSpeakingQuestion(true);
        try {
            const res = await fetchWithAuth("/interview-api/tts", {
                method: "POST",
                body: JSON.stringify({ text }),
            });
            const audio = new Audio(`data:audio/mp3;base64,${res.audioContent}`);
            audio.onended = () => {
                setIsSpeakingQuestion(false);
                startAnswerRecording();
            };
            audio.play();
        } catch {
            setIsSpeakingQuestion(false);
            startAnswerRecording();
        }
    };

    const startAnswerRecording = async () => {
        let activeStream = stream;
        if (!activeStream?.active) {
            try {
                activeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(activeStream);
                if (videoRef.current) videoRef.current.srcObject = activeStream;
            } catch (err) {
                console.error("Failed to re-acquire media stream", err);
                return;
            }
        }

        audioChunksRef.current = [];
        const typesToTry = ["audio/webm", "audio/mp4", "audio/ogg", ""];
        let mimeType = "";
        for (const t of typesToTry) {
            if (t === "" || MediaRecorder.isTypeSupported(t)) { mimeType = t; break; }
        }

        try {
            const audioStream = new MediaStream(activeStream!.getAudioTracks());
            const mr = mimeType ? new MediaRecorder(audioStream, { mimeType }) : new MediaRecorder(audioStream);

            mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mr.onstop = async () => {
                setIsProcessing(true);
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
                const formData = new FormData();
                formData.append("audio", audioBlob, "answer.webm");

                try {
                    const res = await fetchWithAuth("/interview-api/stt", { method: "POST", body: formData });
                    const newPairs = [
                        ...qnaPairsRef.current,
                        { question: currentQuestionRef.current || "Unknown", answer: res.text || "(No answer detected)" },
                    ];
                    updateQnaPairs(newPairs);

                    if (questionNumberRef.current < totalQuestions) {
                        await fetchNextQuestion(newPairs);
                    } else {
                        await submitInterview(newPairs);
                    }
                } catch {
                    const fallback = qnaPairsRef.current;
                    if (questionNumberRef.current < totalQuestions) {
                        await fetchNextQuestion(fallback);
                    } else {
                        await submitInterview(fallback);
                    }
                } finally {
                    setIsProcessing(false);
                }
            };

            mediaRecorderRef.current = mr;
            mr.start();
            setIsRecordingAnswer(true);
        } catch (e) {
            console.error("MediaRecorder start error:", e);
            alert("Error: Your browser does not support audio recording. Please try Chrome.");
        }
    };

    const finishAnswer = () => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecordingAnswer(false);
        }
    };

    const submitInterview = async (finalPairs: any[]) => {
        setIsProcessing(true);

        // Collect face metrics
        let faceMetrics: FaceMetrics | null = null;
        if (analyzerRef.current) {
            faceMetrics = analyzerRef.current.stop();
            setOverlayVisible(false);
        }

        try {
            const evaluation = await fetchWithAuth("/interview-api/evaluate", {
                method: "POST",
                body: JSON.stringify({
                    qnaPairs: finalPairs,
                    domain: config.domain,
                    subtopic: config.subtopic,
                    experienceLevel: config.experienceLevel,
                }),
            });

            try {
                const saveResult = await fetchWithAuth("/interview-api/save-report", {
                    method: "POST",
                    body: JSON.stringify({
                        qnaPairs: finalPairs,
                        domain: config.domain,
                        subtopic: config.subtopic,
                        experienceLevel: config.experienceLevel,
                        customPrompt: config.customPrompt,
                        evaluation,
                        faceMetrics, // ← sent to backend for ML service
                    }),
                });
                router.push(`/report/${saveResult.reportId}`);
                return;
            } catch (saveErr) {
                console.error("Save failed, showing inline results:", saveErr);
                setInterviewResult(evaluation);
            }
        } catch {
            setInterviewResult({
                overallScore: 7, technicalScore: 7, communicationScore: 7,
                strengths: ["Completed the interview"],
                areasForImprovement: ["Provide more detailed answers"],
                recommendation: "Consider",
                summary: "Interview complete. Evaluation unavailable.",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    // ── Results Panel ────────────────────────────────────────────────────────
    if (interviewResult) {
        return (
            <div className="flex flex-col items-center w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 text-green-400 rounded-full text-sm font-semibold mb-4">✅ Interview Complete</div>
                    <h2 className="text-3xl font-bold">Your Results</h2>
                    <p className="text-muted-foreground mt-1">AI evaluation powered by GPT-4o</p>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6 w-full">
                    {[{ label: "Overall", score: interviewResult.overallScore }, { label: "Technical", score: interviewResult.technicalScore }, { label: "Communication", score: interviewResult.communicationScore }].map(({ label, score }) => (
                        <div key={label} className="glass-card p-5 rounded-2xl text-center border border-border/50">
                            <div className={`text-4xl font-bold mb-1 ${score >= 7 ? "text-green-400" : score >= 5 ? "text-amber-400" : "text-red-400"}`}>{score}<span className="text-xl text-muted-foreground">/10</span></div>
                            <p className="text-sm text-muted-foreground font-medium">{label}</p>
                        </div>
                    ))}
                </div>
                <div className={`w-full p-4 rounded-xl mb-6 text-center font-bold text-lg border ${interviewResult.recommendation === "Hire" ? "bg-green-500/10 border-green-500/30 text-green-400" : interviewResult.recommendation === "Reject" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400"}`}>
                    Recommendation: {interviewResult.recommendation}
                </div>
                <div className="glass-card p-5 rounded-2xl mb-6 border border-border/50 w-full">
                    <p className="text-muted-foreground leading-relaxed">{interviewResult.summary}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 w-full">
                    <div className="glass-card p-5 rounded-2xl border border-green-500/20">
                        <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-3">Strengths</h4>
                        <ul className="space-y-1.5">{interviewResult.strengths?.map((s: string, i: number) => (<li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-green-500">✓</span>{s}</li>))}</ul>
                    </div>
                    <div className="glass-card p-5 rounded-2xl border border-amber-500/20">
                        <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">Areas to Improve</h4>
                        <ul className="space-y-1.5">{interviewResult.areasForImprovement?.map((s: string, i: number) => (<li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-amber-500">→</span>{s}</li>))}</ul>
                    </div>
                </div>
                <div className="w-full mb-8">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Full Transcript</h4>
                    <div className="space-y-3">
                        {qnaPairs.map((pair, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-muted/40 border border-border/50 text-sm space-y-2">
                                <p className="font-medium text-foreground"><span className="text-primary">Q{idx + 1}:</span> {pair.question}</p>
                                <p className="text-muted-foreground"><span className="text-zinc-500 font-medium">You:</span> "{pair.answer}"</p>
                            </div>
                        ))}
                    </div>
                </div>
                <button onClick={() => router.push("/dashboard")} className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/30">
                    Go to Dashboard
                </button>
            </div>
        );
    }

    // ── Interview UI ─────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
            {/* Status Header */}
            {questionNumber > 0 && (
                <div className="w-full mb-4 flex justify-between items-center text-sm font-medium text-zinc-400">
                    <span>Question {questionNumber} of {totalQuestions}</span>
                    <div className="flex items-center gap-4">
                        {isProcessing && <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{currentQuestion ? "Processing answer..." : "Generating question..."}</span>}
                        {isSpeakingQuestion && <span className="text-primary animate-pulse">AI is speaking...</span>}
                    </div>
                </div>
            )}

            {/* Live Q&A Transcript */}
            {qnaPairs.length > 0 && (
                <div className="w-full mb-6 max-h-48 overflow-y-auto pr-2 space-y-3">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider sticky top-0 bg-background/80 backdrop-blur-sm pb-2">Transcript So Far</h4>
                    {qnaPairs.map((pair, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-muted/40 border border-border/50 text-sm space-y-2">
                            <p className="font-medium text-foreground"><span className="text-primary">Q{idx + 1}:</span> {pair.question}</p>
                            <p className="text-muted-foreground"><span className="text-zinc-500 font-medium">You:</span> "{pair.answer}"</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Video + Canvas Overlay Container */}
            <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 mb-8">

                {/* Permission gate */}
                {!hasPermission && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-sm z-10 px-4 text-center">
                        <div className="p-4 bg-primary/20 rounded-full mb-4"><Camera className="h-8 w-8 text-primary" /></div>
                        <h3 className="text-xl font-semibold mb-2 text-white">Camera & Microphone Access</h3>
                        <p className="text-zinc-400 mb-6 max-w-sm">We need access to your camera and microphone for the interview.</p>
                        <Button onClick={requestPermissions} size="lg" variant="gradient">Enable Access</Button>
                    </div>
                )}

                {/* Recording indicator */}
                {isRecordingAnswer && (
                    <div className="absolute top-6 right-6 flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 z-20">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-white font-mono font-medium">{formatTime(time)}</span>
                    </div>
                )}

                {/* Face overlay toggle button */}
                {hasPermission && questionNumber > 0 && (
                    <button
                        onClick={toggleOverlay}
                        title={overlayVisible ? "Hide face analysis overlay" : "Show face analysis overlay"}
                        className={`absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-2 rounded-full border backdrop-blur-md text-xs font-semibold transition-all ${overlayVisible
                                ? "bg-primary/20 border-primary/50 text-primary"
                                : "bg-black/50 border-white/20 text-white/70 hover:text-white"
                            }`}
                    >
                        {overlayVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {overlayVisible ? "Analysis ON" : "Analysis OFF"}
                    </button>
                )}

                {/* MediaPipe canvas overlay */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none transition-opacity duration-300"
                    style={{ opacity: overlayVisible ? 1 : 0 }}
                />

                {/* Question overlay */}
                {currentQuestion && !isProcessing && (
                    <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col gap-2">
                        <div className="bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-lg">
                            <p className="text-white text-lg font-medium animate-in fade-in slide-in-from-bottom-2">{currentQuestion}</p>
                        </div>
                    </div>
                )}

                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />

                {hasPermission && !stream && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <VideoOff className="h-12 w-12 text-zinc-600" />
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="glass-card w-full max-w-md p-4 rounded-2xl flex items-center justify-center gap-4">
                {questionNumber === 0 ? (
                    <Button
                        variant="gradient"
                        className="rounded-full h-14 px-8 shadow-lg shadow-primary/30"
                        onClick={startInterview}
                        disabled={!hasPermission || isProcessing}
                    >
                        {isProcessing ? <Loader2 className="animate-spin" /> : "Start Interview"}
                    </Button>
                ) : (
                    <Button
                        variant="destructive"
                        className="rounded-full h-14 px-8 gap-2 shadow-lg shadow-red-500/30 animate-in zoom-in"
                        onClick={finishAnswer}
                        disabled={!isRecordingAnswer || isProcessing}
                    >
                        <Square className="h-4 w-4 fill-current" />
                        {questionNumber === totalQuestions ? "Finish Interview" : "Next Question"}
                    </Button>
                )}
            </div>
        </div>
    );
}
