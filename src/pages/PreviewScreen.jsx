import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Check, RotateCcw } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { useMeal } from "@/components/MealContext";
import { createPageUrl } from "@/utils";
import OverlayPortal from "@/components/OverlayPortal";

export default function PreviewScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { previewUrl, capturedFile, resetMeal } = useMeal();
  const returnTo = location.state?.from || createPageUrl("Home");

  // Resolve preview: context first, then storage fallback (async restore from MealContext may not be done yet)
  const storedFallback = React.useMemo(() => {
    try {
      return sessionStorage.getItem("balancen_last_capture") || localStorage.getItem("meal_last_capture_dataurl") || null;
    } catch { return null; }
  }, []);

  const resolvedPreview = previewUrl || storedFallback;

  console.log("📷 PREVIEW_SCREEN_MOUNT", { hasPreview: !!previewUrl, hasFile: !!capturedFile, hasFallback: !!storedFallback });

  // Only redirect if truly nothing — not during async restore
  React.useEffect(() => {
    if (!resolvedPreview) {
      console.error("❌ NO_PHOTO_IN_PREVIEW - redirecting");
      navigate(createPageUrl("CameraScreen"));
    }
  }, [resolvedPreview, navigate]);

  if (!resolvedPreview) return null;

  const handleRetake = () => {
    console.log("🔄 RETAKE_PHOTO");
    resetMeal();
    // Go back to camera, passing the same origin forward
    navigate(createPageUrl("CameraScreen"), { replace: true, state: { from: returnTo } });
  };

  const handleUsePhoto = () => {
    console.log("✅ USE_PHOTO_CONFIRMED - navigating to analysis");
    navigate(createPageUrl("MealResult"), { replace: true, state: { from: returnTo } });
  };

  return (
    <OverlayPortal>
      <div style={{ position: 'fixed', inset: 0, background: '#000', pointerEvents: 'auto', zIndex: 1 }}>
        {/* Photo Preview */}
        <img
          src={resolvedPreview}
          alt="Captured meal"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Top Bar */}
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
            paddingLeft: '16px', paddingRight: '16px', paddingBottom: '16px',
          }}
        >
          <button
            onClick={() => { resetMeal(); navigate(returnTo, { replace: true }); }}
            style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', color: '#fff', border: 'none', cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Bottom Sheet */}
        <div
          style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            zIndex: 3,
            maxHeight: '90dvh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(to top, rgba(0,0,0,0.97) 60%, transparent)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingTop: '48px',
            paddingLeft: '24px',
            paddingRight: '24px',
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div style={{ maxWidth: '512px', margin: '0 auto', width: '100%', marginTop: 'auto' }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: '20px', fontSize: '18px', fontWeight: 500 }}>
              {t("photo_looks_good")}
            </p>
            {/* Button row — debug bg removed once confirmed working */}
            <div style={{
              display: 'flex', gap: '16px',
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            }}>
              <button
                onClick={handleRetake}
                style={{
                  flex: 1, padding: '16px 24px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation',
                  minHeight: '56px',
                }}
              >
                <RotateCcw size={20} />
                {t("retake")}
              </button>
              <button
                onClick={handleUsePhoto}
                style={{
                  flex: 1, padding: '16px 24px', borderRadius: '16px',
                  background: 'linear-gradient(to right, #10b981, #0d9488)',
                  color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation',
                  boxShadow: '0 10px 30px rgba(16,185,129,0.4)',
                  border: 'none',
                  minHeight: '56px',
                }}
              >
                <Check size={20} />
                {t("use_photo")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
}