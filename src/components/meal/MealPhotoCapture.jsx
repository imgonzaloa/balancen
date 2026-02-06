import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MealPhotoCapture({ onPhotoSelect, isLoading }) {
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onPhotoSelect(event.target.result);
        setShowOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      toast.error("Could not access camera");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL("image/jpeg");
      onPhotoSelect(imageData);
      stopCamera();
      setShowOptions(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  return (
    <div className="relative">
      {/* Main Button */}
      <motion.button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isLoading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full py-6 rounded-3xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-lg shadow-2xl shadow-teal-500/50 flex items-center justify-center gap-3 disabled:opacity-50"
      >
        <Camera size={24} />
        {isLoading ? "Analyzing..." : "Add Meal"}
      </motion.button>

      {/* Dropdown Options */}
      {showOptions && !cameraActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute bottom-full mb-3 left-0 right-0 bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-2xl p-3 z-50 space-y-2"
        >
          <Button
            onClick={startCamera}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3 flex items-center justify-center gap-2"
          >
            <Camera size={18} />
            Take Photo
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            Upload Photo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </motion.div>
      )}

      {/* Camera View */}
      {cameraActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4"
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
            <Button
              onClick={stopCamera}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 flex items-center justify-center"
            >
              <X size={24} />
            </Button>
            <Button
              onClick={capturePhoto}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-full w-16 h-16 flex items-center justify-center"
            >
              <Camera size={28} />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}