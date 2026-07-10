import { useNavigate } from "react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  LogIn,
  LogOut,
  Shield,
  BarChart3,
  Loader2,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: employeeStats } = trpc.employee.stats.useQuery();
  const { data: attendanceStats } = trpc.attendance.stats.useQuery();
  const { data: recentAttendances } = trpc.attendance.list.useQuery({ limit: 10 });

  // Redirect non-admin users
  if (isAuthenticated && !isAdmin) {
    return (
      <MobileLayout title="Dashboard" showBack onBack={() => navigate("/")}>
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700">Akses Terbatas</h2>
          <p className="text-sm text-slate-500 mt-2">
            Dashboard hanya dapat diakses oleh admin.
          </p>
          <Button className="mt-4" onClick={() => navigate("/login")}>
            Login sebagai Admin
          </Button>
        </div>
      </MobileLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <MobileLayout title="Dashboard" showBack onBack={() => navigate("/")}>
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700">Login Diperlukan</h2>
          <p className="text-sm text-slate-500 mt-2">
            Mohon login untuk mengakses dashboard.
          </p>
          <Button className="mt-4" onClick={() => navigate("/login")}>
            Login
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Dashboard" showBack onBack={() => navigate("/")}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-3">
            <Users className="w-5 h-5 text-blue-600 mb-1" />
            <p className="text-2xl font-bold text-blue-700">{employeeStats?.total || 0}</p>
            <p className="text-xs text-blue-600">Total Pegawai</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-3">
            <UserCheck className="w-5 h-5 text-green-600 mb-1" />
            <p className="text-2xl font-bold text-green-700">{employeeStats?.approved || 0}</p>
            <p className="text-xs text-green-600">Tersetujui</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-100">
          <CardContent className="p-3">
            <Clock className="w-5 h-5 text-yellow-600 mb-1" />
            <p className="text-2xl font-bold text-yellow-700">{employeeStats?.pending || 0}</p>
            <p className="text-xs text-yellow-600">Menunggu</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <CardContent className="p-3">
            <UserX className="w-5 h-5 text-red-600 mb-1" />
            <p className="text-2xl font-bold text-red-700">{employeeStats?.rejected || 0}</p>
            <p className="text-xs text-red-600">Ditolak</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Attendance Stats */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Absensi Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-lg font-bold text-slate-700">{attendanceStats?.checkIns || 0}</p>
              <p className="text-xs text-slate-500">Check-in</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-lg font-bold text-slate-700">{attendanceStats?.checkOuts || 0}</p>
              <p className="text-xs text-slate-500">Check-out</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-lg font-bold text-green-600">{attendanceStats?.faceMatched || 0}</p>
              <p className="text-xs text-slate-500">Face Verified</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button
          variant="outline"
          className="h-auto py-3 flex flex-col items-center gap-1"
          onClick={() => navigate("/admin/employees")}
        >
          <Users className="w-5 h-5 text-blue-600" />
          <span className="text-xs">Approval Pegawai</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-3 flex flex-col items-center gap-1"
          onClick={() => navigate("/admin/reports")}
        >
          <BarChart3 className="w-5 h-5 text-orange-600" />
          <span className="text-xs">Laporan Absensi</span>
        </Button>
      </div>

      {/* Recent Attendances */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Absensi Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {!recentAttendances ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            </div>
          ) : recentAttendances.length > 0 ? (
            <div className="space-y-2">
              {recentAttendances.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    a.type === "check_in" ? "bg-green-100" : "bg-orange-100"
                  }`}>
                    {a.type === "check_in" ? (
                      <LogIn className="w-4 h-4 text-green-600" />
                    ) : (
                      <LogOut className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.employeeName || "Unknown"}</p>
                    <p className="text-xs text-slate-500">
                      {a.date} • {a.time}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    a.faceMatched === "yes"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {a.faceMatched === "yes" ? "OK" : "?"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">Belum ada data absensi</p>
          )}
        </CardContent>
      </Card>
    </MobileLayout>
  );
}
