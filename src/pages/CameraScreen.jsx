import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, AlertCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { useMeal } from "@/components/MealContext";
import { createPageUrl } from "@/utils";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { useAppState } from "@/components/AppStateContext";
import CameraPermissionPrompt from "@/components/CameraPermissionPrompt";

const FREE_DAILY_LIMIT = 5;

// Module-level stable store so photo survives navigation/re-render
const _captureStore = { file: null, dataUrl: null };

export default function CameraScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setCapturedFile } = useMeal();
  const { user, profile, setProfile: setContextProfile } = useAppState();

  // Detect profilePhoto mode from query params or localStorage
  const searchParams = new URLSearchParams(location.search);
  const cameraMode = searchParams.get('mode') || localStorage.getItem('CAMERA_MODE') || null;
  const isProfilePhotoMode = cameraMode === 'profilePhoto';

  // Where to go back when closing camera
  const rawReturn = searchParams.get('return') || localStorage.getItem('CAMERA_RETURN_ROUTE');
  const returnTo = isProfilePhotoMode
    ? (rawReturn || createPageUrl('Profile'))
    : (location.state?.from || createPageUrl('Home'));

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);
  
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState(null); // stable blob URL
  const [captureError, setCaptureError] = useState(null); // error after capture
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [livePreview, setLivePreview] = useState(null); // { calories, protein, carbs, fats }
  const [liveAnalyzing, setLiveAnalyzing] = useState(false);
  const [scansUsedToday, setScansUsedToday] = useState(null); // null = not yet loaded
  const liveThrottleRef = useRef(null);
  const liveAbortRef = useRef(null);

  // Load scan count for free users
  useEffect(() => {
    if (isProfilePhotoMode) return;
    const isPremium = profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator';
    if (isPremium) return;
    const today = new Date().toISOString().split("T")[0];
    base44.entities.MealLog.filter({ date: today })
      .then(logs => {
        const aiScans = logs.filter(m => m.photo_url);
        setScansUsedToday(aiScans.length);
      })
      .catch(() => setScansUsedToday(0));
  }, [isProfilePhotoMode, profile]);

  useEffect(() => {
    mountedRef.current = true;
    console.log("📷 CAMERA_OPEN");
    // Check if permission was previously granted; if not, show purpose prompt first
    if (navigator.permissions) {
      navigator.permissions.query({ name: "camera" }).then((status) => {
        if (status.state === "granted") {
          initCamera();
        } else {
          setShowPermissionPrompt(true);
        }
      }).catch(() => {
        // permissions API not supported — go straight to camera (will trigger OS prompt naturally)
        initCamera();
      });
    } else {
      initCamera();
    }
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, []);

  const initCamera = async () => {
    try {
      setCameraError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: isProfilePhotoMode ? "user" : "environment" },
        audio: false
      });

      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        await new Promise((resolve, reject) => {
          const v = videoRef.current;
          if (!v) return reject(new Error("Video ref gone"));
          v.onloadedmetadata = resolve;
          v.onerror = reject;
        });

        if (!mountedRef.current) return;
        await videoRef.current.play().catch(() => {});
        
        let retries = 0;
        while (videoRef.current && videoRef.current.videoWidth === 0 && retries < 5) {
          await new Promise(r => setTimeout(r, 300));
          retries++;
        }

        if (!mountedRef.current) return;
        if (!videoRef.current || videoRef.current.videoWidth === 0) {
          throw new Error("Video stream failed to initialize");
        }

        setVideoReady(true);
        console.log("📷 CAMERA_READY", { w: videoRef.current.videoWidth, h: videoRef.current.videoHeight });
      }
    } catch (err) {
      console.error("Camera error:", err);
      if (!mountedRef.current) return;
      setCameraError(err.message || t("camera_permission_denied"));
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setVideoReady(false);
  };

  const capturePhoto = useCallback(async () => {
    if (isCapturing) return;
    if (!videoRef.current || !videoReady || videoRef.current.videoWidth === 0) {
      console.error("❌ CAMERA_NOT_READY");
      toast.error(t("camera_not_ready"));
      return;
    }

    setIsCapturing(true);
    setCaptureError(null);
    setShowFlash(true);
    setTimeout(() => { if (mountedRef.current) setShowFlash(false); }, 200);
    if (navigator.vibrate) navigator.vibrate(30);

    let blobUrl = null;

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context failed");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // toBlob with dataURL fallback
      let blob = await new Promise((resolve) =>
        canvas.toBlob(b => resolve(b), "image/jpeg", 0.88)
      );

      if (!blob || blob.size === 0) {
        console.warn("⚠️ PHOTO_CAPTURE_RETRY - using dataURL fallback");
        const dataUrlFallback = canvas.toDataURL("image/jpeg", 0.88);
        const res = await fetch(dataUrlFallback);
        blob = await res.blob();
      }

      if (!blob || blob.size === 0) throw new Error("Failed to capture photo");

      const file = new File([blob], "meal.jpg", { type: "image/jpeg" });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.88);

      // Create a stable blob URL for <img> preview — won't disappear on re-render
      blobUrl = URL.createObjectURL(blob);

      console.log("✅ CAPTURE_OK", { size: file.size, dims: `${canvas.width}x${canvas.height}` });

      // Show preview BEFORE stopping camera — prevents any blank flash
      if (mountedRef.current) setCapturedPreview(blobUrl);

      // Write to module-level stable store
      _captureStore.file = file;
      _captureStore.dataUrl = dataUrl;

      // Stop stream (preview is now shown via img, not video)
      stopCamera();

      await new Promise(r => setTimeout(r, 80));

      if (!mountedRef.current) return;

      if (isProfilePhotoMode) {
        console.log("🚀 PROFILE_PHOTO_SAVE");
        await saveProfilePhoto(file, dataUrl);
        return;
      }

      // Write to context + sessionStorage (meal flow)
      setCapturedFile(file, dataUrl);
      console.log("🚀 NAVIGATE_RESULT");
      navigate(createPageUrl("PreviewScreen"), { replace: false });

    } catch (err) {
      console.error("❌ CAPTURE_ERROR:", err);
      if (mountedRef.current) {
        // If we at least have the blob URL, keep showing it with an error
        if (!blobUrl) {
          setCapturedPreview(null);
        }
        setCaptureError(err.message || "Capture failed");
        setIsCapturing(false);
        toast.error(t("error_capturing"));
      }
    }
  }, [isCapturing, videoReady, t, setCapturedFile, navigate]);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    console.log("📁 FILE_SELECTED_FROM_GALLERY", { size: selectedFile.size });

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      if (mountedRef.current) setCapturedPreview(dataUrl);
      _captureStore.file = selectedFile;
      _captureStore.dataUrl = dataUrl;

      if (isProfilePhotoMode) {
        console.log("🚀 PROFILE_PHOTO_SAVE (gallery fallback)");
        await saveProfilePhoto(selectedFile, dataUrl);
        return;
      }

      setCapturedFile(selectedFile, dataUrl);
      stopCamera();
      console.log("🚀 NAVIGATE_RESULT (gallery)");
      navigate(createPageUrl("PreviewScreen"), { replace: false });
    };
    reader.onerror = () => toast.error(t("error_capturing"));
    reader.readAsDataURL(selectedFile);
  };

  // Live nutrition preview — throttled, cancellable
  const runLivePreview = useCallback(async () => {
    if (!videoRef.current || !videoReady || videoRef.current.videoWidth === 0) return;
    if (liveAbortRef.current) liveAbortRef.current = true; // signal previous call to abort

    const abortFlag = { cancelled: false };
    liveAbortRef.current = abortFlag;
    setLiveAnalyzing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      // Use smaller resolution for live preview to keep it fast
      canvas.width = Math.min(video.videoWidth, 640);
      canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);

      if (abortFlag.cancelled) return;

      // Upload thumbnail for analysis
      const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.6));
      if (abortFlag.cancelled) return;
      const file = new File([blob], "preview.jpg", { type: "image/jpeg" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (abortFlag.cancelled) return;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: "Quick nutrition estimate for the food visible in this photo. Return JSON only.",
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            calories: { type: "number" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fats: { type: "number" },
          }
        }
      });

      if (abortFlag.cancelled) return;
      if (mountedRef.current) {
        setLivePreview({
          calories: Math.round(result.calories || 0),
          protein: Math.round(result.protein || 0),
          carbs: Math.round(result.carbs || 0),
          fats: Math.round(result.fats || 0),
        });
      }
    } catch (_) {
      // silently ignore live preview errors
    } finally {
      if (!abortFlag.cancelled && mountedRef.current) setLiveAnalyzing(false);
    }
  }, [videoReady]);

  // Trigger live preview once camera is ready, then throttle every 2000ms
  // DISABLED in profile photo mode — no food analysis
  useEffect(() => {
    if (!videoReady || isProfilePhotoMode) return;
    const initial = setTimeout(() => { runLivePreview(); }, 1000);
    const interval = setInterval(() => { runLivePreview(); }, 2000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
      if (liveAbortRef.current) liveAbortRef.current.cancelled = true;
    };
  }, [videoReady, runLivePreview, isProfilePhotoMode]);

  // Save a captured file as a profile photo and return to profile
  const saveProfilePhoto = useCallback(async (file, dataUrl) => {
    if (!file) return;
    try {
      // Optimistic local preview via AppStateContext if available
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (file_url && profile?.id) {
        await base44.entities.UserProfile.update(profile.id, {
          profile_photo: file_url,
          avatar_url: file_url,
        });
        await base44.auth.updateMe({ avatar_url: file_url });
        const updated = { ...profile, profile_photo: file_url, avatar_url: file_url };
        if (setContextProfile) setContextProfile(updated);
        if (user?.email) {
          localStorage.setItem(`balancen_avatar_${user.email}`, file_url);
          localStorage.setItem(`balancen_photo_${user.email}`, file_url);
        }
        toast.success(t('photo_updated') || 'Profile photo updated');
      }
    } catch (err) {
      console.error('Profile photo save failed:', err);
      toast.error(t('upload_failed') || 'Upload failed');
    } finally {
      localStorage.removeItem('CAMERA_MODE');
      localStorage.removeItem('CAMERA_RETURN_ROUTE');
      stopCamera();
      navigate(returnTo, { replace: true });
    }
  }, [profile, user, setContextProfile, t, navigate, returnTo]);

  const handleClose = React.useCallback(() => {
    if (isProfilePhotoMode) {
      localStorage.removeItem('CAMERA_MODE');
      localStorage.removeItem('CAMERA_RETURN_ROUTE');
    }
    stopCamera();
    navigate(returnTo, { replace: true });
  }, [navigate, returnTo, isProfilePhotoMode]);

  // Permission prompt (shown before first camera use)
  if (showPermissionPrompt) {
    return (
      <CameraPermissionPrompt
        mode="camera"
        lang={t("lang") === "es" ? "es" : "en"}
        onConfirm={() => { setShowPermissionPrompt(false); initCamera(); }}
        onGallery={() => { setShowPermissionPrompt(false); fileInputRef.current?.click(); }}
        onDismiss={handleClose}
      />
    );
  }

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

      {/* Live Framing Assist Overlay - Subtle */}
      {videoReady && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
          <div className={`relative ${isProfilePhotoMode ? 'w-[70%] aspect-[3/4]' : 'w-[80%] aspect-square'} max-w-md`}>
            {/* Corner guides */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/40 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/40 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/40 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/40 rounded-br-xl" />

            {/* Hint text */}
            <div className="absolute -top-12 left-0 right-0 text-center">
              <p className="text-white text-sm font-medium bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
                {isProfilePhotoMode
                  ? t("center_face_hint")
                  : t("point_camera_at_food")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Free scan counter badge */}
      {videoReady && !isProfilePhotoMode && scansUsedToday !== null && !(profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator') && (
        <div
          className="absolute z-[7] pointer-events-none"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 190px)', right: '16px' }}
        >
          <div className={`px-3 py-1.5 rounded-full border text-xs font-bold backdrop-blur-md ${
            scansUsedToday >= FREE_DAILY_LIMIT
              ? 'bg-red-500/30 border-red-400/50 text-red-300'
              : scansUsedToday >= FREE_DAILY_LIMIT - 1
              ? 'bg-amber-500/30 border-amber-400/50 text-amber-300'
              : 'bg-black/50 border-white/20 text-white/70'
          }`}>
            {FREE_DAILY_LIMIT - scansUsedToday}/{FREE_DAILY_LIMIT} AI scans left
          </div>
        </div>
      )}

      {/* Live nutrition preview panel — hidden in profile photo mode */}
      {videoReady && !isProfilePhotoMode && (
        <div
          className="absolute top-0 left-0 right-0 z-[6] pointer-events-none"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 64px)', paddingLeft: '16px', paddingRight: '16px' }}
        >
          <div className="bg-black/60 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10">
            {liveAnalyzing && !livePreview ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-white/70 text-xs font-semibold">{t("analyzing_ellipsis")}</span>
              </div>
            ) : livePreview ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  {liveAnalyzing && <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse flex-shrink-0" />}
                  <span className="text-teal-300 font-black text-base">~{livePreview.calories}</span>
                  <span className="text-white/50 text-xs font-bold">kcal</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="text-blue-300">P <span className="font-black">{livePreview.protein}g</span></span>
                  <span className="text-amber-300">C <span className="font-black">{livePreview.carbs}g</span></span>
                  <span className="text-pink-300">F <span className="font-black">{livePreview.fats}g</span></span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <span className="text-white/40 text-xs font-semibold">{t("point_camera_at_food")}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile photo mode header label */}
      {isProfilePhotoMode && (
        <div
          className="absolute top-0 left-0 right-0 z-[6] flex justify-center pointer-events-none"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 64px)' }}
        >
          <div className="bg-black/60 backdrop-blur-md rounded-2xl px-5 py-2 border border-white/10">
            <span className="text-white text-sm font-semibold">{t("profile_photo")}</span>
          </div>
        </div>
      )}
      
      {/* Camera Status Indicator */}
      {!videoReady && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-emerald-500 mx-auto mb-3" />
          <p className="text-white/80 text-sm">{t("initializing_camera")}</p>
        </div>
      )}

      {/* Flash effect */}
      {showFlash && (
        <div className="absolute inset-0 bg-white z-[20] animate-flash" />
      )}

      {/* Close button */}
      <button
        onClick={handleClose}
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)', zIndex: 22000, pointerEvents: 'auto', touchAction: 'manipulation' }}
        className="absolute right-4 p-3 rounded-xl bg-black/40 backdrop-blur-sm text-white"
      >
        <X size={24} />
      </button>

      {/* Bottom action bar */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 pt-8"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
      >
        {/* Capture button - centered */}
        <div className="flex justify-center mb-6">
          <button
            onClick={capturePhoto}
            disabled={!videoReady || isCapturing}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 border-4 border-white/30 shadow-2xl shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-90 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-white" />
          </button>
        </div>

        {/* Action tabs — food mode only */}
        {!isProfilePhotoMode && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={capturePhoto}
              disabled={!videoReady || isCapturing}
              className="py-3 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {t("scan_food")}
            </button>

            <button
              onClick={() => { setShowBarcodeModal(true); }}
              className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-semibold transition-all active:scale-95"
              style={{ pointerEvents: 'auto', touchAction: 'manipulation', zIndex: 15, position: 'relative' }}
            >
              {t("barcode")}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-semibold transition-all active:scale-95"
            >
              {t("gallery")}
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Captured preview overlay — stable blob URL, never goes blank */}
      {capturedPreview && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={capturedPreview}
            alt="Captured"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Overlay: error state or loading state */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}>
            {captureError ? (
              <div style={{ textAlign: 'center', color: '#fff', padding: '0 32px' }}>
                <p style={{ fontSize: 14, marginBottom: 16, color: '#fca5a5' }}>⚠️ {captureError}</p>
                <button
                  onClick={() => { setCapturedPreview(null); setCaptureError(null); setIsCapturing(false); }}
                  style={{
                    padding: '12px 28px', borderRadius: 12,
                    background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.5)',
                    color: '#6ee7b7', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    pointerEvents: 'auto', touchAction: 'manipulation',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.3)', borderTopColor: '#10b981', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, fontWeight: 500 }}>
                  {isProfilePhotoMode ? t("saving_ellipsis") : t("analyzing_ellipsis")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hard fallback: nothing captured but also no camera — should never be fully blank */}
      {!capturedPreview && !videoReady && !cameraError && !isCapturing && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          {t("initializing_camera_ellipsis")}
        </div>
      )}

      {/* Barcode coming-soon modal — rendered in top-layer portal */}
      {showBarcodeModal && createPortal(
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowBarcodeModal(false)}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 20000,
              background: 'rgba(0,0,0,0.7)',
              pointerEvents: 'auto',
              touchAction: 'none',
            }}
          />
          {/* Sheet */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              bottom: 0, left: 0, right: 0,
              zIndex: 20001,
              background: '#0f172a',
              borderTop: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '24px 24px 0 0',
              padding: '24px',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)',
              pointerEvents: 'auto',
              touchAction: 'pan-y',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>
                {t("barcode") || "Barcode"}
              </h3>
              <button
                onClick={() => setShowBarcodeModal(false)}
                style={{
                  padding: '8px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none', cursor: 'pointer',
                  pointerEvents: 'auto', touchAction: 'manipulation',
                  color: 'rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              {t("barcode_coming_soon")}
            </p>
            <button
              onClick={() => setShowBarcodeModal(false)}
              style={{
                width: '100%', padding: '14px',
                borderRadius: '12px',
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.4)',
                color: '#6ee7b7',
                fontWeight: 600, fontSize: '15px',
                cursor: 'pointer',
                pointerEvents: 'auto', touchAction: 'manipulation',
              }}
            >
              {t("ok")}
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}