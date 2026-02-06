import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { useMeal } from "@/context/MealContext";
import { createPageUrl } from "@/utils";

export default function CameraScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setCapturedFile } = useMeal();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [showUploadFallback, setShowUploadFallback] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    initCamera();
    return () => stopCamera();
  }, []);

  // Retry if video not ready
  useEffect(() => {
    if (!videoReady) return;

    const checkTimer = setTimeout(() => {
      if (videoRef.current?.readyState < 2) {
        console.warn("Video not ready, reinitializing");
        stopCamera();
        setTimeout(initCamera, 500);
      }
    }, 1000);

    return () => clearTimeout(checkTimer);
  }, [videoReady]);

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
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(err => {
            console.error("Play error:", err);
            stopCamera();
            setTimeout(initCamera, 500);
          });
          setVideoReady(true);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(err.message);
      setShowUploadFallback(true);
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
    if (!videoRef.current || videoRef.current.readyState < 2) {
      toast.error(t("camera_not_ready"));
      return;
    }

    try {
      // Capture video frame to canvas
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context failed");

      ctx.drawImage(videoRef.current, 0, 0);

      // Convert canvas to blob
      const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );

      if (!blob || blob.size === 0) {
        toast.error(t("error_capturing"));
        return;
      }

      // Create File object
      const file = new File([blob], "meal.jpg", { type: "image/jpeg" });

      // Store in global context
      setCapturedFile(file);

      // Stop camera and navigate to result screen
      stopCamera();
      navigate(createPageUrl("MealResult"));
    } catch (err) {
      console.error("Capture error:", err);
      toast.error(t("error_capturing"));
    }
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setCapturedFile(selectedFile);
      stopCamera();
      navigate(createPageUrl("MealResult"));
    }
  };

  const handleClose = () => {
    stopCamera();
    navigate(-1);
  };

  // FALLBACK: No camera access
  if (showUploadFallback && cameraError) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          backgroundColor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            zIndex: 10,
            padding: "0.5rem",
            borderRadius: "0.75rem",
            backgroundColor: "rgba(255,255,255,0.1)",
            border: "none",
            color: "white",
            cursor: "pointer"
          }}
        >
          <X size={24} />
        </button>

        <div style={{ textAlign: "center", color: "white", maxWidth: "20rem" }}>
          <AlertCircle size={48} style={{ margin: "0 auto 1rem", color: "rgb(248 113 113)" }} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
            {t("camera_not_available")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "2rem", fontSize: "0.875rem" }}>
            {cameraError}
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "1rem",
              background: "linear-gradient(to right, rgb(16 185 129), rgb(5 150 105))",
              color: "white",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              marginBottom: "0.75rem"
            }}
          >
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

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
      </div>
    );
  }

  // FULLSCREEN CAMERA
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        backgroundColor: "#000"
      }}
    >
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
          display: "block"
        }}
      />

      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          zIndex: 10,
          padding: "0.5rem",
          borderRadius: "0.75rem",
          backgroundColor: "rgba(255,255,255,0.1)",
          border: "none",
          color: "white",
          cursor: "pointer"
        }}
      >
        <X size={24} />
      </button>

      {/* Bottom controls */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background: "linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.7), transparent)",
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
          {t("tomar_foto")}
        </button>
      </div>
    </div>
  );
}