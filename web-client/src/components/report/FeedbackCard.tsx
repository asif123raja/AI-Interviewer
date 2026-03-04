"use client";

import { CheckCircle2, TrendingUp, AlertTriangle, Zap, Brain } from "lucide-react";

interface FeedbackCardProps {
    title: string;
    metrics: {
        confidence: number;
        anxiety: number;
        technicalAccuracy: number;
        communication: number;
    };
    strengths: string[];
    improvements: string[];
}

export function FeedbackCard({ title, metrics, strengths, improvements }: FeedbackCardProps) {
    return (
        <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="bg-muted/50 dark:bg-zinc-800/30 px-6 py-4 border-b border-border/50 flex items-center gap-3">
                <Brain className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">{title}</h2>
            </div>

            <div className="p-6">
                {/* Metric Bars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                    <MetricBar label="Confidence Level" value={metrics.confidence} color="bg-primary" />
                    <MetricBar label="Anxiety Index" value={metrics.anxiety} color="bg-red-500" />
                    <MetricBar label="Technical Accuracy" value={metrics.technicalAccuracy} color="bg-emerald-500" />
                    <MetricBar label="Communication Skill" value={metrics.communication} color="bg-blue-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Strengths */}
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5">
                        <h3 className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-4">
                            <TrendingUp className="h-4 w-4" />
                            Key Strengths
                        </h3>
                        <ul className="space-y-3">
                            {strengths.map((item, index) => (
                                <li key={index} className="flex items-start gap-3 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Areas for Improvement */}
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-5">
                        <h3 className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            Focus Areas
                        </h3>
                        <ul className="space-y-3">
                            {improvements.map((item, index) => (
                                <li key={index} className="flex items-start gap-3 text-sm">
                                    <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-sm font-bold">{value}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}
