import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, AlertCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { useMeal } from "@/components/MealContext";
import { createPageUrl } from "@/utils";

export default function CameraScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setCapturedFile } = useMeal();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [cameraError, setCameraError] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    initCamera();
    return () => stopCamera();
  }, []);

  const initCamera = async () => {
    try {
      setCameraError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for metadata to load
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });

        // Start playing
        await videoRef.current.play();
        
        // Verify video dimensions with retries
        let retries = 0;
        while (videoRef.current.videoWidth === 0 && retries < 3) {
          await new Promise(r => setTimeout(r, 300));
          retries++;
        }

        if (videoRef.current.videoWidth === 0) {
          throw new Error("Video stream failed to initialize");
        }

        setVideoReady(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(err.message || t("camera_permission_denied"));
      toast.error(t("camera_permission_denied"));
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setVideoReady(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !videoReady || videoRef.current.videoWidth === 0) {
      toast.error(t("camera_not_ready"));
      return;
    }

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context failed");

      ctx.drawImage(video, 0, 0);

      // Convert to blob
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );

      if (!blob || blob.size === 0) {
        // Retry once
        await new Promise(r => setTimeout(r, 100));
        const retryBlob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.9)
        );
        
        if (!retryBlob || retryBlob.size === 0) {
          throw new Error("Failed to capture photo");
        }
      }

      // Create File object
      const file = new File([blob], "meal.jpg", { type: "image/jpeg" });

      // Create dataUrl for localStorage
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      // Store BEFORE navigation
      setCapturedFile(file, dataUrl);

      // Stop camera AFTER storing
      stopCamera();

      // Navigate to result screen
      navigate(createPageUrl("Home"));
      
    } catch (err) {
      console.error("Capture error:", err);
      toast.error(t("error_capturing"));
      setIsCapturing(false);
    }
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Create dataUrl for localStorage
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCapturedFile(selectedFile, dataUrl);
      stopCamera();
      navigate(createPageUrl("Home"));
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleClose = () => {
    stopCamera();
    navigate(-1);
  };

  // Error fallback UI
  if (cameraError) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white"
        >
          <X size={24} />
        </button>

        <div className="text-center text-white max-w-sm px-6">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold mb-2">{t("camera_not_available")}</h2>
          <p className="text-white/60 mb-6 text-sm">{cameraError}</p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold mb-3 flex items-center justify-center gap-2"
          >
            <Upload size={20} />
            {t("upload_photo")}
          </button>

          <button
            onClick={handleClose}
            className="w-full py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold"
          >
            {t("cancel")}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    );
  }

  // Fullscreen camera UI
  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Live Framing Assist Overlay */}
      {videoReady && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
          <div className="relative w-[85%] aspect-square max-w-md">
            {/* Corner guides */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-white/60 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-white/60 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-white/60 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-white/60 rounded-br-2xl" />
            
            {/* Instruction text */}
            <div className="absolute -bottom-16 left-0 right-0 text-center space-y-1">
              <p className="text-white text-sm font-semibold">{t("center_your_food") || "Center your food"}</p>
              <p className="text-white/60 text-xs">{t("good_lighting_tip") || "Good lighting improves accuracy"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 p-3 rounded-xl bg-black/40 backdrop-blur-sm text-white"
      >
        <X size={24} />
      </button>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-6 pb-safe">
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold"
          >
            {t("cancel")}
          </button>

          <button
            onClick={capturePhoto}
            disabled={!videoReady || isCapturing}
            className="flex-1 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCapturing ? t("capturing") : t("capture")}
          </button>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full mt-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium"
        >
          {t("upload_from_gallery")}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}