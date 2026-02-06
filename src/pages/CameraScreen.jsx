import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";

export default function CameraScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [cameraError, setCameraError] = useState(null);
  const [showUploadFallback, setShowUploadFallback] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Monitor video readiness
  useEffect(() => {
    if (!cameraReady || !videoRef.current) return;

    const checkVideoReady = setTimeout(() => {
      if (videoRef.current?.readyState !== 4) {
        console.warn("Video not ready, restarting stream");
        stopCamera();
        setTimeout(() => startCamera(), 300);
      }
    }, 1000);

    return () => clearTimeout(checkVideoReady);
  }, [cameraReady]);

  const startCamera = async () => {
    try {
      setCameraError(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.error("Play error:", err));
        setCameraReady(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(err.message);
      toast.error(t("camera_permission_denied"));
      setShowUploadFallback(true);
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
    setCameraReady(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && videoRef.current.readyState === 4) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        stopCamera();
        navigate(-1, { state: { capturedPhoto: blob } });
      }, "image/jpeg", 0.95);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCamera();
      navigate(-1, { state: { capturedPhoto: file } });
    }
  };

  const handleClose = () => {
    stopCamera();
    navigate(-1);
  };

  // FALLBACK: Camera error with upload option
  if (showUploadFallback && cameraError) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9999, backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: "1rem", display: "flex", justifyContent: "flex-end" }}>
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
            <Upload size={20} style={{ display: "inline", marginRight: "0.5rem" }} />
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

  // FULLSCREEN CAMERA - NO MODAL, NO OVERLAY
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9999, backgroundColor: "#000" }}>
      {/* Video fills entire screen */}
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

      {/* Close button - top right */}
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