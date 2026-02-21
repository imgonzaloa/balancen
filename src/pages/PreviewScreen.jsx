import React from "react";
import { useNavigate } from "react-router-dom";
import { X, Check, RotateCcw } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { useMeal } from "@/components/MealContext";
import { createPageUrl } from "@/utils";

export default function PreviewScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { previewUrl, capturedFile, resetMeal } = useMeal();

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
    navigate(createPageUrl("CameraScreen"));
  };

  const handleUsePhoto = () => {
    console.log("✅ USE_PHOTO_CONFIRMED - navigating to analysis");
    navigate(createPageUrl("MealResult"));
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      {/* Photo Preview */}
      <img
        src={resolvedPreview}
        alt="Captured meal"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Top Bar */}
      <div
        className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent px-4 pb-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <button
          onClick={handleRetake}
          className="p-3 rounded-xl bg-black/40 backdrop-blur-sm text-white"
        >
          <X size={24} />
        </button>
      </div>

      {/* Bottom Actions */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-6 pt-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
      >
        <div className="max-w-lg mx-auto">
          <p className="text-white/80 text-center mb-6 text-lg font-medium">
            {t("photo_looks_good")}
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={handleRetake}
              className="flex-1 py-4 px-6 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <RotateCcw size={20} />
              {t("retake")}
            </button>
            
            <button
              onClick={handleUsePhoto}
              className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/50"
            >
              <Check size={20} />
              {t("use_photo")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}