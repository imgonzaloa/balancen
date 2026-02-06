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
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Add video readiness monitor
  useEffect(() => {
    if (!cameraActive || !videoRef.current) return;

    const checkVideoReady = setTimeout(() => {
      if (videoRef.current?.readyState !== 4) {
        console.warn("Video not ready, restarting stream");
        stopCamera();
        setTimeout(() => startCamera(), 300);
      }
    }, 1000);

    return () => clearTimeout(checkVideoReady);
  }, [cameraActive]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment"
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video plays
        videoRef.current.play().catch(err => console.error("Play error:", err));
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
    if (videoRef.current && videoRef.current.readyState === 4) {
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
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

  // FULLSCREEN CAMERA - iOS Safari compatible
  if (mode === "camera" && cameraActive) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 9999,
          backgroundColor: "#000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {/* Video - fill screen, no CSS effects */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            visibility: "visible",
            opacity: 1
          }}
        />

        {/* Top bar - no blur/animation */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0))",
            padding: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <h2 style={{ color: "white", fontSize: "1.125rem", fontWeight: "bold", margin: 0 }}>
            {t("meal_analysis")}
          </h2>
          <button
            onClick={handleClose}
            style={{
              padding: "0.5rem",
              borderRadius: "0.75rem",
              backgroundColor: "rgba(255,255,255,0.1)",
              border: "none",
              color: "white",
              cursor: "pointer"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Bottom controls - no blur/animation */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            background: "linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0))",
            padding: "1.5rem",
            display: "flex",
            gap: "0.75rem"
          }}
        >
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: "1rem",
              borderRadius: "1rem",
              backgroundColor: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "1rem"
            }}
          >
            {t("cancel")}
          </button>
          <button
            onClick={capturePhoto}
            style={{
              flex: 1,
              padding: "1rem",
              borderRadius: "1rem",
              background: "linear-gradient(to right, rgb(16 185 129), rgb(5 150 105))",
              color: "white",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "1rem",
              border: "none"
            }}
          >
            {t("capture")}
          </button>
        </div>
      </div>
    );
  }

  // MENU - Modal bottom sheet
  if (!mode) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 50,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "flex-end",
          backdropFilter: "blur(4px)"
        }}
        onClick={handleClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            backgroundColor: "rgb(15 23 42)",
            borderTopLeftRadius: "1.5rem",
            borderTopRightRadius: "1.5rem",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "white", margin: 0 }}>
              {t("add_meal")}
            </h2>
            <button
              onClick={handleClose}
              style={{
                padding: "0.5rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "none",
                color: "white",
                cursor: "pointer"
              }}
            >
              <X size={20} />
            </button>
          </div>

          <button
            onClick={() => startCamera()}
            style={{
              width: "100%",
              padding: "1.5rem",
              borderRadius: "1rem",
              background: "linear-gradient(to right, rgb(16 185 129), rgb(5 150 105))",
              color: "white",
              fontSize: "1.125rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              border: "none",
              cursor: "pointer"
            }}
          >
            <Camera size={24} />
            {t("take_photo")}
          </button>

          <button
            onClick={() => {
              setMode("upload");
              fileInputRef.current?.click();
            }}
            style={{
              width: "100%",
              padding: "1.5rem",
              borderRadius: "1rem",
              backgroundColor: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              fontSize: "1.125rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              cursor: "pointer"
            }}
          >
            <Upload size={24} />
            {t("upload_photo")}
          </button>
        </div>
      </div>
    );
  }

  // CAMERA ERROR
  if (mode === "camera" && cameraError) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 50,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "flex-end"
        }}
        onClick={handleClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            backgroundColor: "rgb(15 23 42)",
            borderTopLeftRadius: "1.5rem",
            borderTopRightRadius: "1.5rem",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}
        >
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
            <AlertCircle style={{ color: "rgb(248 113 113)", flexShrink: 0, marginTop: "0.25rem" }} size={24} />
            <div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: "bold", color: "white", margin: 0 }}>
                {t("camera_not_available")}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", marginTop: "0.25rem", margin: 0 }}>
                {cameraError}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setMode("upload");
              fileInputRef.current?.click();
            }}
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "1rem",
              background: "linear-gradient(to right, rgb(16 185 129), rgb(5 150 105))",
              color: "white",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              border: "none",
              cursor: "pointer"
            }}
          >
            <Upload size={20} />
            {t("upload_photo")}
          </button>

          <button
            onClick={handleClose}
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "1rem",
              backgroundColor: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleFileUpload}
      style={{ display: "none" }}
    />
  );
}