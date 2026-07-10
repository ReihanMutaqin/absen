import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useNavigate, useLocation } from "react-router";
import { Home, Camera, Clock, User, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  hideBottomNav?: boolean;
}

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Beranda" },
  { path: "/attendance", icon: Camera, label: "Absensi" },
  { path: "/history", icon: Clock, label: "Riwayat" },
  { path: "/leave", icon: User, label: "Izin" },
];

const ADMIN_NAV_ITEM = { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" };

export function MobileLayout({
  children,
  title,
  showBack,
  onBack,
  hideBottomNav = false,
}: MobileLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const navItems = isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">
                {title || "RS SHL Attendance"}
              </h1>
              <p className="text-[10px] text-slate-500 leading-tight">Sistem Absensi Face Recognition</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className={cn("max-w-lg mx-auto px-4 py-4", hideBottomNav ? "pb-6" : "pb-24")}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
          <div className="max-w-lg mx-auto flex">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive =
                path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(path);
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors",
                    isActive
                      ? "text-teal-600"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform",
                      isActive && "scale-110"
                    )}
                  />
                  <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <Toaster position="top-center" />
    </div>
  );
}
