"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/Button";
import { ArrowUpRight, Mic, Activity, LineChart, Moon, Sun, User } from "lucide-react";
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

    const mobileTabLinks = [
        { name: "Home", href: "/dashboard", icon: LineChart },
        { name: "Practice", href: "/practice", icon: Mic },
        { name: "Reports", href: "/report", icon: Activity },
        { name: "Profile", href: "/dashboard/profile", icon: User },
    ];

    return (
        <>
            <nav className="sticky top-0 z-50 w-full glass border-b border-border/40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
                        <div className="bg-primary p-2.5 rounded-2xl text-primary-foreground shadow-lg shadow-primary/25 relative flex items-center justify-center w-11 h-11">
                            <ArrowUpRight className="h-6 w-6 relative z-10" strokeWidth={2.5} />
                            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary-foreground/70 rounded-full" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-extrabold text-2xl tracking-tight leading-none flex items-baseline text-foreground">
                                Hire <span className="text-primary font-medium tracking-normal ml-1">path</span>
                            </span>
                            <span className="text-[0.65rem] text-muted-foreground font-medium uppercase tracking-wider hidden sm:block mt-1">
                                From campus to career — AI prep
                            </span>
                        </div>
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
                    <div className="flex items-center gap-2 sm:gap-3">
                        {mounted && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="rounded-full shrink-0"
                                aria-label="Toggle Theme"
                            >
                                {theme === "dark" ? (
                                    <Sun className="h-5 w-5 text-amber-500 transition-all" />
                                ) : (
                                    <Moon className="h-5 w-5 text-slate-700 transition-all" />
                                )}
                            </Button>
                        )}

                        <div className="flex items-center shrink-0">
                            {user ? (
                                <Link href="/dashboard/profile" className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary font-bold border-2 border-primary/20 hover:border-primary/50 transition-colors overflow-hidden">
                                    {user.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-5 h-5 relative top-[1px]" />}
                                </Link>
                            ) : (
                                <Link href="/login">
                                    <Button variant="outline" size="sm" className="rounded-full hidden sm:flex">
                                        Sign In
                                    </Button>
                                    <Button variant="outline" size="icon" className="rounded-full sm:hidden w-9 h-9">
                                        <User className="w-4 h-4" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                        <Button variant="gradient" className="rounded-full shadow-primary/25 hidden sm:flex">
                            Start Practice
                        </Button>
                    </div>
                </div>
            </div>
        </nav>

        {/* Global Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] pb-safe">
            <nav className="flex items-center justify-around px-2 pt-2 pb-4 sm:pb-6">
                {mobileTabLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`flex flex-col items-center gap-1 p-2 w-20 transition-all duration-200
                                ${isActive 
                                    ? "text-primary" 
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <div className={`flex items-center justify-center w-12 h-8 rounded-full transition-colors ${isActive ? 'bg-primary/10' : 'bg-transparent'}`}>
                                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[10px] font-bold text-center leading-tight truncate w-full px-1 ${isActive ? 'text-primary' : 'font-medium'}`}>
                                {link.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    </>
    );
}
