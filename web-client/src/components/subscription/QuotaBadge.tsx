"use client";

import { useEffect, useState } from "react";
import { getMySubscription } from "@/lib/api";
import Link from "next/link";
import { Crown } from "lucide-react";

export function QuotaBadge() {
    const [subInfo, setSubInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getMySubscription();
                setSubInfo(data);
            } catch (err) {
                // Ignore if unauthorized or failed
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading || !subInfo) return null;

    let quotaText = `${subInfo.interviewsRemaining} interviews left`;
    if (subInfo.interviewsRemaining > 1000) {
        quotaText = "Unlimited Interviews";
    }

    const isFree = subInfo.planName === 'free';

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${isFree ? 'bg-muted border-border text-muted-foreground' : 'bg-blue-500/10 border-blue-500/30 text-blue-600'}`}>
            {!isFree && <Crown className="w-3 h-3" />}
            <span>{subInfo.displayName}: {quotaText}</span>
            {isFree && (
                <Link href="/pricing" className="ml-1 text-blue-500 hover:underline">
                    Upgrade
                </Link>
            )}
        </div>
    );
}
