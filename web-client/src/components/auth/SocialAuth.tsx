"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, OAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export function SocialAuth() {
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSocialAuth = async (providerName: 'google' | 'apple') => {
        setError("");
        setLoadingProvider(providerName);

        try {
            const provider = providerName === 'google'
                ? new GoogleAuthProvider()
                : new OAuthProvider('apple.com');

            if (providerName === 'apple') {
                (provider as OAuthProvider).addScope('email');
                (provider as OAuthProvider).addScope('name');
            }

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Sync User to Postgres via API Gateway
            const token = await user.getIdToken();
            const res = await fetch(`${API_URL}/auth/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // Apple might not provide display name reliably, but Firebase handles it when it can
                body: JSON.stringify({ email: user.email, name: user.displayName || 'Social User' })
            });

            if (!res.ok) {
                console.error("Postgres Sync Error", await res.text());
            }

            router.push("/dashboard");
        } catch (err: any) {
            console.error(err);
            setError(err.message || `Failed to sign in with ${providerName}.`);
        } finally {
            setLoadingProvider(null);
        }
    };

    return (
        <div className="mt-6">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-background/50 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center">
                    {error}
                </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialAuth('google')}
                    disabled={!!loadingProvider}
                    className="w-full"
                >
                    {loadingProvider === 'google' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                    )}
                    Google
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialAuth('apple')}
                    disabled={!!loadingProvider}
                    className="w-full font-semibold"
                >
                    {loadingProvider === 'apple' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16.365 20.081c-1.365 1.4-2.868 2.858-4.382 2.858-1.579 0-2.067-.939-3.926-.939-1.84 0-2.399.919-3.911.957-1.564.04-3.238-1.632-4.594-3.593C-3.4 13.111.458 4.498 7.158 4.498c1.472 0 2.861 1.018 3.822 1.018.96 0 2.653-1.217 4.417-1.037 1.889.057 3.616 1.055 4.619 2.502-4.135 2.112-3.476 7.646.606 9.309-1.002 2.531-3.085 4.97-4.257 6.165V20.081ZM14.954 3.047c-.777 1.488-2.684 2.518-4.148 2.375C11.106 3.868 13.06 2.569 14.56.914c.905-.989 1.748-2.671 1.353-2.914.075 1.638-.17 3.528-1.503 4.9a4.897 4.897 0 0 1 .544.147Z" />
                        </svg>
                    )}
                    Apple
                </Button>
            </div>
        </div>
    );
}
