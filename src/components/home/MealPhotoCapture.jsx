import React, { useRef, useState, useEffect } from "react";
import { Camera, Upload, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/TranslationProvider";
import { toast } from "sonner";

export default function MealPhotoCapture({ isOpen, onClose, onPhotoSelected }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setMode("camera");
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(err.message);
      toast.error(t("camera_permission_denied"));
      setTimeout(() => {
        setMode("upload");
        fileInputRef.current?.click();
      }, 500);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        onPhotoSelected(blob);
        stopCamera();
        resetMode();
      }, "image/jpeg", 0.95);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoSelected(file);
      resetMode();
    }
  };

  const resetMode = () => {
    stopCamera();
    setMode(null);
    onClose();
  };

  const handleClose = () => {
    stopCamera();
    setMode(null);
    onClose();
  };

  if (!isOpen) return null;

  // FULLSCREEN CAMERA - No modal wrapper, direct root element
  if (mode === "camera" && cameraActive) {
    return (
      <div
        className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
        style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}
      >
        {/* Video - absolutely fills screen */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ position: "absolute", top: 0, left: 0 }}
        />

        {/* Top bar */}
        <div className="absolute top-0 inset-x-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{t("meal_analysis")}</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/90 to-transparent p-6 flex gap-3 safe-area-inset-bottom">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1 bg-white/10 border-white/20 text-white py-4 rounded-2xl hover:bg-white/20 font-semibold"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={capturePhoto}
            className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-4 rounded-2xl font-semibold"
          >
            {t("capture")}
          </Button>
        </div>
      </div>
    );
  }

  // MENU - Modal in bottom sheet style
  if (!mode) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
        onClick={handleClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-slate-900 rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white">{t("add_meal")}</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
            >
              <X size={20} />
            </button>
          </div>

          <Button
            onClick={() => startCamera()}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-6 rounded-2xl flex items-center justify-center gap-3 text-lg font-semibold"
          >
            <Camera size={24} />
            {t("take_photo")}
          </Button>

          <Button
            onClick={() => {
              setMode("upload");
              fileInputRef.current?.click();
            }}
            variant="outline"
            className="w-full bg-white/10 border-white/20 text-white py-6 rounded-2xl flex items-center justify-center gap-3 text-lg font-semibold hover:bg-white/20"
          >
            <Upload size={24} />
            {t("upload_photo")}
          </Button>
        </div>
      </div>
    );
  }

  // CAMERA ERROR - Modal fallback
  if (mode === "camera" && cameraError) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
        onClick={handleClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-slate-900 rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom"
        >
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={24} />
            <div>
              <h2 className="text-lg font-bold text-white">{t("camera_not_available")}</h2>
              <p className="text-white/60 text-sm mt-1">{cameraError}</p>
            </div>
          </div>

          <Button
            onClick={() => {
              setMode("upload");
              fileInputRef.current?.click();
            }}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-4 rounded-2xl font-semibold"
          >
            <Upload size={20} className="mr-2" />
            {t("upload_photo")}
          </Button>

          <Button
            onClick={handleClose}
            variant="outline"
            className="w-full bg-white/10 border-white/20 text-white py-4 rounded-2xl hover:bg-white/20 font-semibold"
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    );
  }

  // Hidden file input
  return (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleFileUpload}
      className="hidden"
    />
  );
}