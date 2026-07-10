import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fingerprint, Shield, Clock, Users } from "lucide-react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

const features = [
  {
    icon: Fingerprint,
    title: "Face Recognition",
    desc: "Absensi otomatis dengan teknologi pengenalan wajah",
  },
  {
    icon: Clock,
    title: "Real-time Monitoring",
    desc: "Pantau kehadiran pegawai secara langsung",
  },
  {
    icon: Shield,
    title: "Aman & Terenkripsi",
    desc: "Data wajah disimpan terenkripsi dengan aman",
  },
  {
    icon: Users,
    title: "Manajemen Tim",
    desc: "Kelola departemen, shift, dan laporan absensi",
  },
];

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-2xl">
            <svg
              className="w-11 h-11 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">RS SHL</h1>
          <p className="text-teal-200 mt-1 text-sm">Sistem Absensi Digital</p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10"
            >
              <Icon className="w-5 h-5 text-teal-300 mb-2" />
              <p className="text-white font-semibold text-xs leading-tight">{title}</p>
              <p className="text-teal-200/70 text-[10px] mt-0.5 leading-tight">{desc}</p>
            </div>
          ))}
        </div>

        {/* Login Card */}
        <Card className="w-full max-w-sm bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
          <CardContent className="p-6">
            <div className="text-center mb-5">
              <h2 className="text-white font-bold text-lg">Login Admin</h2>
              <p className="text-teal-200 text-xs mt-1">
                Akses khusus untuk manajemen &amp; admin
              </p>
            </div>

            <Button
              className="w-full h-12 bg-white text-teal-800 hover:bg-teal-50 font-semibold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              size="lg"
              onClick={() => {
                window.location.href = getOAuthUrl();
              }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
              Masuk dengan Kimi SSO
            </Button>

            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-teal-200/60 text-[10px] text-center">
                Login ini hanya untuk Administrator.
                <br />
                Pegawai cukup masukkan NIK di halaman Absensi.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-teal-300/40 text-[10px] mt-6 text-center">
          © 2025 RS SHL · Sistem Absensi Face Recognition
        </p>
      </div>
    </div>
  );
}
