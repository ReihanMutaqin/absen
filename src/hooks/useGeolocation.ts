import { useState, useCallback } from "react";

interface GeolocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  locationName: string | null;
  error: string | null;
  isLoading: boolean;
}

export function useGeolocation() {
  const [data, setData] = useState<GeolocationData>({
    latitude: null,
    longitude: null,
    accuracy: null,
    locationName: null,
    error: null,
    isLoading: false,
  });

  const getLocation = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    return new Promise<GeolocationData>((resolve) => {
      if (!navigator.geolocation) {
        const error = "Geolocation tidak didukung di browser ini";
        setData((prev) => ({ ...prev, error, isLoading: false }));
        resolve({ ...data, error, isLoading: false });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          // Try to get location name using reverse geocoding
          let locationName = null;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              { headers: { "User-Agent": "RS-SHL-Attendance-App" } }
            );
            if (response.ok) {
              const geoData = await response.json();
              locationName =
                geoData.display_name || "Lokasi tidak dikenali";
            }
          } catch {
            locationName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          }

          const result: GeolocationData = {
            latitude,
            longitude,
            accuracy,
            locationName,
            error: null,
            isLoading: false,
          };

          setData(result);
          resolve(result);
        },
        (err) => {
          let error = "Gagal mendapatkan lokasi";
          switch (err.code) {
            case err.PERMISSION_DENIED:
              error = "Izin lokasi ditolak. Mohon izinkan akses lokasi.";
              break;
            case err.POSITION_UNAVAILABLE:
              error = "Informasi lokasi tidak tersedia";
              break;
            case err.TIMEOUT:
              error = "Timeout mendapatkan lokasi";
              break;
          }
          const result = { ...data, error, isLoading: false };
          setData(result);
          resolve(result);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }, []);

  return { ...data, getLocation };
}
