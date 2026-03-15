"use client";

import { useEffect, useState } from "react";
import { PlanComparisonTable } from "@/components/subscription/PlanComparisonTable";
import { PricingCard, SubscriptionPlan } from "@/components/subscription/PricingCard";
import { fetchSubscriptionPlans, getMySubscription } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function PricingPage() {
    const { user } = useAuth();
    const [subInfo, setSubInfo] = useState<any>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadPlansAndSub() {
            try {
                const data = await fetchSubscriptionPlans();
                setPlans(data || []);
                
                if (user) {
                    const sub = await getMySubscription();
                    setSubInfo(sub);
                }
            } catch (error) {
                console.error("Failed to load plans or sub", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadPlansAndSub();
    }, [user]);

    const getPlan = (name: string) => plans.find(p => p.name === name);

    const getProratedPrice = (targetPlan: SubscriptionPlan) => {
        if (!subInfo || subInfo.planName === 'free') return undefined; // No prorating if free
        
        const currentPlan = getPlan(subInfo.planName);
        if (!currentPlan) return undefined;
        
        // Don't prorate if downgrading or upgrading to same cycle but lower cost
        if (targetPlan.priceInrPaise <= currentPlan.priceInrPaise) return undefined;
        
        // Prorated Upgrade Pricing = TargetPrice - (CurrentPrice / MaxInterviews) * RemainingInterviews
        const currentPrice = currentPlan.priceInrPaise;
        const currentMax = currentPlan.maxInterviews;
        const remaining = subInfo.interviewsRemaining;

        const discountPaise = (currentPrice / currentMax) * remaining;
        const finalPricePaise = Math.max(0, targetPlan.priceInrPaise - discountPaise);
        
        return Math.round(finalPricePaise);
    };

    const isCurrentPlan = (name: string) => subInfo?.planName === name;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="container mx-auto px-4 py-16 flex-1">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                        Level Up Your Interview Prep
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Whether you're just starting out or looking for an edge with our advanced AI facial analysis, we have a plan designed for you.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-24 max-w-7xl mx-auto items-stretch">
                        {getPlan('free') && <PricingCard plan={getPlan('free') as SubscriptionPlan} isCurrentPlan={isCurrentPlan('free')} />}
                        {getPlan('basic_lite') && <PricingCard plan={getPlan('basic_lite') as SubscriptionPlan} proratedPriceInrPaise={getProratedPrice(getPlan('basic_lite') as SubscriptionPlan)} isCurrentPlan={isCurrentPlan('basic_lite')} />}
                        {getPlan('basic') && <PricingCard plan={getPlan('basic') as SubscriptionPlan} proratedPriceInrPaise={getProratedPrice(getPlan('basic') as SubscriptionPlan)} isCurrentPlan={isCurrentPlan('basic')} />}
                        {getPlan('premium_lite') && <PricingCard plan={getPlan('premium_lite') as SubscriptionPlan} proratedPriceInrPaise={getProratedPrice(getPlan('premium_lite') as SubscriptionPlan)} isCurrentPlan={isCurrentPlan('premium_lite')} />}
                        {getPlan('premium') && <PricingCard plan={getPlan('premium') as SubscriptionPlan} isPopular proratedPriceInrPaise={getProratedPrice(getPlan('premium') as SubscriptionPlan)} isCurrentPlan={isCurrentPlan('premium')} />}
                    </div>
                )}

                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-8">Detailed Feature Comparison</h2>
                    <PlanComparisonTable />
                </div>
            </main>
        </div>
    );
}
