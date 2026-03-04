"use client";

import { Button } from "@/components/ui/Button";
import { FeedbackCard } from "@/components/report/FeedbackCard";
import { ArrowLeft, Download, Share2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { fetchReportById } from "@/lib/api";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

export default function ReportPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const id = params.id;
    const { user, loading: authLoading } = useAuth();

    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadReport() {
            if (!user) return;
            try {
                const data = await fetchReportById(id);
                setReport(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load interview report. It may not exist or you don't have permission.");
            } finally {
                setLoading(false);
            }
        }
        if (!authLoading) {
            loadReport();
        }
    }, [id, user, authLoading]);

    if (authLoading || loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </ProtectedRoute>
        );
    }

    if (error || !report) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 mb-8">
                    {error || "Report not found."}
                </div>
                <Link href="/dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </div>
        );
    }

    // Formatting fallback data safely
    const roleTitle = `${report.domain} ${report.subtopic ? `- ${report.subtopic}` : ''}`;
    const reportDate = new Date(report.createdAt).toLocaleDateString();

    const fullReportResult = report.fullReport?.result || report.fullReport || {};
    const emotionTimeline = report.fullReport?.emotionTimeline || [];

    // Calculate Emotion Durations dynamically from timeline snapshots
    const emotionDurations: Record<string, number> = {};
    if (emotionTimeline.length > 0) {
        emotionTimeline.forEach((snap: any) => {
            const emo = snap.emotion || "Neutral";
            emotionDurations[emo] = (emotionDurations[emo] || 0) + 2; // Each snapshot = 2 secs
        });
    }

    // Construct metrics object expected by FeedbackCard
    const metrics = {
        confidence: report.avgConfidenceScore || 0,
        anxiety: report.anxietyScore || 0,
        technicalAccuracy: fullReportResult.technical_score || report.communication || 0,
        communication: fullReportResult.behavioral_score || report.engagement || 0
    };

    // If there is no detailed text analysis saved locally yet, we provide fallback arrays
    const strengths = fullReportResult.strengths || ["Detailed analysis not available for this session."];
    const improvementsRaw = fullReportResult.improvements || [];
    const improvements = improvementsRaw.length > 0
        ? improvementsRaw.map((imp: any) => typeof imp === 'string' ? imp : `Q${imp.question_number}: ${imp.feedback}`)
        : ["Detailed analysis not available for this session."];
    const transcript = fullReportResult.transcript || [];

    return (
        <ProtectedRoute>
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-border/50">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold">Interview Analysis</h1>
                                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                    ID: {id.substring(0, 8)}...
                                </span>
                            </div>
                            <p className="text-muted-foreground text-sm flex items-center gap-2">
                                {roleTitle} • {reportDate}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4 md:mt-0">
                        <Button variant="outline" size="sm" className="gap-2 rounded-full">
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>
                        <Button variant="gradient" size="sm" className="gap-2 rounded-full shadow-lg shadow-primary/20">
                            <Download className="h-4 w-4" />
                            Export PDF
                        </Button>
                    </div>
                </div>

                {/* Score Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="col-span-1 md:col-span-4 glass-card p-6 rounded-2xl flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
                        <div>
                            <h2 className="text-lg font-semibold mb-1">Overall Assessment</h2>
                            <p className="text-muted-foreground text-sm max-w-xl">
                                {fullReportResult.summary || fullReportResult.executiveSummary || "No executive summary provided by the analytics engine."}
                            </p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-5xl font-black text-primary drop-shadow-sm">{report.avgConfidenceScore || 0}</span>
                            <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase mt-1">Score out of 100</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Metrics & Feedback */}
                    <div className="lg:col-span-2 space-y-6">
                        <FeedbackCard
                            title="Comprehensive Analysis"
                            metrics={metrics}
                            strengths={strengths}
                            improvements={improvements}
                        />
                        {fullReportResult.recommended_learning_path && fullReportResult.recommended_learning_path.length > 0 && (
                            <div className="glass-card rounded-2xl p-6 border border-border/50">
                                <h3 className="text-lg font-semibold mb-4 text-primary">Recommended Learning Path</h3>
                                <ul className="space-y-2">
                                    {fullReportResult.recommended_learning_path.map((item: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm">
                                            <span className="text-primary font-bold mt-0.5">•</span>
                                            <span className="leading-relaxed text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {Object.keys(emotionDurations).length > 0 && (
                            <div className="glass-card rounded-2xl p-6 border border-border/50">
                                <h3 className="text-lg font-semibold mb-4 text-emerald-500">Facial Emotion Timeline</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(emotionDurations)
                                        .sort((a, b) => b[1] - a[1]) // highest duration first
                                        .map(([emo, secs]) => {
                                            const mins = Math.floor(secs / 60);
                                            const remSecs = secs % 60;
                                            const timeStr = mins > 0 ? `${mins}m ${remSecs}s` : `${remSecs}s`;
                                            return (
                                                <div key={emo} className="bg-background/40 p-3 rounded-xl border border-border text-center flex flex-col items-center justify-center">
                                                    <span className="text-sm font-bold text-foreground mb-1">{emo}</span>
                                                    <span className="text-xs text-muted-foreground">{timeStr}</span>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Transcript */}
                    <div className="lg:col-span-1">
                        <div className="glass-card rounded-2xl p-6 border border-border/50 h-full">
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                Key Interaction
                            </h3>

                            <div className="space-y-6">
                                {transcript.length > 0 ? (
                                    transcript.map((line: any, i: number) => (
                                        <div key={i} className={`flex flex-col ${line.speaker === "You" ? "items-end" : "items-start"}`}>
                                            <div className="flex items-center gap-2 mb-1.5 px-1">
                                                <span className="text-xs font-semibold text-muted-foreground">{line.speaker}</span>
                                                <span className="text-[10px] text-zinc-500">{line.time}</span>
                                            </div>
                                            <div className={`
                                            p-3 rounded-2xl max-w-[90%] text-sm leading-relaxed shadow-sm
                                            ${line.speaker === "You"
                                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                    : "bg-muted dark:bg-zinc-800 rounded-tl-sm text-foreground"}
                                        `}>
                                                {line.text}
                                            </div>
                                            {line.emotion && (
                                                <span className="text-[10px] mt-1 text-emerald-500 font-medium px-2">
                                                    Detected Emotion: {line.emotion}
                                                </span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No transcript data available for this session.</p>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-border mt-auto">
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                    <p className="text-xs leading-relaxed">
                                        The ML Pipeline analyzes micro-expressions every 30 frames. A detailed chronological JSON of these frames is available in the exported PDF.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
