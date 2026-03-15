import { Activity } from "lucide-react";

interface FacialAnalysisBadgeProps {
    enabled: boolean;
}

export function FacialAnalysisBadge({ enabled }: FacialAnalysisBadgeProps) {
    if (!enabled) {
        return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground border border-border" title="Upgrade to Premium to unlock Facial Analysis">
                <Activity className="w-3.5 h-3.5 opacity-50" />
                <span>Facial Analysis Locked</span>
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-green-500/15 text-green-600 border border-green-500/30">
            <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <Activity className="w-3.5 h-3.5" />
            <span>Facial Analysis Active</span>
        </div>
    );
}
