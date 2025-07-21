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
  BarChart3,
  Phone,
  MessageSquare,
  FileText,
  Zap,
  Users,
  Key,
  TestTube,
  Activity,
  Webhook,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authManager } from "@/lib/auth";
import { User as UserType } from "@/lib/api";
import Image from "next/image";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [buildExpanded, setBuildExpanded] = useState(true);
  const [testExpanded, setTestExpanded] = useState(true);
  const [observeExpanded, setObserveExpanded] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication status
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
    router.push(`/dashboard${path === "overview" ? "" : `/${path}`}`);
  };

  const getActiveSection = () => {
    if (pathname === "/dashboard") return "overview";
    const segments = pathname.split("/");
    return segments[segments.length - 1] || "overview";
  };

  const activeSection = getActiveSection();

  const mainSidebarItems = [
    { id: "overview", label: "Overview", icon: Home, path: "/assistants" },
    // { id: "metrics", label: "Metrics", icon: BarChart3, path: "/metrics" },
  ];

  const buildItems = [
    { id: "assistants", label: "Assistants", icon: Mic, path: "/assistants" },
    // {
    //   id: "workflows",
    //   label: "Workflows",
    //   icon: Zap,
    //   badge: "New",
    //   path: "/workflows",
    // },
    // {
    //   id: "phone-numbers",
    //   label: "Phone Numbers",
    //   icon: Phone,
    //   path: "/phone-numbers",
    // },
    // { id: "tools", label: "Tools", icon: Settings, path: "/tools" },
    // { id: "files", label: "Files", icon: FileText, path: "/files" },
    // { id: "squads", label: "Squads", icon: Users, path: "/squads" },
    // { id: "api-keys", label: "Vapi API Keys", icon: Key, path: "/api-keys" },
  ];

  const testItems = [
    {
      id: "test-suites",
      label: "Test Suites",
      icon: TestTube,
      path: "/test-suites",
    },
  ];

  const observeItems = [
    { id: "call-logs", label: "Call Logs", icon: Activity, path: "/call-logs" },
    {
      id: "chat-logs",
      label: "Chat Logs",
      icon: MessageSquare,
      path: "/chat-logs",
    },
    {
      id: "session-logs",
      label: "Session Logs",
      icon: Activity,
      path: "/session-logs",
    },
    { id: "api-logs", label: "API Logs", icon: Activity, path: "/api-logs" },
    {
      id: "webhook-logs",
      label: "Webhook Logs",
      icon: Webhook,
      path: "/webhook-logs",
    },
  ];

  const renderNavItem = (item: any, isActive: boolean) => {
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        onClick={() => handleNavigation(item.path)}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? "bg-blue-600 text-white shadow-md"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        {!sidebarCollapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive ? "bg-white text-blue-600" : "bg-blue-600 text-white"
                }`}
              >
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-white/90 backdrop-blur-sm border-r border-gray-200/50 transition-all duration-300 flex flex-col shadow-lg`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10">
                  <Image
                    src="/rounded-logo.png"
                    alt="Logo"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                </div>
                <div className="text-xl font-bold text-gray-900">Zenvoice</div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-10 h-10 mx-auto">
                <Image
                  src="/rounded-logo.png"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-2 space-y-1">
            {/* Main items */}
            {mainSidebarItems.map((item) =>
              renderNavItem(item, activeSection === item.id),
            )}

            {/* BUILD Section */}
            {!sidebarCollapsed && (
              <div className="pt-4">
                <button
                  onClick={() => setBuildExpanded(!buildExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>BUILD</span>
                  {buildExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}

            {(buildExpanded || sidebarCollapsed) &&
              buildItems.map((item) =>
                renderNavItem(item, activeSection === item.id),
              )}

            {/* TEST Section */}
            {!sidebarCollapsed && (
              <div className="pt-4">
                <button
                  onClick={() => setTestExpanded(!testExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>TEST</span>
                  {testExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}

            {(testExpanded || sidebarCollapsed) &&
              testItems.map((item) =>
                renderNavItem(item, activeSection === item.id),
              )}

            {/* OBSERVE Section */}
            {!sidebarCollapsed && (
              <div className="pt-4">
                <button
                  onClick={() => setObserveExpanded(!observeExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                >
                  <span>OBSERVE</span>
                  {observeExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}

            {(observeExpanded || sidebarCollapsed) &&
              observeItems.map((item) =>
                renderNavItem(item, activeSection === item.id),
              )}
          </nav>
        </div>

        {/* Credits Section */}
        <div className="p-4 border-t border-gray-200/50">
          {!sidebarCollapsed ? (
            <div className="space-y-3">
              {/* Ad-hoc Infra */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Ad-hoc Infra</span>
                <span className="text-sm font-semibold text-gray-900 ml-auto">
                  9 credits
                </span>
              </div>

              {/* Buy Credits Button */}
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm py-2">
                Buy Credits
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-900 font-semibold">9</span>
            </div>
          )}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200/50">
          {!sidebarCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Collapse Button at Bottom */}
        <div className="p-4 border-t border-gray-200/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
