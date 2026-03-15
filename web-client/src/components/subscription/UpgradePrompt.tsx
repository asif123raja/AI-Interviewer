import Link from "next/link";
import { Crown } from "lucide-react";

interface UpgradePromptProps {
    message?: string;
}

export function UpgradePrompt({ message = "Unlock advanced features and unlimited interviews." }: UpgradePromptProps) {
    return (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-6 text-center max-w-2xl mx-auto my-8">
            <Crown className="w-8 h-8 mx-auto text-blue-500 mb-3" />
            <h3 className="text-xl font-bold mb-2">Upgrade to Premium</h3>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Link 
                href="/pricing"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
                View Plans
            </Link>
        </div>
    );
}
