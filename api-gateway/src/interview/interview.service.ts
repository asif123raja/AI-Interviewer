import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as textToSpeech from '@google-cloud/text-to-speech';
import { createClient } from '@deepgram/sdk';
import OpenAI from 'openai';

@Injectable()
export class InterviewService {
    private readonly logger = new Logger(InterviewService.name);
    private ttsClient: textToSpeech.TextToSpeechClient;
    private deepgram: any;
    private openai: OpenAI;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService
    ) {
        // Initialize Google TTS
        const projectId = this.configService.get<string>('GOOGLE_TTS_PROJECT_ID');
        const clientEmail = this.configService.get<string>('GOOGLE_TTS_CLIENT_EMAIL');
        const rawPrivateKey = this.configService.get<string>('GOOGLE_TTS_PRIVATE_KEY');

        let privateKey = '';
        if (rawPrivateKey) {
            privateKey = rawPrivateKey.replace(/\\n/g, '\n');
        }

        if (projectId && clientEmail && privateKey) {
            this.ttsClient = new textToSpeech.TextToSpeechClient({
                credentials: {
                    client_email: clientEmail,
                    private_key: privateKey,
                },
                projectId,
            });
            this.logger.log('Google TTS Client initialized.');
        } else {
            this.logger.warn('Google TTS Credentials missing or incomplete. TTS will not work.');
        }

        // Initialize Deepgram
        const deepgramApiKey = this.configService.get<string>('DEEPGRAM_API_KEY');
        if (deepgramApiKey) {
            this.deepgram = createClient(deepgramApiKey);
            this.logger.log('Deepgram Client initialized.');
        } else {
            this.logger.warn('Deepgram API Key missing. STT will not work.');
        }

        // Initialize OpenAI
        const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (openaiApiKey) {
            this.openai = new OpenAI({ apiKey: openaiApiKey });
            this.logger.log('OpenAI Client initialized.');
        } else {
            this.logger.warn('OpenAI API Key missing. AI Question generation will not work.');
        }
    }

    async generateNextQuestion(
        domain: string,
        subtopic: string,
        experienceLevel: string,
        difficulty: string,
        history: { question: string, answer: string }[],
        customPrompt?: string
    ) {
        if (!this.openai) {
            throw new Error('OpenAI API is not configured.');
        }

        const sessionId = Date.now(); // unique per request — forces fresh generation every time
        const systemPrompt = `You are an expert AI interviewer. Session ID: ${sessionId}
Domain: ${domain || 'General Technology'}
Experience Level: ${experienceLevel || 'Intermediate'}
Difficulty: ${difficulty || 'Medium'}
${subtopic ? `Subtopic: ${subtopic}` : ''}
${customPrompt ? `Special Instructions: ${customPrompt}` : ''}

STRICT RULES:
- Ask ONE unique question. Return ONLY the raw question text, no prefix, no numbering, no markdown.
- NEVER repeat or rephrase a question already asked in this session.
- NEVER start with "Tell me about yourself" for technical domains.
- Each question must be different, specific, and progressively deeper.
- The session ID above is unique — treat this as a completely fresh interview context.`;

        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt }
        ];

        if (history && history.length > 0) {
            for (const item of history) {
                messages.push({ role: 'assistant', content: item.question });
                messages.push({ role: 'user', content: item.answer || '(no answer given)' });
            }
            messages.push({
                role: 'user',
                content: `Ask the next interview question. It must be completely different from everything asked so far and dig deeper into my performance.`
            });
        } else {
            messages.push({
                role: 'user',
                content: `Begin the interview. Give me a sharp, specific opening question for a ${experienceLevel || 'Intermediate'} ${subtopic || domain} interview. Not generic.`
            });
        }

        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages,
                max_tokens: 200,
                temperature: 1.0,
            });

            const questionText = completion.choices[0]?.message?.content?.trim() || '';
            this.logger.log(`Generated question [${history.length + 1}]: ${questionText.substring(0, 80)}`);
            return { question: questionText };
        } catch (error) {
            this.logger.error(`OpenAI error generating question: ${error.message}`);
            return { question: `Can you walk me through your experience with ${subtopic || domain} and a specific challenge you solved?` };
        }
    }

    async evaluateInterview(
        qnaPairs: { question: string, answer: string }[],
        domain: string,
        subtopic: string,
        experienceLevel: string,
    ) {
        if (!this.openai) {
            throw new Error('OpenAI API is not configured.');
        }

        const transcript = qnaPairs.map((p, i) =>
            `Q${i + 1}: ${p.question}\nA${i + 1}: ${p.answer}`
        ).join('\n\n');

        const prompt = `You are a STRICT, BRUTALLY HONEST senior hiring manager evaluating a ${experienceLevel} ${subtopic || domain} interview.

Interview Transcript:
${transcript}

EVALUATION RULES:
1. DO NOT BE GENEROUS. You must provide the harsh truth. 
2. Do NOT default to "middle-of-the-road" scores like 7/10 or 50% just to be polite. 
3. If an answer is poor, brief, completely wrong, or overly generic, you MUST give it a low score (e.g. 1/10, 2/10, 3/10).
4. Only award 8/10 or higher for truly exceptional, highly detailed answers.
5. If the candidate barely spoke or failed to elaborate, their Communication and Technical scores should reflect critical failure.

Evaluate and return a JSON object with:
{
  "overallScore": (number 1-10, be extremely strict),
  "technicalScore": (number 1-10, be extremely strict),
  "communicationScore": (number 1-10, be extremely strict),
  "strengths": ["list of strengths, or leave empty if none"],
  "areasForImprovement": ["list of brutal, honest areas for improvement"],
  "recommendation": "Hire | Consider | Reject" (Default to Reject if answers are poor),
  "summary": "2-3 sentence honest, critical summary. Do not sugarcoat."
}

Return only valid JSON, no markdown.`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 600,
                temperature: 0.3,
            });

            const raw = completion.choices[0]?.message?.content?.trim() || '{}';
            return JSON.parse(raw);
        } catch (error) {
            this.logger.error(`Evaluation error: ${error.message}`);
            return {
                overallScore: 7,
                technicalScore: 7,
                communicationScore: 7,
                strengths: ['Completed the interview'],
                areasForImprovement: ['Provide more detailed answers'],
                recommendation: 'Consider',
                summary: 'Interview completed. Manual review recommended.'
            };
        }
    }

    async generateSpeech(text: string): Promise<string> {
        if (!this.ttsClient) {
            throw new Error('TTS Client not initialized.');
        }

        const request = {
            input: { text: text },
            voice: { languageCode: 'en-US', name: 'en-US-Journey-D' },
            audioConfig: { audioEncoding: 'MP3' as const },
        };

        try {
            const [response] = await this.ttsClient.synthesizeSpeech(request);
            if (response.audioContent instanceof Uint8Array) {
                return Buffer.from(response.audioContent).toString('base64');
            } else if (typeof response.audioContent === 'string') {
                return response.audioContent;
            }
            throw new Error('Unexpected audio content format');
        } catch (error) {
            this.logger.error(`Error generating speech: ${error.message}`);
            throw error;
        }
    }

    async transcribeAudio(audioBuffer: Buffer, mimetype: string): Promise<string> {
        if (!this.deepgram) {
            throw new Error('Deepgram Client not initialized.');
        }

        try {
            const { result, error } = await this.deepgram.listen.prerecorded.transcribeFile(
                audioBuffer,
                {
                    model: 'nova-2',
                    smart_format: true,
                    mimetype: mimetype || 'audio/webm'
                }
            );

            if (error) {
                throw new Error(error.message);
            }

            const transcript = result?.results?.channels[0]?.alternatives[0]?.transcript || '';
            return transcript;
        } catch (error) {
            this.logger.error(`Error transcribing audio: ${error.message}`);
            throw error;
        }
    }
}
