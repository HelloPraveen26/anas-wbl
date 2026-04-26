'use client';

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Wallet,
    LogOut,
    Menu,
    X,
    Shield,
    ChevronRight
} from "lucide-react";
import { authManager } from "@/lib/auth";
import cristy from "@/assets/recover.png";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        // Skip auth check for login page
        if (isLoginPage) return;

        const token = authManager.getToken();
        if (!token) {
            router.push('/admin/login');
        }
    }, [router, isLoginPage]);

    const handleSignOut = () => {
        authManager.clearAuth();
        router.replace('/admin/login');
    };

    const navItems = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Wallet', href: '/admin/wallet', icon: Wallet },
    ];

    // If it's the login page, render children without the admin sidebar/navigation
    if (isLoginPage) {
        return (
            <div className="min-h-screen bg-white">
                <main className="w-full">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Desktop Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 shadow-sm z-30`}
            >
                <div className="p-6 flex items-center justify-between">
                    {isSidebarOpen ? (
                        <img src={cristy.src} alt="ZenVoice" className="h-16 w-auto" />
                    ) : (
                        <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                    )}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                            >
                                <Icon size={22} className={isActive ? 'text-white' : 'text-emerald-600'} />
                                {isSidebarOpen && <span className="font-semibold">{item.name}</span>}
                                {isSidebarOpen && isActive && <ChevronRight size={16} className="ml-auto opacity-70" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 mt-auto">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all group"
                    >
                        <LogOut size={22} className="text-gray-400 group-hover:text-red-500" />
                        {isSidebarOpen && <span className="font-semibold text-sm">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Menu */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-40">
                <img src={cristy.src} alt="ZenVoice" className="h-6 w-auto" />
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-white z-50 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <img src={cristy.src} alt="ZenVoice" className="h-8 w-auto" />
                        <button onClick={() => setIsMobileMenuOpen(false)}><X /></button>
                    </div>
                    <nav className="space-y-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-4 p-4 rounded-xl text-lg font-bold ${pathname === item.href ? 'bg-emerald-600 text-white' : 'text-gray-700'
                                        }`}
                                >
                                    <Icon size={24} />
                                    {item.name}
                                </Link>
                            );
                        })}
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-4 p-4 rounded-xl text-lg font-bold text-red-600"
                        >
                            <LogOut size={24} />
                            Sign Out
                        </button>
                    </nav>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative pt-16 md:pt-0">
                {/* Subtle background decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 z-10 relative">
                    {children}
                </div>
            </main>
        </div>
    );
}
