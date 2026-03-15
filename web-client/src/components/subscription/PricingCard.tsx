import RazorpayButton from './RazorpayButton';

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  priceInrPaise: number;
  billingCadence: string;
  maxInterviews: number;
  answerTimeLimitSeconds: number;
  facialAnalysisEnabled: boolean;
  isActive: boolean;
}

interface PricingCardProps {
    plan: SubscriptionPlan;
    isPopular?: boolean;
    proratedPriceInrPaise?: number;
    isCurrentPlan?: boolean;
}

export function PricingCard({ plan, isPopular, proratedPriceInrPaise, isCurrentPlan }: PricingCardProps) {
    const originalPrice = plan.priceInrPaise / 100;
    const finalPrice = proratedPriceInrPaise !== undefined ? proratedPriceInrPaise / 100 : originalPrice;
    const isProratedUpgrade = proratedPriceInrPaise !== undefined && finalPrice < originalPrice;
    
    // MRP is calculated as 10% greater
    const mrpPrice = Math.round(originalPrice * 1.10);
    
    return (
        <div className={`relative flex flex-col p-6 rounded-3xl border ${isPopular ? 'border-primary shadow-xl md:scale-105 bg-primary/5' : 'border-border shadow-sm glass-card'} ${isCurrentPlan ? 'ring-2 ring-primary bg-primary/5' : ''} transition-all`}>
            {isPopular && !isCurrentPlan && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Most Popular
                </div>
            )}
            {isCurrentPlan && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-muted-foreground text-secondary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm">
                    Current Plan
                </div>
            )}
            <h3 className="text-xl font-bold mb-2">{plan.displayName}</h3>
            
            <div className="mb-4">
                {isProratedUpgrade ? (
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-muted-foreground line-through decoration-destructive decoration-2">₹{originalPrice}</span>
                        <span className="text-xs font-bold text-green-600 bg-green-500/20 px-2 py-0.5 rounded-full">Pro-rated Upgrade</span>
                    </div>
                ) : (
                    plan.priceInrPaise > 0 && (
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-muted-foreground line-through decoration-destructive decoration-2">₹{mrpPrice}</span>
                            <span className="text-xs font-bold text-green-600 px-1 py-0.5 rounded-full">Save 10%</span>
                        </div>
                    )
                )}
                <span className="text-4xl font-black text-foreground">₹{finalPrice}</span>
                <span className="text-muted-foreground font-medium">/{plan.billingCadence === 'monthly' ? 'mo' : 'day'}</span>
            </div>
            
            <ul className="mb-8 flex-1 space-y-4">
                <li className="flex items-start gap-3">
                    <span className="text-primary shrink-0 mt-0.5">✓</span> 
                    <span className="text-sm font-medium">{plan.maxInterviews > 1000 ? 'Unlimited' : plan.maxInterviews} Interviews / {plan.billingCadence === 'monthly' ? 'mo' : 'day'}</span>
                </li>
                <li className="flex items-start gap-3">
                    <span className="text-primary shrink-0 mt-0.5">✓</span> 
                    <span className="text-sm font-medium">{plan.answerTimeLimitSeconds === 120 ? '2 Min' : 'Unlimited'} Answer Time</span>
                </li>
                <li className="flex items-start gap-3">
                    <span className={`shrink-0 mt-0.5 ${plan.facialAnalysisEnabled ? "text-primary" : "text-muted-foreground/50"}`}>
                        {plan.facialAnalysisEnabled ? '✓' : '✗'}
                    </span> 
                    <span className={`text-sm font-medium ${!plan.facialAnalysisEnabled ? "text-muted-foreground" : ""}`}>
                        {plan.facialAnalysisEnabled ? 'Facial Video Analysis' : 'Facial Video Analysis (Not in Lite)'}
                    </span>
                </li>
            </ul>

            <div className="mt-auto">
                <RazorpayButton 
                    planName={plan.name} 
                    amountInr={finalPrice} 
                    billingCadence={plan.billingCadence} 
                    isCurrentPlan={isCurrentPlan}
                />
            </div>
        </div>
    );
}