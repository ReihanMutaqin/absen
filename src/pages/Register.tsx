import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/providers/trpc";
import { useCamera } from "@/hooks/useCamera";
import { useFaceApi } from "@/hooks/useFaceApi";
import { toast } from "sonner";
import { Camera, UserPlus, RotateCcw, Check, Loader2 } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const { videoRef, isActive, startCamera, stopCamera, captureImage } = useCamera();
  const { isLoaded: isFaceLoaded, getFaceDescriptor } = useFaceApi();
  const { data: departments } = trpc.department.list.useQuery();
  const registerMutation = trpc.employee.register.useMutation();

  const [step, setStep] = useState<"form" | "camera" | "review">("form");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    nik: "",
    name: "",
    email: "",
    phone: "",
    departmentId: "",
    position: "",
    shift: "pagi" as "pagi" | "siang" | "malam" | "flexible",
  });

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleStartCamera = useCallback(async () => {
    // Validate form
    if (!formData.nik || !formData.name) {
      toast.error("NIK dan Nama wajib diisi");
      return;
    }
    if (!isFaceLoaded) {
      toast.error("Face detection model masih loading, mohon tunggu");
      return;
    }
    setStep("camera");
    await startCamera("user");
  }, [formData, isFaceLoaded, startCamera]);

  const handleCapture = useCallback(async () => {
    const image = captureImage();
    if (!image || !videoRef.current) return;

    setIsProcessing(true);

    try {
      // Detect face and get descriptor
      const descriptor = await getFaceDescriptor(videoRef.current);

      if (!descriptor) {
        toast.error("Wajah tidak terdeteksi. Mohon posisikan wajah di tengah kamera.");
        setIsProcessing(false);
        return;
      }

      setCapturedImage(image);
      setFaceDescriptor(Array.from(descriptor));
      stopCamera();
      setStep("review");
      toast.success("Wajah berhasil dideteksi!");
    } catch {
      toast.error("Gagal mendeteksi wajah");
    } finally {
      setIsProcessing(false);
    }
  }, [captureImage, videoRef, getFaceDescriptor, stopCamera]);

  const handleSubmit = useCallback(async () => {
    if (!capturedImage || !faceDescriptor) {
      toast.error("Data tidak lengkap");
      return;
    }

    setIsProcessing(true);

    try {
      const result = await registerMutation.mutateAsync({
        ...formData,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined,
        facePhotoUrl: capturedImage,
        faceDescriptor,
      });

      toast.success(result.message);
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Gagal mendaftar");
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, faceDescriptor, formData, registerMutation, navigate]);

  const handleRetake = useCallback(async () => {
    setCapturedImage(null);
    setFaceDescriptor(null);
    setStep("camera");
    await startCamera("user");
  }, [startCamera]);

  return (
    <MobileLayout title="Daftar Pegawai" showBack onBack={() => navigate("/")}>
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`flex items-center gap-1 ${step === "form" ? "text-teal-600" : "text-slate-400"}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "form" ? "bg-teal-600 text-white" : "bg-slate-200"}`}>1</div>
          <span className="text-xs">Data</span>
        </div>
        <div className="w-8 h-px bg-slate-300" />
        <div className={`flex items-center gap-1 ${step === "camera" ? "text-teal-600" : "text-slate-400"}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "camera" ? "bg-teal-600 text-white" : "bg-slate-200"}`}>2</div>
          <span className="text-xs">Wajah</span>
        </div>
        <div className="w-8 h-px bg-slate-300" />
        <div className={`flex items-center gap-1 ${step === "review" ? "text-teal-600" : "text-slate-400"}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "review" ? "bg-teal-600 text-white" : "bg-slate-200"}`}>3</div>
          <span className="text-xs">Review</span>
        </div>
      </div>

      {/* Step 1: Form */}
      {step === "form" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label htmlFor="nik">NIK *</Label>
                <Input
                  id="nik"
                  placeholder="Masukkan NIK"
                  value={formData.nik}
                  onChange={(e) => setFormData((p) => ({ ...p, nik: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="name">Nama Lengkap *</Label>
                <Input
                  id="name"
                  placeholder="Masukkan nama lengkap"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">No. Telepon</Label>
                <Input
                  id="phone"
                  placeholder="08123456789"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label>Departemen</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(v) => setFormData((p) => ({ ...p, departmentId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih departemen" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="position">Jabatan</Label>
                <Input
                  id="position"
                  placeholder="Masukkan jabatan"
                  value={formData.position}
                  onChange={(e) => setFormData((p) => ({ ...p, position: e.target.value }))}
                />
              </div>
              <div>
                <Label>Shift</Label>
                <Select
                  value={formData.shift}
                  onValueChange={(v) => setFormData((p) => ({ ...p, shift: v as typeof p.shift }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pagi">Pagi</SelectItem>
                    <SelectItem value="siang">Siang</SelectItem>
                    <SelectItem value="malam">Malam</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full h-12 bg-teal-600 hover:bg-teal-700"
            onClick={handleStartCamera}
            disabled={!isFaceLoaded}
          >
            {!isFaceLoaded ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading Model...
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 mr-2" />
                Lanjutkan ke Pengambilan Wajah
              </>
            )}
          </Button>

          {!isFaceLoaded && (
            <p className="text-xs text-center text-amber-600">
              Mohon tunggu, model face detection sedang di-load...
            </p>
          )}
        </div>
      )}

      {/* Step 2: Camera */}
      {step === "camera" && (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[3/4]">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            {/* Face Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/50 rounded-full" />
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white text-sm bg-black/50 inline-block px-3 py-1 rounded-full">
                  Posisikan wajah di lingkaran
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                stopCamera();
                setStep("form");
              }}
            >
              Kembali
            </Button>
            <Button
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              onClick={handleCapture}
              disabled={!isActive || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5 mr-2" />
                  Ambil Foto
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === "review" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Preview Foto Wajah</h3>
              {capturedImage && (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={capturedImage}
                    alt="Captured face"
                    className="w-full aspect-square object-cover"
                  />
                  {faceDescriptor && (
                    <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Wajah Terdeteksi
                    </div>
                  )}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleRetake}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Ulangi Pengambilan
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Data Pegawai</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">NIK</span>
                  <span className="font-medium">{formData.nik}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                {formData.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                )}
                {formData.departmentId && departments && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Departemen</span>
                    <span className="font-medium">
                      {departments.find((d) => String(d.id) === formData.departmentId)?.name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Shift</span>
                  <span className="font-medium capitalize">{formData.shift}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full h-12 bg-teal-600 hover:bg-teal-700"
            onClick={handleSubmit}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                Kirim Pendaftaran
              </>
            )}
          </Button>

          <p className="text-xs text-center text-slate-500">
            Setelah dikirim, data akan ditinjau oleh admin untuk disetujui.
          </p>
        </div>
      )}
    </MobileLayout>
  );
}
