import { Check, X } from "lucide-react";

export function PlanComparisonTable() {
    const features = [
        {
            name: "Max Interviews",
            free: "2",
            basicLite: "10 / day",
            basic: "10 / day",
            premiumLite: "Unlimited",
            premium: "Unlimited",
        },
        {
            name: "Answer Time Limit",
            free: "120 seconds",
            basicLite: "Unlimited",
            basic: "Unlimited",
            premiumLite: "Unlimited",
            premium: "Unlimited",
        },
        {
            name: "Facial Video Analysis",
            free: <Check className="h-5 w-5 text-primary mx-auto" />,
            basicLite: <span className="text-xs text-muted-foreground">Not in Lite</span>,
            basic: <Check className="h-5 w-5 text-primary mx-auto" />,
            premiumLite: <span className="text-xs text-muted-foreground">Not in Lite</span>,
            premium: <Check className="h-5 w-5 text-primary mx-auto" />,
        },
        {
            name: "Advanced AI Feedback",
            free: <Check className="h-5 w-5 text-primary mx-auto" />,
            basicLite: <Check className="h-5 w-5 text-primary mx-auto" />,
            basic: <Check className="h-5 w-5 text-primary mx-auto" />,
            premiumLite: <Check className="h-5 w-5 text-primary mx-auto" />,
            premium: <Check className="h-5 w-5 text-primary mx-auto" />,
        },
    ];

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-border">
                        <th className="py-4 px-6 font-semibold bg-muted/30">Features</th>
                        <th className="py-4 px-6 font-semibold text-center">Free</th>
                        <th className="py-4 px-6 font-semibold text-center">Basic Lite</th>
                        <th className="py-4 px-6 font-semibold text-center">Basic</th>
                        <th className="py-4 px-6 font-semibold text-center">Premium Lite</th>
                        <th className="py-4 px-6 font-semibold text-center bg-primary/5 text-primary rounded-tr-xl">Premium</th>
                    </tr>
                </thead>
                <tbody>
                    {features.map((feature, idx) => (
                        <tr key={idx} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                            <td className="py-4 px-6 font-medium text-muted-foreground">{feature.name}</td>
                            <td className="py-4 px-6 text-center">{feature.free}</td>
                            <td className="py-4 px-6 text-center">{feature.basicLite}</td>
                            <td className="py-4 px-6 text-center">{feature.basic}</td>
                            <td className="py-4 px-6 text-center">{feature.premiumLite}</td>
                            <td className="py-4 px-6 text-center bg-primary/5 font-medium">{feature.premium}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}