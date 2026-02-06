import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";

export default function CameraScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    initCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Monitor video readiness - retry if stream not playing
  useEffect(() => {
    if (!videoReady) return;

    const readinessCheck = setTimeout(() => {
      if (videoRef.current?.readyState < 2) {
        console.warn("Video not ready, reinitializing stream");
        stopCamera();
        setTimeout(initCamera, 500);
      }
    }, 1000);

    return () => clearTimeout(readinessCheck);
  }, [videoReady]);

  const initCamera = async () => {
    try {
      setCameraError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment"
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Handle metadata loaded to ensure video is ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(err => {
            console.error("Play failed:", err);
            stopCamera();
            setTimeout(initCamera, 500);
          });
          setVideoReady(true);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(err.message);
      setShowFallback(true);
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

  const capturePhoto = () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      toast.error(t("camera_not_ready"));
      return;
    }

    try {
      // Create hidden canvas
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");

      // Draw video frame
      ctx.drawImage(videoRef.current, 0, 0);

      // Convert to JPEG data URL (instant, no upload needed)
      const imageData = canvas.toDataURL("image/jpeg", 0.95);

      // Stop camera and navigate with image data
      stopCamera();

      // Navigate to Home with captured image
      navigate("/Home", {
        state: { capturedPhoto: imageData }
      });
    } catch (err) {
      console.error("Capture error:", err);
      toast.error(t("error_capturing"));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        stopCamera();
        navigate("/Home", {
          state: { capturedPhoto: event.target.result }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    stopCamera();
    navigate(-1);
  };

  // FALLBACK: Upload only (camera unavailable)
  if (showFallback && cameraError) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9999, backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10 }}>
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
            <X size={24} />
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
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 9999, backgroundColor: "#000" }}>
      {/* Video element fills entire screen */}
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
          cursor: "pointer",
          backdropFilter: "none"
        }}
      >
        <X size={24} />
      </button>

      {/* Bottom controls with gradient */}
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