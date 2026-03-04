"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { INTERVIEW_DOMAINS, EXPERIENCE_LEVELS, DIFFICULTY_LEVELS, INTERVIEW_TYPES } from "@/lib/constants";

export interface InterviewConfig {
    domain: string;
    subtopic: string;
    experienceLevel: string;
    difficulty: string;
    interviewType: string;
    customPrompt?: string;
}

interface InterviewSetupProps {
    onStart: (config: InterviewConfig) => void;
}

export function InterviewSetup({ onStart }: InterviewSetupProps) {
    const [domain, setDomain] = useState(INTERVIEW_DOMAINS[0].name);
    const [subtopic, setSubtopic] = useState(INTERVIEW_DOMAINS[0].subdomains[0]);
    const [customDomain, setCustomDomain] = useState("");
    const [customSubtopic, setCustomSubtopic] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("intermediate");
    const [difficulty, setDifficulty] = useState("medium");
    const [interviewType, setInterviewType] = useState("technical");
    const [customPrompt, setCustomPrompt] = useState("");

    const handleDomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDomain = e.target.value;
        setDomain(newDomain);
        const domainObj = INTERVIEW_DOMAINS.find(d => d.name === newDomain);
        if (domainObj && domainObj.subdomains.length > 0) {
            setSubtopic(domainObj.subdomains[0]);
        } else {
            setSubtopic("");
        }
    };

    const handleStart = () => {
        onStart({
            domain: domain === "Custom" ? customDomain || "Custom" : domain,
            subtopic: domain === "Custom" ? customSubtopic || "Custom Topic" : subtopic,
            experienceLevel,
            difficulty,
            interviewType,
            customPrompt: customPrompt || undefined
        });
    };

    const currentDomainObj = INTERVIEW_DOMAINS.find(d => d.name === domain);

    return (
        <div className="glass-card max-w-2xl mx-auto p-8 rounded-3xl border border-border/50">
            <h2 className="text-2xl font-bold mb-6 text-center">Configure Your Interview</h2>

            <div className="space-y-6">
                {/* Domain & Subdomain */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Domain</label>
                        <select
                            className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                            value={domain}
                            onChange={handleDomainChange}
                        >
                            {INTERVIEW_DOMAINS.map(d => (
                                <option key={d.name} value={d.name}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Sub-Domain</label>
                        {domain !== "Custom" ? (
                            <select
                                className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                value={subtopic}
                                onChange={(e) => setSubtopic(e.target.value)}
                            >
                                {currentDomainObj?.subdomains.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                placeholder="Enter custom subtopic..."
                                className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                value={customSubtopic}
                                onChange={(e) => setCustomSubtopic(e.target.value)}
                            />
                        )}
                    </div>
                </div>

                {/* Custom Domain Input */}
                {domain === "Custom" && (
                    <div>
                        <label className="block text-sm font-medium mb-2">Custom Domain Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Space Exploration"
                            className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                            value={customDomain}
                            onChange={(e) => setCustomDomain(e.target.value)}
                        />
                    </div>
                )}

                {/* Settings Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Experience</label>
                        <select
                            className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm outline-none"
                            value={experienceLevel}
                            onChange={(e) => setExperienceLevel(e.target.value)}
                        >
                            {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Difficulty</label>
                        <select
                            className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm outline-none"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            {DIFFICULTY_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Type</label>
                        <select
                            className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm outline-none"
                            value={interviewType}
                            onChange={(e) => setInterviewType(e.target.value)}
                        >
                            {INTERVIEW_TYPES.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                        </select>
                    </div>
                </div>

                {/* Custom System Prompt */}
                <div>
                    <label className="block text-sm font-medium mb-2 flex justify-between items-end">
                        Custom Focus / Persona Instruction
                        <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <textarea
                        rows={3}
                        placeholder="e.g. Focus only on system design for a scalable AI backend using NestJS and Redis."
                        className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                    />
                </div>

                <div className="pt-4">
                    <Button
                        variant="gradient"
                        className="w-full rounded-xl h-12 shadow-lg shadow-primary/20 text-md"
                        onClick={handleStart}
                    >
                        Initialize Simulation
                    </Button>
                </div>
            </div>
        </div>
    );
}
