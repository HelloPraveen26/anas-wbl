"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  User,
  Settings,
  Mic,
  AlertCircle,
  Home,
  Phone,
  Activity,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CreditCard,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authManager } from "@/lib/auth";
import { User as UserType } from "@/lib/api";
import Image from "next/image";
import newlogo from "../../assets/newlogo.png";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [buildExpanded, setBuildExpanded] = useState(true);
  const [observeExpanded, setObserveExpanded] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const authState = authManager.getAuthState();

    if (!authState.isAuthenticated) {
      router.push("/");
      return;
    }

    try {
      setUser(authState.user);
    } catch (err) {
      console.error("Error loading user data:", err);
      setError("Invalid user data. Please sign in again.");
      authManager.clearAuth();
      router.push("/");
      return;
    }

    setIsLoading(false);
  }, [router]);

  const handleSignOut = () => {
    authManager.clearAuth();
    router.push("/");
  };

  const handleNavigation = (path: string) => {
    if (path === "" || path === "overview") {
      router.push("/dashboard");
    } else {
      router.push(`/dashboard${path}`);
    }
  };

  const handleProfileClick = () => {
    router.push("/dashboard/profile");
  };

  const getActiveSection = () => {
    if (pathname === "/dashboard") return "overview";
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return lastSegment || "overview";
  };

  const activeSection = getActiveSection();

  const mainSidebarItems = [
    { id: "overview", label: "Overview", icon: Home, path: "" },
  ];

  const buildItems = [
    { id: "assistants", label: "Assistants", icon: Mic, path: "/assistants" },
    {
      id: "phone-numbers",
      label: "Phone Numbers",
      icon: Phone,
      path: "/phone-numbers",
    },
    { id: "tools", label: "Tools", icon: Settings, path: "/tools" },
  ];

  const observeItems = [
    { id: "call-logs", label: "Call Logs", icon: Activity, path: "/call-logs" },
  ];

  const renderNavItem = (item: any, isActive: boolean) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => handleNavigation(item.path)}
        className={`group relative w-full flex items-center gap-2 px-3 py-1.5 text-sm font-semibold transition-all ${
          isActive
            ? "text-emerald-800 bg-emerald-100 rounded-lg"
            : "text-gray-900 hover:text-gray-900"
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-full"></div>
        )}
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
            isActive
              ? "bg-emerald-50 text-emerald-600"
              : "text-emerald-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        {!sidebarCollapsed && (
          <>
            <span className="flex-1 text-left font-semibold">{item.label}</span>
            {item.badge && (
              <span className="text-xs px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-600 font-semibold">
                {item.badge}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <Image
              src="/rounded-logo.png"
              alt="Logo"
              width={64}
              height={64}
              className="animate-pulse"
            />
          </div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } bg-white border-r border-gray-300 transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200  ">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 ml-5">
              <Image
                src={newlogo}
                alt="ZenVoice Logo"
                width={120}
                height={32}
                className="object-contain" 
              />
            </div>
          ) : (
            <div className="w-9 h-9 mx-auto bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-1">
            {/* Main */}
            {mainSidebarItems.map((item) =>
              renderNavItem(item, activeSection === item.id),
            )}

            {/* BUILD Section */}
            <div className="pt-6 pb-2">
              {!sidebarCollapsed ? (
                <button
                  onClick={() => setBuildExpanded(!buildExpanded)}
                  className="w-full flex items-center justify-between px-3 py-0.2 text-xs font-bold text-gray-600 uppercase tracking-wider hover:text-gray-600 -mt-5"
                >
                  <span>Build</span>
                  {buildExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : (
                <div className="h-px bg-gray-200 mx-2"></div>
              )}
            </div>

            {(buildExpanded || sidebarCollapsed) &&
              buildItems.map((item) =>
                renderNavItem(item, activeSection === item.id),
              )}

            {/* OBSERVE Section */}
            <div className="pt-6 pb-2">
              {!sidebarCollapsed ? (
                <button
                  onClick={() => setObserveExpanded(!observeExpanded)}
                  className="w-full flex items-center justify-between px-3 py-0.2 text-xs font-bold text-gray-600 uppercase tracking-wider hover:text-gray-600 -mt-5"
                >
                  <span>Observe</span>
                  {observeExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              ) : (
                <div className="h-px bg-gray-200 mx-2"></div>
              )}
            </div>

            {(observeExpanded || sidebarCollapsed) &&
              observeItems.map((item) =>
                renderNavItem(item, activeSection === item.id),
              )}
          </nav>
        </div>

        {/* Credits Card */}
        <div className="p-3 border-t border-gray-300">
          {!sidebarCollapsed ? (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-600 uppercase">Credits</span>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">9</div>
              <Button className="w-full bg-gray-800 hover:bg-emerald-600 text-white h-8 text-xs font-semibold">
                <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                Buy Credits
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-2 border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              <span className="text-sm font-bold text-gray-900">9</span>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-green-300 bg-emerald-50 rounded-xl mx-2 mb-2 shadow-sm">
          {!sidebarCollapsed ? (
            <div>
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-emerald-100 cursor-pointer mb-1 transition-colors"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-600 truncate">{user?.email}</div>
                </div>
              </button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-emerald-100 h-8 text-xs font-semibold rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleProfileClick}
                className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <User className="w-5 h-5 text-white" />
              </button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="w-full p-2 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 text-gray-700" />
              </Button>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-gray-300">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 h-8"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">{children}</div>
    </div>
  );
}