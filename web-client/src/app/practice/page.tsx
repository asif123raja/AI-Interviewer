"use client";

import { useState } from "react";
import { VideoRecorder } from "@/components/practice/VideoRecorder";
import { InterviewSetup, InterviewConfig } from "@/components/practice/InterviewSetup";
import { Brain, FileText, Settings, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function PracticeRoom() {
    const [config, setConfig] = useState<InterviewConfig | null>(null);

    const handleStart = (newConfig: InterviewConfig) => {
        setConfig(newConfig);
    };
    return (
        <ProtectedRoute>
            <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-4rem)]">

                {/* Header Info */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-border/50">
                    <div className="flex items-center gap-4">
                        {config && (
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setConfig(null)}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        )}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-wider">
                                    {config ? "Simulation Active" : "Setup Mode"}
                                </span>
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    <Brain className="h-3.5 w-3.5" />
                                    Engine: GPT-4o
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold">
                                {config ? `${config.experienceLevel} ${config.subtopic}` : "AI Interview Setup"}
                            </h1>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4 md:mt-0">
                        <Button variant="outline" size="sm" className="gap-2">
                            <FileText className="h-4 w-4" />
                            View Resume
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Settings className="h-4 w-4" />
                            Settings
                        </Button>
                    </div>
                </div>

                {/* Main Studio Area */}
                {!config ? (
                    <div className="mt-8">
                        <InterviewSetup onStart={handleStart} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Left column: Video (takes 3 columns) */}
                        <div className="lg:col-span-3">
                            <VideoRecorder config={config} />
                        </div>

                        {/* Right column: Current context / Question */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="glass-card p-6 rounded-2xl h-full border border-border/50 flex flex-col">
                                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Brain className="h-5 w-5 text-primary" />
                                        AI Prompt
                                    </h3>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Q1/5</span>
                                </div>

                                <div className="flex-1">
                                    <p className="text-lg leading-relaxed text-foreground mb-4">
                                        "Ready to begin your {config.domain} interview. Press Start when you are ready."
                                    </p>
                                </div>

                                <div className="mt-auto pt-4">
                                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500/80 p-3 rounded-lg text-xs flex gap-2">
                                        <span className="font-bold shrink-0">Tip:</span>
                                        Focus on structured answers using the STAR format (Situation, Task, Action, Result).
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
