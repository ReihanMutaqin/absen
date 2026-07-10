import { useNavigate } from "react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarDays,
  UserPlus,
  LogIn,
  BarChart3,
  Shield,
  FileText,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { useState, useEffect } from "react";

export default function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  // Real-time clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Pending stats for admin badge
  const { data: employeeStats } = trpc.employee.stats.useQuery(undefined, {
    enabled: isAdmin,
    refetchInterval: 30000,
  });
  const { data: leavePending } = trpc.leave.pendingCount.useQuery(undefined, {
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  const pendingEmployees = employeeStats?.pending ?? 0;
  const pendingLeaves = leavePending?.count ?? 0;
  const totalPending = pendingEmployees + pendingLeaves;

  const menuItems = [
    {
      label: "Daftar Pegawai",
      sub: "Registrasi wajah baru",
      icon: UserPlus,
      color: "bg-blue-100",
      iconColor: "text-blue-600",
      path: "/register",
    },
    {
      label: "Absensi",
      sub: "Check-in / Check-out",
      icon: LogIn,
      color: "bg-green-100",
      iconColor: "text-green-600",
      path: "/attendance",
    },
    {
      label: "Riwayat",
      sub: "Lihat riwayat absensi",
      icon: CalendarDays,
      color: "bg-purple-100",
      iconColor: "text-purple-600",
      path: "/history",
    },
    {
      label: "Profil",
      sub: "Lihat data pegawai",
      icon: User,
      color: "bg-cyan-100",
      iconColor: "text-cyan-600",
      path: "/profile",
    },
    {
      label: "Pengajuan Izin",
      sub: "Izin & Cuti",
      icon: FileText,
      color: "bg-orange-100",
      iconColor: "text-orange-600",
      path: "/leave",
    },
    {
      label: "Dashboard",
      sub: "Monitoring & Laporan",
      icon: BarChart3,
      color: "bg-amber-100",
      iconColor: "text-amber-600",
      path: "/dashboard",
    },
  ];

  return (
    <MobileLayout>
      {/* Welcome Section */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-3">
          <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800">RS SHL</h1>
        <p className="text-sm text-slate-500 mt-1">Sistem Absensi Digital</p>
      </div>

      {/* Date Time Card */}
      <Card className="mb-6 bg-gradient-to-r from-teal-600 to-teal-700 border-0 text-white">
        <CardContent className="p-4 text-center">
          <CalendarDays className="w-5 h-5 mx-auto mb-1 opacity-80" />
          <p className="text-sm opacity-90">{dateStr}</p>
          <p className="text-3xl font-bold mt-1 tabular-nums tracking-wider">{timeStr}</p>
        </CardContent>
      </Card>

      {/* Admin Alert Badge */}
      {isAdmin && totalPending > 0 && (
        <div
          className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => navigate("/admin/employees")}
        >
          <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Perlu Perhatian</p>
            <p className="text-xs text-amber-600">
              {pendingEmployees > 0 && `${pendingEmployees} pegawai menunggu approval`}
              {pendingEmployees > 0 && pendingLeaves > 0 && " · "}
              {pendingLeaves > 0 && `${pendingLeaves} izin menunggu`}
            </p>
          </div>
          <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {totalPending}
          </div>
        </div>
      )}

      {/* Menu Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {menuItems.map(({ label, sub, icon: Icon, color, iconColor, path }) => (
          <Card
            key={path}
            className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 border-slate-100"
            onClick={() => navigate(path)}
          >
            <CardContent className="p-4 text-center">
              <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">{label}</h3>
              <p className="text-xs text-slate-500 mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Section */}
      {isAdmin && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Menu Admin
          </h2>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12 relative"
              onClick={() => navigate("/admin/employees")}
            >
              <UserPlus className="w-5 h-5 text-blue-600" />
              <div className="text-left flex-1">
                <p className="text-sm font-medium">Approval Pegawai</p>
                <p className="text-xs text-slate-500">Setujui atau tolak pendaftaran</p>
              </div>
              {pendingEmployees > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {pendingEmployees}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12 relative"
              onClick={() => navigate("/admin/reports")}
            >
              <BarChart3 className="w-5 h-5 text-orange-600" />
              <div className="text-left">
                <p className="text-sm font-medium">Laporan Absensi</p>
                <p className="text-xs text-slate-500">Data dan statistik absensi</p>
              </div>
            </Button>
          </div>
        </div>
      )}

      {/* Login/Logout */}
      <div className="text-center">
        {isAuthenticated ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              Login sebagai:{" "}
              <span className="font-semibold text-teal-700">{user?.name || "Admin"}</span>
              {isAdmin && (
                <span className="ml-2 text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-semibold">
                  ADMIN
                </span>
              )}
            </p>
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={logout}>
              Keluar
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
            Login Management
          </Button>
        )}
      </div>
    </MobileLayout>
  );
}
