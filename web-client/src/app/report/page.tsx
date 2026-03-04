"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchReports } from "@/lib/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Loader2, FileText, Calendar, Activity, Trophy, ArrowRight, PlusCircle } from "lucide-react";

export default function ReportsHistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadHistory() {
            if (!user) return;
            try {
                const data = await fetchReports();
                // Ensure reports are sorted by newest first
                const sorted = Array.isArray(data)
                    ? data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    : [];
                setReports(sorted);
            } catch (err) {
                console.error("Failed to load reports:", err);
                setError("Failed to load your interview history. Please try again later.");
            } finally {
                setLoading(false);
            }
        }

        if (!authLoading) {
            loadHistory();
        }
    }, [user, authLoading]);

    if (authLoading || loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-border/50">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            Interview Reports
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Review your past performances and track your improvement over time.
                        </p>
                    </div>
                    {reports.length > 0 && (
                        <Link href="/practice" className="mt-4 md:mt-0">
                            <Button variant="gradient" className="gap-2 rounded-full shadow-lg shadow-primary/20">
                                <PlusCircle className="h-4 w-4" />
                                New Interview
                            </Button>
                        </Link>
                    )}
                </div>

                {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 mb-8">
                        {error}
                    </div>
                )}

                {!error && reports.length === 0 ? (
                    // Empty State
                    <div className="glass-card rounded-3xl p-12 text-center border border-border/50 max-w-2xl mx-auto mt-12">
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <FileText className="h-10 w-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3">No Interview History Yet</h2>
                        <p className="text-muted-foreground mb-8 text-lg">
                            It looks like you haven't completed any practice interviews.
                            Attempt your first interview now to get detailed AI feedback and start tracking your progress!
                        </p>
                        <Link href="/practice">
                            <Button size="lg" variant="gradient" className="gap-2 rounded-full px-8 shadow-xl shadow-primary/20">
                                Take Your First Interview
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                ) : (
                    // Populated Grid State
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reports.map((report) => {
                            const date = new Date(report.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'short', day: 'numeric'
                            });

                            const roleTitle = `${report.domain || 'General'} ${report.subtopic ? `- ${report.subtopic}` : ''}`;

                            return (
                                <div key={report.id} className="glass-card rounded-2xl p-6 border border-border/50 flex flex-col hover:border-primary/30 transition-colors group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                                                {roleTitle}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {date}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="bg-background/50 rounded-xl p-3 border border-border flex flex-col items-center justify-center">
                                            <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                                                <Trophy className="h-3.5 w-3.5" />
                                                <span className="text-xs font-semibold">Confidence</span>
                                            </div>
                                            <span className="text-xl font-bold text-foreground">
                                                {report.avgConfidenceScore || 0}<span className="text-xs text-muted-foreground font-normal">/100</span>
                                            </span>
                                        </div>
                                        <div className="bg-background/50 rounded-xl p-3 border border-border flex flex-col items-center justify-center">
                                            <div className="flex items-center gap-1.5 text-red-500 mb-1">
                                                <Activity className="h-3.5 w-3.5" />
                                                <span className="text-xs font-semibold">Anxiety</span>
                                            </div>
                                            <span className="text-xl font-bold text-foreground">
                                                {report.anxietyScore || 0}<span className="text-xs text-muted-foreground font-normal">/100</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-border/50">
                                        <Link href={`/report/${report.id}`} className="w-full">
                                            <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                View Full Report
                                                <ArrowRight className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </ProtectedRoute >
    );
}
