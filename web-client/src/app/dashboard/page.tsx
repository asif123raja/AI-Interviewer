"use client";

import { Activity, Clock, Trophy, Target, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { useEffect, useState } from "react";
import { fetchDashboardStats, fetchReports } from "@/lib/api";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            if (!user) return;
            try {
                // In parallel fetch both stats and history
                const [statsData, reportsData] = await Promise.all([
                    fetchDashboardStats().catch(() => null),
                    fetchReports().catch(() => [])
                ]);

                setStats(statsData);
                setHistory(reportsData);
            } catch (err) {
                console.error(err);
                setError("Failed to load dashboard data. Please ensure you are logged in and the server is running.");
            } finally {
                setLoading(false);
            }
        }
        if (!authLoading) {
            loadData();
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

    if (error && !stats && history.length === 0) {
        return (
            <ProtectedRoute>
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 mb-8">
                        {error}
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    // Prepare chronological data for the chart
    // History is newest-first, so we reverse it for the chart to go oldest -> newest
    const chartData = [...history].reverse().map((report, index) => ({
        name: `Int ${index + 1}`,
        confidence: report.avgConfidenceScore || 0,
        anxiety: report.anxietyScore || 0
    }));

    return (
        <ProtectedRoute>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}</h1>
                        <p className="text-muted-foreground mt-1">Here's your interview performance overview.</p>
                    </div>
                    <Link href="/practice">
                        <Button variant="gradient" className="gap-2 shadow-lg shadow-primary/20">
                            <Target className="h-4 w-4" />
                            New Interview
                        </Button>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard title="Total Interviews" value={stats?.totalInterviews || "0"} icon={<Clock className="h-4 w-4 text-primary" />} trend="All time" />
                    <StatCard title="Avg. Confidence" value={`${stats?.avgConfidence || 0}%`} icon={<Trophy className="h-4 w-4 text-amber-500" />} trend="Calculated average" />
                    <StatCard title="Avg. Anxiety" value={`${stats?.avgAnxiety || 0}%`} icon={<Activity className="h-4 w-4 text-red-500" />} trend="Calculated average" trendDown />
                    <StatCard title="Questions Answered" value="142" icon={<Target className="h-4 w-4 text-emerald-500" />} trend="Top 15% of users" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart Section */}
                    <div className="col-span-1 lg:col-span-2 glass-card rounded-2xl p-6 border border-border/50">
                        <h2 className="text-xl font-semibold mb-6">Performance Trajectory</h2>
                        <div className="h-[350px] w-full">
                            {chartData.length > 0 ? (
                                <AnalyticsChart data={chartData} />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-xl">
                                    Complete interviews to see your performance trajectory.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Interviews List */}
                    <div className="glass-card rounded-2xl p-6 border border-border/50 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold">Recent History</h2>
                            <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                            {history.length > 0 ? (
                                history.map((report) => (
                                    <HistoryItem
                                        key={report.id}
                                        role={`${report.domain} ${report.subtopic ? `- ${report.subtopic}` : ''}`}
                                        date={new Date(report.createdAt).toLocaleDateString()}
                                        score={report.avgConfidenceScore || 0}
                                        id={report.id}
                                    />
                                ))
                            ) : (
                                <div className="text-sm text-muted-foreground text-center py-8">
                                    No interviews found. Start your first practice session!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}

function StatCard({ title, value, icon, trend, trendDown = false }: any) {
    return (
        <div className="glass p-6 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <div className="p-2 bg-muted rounded-lg dark:bg-black/20">{icon}</div>
            </div>
            <div>
                <div className="text-3xl font-bold">{value}</div>
                <div className={`text-xs mt-2 ${trendDown ? "text-emerald-500" : "text-primary"}`}>
                    {trend}
                </div>
            </div>
        </div>
    )
}

function HistoryItem({ role, date, score, id }: any) {
    return (
        <Link
            href={`/report/${id}`}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
        >
            <div>
                <h4 className="font-medium text-sm line-clamp-1">{role}</h4>
                <span className="text-xs text-muted-foreground">{date}</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-bold">{score}</span>
                    <span className="text-[10px] text-muted-foreground tracking-wider uppercase">Score</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {score >= 80 ? "A" : score >= 70 ? "B" : "C"}
                </div>
            </div>
        </Link>
    )
}
