import { useState, useEffect, useCallback } from "react";
import * as faceapi from "face-api.js";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

export function useFaceApi() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadModels() {
      try {
        setIsLoading(true);
        setError(null);

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        if (mounted) {
          setIsLoaded(true);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError("Gagal memuat model face detection");
          setIsLoading(false);
        }
      }
    }

    loadModels();

    return () => {
      mounted = false;
    };
  }, []);

  const detectFace = useCallback(
    async (videoEl: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement) => {
      if (!isLoaded) return null;

      try {
        const detection = await faceapi
          .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        return detection || null;
      } catch {
        return null;
      }
    },
    [isLoaded]
  );

  const detectAllFaces = useCallback(
    async (videoEl: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement) => {
      if (!isLoaded) return [];

      try {
        const detections = await faceapi
          .detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        return detections;
      } catch {
        return [];
      }
    },
    [isLoaded]
  );

  const getFaceDescriptor = useCallback(
    async (videoEl: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement) => {
      const detection = await detectFace(videoEl);
      return detection?.descriptor || null;
    },
    [detectFace]
  );

  return {
    isLoading,
    isLoaded,
    error,
    detectFace,
    detectAllFaces,
    getFaceDescriptor,
  };
}
