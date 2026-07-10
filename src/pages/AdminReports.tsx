import { useState } from "react";
import { useNavigate } from "react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/providers/trpc";
import {
  BarChart3,
  CalendarDays,
  LogIn,
  LogOut,
  MapPin,
  Loader2,
  Download,
  Search,
} from "lucide-react";

type ExportMode = "single" | "range" | "month";

export default function AdminReports() {
  const navigate = useNavigate();
  const [exportMode, setExportMode] = useState<ExportMode>("single");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [departmentId, setDepartmentId] = useState<string>("");

  const { data: departments } = trpc.department.list.useQuery();

  // Compute the effective date filter
  const effectiveDate = exportMode === "single" ? selectedDate : undefined;

  const { data: attendanceStats } = trpc.attendance.stats.useQuery(
    { date: effectiveDate },
    { enabled: exportMode === "single" && !!effectiveDate }
  );

  const { data: attendances, isLoading } = trpc.attendance.list.useQuery(
    {
      date: effectiveDate,
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      limit: 500,
    },
    { enabled: true }
  );

  // Filter by range / month on client side
  const filteredAttendances = attendances?.filter((a) => {
    if (!a.date) return true;
    if (exportMode === "range" && startDate && endDate) {
      return a.date >= startDate && a.date <= endDate;
    }
    if (exportMode === "month" && selectedMonth) {
      return a.date.startsWith(selectedMonth);
    }
    return true;
  });

  const handleExport = () => {
    if (!filteredAttendances || filteredAttendances.length === 0) return;

    const csv = [
      ["No", "Nama", "NIK", "Departemen", "Tipe", "Tanggal", "Waktu", "Lokasi", "Face Match", "Similarity"].join(
        ", "
      ),
      ...filteredAttendances.map((a, i) =>
        [
          i + 1,
          a.employeeName || "-",
          a.employeeNik || "-",
          a.departmentName || "-",
          a.type,
          a.date,
          a.time,
          a.locationName || "-",
          a.faceMatched,
          a.faceSimilarity || "-",
        ].join(", ")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);

    let filename = "absensi";
    if (exportMode === "single") filename += `_${selectedDate}`;
    else if (exportMode === "range") filename += `_${startDate}_sd_${endDate}`;
    else if (exportMode === "month") filename += `_${selectedMonth}`;
    link.download = `${filename}.csv`;
    link.click();
  };

  return (
    <MobileLayout title="Laporan Absensi" showBack onBack={() => navigate("/dashboard")}>
      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
          {/* Export Mode */}
          <div>
            <Label className="text-xs">Mode Filter</Label>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {(["single", "range", "month"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setExportMode(mode)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    exportMode === mode
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {mode === "single" ? "Per Hari" : mode === "range" ? "Rentang" : "Per Bulan"}
                </button>
              ))}
            </div>
          </div>

          {exportMode === "single" && (
            <div>
              <Label className="text-xs">Tanggal</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          )}

          {exportMode === "range" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Dari</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Sampai</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          )}

          {exportMode === "month" && (
            <div>
              <Label className="text-xs">Bulan</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          )}

          <div>
            <Label className="text-xs">Departemen</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Departemen</SelectItem>
                {departments?.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full border-teal-200 text-teal-700 hover:bg-teal-50"
            onClick={handleExport}
            disabled={!filteredAttendances || filteredAttendances.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV ({filteredAttendances?.length ?? 0} data)
          </Button>
        </CardContent>
      </Card>

      {/* Stats — only for single day mode */}
      {exportMode === "single" && attendanceStats && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Card className="bg-green-50 border-green-100">
            <CardContent className="p-3 text-center">
              <LogIn className="w-4 h-4 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-700">{attendanceStats.checkIns}</p>
              <p className="text-[10px] text-green-600">Check-in</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-100">
            <CardContent className="p-3 text-center">
              <LogOut className="w-4 h-4 text-orange-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-orange-700">{attendanceStats.checkOuts}</p>
              <p className="text-[10px] text-orange-600">Check-out</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-3 text-center">
              <BarChart3 className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-700">{attendanceStats.totalRecords}</p>
              <p className="text-[10px] text-blue-600">Total</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Data Absensi ({filteredAttendances?.length ?? 0} records)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            </div>
          ) : filteredAttendances && filteredAttendances.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredAttendances.map((a) => (
                <div key={a.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          a.type === "check_in" ? "bg-green-100" : "bg-orange-100"
                        }`}
                      >
                        {a.type === "check_in" ? (
                          <LogIn className="w-4 h-4 text-green-600" />
                        ) : (
                          <LogOut className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{a.employeeName || "-"}</p>
                        <p className="text-xs text-slate-500">
                          {a.employeeNik} {a.departmentName ? `• ${a.departmentName}` : ""}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        a.faceMatched === "yes"
                          ? "bg-green-100 text-green-700"
                          : a.faceMatched === "no"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {a.faceMatched === "yes"
                        ? "Verified"
                        : a.faceMatched === "no"
                        ? "Failed"
                        : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {a.date}
                    </span>
                    <span>{a.time}</span>
                    {a.faceSimilarity && (
                      <span>{(parseFloat(a.faceSimilarity) * 100).toFixed(1)}%</span>
                    )}
                  </div>
                  {a.locationName && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{a.locationName}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Tidak ada data absensi</p>
            </div>
          )}
        </CardContent>
      </Card>
    </MobileLayout>
  );
}
