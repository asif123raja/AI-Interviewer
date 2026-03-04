/**
 * FaceAnalyzer — Client-side behavioral analysis using MediaPipe FaceLandmarker.
 *
 * Runs entirely in the browser. Computes:
 *   - Eye Aspect Ratio (EAR) → blink detection → blink rate (blinks/min)
 *   - Head pose (pitch) → confidence proxy
 *   - Gaze ratio (iris centering) → eye contact proxy
 *   - Dominant emotion heuristic from landmark geometry
 *
 * Usage:
 *   const analyzer = new FaceAnalyzer();
 *   await analyzer.init();
 *   analyzer.start(videoEl, canvasEl);   // starts rAF loop
 *   const metrics = analyzer.stop();     // returns aggregated metrics
 */

import {
    FaceLandmarker,
    FilesetResolver,
    DrawingUtils,
    type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

// ─── Landmark indices for EAR (MediaPipe Face Mesh) ──────────────────────────
const LEFT_EYE = [362, 385, 387, 263, 373, 380];  // [p1,p2,p3,p4,p5,p6]
const RIGHT_EYE = [33, 160, 158, 133, 153, 144];
const IRIS_LEFT_CENTER = 473;
const IRIS_RIGHT_CENTER = 468;
const LEFT_EYE_INNER = 362;
const LEFT_EYE_OUTER = 263;
const RIGHT_EYE_INNER = 33;
const RIGHT_EYE_OUTER = 133;

// Head pose anchors
const NOSE_TIP = 1;
const CHIN = 152;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;

const EAR_BLINK_THRESHOLD = 0.21;
const FRAMES_FOR_BLINK = 2;

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function ear(landmarks: { x: number; y: number }[], indices: number[]) {
    const [p1, p2, p3, p4, p5, p6] = indices.map((i) => landmarks[i]);
    return (dist(p2, p6) + dist(p3, p5)) / (2 * dist(p1, p4));
}

export interface EmotionSnapshot {
    timestampSec: number;
    emotion: string;
    anxietyScore: number;
}

export interface FaceMetrics {
    blinkRate: number;          // blinks per minute
    avgGazeRatio: number;       // 0–1, higher = more centered gaze
    avgHeadPitch: number;       // degrees, negative = looking down
    dominantEmotion: string;    // heuristic emotion label
    anxietyScore: number;       // 0–100 computed composite
    confidenceScore: number;    // 0–100 computed composite
    sessionDurationSec: number;
    totalBlinks: number;
    rawSamples: number;
    timeline: EmotionSnapshot[];
}

export class FaceAnalyzer {
    private landmarker: FaceLandmarker | null = null;
    private rafId: number | null = null;
    private isRunning = false;

    // counters
    private startTime = 0;
    private totalBlinks = 0;
    private blinkFrames = 0;
    private inBlink = false;
    private gazeRatioSum = 0;
    private headPitchSum = 0;
    private sampleCount = 0;
    private emotionCounts: Record<string, number> = {};
    private timeline: EmotionSnapshot[] = [];
    private lastSnapshotTime = 0;

    async init() {
        // Suppress MediaPipe's TFLite XNNPACK warnings to clear up the console
        const originalInfo = console.info;
        const originalLog = console.log;
        console.info = (...args) => { if (!args[0]?.includes?.("XNNPACK")) originalInfo(...args); };
        console.log = (...args) => { if (!args[0]?.includes?.("XNNPACK")) originalLog(...args); };

        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            this.landmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath:
                        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                    delegate: "GPU",
                },
                outputFaceBlendshapes: true,
                runningMode: "VIDEO",
                numFaces: 1,
            });
        } finally {
            console.info = originalInfo;
            console.log = originalLog;
        }
    }

    private lastTimestamp = -1;

    start(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
        if (!this.landmarker) {
            console.error("[FaceAnalyzer] Not initialized. Call init() first.");
            return;
        }
        this.isRunning = true;
        this.startTime = performance.now();
        const ctx = canvas.getContext("2d")!;
        const drawingUtils = new DrawingUtils(ctx);

        const loop = () => {
            if (!this.isRunning) return;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const now = performance.now();
            // Deduplicate timestamps to avoid MediaPipe error
            const ts = now === this.lastTimestamp ? now + 1 : now;
            this.lastTimestamp = ts;

            try {
                const result: FaceLandmarkerResult = this.landmarker!.detectForVideo(video, ts);

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (result.faceLandmarks.length > 0) {
                    const lm = result.faceLandmarks[0];
                    this.processLandmarks(lm, result);

                    // Draw mesh overlay
                    drawingUtils.drawConnectors(
                        lm,
                        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
                        { color: "#00ffe530", lineWidth: 0.5 }
                    );
                    drawingUtils.drawConnectors(
                        lm,
                        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
                        { color: "#fb923c", lineWidth: 1.5 }
                    );
                    drawingUtils.drawConnectors(
                        lm,
                        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
                        { color: "#fb923c", lineWidth: 1.5 }
                    );
                    drawingUtils.drawConnectors(
                        lm,
                        FaceLandmarker.FACE_LANDMARKS_LIPS,
                        { color: "#f472b6", lineWidth: 1.5 }
                    );

                    // Emotion label overlay
                    const emotion = this.heuristicEmotion(result);
                    ctx.font = "bold 16px Inter, sans-serif";
                    ctx.fillStyle = "#00ffe5";
                    ctx.fillText(`Emotion: ${emotion}`, 12, 28);
                    ctx.fillStyle = "#ffffff80";
                    ctx.font = "13px monospace";
                    ctx.fillText(`Blinks: ${this.totalBlinks}`, 12, 50);
                }
            } catch (_) {
                // Timing safety — skip this frame
            }

            this.rafId = requestAnimationFrame(loop);
        };

        this.rafId = requestAnimationFrame(loop);
    }

    stop(): FaceMetrics {
        this.isRunning = false;
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);

        const durationSec = (performance.now() - this.startTime) / 1000;
        const durationMin = durationSec / 60 || 1;
        const blinkRate = Math.round(this.totalBlinks / durationMin);
        const avgGazeRatio = this.sampleCount > 0 ? this.gazeRatioSum / this.sampleCount : 0.5;
        const avgHeadPitch = this.sampleCount > 0 ? this.headPitchSum / this.sampleCount : 0;

        // Dominant emotion
        const dominantEmotion = Object.entries(this.emotionCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || "Neutral";

        // Composite scores (0–100)
        const normalizedBlink = Math.min(blinkRate / 60, 1); // >60bpm = max anxiety
        const gazeScore = avgGazeRatio;                        // 1 = best eye contact
        const pitchPenalty = Math.min(Math.max(-avgHeadPitch, 0) / 30, 1); // looking down
        const anxietyScore = Math.round(
            (0.4 * normalizedBlink + 0.3 * (1 - gazeScore) + 0.3 * pitchPenalty) * 100
        );
        const confidenceScore = Math.max(0, 100 - anxietyScore);

        return {
            blinkRate,
            avgGazeRatio: Math.round(avgGazeRatio * 100) / 100,
            avgHeadPitch: Math.round(avgHeadPitch * 10) / 10,
            dominantEmotion,
            anxietyScore,
            confidenceScore,
            sessionDurationSec: Math.round(durationSec),
            totalBlinks: this.totalBlinks,
            rawSamples: this.sampleCount,
            timeline: this.timeline,
        };
    }

    private processLandmarks(lm: { x: number; y: number; z: number }[], result: FaceLandmarkerResult) {
        this.sampleCount++;

        // ─── EAR Blink Detection ────────────────────────────────────────────────
        const leftEAR = ear(lm, LEFT_EYE);
        const rightEAR = ear(lm, RIGHT_EYE);
        const avgEAR = (leftEAR + rightEAR) / 2;

        if (avgEAR < EAR_BLINK_THRESHOLD) {
            this.blinkFrames++;
            if (this.blinkFrames >= FRAMES_FOR_BLINK && !this.inBlink) {
                this.totalBlinks++;
                this.inBlink = true;
            }
        } else {
            this.blinkFrames = 0;
            this.inBlink = false;
        }

        // ─── Gaze Ratio ─────────────────────────────────────────────────────────
        // Compare iris center position relative to eye width
        const leftEyeWidth = dist(lm[LEFT_EYE_INNER], lm[LEFT_EYE_OUTER]);
        const leftIrisOffset = Math.abs(lm[IRIS_LEFT_CENTER].x - (lm[LEFT_EYE_INNER].x + lm[LEFT_EYE_OUTER].x) / 2) / (leftEyeWidth || 0.01);
        const rightEyeWidth = dist(lm[RIGHT_EYE_INNER], lm[RIGHT_EYE_OUTER]);
        const rightIrisOffset = Math.abs(lm[IRIS_RIGHT_CENTER].x - (lm[RIGHT_EYE_INNER].x + lm[RIGHT_EYE_OUTER].x) / 2) / (rightEyeWidth || 0.01);
        const gazeRatio = 1 - Math.min((leftIrisOffset + rightIrisOffset) / 2, 1);
        this.gazeRatioSum += gazeRatio;

        // ─── Head Pitch (simplified) ─────────────────────────────────────────────
        // Use nose tip Y vs chin Y in normalized coordinates
        const noseTip = lm[NOSE_TIP];
        const chin = lm[CHIN];
        const pitchProxy = (noseTip.y - chin.y) * 90; // rough degree approximation
        this.headPitchSum += pitchProxy;

        // ─── Emotion Heuristic from Blendshapes ─────────────────────────────────
        const emotion = this.heuristicEmotion(result);
        this.emotionCounts[emotion] = (this.emotionCounts[emotion] || 0) + 1;

        // ─── Snapshot Timeline (every 2 seconds) ────────────────────────────────
        const elapsedSec = (performance.now() - this.startTime) / 1000;
        if (elapsedSec - this.lastSnapshotTime >= 2.0) {
            // Calculate instantaneous anxiety for this snapshot
            const instantGaze = gazeRatio;
            const instantPitch = Math.min(Math.max(-pitchProxy, 0) / 30, 1);
            const instantBlink = this.inBlink ? 1 : 0; // naive instant approximation

            const instantAnxScore = Math.round(
                (0.4 * instantBlink + 0.3 * (1 - instantGaze) + 0.3 * instantPitch) * 100
            );

            this.timeline.push({
                timestampSec: Math.round(elapsedSec),
                emotion: emotion,
                anxietyScore: instantAnxScore
            });
            this.lastSnapshotTime = elapsedSec;
        }
    }

    private heuristicEmotion(result: FaceLandmarkerResult): string {
        if (!result.faceBlendshapes?.length) return "Neutral";
        const bs = result.faceBlendshapes[0].categories;
        const get = (name: string) => bs.find((c) => c.categoryName === name)?.score ?? 0;

        const happy = get("mouthSmileLeft") + get("mouthSmileRight");
        const surprised = get("jawOpen") + get("eyeWideLeft") + get("eyeWideRight");
        const fearful = get("browInnerUp") + get("mouthFrownLeft") + get("mouthFrownRight");
        const angry = get("browDownLeft") + get("browDownRight") + get("noseSneerLeft") + get("noseSneerRight");

        const scores: [string, number][] = [
            ["Happy", happy],
            ["Surprised", surprised],
            ["Anxious", fearful],
            ["Focused", angry * 0.3],
            ["Neutral", 0.5],
        ];

        return scores.sort((a, b) => b[1] - a[1])[0][0];
    }

    destroy() {
        this.stop();
        this.landmarker?.close();
    }
}
