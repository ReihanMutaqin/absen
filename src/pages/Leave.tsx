import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  Search,
  FileText,
  Send,
  Loader2,
  User,
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

const leaveTypeLabels: Record<string, string> = {
  sakit: "Sakit",
  cuti: "Cuti",
  izin: "Izin",
  dinas: "Dinas Luar",
};

const statusConfig = {
  pending: { label: "Menunggu", icon: Clock, color: "bg-yellow-100 text-yellow-700", badgeVariant: "secondary" as const },
  approved: { label: "Disetujui", icon: CheckCircle, color: "bg-green-100 text-green-700", badgeVariant: "default" as const },
  rejected: { label: "Ditolak", icon: XCircle, color: "bg-red-100 text-red-700", badgeVariant: "destructive" as const },
};

export default function Leave() {
  const navigate = useNavigate();
  const [nik, setNik] = useState("");
  const [searchNik, setSearchNik] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    type: "izin" as "sakit" | "cuti" | "izin" | "dinas",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const { data: employee, isFetching } = trpc.employee.getByNik.useQuery(
    { nik: searchNik },
    { enabled: !!searchNik, retry: false }
  );

  const { data: leaveHistory, refetch: refetchHistory } = trpc.leave.getByEmployee.useQuery(
    { employeeId: employee?.id ?? 0 },
    { enabled: !!employee?.id }
  );

  const submitMutation = trpc.leave.submit.useMutation();

  const handleSearch = useCallback(() => {
    if (!nik.trim()) {
      toast.error("Masukkan NIK");
      return;
    }
    setSearchNik(nik.trim());
    setSubmitted(false);
  }, [nik]);

  const handleSubmit = useCallback(async () => {
    if (!employee) return;
    if (!form.startDate || !form.endDate) {
      toast.error("Pilih tanggal mulai dan selesai");
      return;
    }
    if (form.startDate > form.endDate) {
      toast.error("Tanggal selesai harus setelah tanggal mulai");
      return;
    }
    if (form.reason.trim().length < 5) {
      toast.error("Alasan minimal 5 karakter");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        employeeId: employee.id,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
      });
      toast.success("Permohonan izin berhasil dikirim!");
      setSubmitted(true);
      setForm({ type: "izin", startDate: "", endDate: "", reason: "" });
      refetchHistory();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim permohonan");
    } finally {
      setIsSubmitting(false);
    }
  }, [employee, form, submitMutation, refetchHistory]);

  // Compute total days
  const totalDays =
    form.startDate && form.endDate
      ? Math.max(
          1,
          Math.ceil(
            (new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        )
      : 0;

  return (
    <MobileLayout title="Pengajuan Izin" showBack onBack={() => navigate("/")}>
      {/* Search Employee */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
          <div>
            <Label htmlFor="nik-leave">NIK Pegawai</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="nik-leave"
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

          {employee && (
            <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                {employee.facePhotoUrl ? (
                  <img src={employee.facePhotoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-teal-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-800">{employee.name}</p>
                <p className="text-xs text-teal-600">{employee.nik}</p>
                {employee.status !== "approved" && (
                  <p className="text-xs text-red-500 mt-0.5">⚠ Pegawai belum disetujui</p>
                )}
              </div>
            </div>
          )}

          {!employee && searchNik && !isFetching && (
            <p className="text-xs text-red-500 text-center">NIK tidak ditemukan</p>
          )}
        </CardContent>
      </Card>

      {/* Form */}
      {employee && employee.status === "approved" && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {submitted ? "Permohonan Terkirim ✓" : "Form Pengajuan Izin"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {submitted ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-green-700 font-semibold">Berhasil Dikirim!</p>
                <p className="text-xs text-slate-500 mt-1">
                  Permohonan izin sedang menunggu persetujuan admin
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setSubmitted(false)}
                >
                  Ajukan Lagi
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-xs">Jenis Izin</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((p) => ({ ...p, type: v as typeof p.type }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih jenis izin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sakit">🤒 Sakit</SelectItem>
                      <SelectItem value="cuti">🏖 Cuti</SelectItem>
                      <SelectItem value="izin">📝 Izin</SelectItem>
                      <SelectItem value="dinas">💼 Dinas Luar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Tanggal Mulai</Label>
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                      min={new Date().toISOString().split("T")[0]}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tanggal Selesai</Label>
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                      min={form.startDate || new Date().toISOString().split("T")[0]}
                      className="mt-1"
                    />
                  </div>
                </div>

                {totalDays > 0 && (
                  <p className="text-xs text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg">
                    📅 Total: <strong>{totalDays} hari</strong>
                  </p>
                )}

                <div>
                  <Label className="text-xs">Alasan / Keterangan</Label>
                  <Textarea
                    placeholder="Jelaskan alasan izin..."
                    value={form.reason}
                    onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                    className="mt-1 resize-none"
                    rows={3}
                  />
                  <p className="text-[10px] text-slate-400 mt-1 text-right">
                    {form.reason.length} karakter
                  </p>
                </div>

                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700 h-11"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Kirim Permohonan
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leave History */}
      {employee && leaveHistory && leaveHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Riwayat Izin</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {leaveHistory.map((leave) => {
              const cfg = statusConfig[leave.status];
              const Icon = cfg.icon;
              return (
                <div key={leave.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${cfg.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {leaveTypeLabels[leave.type] ?? leave.type}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <CalendarDays className="w-2.5 h-2.5" />
                          {leave.startDate === leave.endDate
                            ? leave.startDate
                            : `${leave.startDate} – ${leave.endDate}`}
                        </div>
                      </div>
                    </div>
                    <Badge variant={cfg.badgeVariant} className="text-[10px] shrink-0">
                      {cfg.label}
                    </Badge>
                  </div>
                  {leave.reason && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{leave.reason}</p>
                  )}
                  {leave.notes && (
                    <p className="text-xs text-slate-400 mt-1 italic">Admin: {leave.notes}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Initial state */}
      {!searchNik && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-orange-400" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Pengajuan Izin & Cuti</p>
          <p className="text-slate-400 text-xs mt-1">Masukkan NIK untuk mengajukan izin</p>
        </div>
      )}
    </MobileLayout>
  );
}
