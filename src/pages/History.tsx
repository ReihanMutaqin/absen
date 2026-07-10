import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { Search, CalendarDays, LogIn, LogOut, MapPin, Clock, Loader2 } from "lucide-react";

export default function History() {
  const navigate = useNavigate();
  const [nik, setNik] = useState("");
  const [searchNik, setSearchNik] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Use tRPC to search employee — triggered by searchNik state change
  const { data: employee, isFetching: isSearching, isError } = trpc.employee.getByNik.useQuery(
    { nik: searchNik },
    { enabled: !!searchNik, retry: false }
  );

  const { data: history, isLoading } = trpc.attendance.getHistory.useQuery(
    {
      employeeId: employee?.id ?? 0,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit: 50,
    },
    { enabled: !!employee?.id }
  );

  // Show toast when search result arrives
  useEffect(() => {
    if (!searchNik || isSearching) return;
    if (employee) {
      toast.success(`Data ditemukan: ${employee.name}`);
    }
  }, [employee, searchNik, isSearching]);

  const handleSearch = useCallback(() => {
    if (!nik.trim()) {
      toast.error("Masukkan NIK");
      return;
    }
    setSearchNik(nik.trim());
  }, [nik]);

  return (
    <MobileLayout title="Riwayat Absensi" showBack onBack={() => navigate("/")}>
      {/* Search */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
          <div>
            <Label htmlFor="nik">NIK Pegawai</Label>
            <div className="flex gap-2">
              <Input
                id="nik"
                placeholder="Masukkan NIK"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon" disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {employee && (
            <div className="flex items-center gap-2 p-2 bg-teal-50 rounded-lg">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                {employee.facePhotoUrl ? (
                  <img src={employee.facePhotoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="text-teal-600 font-bold text-xs">{employee.name[0]}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-800">{employee.name}</p>
                <p className="text-xs text-teal-600">{employee.nik} · {employee.departmentName || "–"}</p>
              </div>
            </div>
          )}

          {!employee && searchNik && !isSearching && (
            <p className="text-xs text-red-500 text-center">NIK tidak ditemukan</p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Dari Tanggal</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Sampai Tanggal</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        </div>
      ) : history && history.length > 0 ? (
        <div className="space-y-2">
          {history.map((record) => (
            <Card key={record.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      record.type === "check_in" ? "bg-green-100" : "bg-orange-100"
                    }`}
                  >
                    {record.type === "check_in" ? (
                      <LogIn className="w-5 h-5 text-green-600" />
                    ) : (
                      <LogOut className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-semibold ${
                          record.type === "check_in" ? "text-green-700" : "text-orange-700"
                        }`}
                      >
                        {record.type === "check_in" ? "Check-in" : "Check-out"}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          record.faceMatched === "yes"
                            ? "bg-green-100 text-green-700"
                            : record.faceMatched === "no"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {record.faceMatched === "yes"
                          ? "Verified"
                          : record.faceMatched === "no"
                          ? "Failed"
                          : "Pending"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {record.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {record.time}
                      </span>
                    </div>
                    {record.locationName && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{record.locationName}</span>
                      </div>
                    )}
                    {record.faceSimilarity && (
                      <p className="text-xs text-slate-400 mt-1">
                        Similarity: {(parseFloat(record.faceSimilarity) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : employee ? (
        <div className="text-center py-8">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Tidak ada data absensi</p>
        </div>
      ) : (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Masukkan NIK untuk melihat riwayat</p>
        </div>
      )}
    </MobileLayout>
  );
}
