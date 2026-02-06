import React, { useRef, useState, useEffect } from "react";
import { Camera, Upload, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/components/TranslationProvider";
import { toast } from "sonner";

export default function MealPhotoCapture({ isOpen, onClose, onPhotoSelected }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Clean up camera on unmount
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
      // Auto-fallback to upload
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

  // If not open, don't render anything
  if (!isOpen) return null;

  // INITIAL MENU - Clean, no modal overlay, just centered buttons
  if (!mode) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-slate-900 rounded-t-3xl p-6 space-y-4"
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
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // CAMERA MODE - Fullscreen camera view
  if (mode === "camera" && cameraActive) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
        >
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

          {/* Camera */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Bottom controls */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-6 flex gap-3">
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
        </motion.div>
      </AnimatePresence>
    );
  }

  // CAMERA ERROR - Show error and fallback option
  if (mode === "camera" && cameraError) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-slate-900 rounded-t-3xl p-6 space-y-4"
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
          </motion.div>
        </motion.div>
      </AnimatePresence>
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