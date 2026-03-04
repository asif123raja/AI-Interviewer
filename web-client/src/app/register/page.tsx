"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, Loader2, PlayCircle, User } from "lucide-react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { SocialAuth } from "@/components/auth/SocialAuth";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1. Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Update Firebase Display Name
            await updateProfile(user, { displayName: name });

            // 3. Sync User to Postgres via API Gateway
            const token = await user.getIdToken();
            const res = await fetch(`${API_URL}/auth/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: user.email, name })
            });

            if (!res.ok) {
                console.error("Postgres Sync Error", await res.text());
                // We don't block login if sync fails, but we should log it
            }

            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Failed to create account.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

            <div className="relative z-10 w-full max-w-md p-8 glass-card rounded-3xl mx-4">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <PlayCircle className="h-10 w-10 text-primary" />
                        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                            AI Interview
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
                    <p className="text-muted-foreground mt-2">Start your journey to interview mastery</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full pl-10 pr-4 py-3 bg-background/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full py-6 text-lg font-semibold rounded-xl shadow-lg shadow-primary/20"
                        variant="gradient"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create account"}
                    </Button>
                </form>

                <SocialAuth />

                <div className="mt-8 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary font-semibold hover:underline">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
