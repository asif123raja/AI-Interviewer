"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMySubscription } from "@/lib/api";
import { User, Mail, CreditCard, Calendar, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user, loading: authLoading, signOut } = useAuth();
    const router = useRouter();
    const [subInfo, setSubInfo] = useState<any>(null);
    const [loadingSub, setLoadingSub] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    const sidebarOptions = [
        { id: "overview", label: "Overview", icon: User },
        { id: "subscription", label: "Billing & Plan", icon: CreditCard },
        { id: "history", label: "Interview History", icon: Calendar },
        { id: "settings", label: "Account Settings", icon: Activity },
    ];

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        async function fetchSub() {
            try {
                const data = await getMySubscription();
                setSubInfo(data);
            } catch (err) {
                console.error("Failed to load subscription:", err);
            } finally {
                setLoadingSub(false);
            }
        }

        if (user) {
            fetchSub();
        }
    }, [user, authLoading, router]);

    const handleCancelAutoRenewal = async () => {
        if (!confirm("Are you sure you want to cancel auto-renewal? You will keep your benefits until the end of the billing cycle, but will not be charged again.")) return;
        
        try {
            setLoadingSub(true);
            const { cancelAutoRenewal } = await import("@/lib/api");
            await cancelAutoRenewal();
            alert("Auto-renewal has been successfully cancelled.");
            // Refresh
            const data = await getMySubscription();
            setSubInfo(data);
        } catch (error: any) {
            alert(error.message || "Failed to cancel auto-renewal.");
        } finally {
            setLoadingSub(false);
        }
    };

    if (authLoading || loadingSub) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    const isFree = subInfo?.planName === 'free';
    const isPremium = subInfo?.planName?.includes('premium');
    const isHighestPlan = subInfo?.planName === 'premium';

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl flex gap-8 flex-col md:flex-row items-start">
            
            {/* Sidebar */}
            <aside className="w-full md:w-64 shrink-0 space-y-2">
                <div className="mb-8 hidden md:block">
                    <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
                    <p className="text-muted-foreground text-sm">Manage your account settings</p>
                </div>
                
                <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {sidebarOptions.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = activeTab === opt.id;
                        return (
                            <button
                                key={opt.id}
                                onClick={() => setActiveTab(opt.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap
                                    ${isActive 
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? "" : "opacity-70"}`} />
                                {opt.label}
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 w-full">
                
                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        <div className="glass-card p-6 md:p-8 rounded-2xl border border-border/50">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12 text-primary" />
                                    )}
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className="text-2xl font-bold">{user.displayName || "User"}</h2>
                                    <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mt-2">
                                        <Mail className="w-4 h-4" />
                                        {user.email}
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                                        <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-semibold uppercase tracking-wide rounded-full">
                                            Role: Candidate
                                        </span>
                                        <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wide rounded-full">
                                            Plan: {subInfo?.displayName || 'Loading...'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Mini-View */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="glass-card p-5 rounded-xl border border-border/50">
                                <p className="text-sm font-medium text-muted-foreground mb-1">Total Interviews Taken</p>
                                <p className="text-3xl font-black">{subInfo?.interviewsUsed || 0}</p>
                            </div>
                            <div className="glass-card p-5 rounded-xl border border-border/50">
                                <p className="text-sm font-medium text-muted-foreground mb-1">Overall Average Score</p>
                                <p className="text-3xl font-black text-primary">N/A</p>
                                <p className="text-xs text-muted-foreground mt-1">Take more interviews to see score</p>
                            </div>
                        </div>
                    </div>
                )}


                {/* SUBSCRIPTION TAB */}
                {activeTab === "subscription" && (
                    <div className="space-y-6">
                        <div className="glass-card p-6 md:p-8 rounded-2xl border border-border/50">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <CreditCard className="w-6 h-6 text-primary" />
                                Current Subscription
                            </h3>

                            {subInfo ? (
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl bg-background/50 border border-border/50 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Active Plan</p>
                                            <p className="text-2xl font-bold capitalize flex items-center gap-2">
                                                {subInfo.displayName}
                                                {isPremium && <span className="text-amber-500 text-xs px-2 py-0.5 bg-amber-500/10 rounded-full border border-amber-500/20">PRO</span>}
                                            </p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="text-sm text-muted-foreground mb-1">Status</p>
                                            {subInfo?.status === 'cancelled_at_period_end' ? (
                                                <p className="text-sm font-medium text-amber-600 bg-amber-500/20 px-3 py-1 rounded-full inline-block">Cancels at Term End</p>
                                            ) : (
                                                <p className="text-sm font-medium text-green-600 bg-green-500/20 px-3 py-1 rounded-full inline-block">Active (Auto-Renews)</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-5 rounded-xl bg-background/50 border border-border/50">
                                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                                <Activity className="w-5 h-5" />
                                                <span className="font-medium">Interviews Remaining</span>
                                            </div>
                                            <p className="text-3xl font-bold">
                                                {subInfo.interviewsRemaining > 1000 ? 'Unlimited' : subInfo.interviewsRemaining}
                                                <span className="text-sm font-normal text-muted-foreground ml-1">
                                                    / {subInfo.quotaWindow === 'monthly' ? 'this month' : 'total'}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="p-5 rounded-xl bg-background/50 border border-border/50">
                                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                                <Calendar className="w-5 h-5" />
                                                <span className="font-medium">Renewal Date</span>
                                            </div>
                                            <p className="text-xl font-bold mt-2">
                                                {subInfo.expiresAt ? new Date(subInfo.expiresAt).toLocaleDateString() : 'Never (Free Tier)'}
                                            </p>
                                        </div>
                                    </div>

                                    {!isFree && subInfo?.status !== 'cancelled_at_period_end' && (
                                        <div className="mt-2 text-right">
                                            <Button variant="outline" size="sm" onClick={handleCancelAutoRenewal} className="text-xs">
                                                Cancel Auto-Renewal
                                            </Button>
                                        </div>
                                    )}

                                    {!isHighestPlan && (
                                        <div className="p-5 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
                                            <div className="text-center sm:text-left">
                                                <p className="font-bold text-lg text-primary">Upgrade Your Plan</p>
                                                <p className="text-sm text-muted-foreground">Unlock unlimited interviews and advanced features.</p>
                                            </div>
                                            <Link href="/pricing" className="shrink-0 w-full sm:w-auto">
                                                <Button className="w-full">View Upgrade Options</Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Subscription details could not be loaded.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === "history" && (
                    <div className="glass-card p-6 md:p-8 rounded-2xl border border-border/50">
                        <div className="text-center py-12">
                            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-lg font-bold">No interviews yet</h3>
                            <p className="text-muted-foreground mb-6 mt-2">Your interview history and detailed reports will appear here.</p>
                            <Link href="/">
                                <Button>Start Your First Interview</Button>
                            </Link>
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === "settings" && (
                    <div className="glass-card p-6 md:p-8 rounded-2xl border border-border/50">
                        <h3 className="text-xl font-bold mb-6">Account Settings</h3>
                        <p className="text-muted-foreground italic mb-8">Settings configuration is currently offline.</p>
                        
                        <div className="border-t border-border pt-6 mt-6">
                            <Button variant="destructive" onClick={() => signOut()}>Sign Out Completely</Button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}

