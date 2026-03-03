"use client";

import { useEffect, useState, Suspense } from "react";
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
  PhoneIncoming,
  AudioWaveform,
  RefreshCw,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authManager } from "@/lib/auth";
import { User as UserType } from "@/lib/api";
import Image from "next/image";
import cristy from "../../assets/newlogo.png";
import logo1 from "../../assets/logo1.png";
import { BuyCreditsDialog } from "@/components/BuyCreditsDialog";
import { useUserRefresh } from "@/hooks/useUserRefresh";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/Toast";
import { PaymentCallbackHandler } from "@/components/PaymentCallbackHandler";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [buildExpanded, setBuildExpanded] = useState(true);
  const [observeExpanded, setObserveExpanded] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { refreshUser, isRefreshing } = useUserRefresh();
  const { toasts, success, removeToast } = useToast();

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
    // Close mobile sidebar on navigation
    setIsMobileSidebarOpen(false);
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
    // { id: "voices", label: "Voices", icon: AudioWaveform, path: "/voices" },
  ];

  const observeItems = [
    {
      id: "call-logs",
      label: "Call Logs",
      icon: PhoneIncoming,
      path: "/call-logs",
    },
    {
      id: "chat-logs",
      label: "Chat Logs",
      icon: MessageSquare,
      path: "/chat-logs",
    },
  ];

  const renderNavItem = (item: any, isActive: boolean) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => handleNavigation(item.path)}
        className={`group relative w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-xl ${
          isActive
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
            : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
        }`}
      >
        <div
          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
            isActive
              ? "bg-white/20"
              : "bg-gray-100 text-emerald-600 group-hover:bg-emerald-100"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        {!sidebarCollapsed && (
          <>
            <span className="flex-1 text-left font-semibold">{item.label}</span>
            {item.badge && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm font-semibold">
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Image
            src={logo1}
            alt="Logo"
            width={48}
            height={48}
            className="opacity-90"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex">
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? "w-20" : "w-72"
        } bg-white/80 backdrop-blur-xl border-r border-emerald-100 transition-all duration-300 flex flex-col shadow-xl
        ${isMobileSidebarOpen ? "fixed inset-y-0 left-0 z-50" : "hidden"} md:flex`}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-emerald-100">
          <div className="flex-1">
            <img src={cristy.src} alt="Company Logo" className="h-10 w-auto" />
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-emerald-50 transition-colors flex-shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 ">
          <nav className="px-4 space-y-2">
            {/* Main */}
            {mainSidebarItems.map((item) =>
              renderNavItem(item, activeSection === item.id),
            )}

            {/* BUILD Section */}
            <div className="pt-6 pb-2">
              {!sidebarCollapsed ? (
                <button
                  onClick={() => setBuildExpanded(!buildExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-gray-500 uppercase tracking-wider hover:text-emerald-600 transition-colors rounded-lg hover:bg-emerald-50"
                >
                  <span>Build</span>
                  {buildExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <div className="h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent mx-2"></div>
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
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-gray-500 uppercase tracking-wider hover:text-emerald-600 transition-colors rounded-lg hover:bg-emerald-50"
                >
                  <span>Observe</span>
                  {observeExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <div className="h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent mx-2"></div>
              )}
            </div>

            {(observeExpanded || sidebarCollapsed) &&
              observeItems.map((item) =>
                renderNavItem(item, activeSection === item.id),
              )}
          </nav>
        </div>

        {/* Credits Card */}
        <div className="p-4">
          {!sidebarCollapsed ? (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Credits
                </span>
                <button
                  onClick={async () => {
                    const result = await refreshUser();
                    if (result.success && result.user) setUser(result.user);
                  }}
                  disabled={isRefreshing}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  title="Refresh credits"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-3">
                {(user?.credits || 0).toFixed(2)}
              </div>
              <BuyCreditsDialog />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 bg-white rounded-xl p-3 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {(user?.credits || 0).toFixed(2)}
                </span>
                <button
                  onClick={async () => {
                    const result = await refreshUser();
                    if (result.success && result.user) setUser(result.user);
                  }}
                  disabled={isRefreshing}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  title="Refresh credits"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
              <BuyCreditsDialog
                trigger={
                  <Button
                    size="sm"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white p-2"
                  >
                    <CreditCard className="w-4 h-4" />
                  </Button>
                }
              />
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-emerald-100">
          {!sidebarCollapsed ? (
            <div className="space-y-2">
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-all group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 flex-shrink-0 group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-shadow">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </div>
                </div>
              </button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-emerald-50 h-9 text-sm font-medium rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleProfileClick}
                className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
              >
                <User className="w-5 h-5 text-white" />
              </button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="w-full p-2 hover:bg-emerald-50 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        {/* <div className="p-4 border-t border-emerald-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 h-9 rounded-xl font-medium transition-all"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </Button>
        </div> */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Mobile Header with Hamburger */}
        <div className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-emerald-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-emerald-50 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <img src={cristy.src} alt="ZenVoice Logo" className="h-8 w-auto" />
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>

      {/* Payment Callback Handler */}
      <Suspense fallback={null}>
        <PaymentCallbackHandler user={user} onUserUpdate={setUser} />
      </Suspense>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
