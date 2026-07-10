import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  Search,
  User,
  CalendarDays,
  LogIn,
  LogOut,
  Clock,
  Loader2,
  Building2,
  BadgeCheck,
  Phone,
  Mail,
} from "lucide-react";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  approved: { label: "Aktif", variant: "default" },
  pending: { label: "Menunggu", variant: "secondary" },
  rejected: { label: "Ditolak", variant: "destructive" },
};

const shiftLabels: Record<string, string> = {
  pagi: "Pagi (07:00 – 15:00)",
  siang: "Siang (15:00 – 23:00)",
  malam: "Malam (23:00 – 07:00)",
  flexible: "Flexible",
};

export default function Profile() {
  const navigate = useNavigate();
  const [nik, setNik] = useState("");
  const [searchNik, setSearchNik] = useState("");

  const { data: employee, isFetching } = trpc.employee.getByNik.useQuery(
    { nik: searchNik },
    { enabled: !!searchNik, retry: false }
  );

  const today = new Date().toISOString().split("T")[0];
  const { data: todayAttendances } = trpc.attendance.getToday.useQuery(
    { employeeId: employee?.id ?? 0, date: today },
    { enabled: !!employee?.id }
  );

  const { data: recentHistory } = trpc.attendance.getHistory.useQuery(
    { employeeId: employee?.id ?? 0, limit: 5 },
    { enabled: !!employee?.id }
  );

  const handleSearch = useCallback(() => {
    if (!nik.trim()) {
      toast.error("Masukkan NIK");
      return;
    }
    setSearchNik(nik.trim());
  }, [nik]);

  const todayCheckIn = todayAttendances?.find((a) => a.type === "check_in");
  const todayCheckOut = todayAttendances?.find((a) => a.type === "check_out");

  return (
    <MobileLayout title="Profil Pegawai" showBack onBack={() => navigate("/")}>
      {/* Search */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
          <div>
            <Label htmlFor="nik-profile">NIK Pegawai</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="nik-profile"
                placeholder="Masukkan NIK"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon" disabled={isFetching}>
                {isFetching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Not found */}
      {!employee && searchNik && !isFetching && (
        <div className="text-center py-8">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">NIK tidak ditemukan</p>
        </div>
      )}

      {/* Profile Card */}
      {employee && (
        <>
          <Card className="mb-4 overflow-hidden">
            {/* Header gradient */}
            <div className="h-16 bg-gradient-to-r from-teal-600 to-teal-700" />
            <CardContent className="p-4 pt-0">
              <div className="-mt-8 flex items-end gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl border-4 border-white overflow-hidden bg-teal-100 flex items-center justify-center shadow-md">
                  {employee.facePhotoUrl ? (
                    <img
                      src={employee.facePhotoUrl}
                      alt={employee.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-teal-600" />
                  )}
                </div>
                <div className="mb-1">
                  <h2 className="text-base font-bold text-slate-800">{employee.name}</h2>
                  <p className="text-xs text-slate-500">{employee.nik}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant={statusMap[employee.status]?.variant ?? "secondary"}>
                  {statusMap[employee.status]?.label ?? employee.status}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  Shift: {shiftLabels[employee.shift] ?? employee.shift}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                {employee.departmentName && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{employee.departmentName}</span>
                  </div>
                )}
                {employee.position && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <BadgeCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{employee.position}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                {employee.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{employee.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Status */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Absensi Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`p-3 rounded-xl text-center border ${
                    todayCheckIn
                      ? "bg-green-50 border-green-100"
                      : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <LogIn
                    className={`w-5 h-5 mx-auto mb-1 ${
                      todayCheckIn ? "text-green-600" : "text-slate-300"
                    }`}
                  />
                  <p className="text-xs text-slate-500">Check-in</p>
                  <p
                    className={`text-sm font-bold mt-0.5 ${
                      todayCheckIn ? "text-green-700" : "text-slate-400"
                    }`}
                  >
                    {todayCheckIn?.time ?? "–"}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-xl text-center border ${
                    todayCheckOut
                      ? "bg-orange-50 border-orange-100"
                      : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <LogOut
                    className={`w-5 h-5 mx-auto mb-1 ${
                      todayCheckOut ? "text-orange-600" : "text-slate-300"
                    }`}
                  />
                  <p className="text-xs text-slate-500">Check-out</p>
                  <p
                    className={`text-sm font-bold mt-0.5 ${
                      todayCheckOut ? "text-orange-700" : "text-slate-400"
                    }`}
                  >
                    {todayCheckOut?.time ?? "–"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent History */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Riwayat Terbaru</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {!recentHistory ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                </div>
              ) : recentHistory.length > 0 ? (
                <div className="space-y-2">
                  {recentHistory.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          r.type === "check_in" ? "bg-green-100" : "bg-orange-100"
                        }`}
                      >
                        {r.type === "check_in" ? (
                          <LogIn className="w-4 h-4 text-green-600" />
                        ) : (
                          <LogOut className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-semibold ${
                            r.type === "check_in" ? "text-green-700" : "text-orange-700"
                          }`}
                        >
                          {r.type === "check_in" ? "Check-in" : "Check-out"}
                        </p>
                        <div className="flex gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-0.5">
                            <CalendarDays className="w-2.5 h-2.5" />
                            {r.date}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {r.time}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          r.faceMatched === "yes"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {r.faceMatched === "yes" ? "✓" : "?"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">
                  Belum ada riwayat absensi
                </p>
              )}

              {recentHistory && recentHistory.length >= 5 && (
                <Button
                  variant="link"
                  size="sm"
                  className="w-full mt-2 text-teal-600"
                  onClick={() => navigate("/history")}
                >
                  Lihat semua riwayat →
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Initial state */}
      {!searchNik && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-teal-400" />
          </div>
          <p className="text-slate-500 text-sm">Masukkan NIK untuk melihat profil</p>
        </div>
      )}
    </MobileLayout>
  );
}
