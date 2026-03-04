import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Mic, Activity, LineChart, BrainCircuit, ScanFace, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px] pointer-events-none" />

      <main className="flex flex-col items-center justify-center w-full max-w-6xl px-6 py-20 lg:py-32 text-center z-10">

        {/* Animated Pill Badge */}
        <div className="mb-8 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
          New: On-Device Video Processing Released
        </div>

        {/* Hero Title */}
        <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl mb-8 leading-[1.1]">
          Master Your Next <br />
          <span className="text-gradient">Technical Interview</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground mb-12">
          An enterprise-level AI practice platform. We analyze your facial expressions, text semantics, and vocal anxiety to generate comprehensive feedback.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/practice">
            <Button variant="gradient" size="lg" className="w-full sm:w-auto gap-2 group text-md h-12 px-8">
              Start Free Interview
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 bg-background/50 backdrop-blur-md h-12 px-8">
              View Analytics
              <LineChart className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full max-w-5xl">
          <FeatureCard
            icon={<ScanFace className="h-6 w-6 text-primary" />}
            title="Facial Emotion Tracking"
            description="Real-time OpenCV analysis tracking micro-expressions of anxiety, confidence, and confusion."
          />
          <FeatureCard
            icon={<BrainCircuit className="h-6 w-6 text-purple-500" />}
            title="Contextual LLM Feedback"
            description="Specialized multi-modal processing evaluating technical accuracy against customized job descriptions."
          />
          <FeatureCard
            icon={<Activity className="h-6 w-6 text-teal-500" />}
            title="Historical Skill Growth"
            description="Track your performance over time. Watch your confidence metrics rise as you prepare for the real thing."
          />
        </div>

      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-8 rounded-2xl glass-card transition-transform hover:-translate-y-1">
      <div className="mb-4 p-3 rounded-full bg-muted dark:bg-zinc-800">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  )
}
