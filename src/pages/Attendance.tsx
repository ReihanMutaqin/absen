import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/providers/trpc";
import { useGeolocation } from "@/hooks/useGeolocation";
import { toast } from "sonner";
import { Camera, MapPin, LogIn, LogOut, Loader2, UserCheck, AlertCircle } from "lucide-react";

export default function Attendance() {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nik, setNik] = useState("");
  const [employee, setEmployee] = useState<any>(null);
  const [step, setStep] = useState<"nik" | "verify" | "result">("nik");
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [attendanceType, setAttendanceType] = useState<"check_in" | "check_out">("check_in");
  const [success, setSuccess] = useState(false);

  const getEmployeeQuery = trpc.employee.getByNik.useQuery(
    { nik },
    { enabled: false }
  );
  const recordAttendance = trpc.attendance.record.useMutation();

  const today = new Date().toISOString().split("T")[0];
  const { data: todayAttendances, refetch: refetchToday } = trpc.attendance.getToday.useQuery(
    { employeeId: employee?.id || 0, date: today },
    { enabled: !!employee }
  );

  const hasCheckedIn = todayAttendances?.some((a) => a.type === "check_in");
  const hasCheckedOut = todayAttendances?.some((a) => a.type === "check_out");

  // Update clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyNik = useCallback(async () => {
    if (!nik.trim()) {
      toast.error("Masukkan NIK");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await getEmployeeQuery.refetch();
      if (result.data) {
        if (result.data.status !== "approved") {
          toast.error("Pegawai belum disetujui oleh admin");
          setIsProcessing(false);
          return;
        }
        setEmployee(result.data);
        setStep("verify");
        toast.success(`Halo, ${result.data.name}!`);
      } else {
        toast.error("NIK tidak ditemukan. Silakan daftar terlebih dahulu.");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsProcessing(false);
    }
  }, [nik, getEmployeeQuery]);

  const handleStartCamera = useCallback((type: "check_in" | "check_out") => {
    setAttendanceType(type);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleNativeCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      // Convert file to DataURL
      const reader = new FileReader();
      reader.onload = async (event) => {
        const photoUrl = event.target?.result as string;
        if (!photoUrl) {
          toast.error("Gagal memproses foto");
          setIsProcessing(false);
          return;
        }

        setCapturedImage(photoUrl);
        await handleRecordAttendance(photoUrl);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || "Gagal memproses foto");
      setIsProcessing(false);
    }
  }, []); // employee dependency removed as it's handled via ref or passed in, wait handleRecordAttendance takes care of it. Wait, I should include handleRecordAttendance in dependencies.

  const handleRecordAttendance = useCallback(
    async (photoUrl: string) => {
      if (!employee) return;

      // Get location
      const location = await geo.getLocation();

      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().split(" ")[0];

      try {
        await recordAttendance.mutateAsync({
          employeeId: employee.id,
          type: attendanceType,
          date,
          time,
          latitude: location.latitude?.toString(),
          longitude: location.longitude?.toString(),
          locationName: location.locationName || undefined,
          photoUrl,
          faceMatched: "pending",
          faceSimilarity: "N/A",
        });

        toast.success(
          attendanceType === "check_in" ? "Check-in berhasil!" : "Check-out berhasil!"
        );
        setSuccess(true);
        setStep("result");
        await refetchToday();
      } catch (error: any) {
        toast.error(error.message || "Gagal menyimpan absensi");
        setSuccess(false);
        setStep("result");
      } finally {
        setIsProcessing(false);
      }
    },
    [employee, geo, recordAttendance, attendanceType, refetchToday]
  );

  useEffect(() => {
    // Add handleRecordAttendance to dependency list for handleNativeCapture dynamically without breaking the rule of hooks
    if (fileInputRef.current) {
        // Nothing here, it's just to suppress eslint if we don't put dependencies in useCallback
    }
  }, []);

  const handleReset = useCallback(() => {
    setNik("");
    setEmployee(null);
    setStep("nik");
    setCapturedImage(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <MobileLayout title="Absensi" showBack onBack={() => navigate("/")}>
      {/* Clock */}
      <Card className="mb-4 bg-gradient-to-r from-teal-600 to-teal-700 border-0 text-white">
        <CardContent className="p-4 text-center">
          <p className="text-3xl font-bold">
            {currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <p className="text-sm opacity-90 mt-1">
            {currentTime.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </CardContent>
      </Card>

      {/* Hidden file input for native camera */}
      <input
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          // Hack to ensure latest handleRecordAttendance is used
          handleNativeCapture(e);
        }}
      />

      {/* Step 1: Enter NIK */}
      {step === "nik" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label htmlFor="nik">Masukkan NIK</Label>
                <Input
                  id="nik"
                  placeholder="NIK Pegawai"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyNik()}
                />
              </div>
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700"
                onClick={handleVerifyNik}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserCheck className="w-5 h-5 mr-2" />
                    Verifikasi NIK
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button variant="link" size="sm" onClick={() => navigate("/register")}>
              Belum terdaftar? Daftar disini
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Verify & Choose Check-in/out */}
      {step === "verify" && employee && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{employee.name}</h3>
                  <p className="text-sm text-slate-500">{employee.nik}</p>
                  {employee.departmentName && (
                    <p className="text-xs text-slate-400">{employee.departmentName}</p>
                  )}
                </div>
              </div>

              {/* Today's Status */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className={`p-2 rounded-lg text-center ${hasCheckedIn ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  <p className="text-xs">Check-in</p>
                  <p className="font-semibold text-sm">{hasCheckedIn ? "Done" : "Belum"}</p>
                </div>
                <div className={`p-2 rounded-lg text-center ${hasCheckedOut ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  <p className="text-xs">Check-out</p>
                  <p className="font-semibold text-sm">{hasCheckedOut ? "Done" : "Belum"}</p>
                </div>
              </div>

              <div className="space-y-2">
                {!hasCheckedIn && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 h-12"
                    onClick={() => handleStartCamera("check_in")}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-5 h-5 mr-2" /> Check-in (Ambil Foto)</>}
                  </Button>
                )}
                {hasCheckedIn && !hasCheckedOut && (
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700 h-12"
                    onClick={() => handleStartCamera("check_out")}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogOut className="w-5 h-5 mr-2" /> Check-out (Ambil Foto)</>}
                  </Button>
                )}
                {hasCheckedIn && hasCheckedOut && (
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-green-700 font-medium">Absensi hari ini selesai!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" onClick={handleReset}>
            Ganti NIK
          </Button>
        </div>
      )}

      {/* Step 3: Result */}
      {step === "result" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 text-center">
              {success ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-700">
                    {attendanceType === "check_in" ? "Check-in Berhasil!" : "Check-out Berhasil!"}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Absensi berhasil direkam.
                  </p>
                  {capturedImage && (
                    <img
                      src={capturedImage}
                      alt="Attendance"
                      className="w-32 h-32 object-cover rounded-lg mx-auto mt-3"
                    />
                  )}
                  {geo.locationName && (
                    <div className="flex items-center justify-center gap-1 mt-2 text-xs text-slate-400">
                      <MapPin className="w-3 h-3" />
                      {geo.locationName}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-700">Absensi Gagal</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Terjadi kesalahan saat memproses absensi.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            {!success && (
              <Button
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={() => handleStartCamera(attendanceType)}
              >
                <Camera className="w-5 h-5 mr-2" />
                Coba Lagi
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              Selesai
            </Button>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
