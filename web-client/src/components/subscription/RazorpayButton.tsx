"use client";

import { useEffect, useState } from 'react';
import { fetchSubscriptionPlans, createRazorpayOrder, verifyRazorpayPayment } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface RazorpayButtonProps {
    planName: string;
    amountInr: number;
    billingCadence: string;
    buttonText?: string;
    isCurrentPlan?: boolean;
}

export default function RazorpayButton({ planName, amountInr, billingCadence, buttonText = "Subscribe", isCurrentPlan }: RazorpayButtonProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Dynamically load Razorpay SDK
        if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
            const script = document.createElement('script');
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const handlePayment = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            setIsLoading(true);
            const orderMetadata = await createRazorpayOrder(planName);

            const options = {
                key: orderMetadata.keyId,
                amount: orderMetadata.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
                currency: orderMetadata.currency,
                name: "HirePath AI",
                description: `Subscription to ${planName}`,
                order_id: orderMetadata.isSubscription ? undefined : orderMetadata.razorpayOrderId,
                subscription_id: orderMetadata.isSubscription ? orderMetadata.razorpayOrderId : undefined,
                handler: async function (response: any) {
                    try {
                        await verifyRazorpayPayment({
                            razorpayOrderId: response.razorpay_order_id || response.razorpay_subscription_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            plan: planName
                        });
                        alert('Payment Successful!');
                        router.push('/dashboard/profile');
                        router.refresh();
                    } catch (error) {
                        alert('Payment Verification Failed!');
                    }
                },
                prefill: {
                    email: user.email,
                },
                theme: {
                    color: "#0F6E56",
                },
            };

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                console.error(response.error);
                alert("Payment Failed - " + response.error.description);
            });
            rzp1.open();

        } catch (error: any) {
            console.error("Order creation failed", error);
            alert(`Failed to start payment process. ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (planName === 'free' || isCurrentPlan) {
        return (
            <button 
                className="w-full py-2 px-4 bg-muted text-muted-foreground rounded-lg font-medium cursor-not-allowed border border-border"
                disabled
            >
                Current Plan
            </button>
        );
    }

    return (
        <button
            onClick={handlePayment}
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
        >
            {isLoading ? 'Processing...' : buttonText}
        </button>
    );
}
