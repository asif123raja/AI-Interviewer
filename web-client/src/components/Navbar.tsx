"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/Button";
import { Mic, Activity, LineChart, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
    const { user, signOut } = useAuth();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const navLinks = [
        { name: "Dashboard", href: "/dashboard", icon: LineChart },
        { name: "Practice", href: "/practice", icon: Mic },
        { name: "Reports", href: "/report", icon: Activity },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full glass border-b border-border/40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
                        <div className="bg-gradient-to-br from-primary to-purple-600 p-2 rounded-xl text-white shadow-lg shadow-primary/25">
                            <Mic className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-xl tracking-tight hidden sm:block">
                            AI Interview <span className="text-gradient">Platform</span>
                        </span>
                    </Link>

                    {/* Center Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navLinks.map((link) => {
                            const isActive = pathname?.startsWith(link.href);
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                    ${isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                  `}
                                >
                                    <Icon className="h-4 w-4" />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        {mounted && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="rounded-full"
                                aria-label="Toggle Theme"
                            >
                                {theme === "dark" ? (
                                    <Sun className="h-5 w-5 text-amber-500 transition-all" />
                                ) : (
                                    <Moon className="h-5 w-5 text-slate-700 transition-all" />
                                )}
                            </Button>
                        )}

                        <div className="hidden sm:flex items-center gap-2">
                            {user ? (
                                <Button variant="outline" className="rounded-full" onClick={signOut}>
                                    Sign Out
                                </Button>
                            ) : (
                                <Link href="/login">
                                    <Button variant="outline" className="rounded-full">
                                        Sign In
                                    </Button>
                                </Link>
                            )}
                        </div>
                        <Button variant="gradient" className="rounded-full shadow-primary/25">
                            Start Practice
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
