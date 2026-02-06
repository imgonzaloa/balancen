import React, { useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useTranslation } from "@/components/TranslationProvider";

export default function MealPhotoCapture({ isOpen, onClose, onPhotoSelected }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
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
        onClose();
      }, "image/jpeg", 0.9);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoSelected(file);
      onClose();
    }
  };

  const resetMode = () => {
    stopCamera();
    setMode(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-sm">
        {!mode ? (
          <motion.div className="space-y-4 py-8">
            <h2 className="text-xl font-bold text-white text-center mb-6">
              {t("add_meal") || "Add Meal"}
            </h2>
            <Button
              onClick={() => {
                setMode("camera");
                startCamera();
              }}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-6 rounded-2xl flex items-center justify-center gap-3"
            >
              <Camera size={20} />
              {t("take_photo") || "Take Photo"}
            </Button>
            <Button
              onClick={() => {
                setMode("upload");
                fileInputRef.current?.click();
              }}
              variant="outline"
              className="w-full bg-white/10 border-white/20 text-white py-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/20"
            >
              <Upload size={20} />
              {t("upload_photo") || "Upload Photo"}
            </Button>
          </motion.div>
        ) : mode === "camera" && cameraActive ? (
          <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-xl bg-black"
            />
            <div className="flex gap-3">
              <Button
                onClick={resetMode}
                variant="outline"
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={capturePhoto}
                className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
              >
                {t("capture")}
              </Button>
            </div>
          </motion.div>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}