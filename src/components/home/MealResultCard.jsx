import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X, Flame, RefreshCw, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { useMeal } from "@/components/MealContext";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function MealResultCard({ profile, onSave }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    file,
    previewUrl,
    status,
    result,
    error,
    updateStatus,
    setAnalysisResult,
    setAnalysisError,
    clearCapture,
  } = useMeal();

  const [editedCalories, setEditedCalories] = useState("");
  const [editedProtein, setEditedProtein] = useState("");
  const [editedCarbs, setEditedCarbs] = useState("");
  const [editedFats, setEditedFats] = useState("");
  const [saving, setSaving] = useState(false);

  // Update editable fields when result changes
  useEffect(() => {
    if (result) {
      setEditedCalories(result.calories?.toString() || "");
      setEditedProtein(result.protein?.toString() || "");
      setEditedCarbs(result.carbs?.toString() || "");
      setEditedFats(result.fats?.toString() || "");
    }
  }, [result]);

  // Auto-start analysis when captured
  useEffect(() => {
    if (status === "captured" && file && !result && !error) {
      analyzePhoto();
    }
  }, [status, file, result, error]);

  const analyzePhoto = async () => {
    if (!file) return;

    try {
      updateStatus("uploading");

      const formData = new FormData();
      formData.append("file", file, "meal.jpg");

      const response = await fetch("/ai/meal-analysis", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(t("analysis_failed"));
      }

      updateStatus("analyzing");

      const data = await response.json();

      if (!data.calories && !data.items) {
        throw new Error(t("no_food_detected"));
      }

      setAnalysisResult({
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fats: data.fats || 0,
        items: data.items || [],
      });

      toast.success(t("analysis_complete"));
    } catch (err) {
      console.error("Analysis error:", err);
      setAnalysisError(err.message || t("analysis_failed"));
      toast.error(err.message || t("analysis_failed"));
    }
  };

  const handleSave = async () => {
    if (!file || !previewUrl) {
      toast.error(t("no_photo_captured"));
      return;
    }

    setSaving(true);

    try {
      // Upload photo first
      const uploadFormData = new FormData();
      uploadFormData.append("file", file, "meal.jpg");

      const uploadResponse = await base44.integrations.Core.UploadFile({
        file: file,
      });

      const photoUrl = uploadResponse.file_url;

      // Save meal log
      const today = new Date().toISOString().split("T")[0];
      const mealTime = new Date().toTimeString().slice(0, 5);

      await base44.entities.MealLog.create({
        date: today,
        meal_time: mealTime,
        photo_url: photoUrl,
        estimated_calories: parseInt(editedCalories) || 0,
        estimated_protein: parseInt(editedProtein) || 0,
        estimated_carbs: parseInt(editedCarbs) || 0,
        estimated_fats: parseInt(editedFats) || 0,
      });

      // Clear capture state
      clearCapture();

      // Trigger parent callback
      if (onSave) {
        onSave();
      }

      toast.success(t("meal_saved"));
    } catch (err) {
      console.error("Save error:", err);
      toast.error(t("error_saving_meal"));
    } finally {
      setSaving(false);
    }
  };

  const handleRetakePhoto = () => {
    clearCapture();
    navigate(createPageUrl("CameraScreen"));
  };

  const handleClose = () => {
    clearCapture();
  };

  if (!previewUrl) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end"
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="w-full bg-gradient-to-b from-slate-900 to-slate-800 rounded-t-3xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-lg border-b border-white/10 p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">{t("meal_analysis")}</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Image Preview - ALWAYS VISIBLE */}
        <div className="p-4">
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <img
              src={previewUrl}
              alt="Captured meal"
              className="w-full h-64 object-cover"
            />
          </div>
        </div>

        {/* Analysis Status */}
        {status === "uploading" || status === "analyzing" ? (
          <div className="p-6 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-emerald-400 animate-spin" />
            <p className="text-white font-semibold mb-2">{t("analyzing_food")}</p>
            <p className="text-white/60 text-sm">{t("please_wait")}</p>
          </div>
        ) : null}

        {/* Error State */}
        {status === "error" && error ? (
          <div className="p-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
            <button
              onClick={analyzePhoto}
              className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              {t("retry_analysis")}
            </button>
          </div>
        ) : null}

        {/* Results */}
        {status === "done" && result ? (
          <div className="p-6 space-y-6">
            {/* Calories Card */}
            <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Flame className="text-orange-400" size={28} />
                <div>
                  <p className="text-white/60 text-sm">{t("estimated_calories")}</p>
                  <input
                    type="number"
                    value={editedCalories}
                    onChange={(e) => setEditedCalories(e.target.value)}
                    className="text-4xl font-black text-white bg-transparent border-none outline-none w-32"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                <p className="text-white/50 text-xs mb-1">{t("protein")}</p>
                <input
                  type="number"
                  value={editedProtein}
                  onChange={(e) => setEditedProtein(e.target.value)}
                  className="text-xl font-bold text-white bg-transparent border-none outline-none w-full"
                  placeholder="0"
                />
                <p className="text-white/40 text-xs">g</p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                <p className="text-white/50 text-xs mb-1">{t("carbs")}</p>
                <input
                  type="number"
                  value={editedCarbs}
                  onChange={(e) => setEditedCarbs(e.target.value)}
                  className="text-xl font-bold text-white bg-transparent border-none outline-none w-full"
                  placeholder="0"
                />
                <p className="text-white/40 text-xs">g</p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                <p className="text-white/50 text-xs mb-1">{t("fats")}</p>
                <input
                  type="number"
                  value={editedFats}
                  onChange={(e) => setEditedFats(e.target.value)}
                  className="text-xl font-bold text-white bg-transparent border-none outline-none w-full"
                  placeholder="0"
                />
                <p className="text-white/40 text-xs">g</p>
              </div>
            </div>

            {/* Detected Items */}
            {result.items && result.items.length > 0 ? (
              <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
                <p className="text-white/60 text-sm mb-3">{t("detected_items")}</p>
                <div className="space-y-2">
                  {result.items.map((item, idx) => (
                    <div key={idx} className="text-white text-sm">
                      • {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="p-6 space-y-3 pb-safe">
          {status === "done" && result ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg disabled:opacity-50"
            >
              {saving ? t("saving") : t("save_meal")}
            </button>
          ) : null}

          <button
            onClick={handleRetakePhoto}
            className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold flex items-center justify-center gap-2"
          >
            <Camera size={18} />
            {t("retake_photo")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}