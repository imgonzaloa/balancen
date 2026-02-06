import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { toast } from "sonner";

export default function MealResultCard({ file, profile, onSave, onCancel }) {
  const { t } = useTranslation();
  const [analyzing, setAnalyzing] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    analyzePhoto();
  }, [file]);

  const analyzePhoto = async () => {
    try {
      setAnalyzing(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this food photo and provide nutritional estimates. Return JSON with: { items: [names of food items detected], calories: estimated total calories, protein_g: protein in grams, carbs_g: carbs in grams, fats_g: fats in grams, health_score: 0-100 score, confidence: 0-100 }`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            items: { type: "array", items: { type: "string" } },
            calories: { type: "number" },
            protein_g: { type: "number" },
            carbs_g: { type: "number" },
            fats_g: { type: "number" },
            health_score: { type: "number" },
            confidence: { type: "number" }
          }
        }
      });

      setResult({ ...analysis, file_url });
      setEditValues({
        calories: analysis.calories,
        protein_g: analysis.protein_g,
        carbs_g: analysis.carbs_g,
        fats_g: analysis.fats_g
      });
      setAnalyzing(false);
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.message);
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const meal_time = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });

      await base44.entities.MealLog.create({
        date: today,
        meal_time,
        photo_url: result.file_url,
        estimated_calories: editValues.calories,
        estimated_protein: editValues.protein_g,
        estimated_carbs: editValues.carbs_g,
        estimated_fats: editValues.fats_g
      });

      toast.success(t("meal_saved") || "Meal saved!");
      onSave?.();
    } catch (err) {
      toast.error(t("error_saving") || "Error saving meal");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (analyzing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center"
      >
        <Loader2 size={40} className="text-teal-400 mx-auto mb-4 animate-spin" />
        <p className="text-white font-semibold">{t("analyzing_meal") || "Analyzing meal..."}</p>
        <p className="text-white/60 text-sm mt-2">{t("please_wait") || "This takes a few seconds"}</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-red-500/20 backdrop-blur-xl border border-red-500/50 rounded-3xl p-6"
      >
        <div className="flex items-start gap-3">
          <AlertCircle size={24} className="text-red-300 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="text-red-300 font-semibold">{t("analysis_failed") || "Analysis failed"}</p>
            <p className="text-red-200/70 text-sm mt-1">{error}</p>
            <div className="flex gap-2 mt-4">
              <Button onClick={onCancel} variant="outline" className="flex-1 bg-red-500/20 border-red-400 text-red-300 hover:bg-red-500/30">
                {t("cancel")}
              </Button>
              <Button onClick={analyzePhoto} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                {t("retry")}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Preview Image */}
      <div className="relative rounded-2xl overflow-hidden bg-black/50 border border-white/10">
        <img src={result.file_url} alt="Meal" className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Detected Items */}
      <div>
        <p className="text-xs text-white/60 font-semibold uppercase mb-2">{t("detected_items") || "Detected Items"}</p>
        <div className="flex flex-wrap gap-2">
          {result.items?.map((item, idx) => (
            <span key={idx} className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/50 text-teal-300 text-xs font-medium">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Editable Nutrition */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-2xl p-4">
          <label className="text-xs text-white/60 block mb-2">{t("calories") || "Calories"}</label>
          <Input
            type="number"
            value={editValues.calories}
            onChange={(e) => setEditValues({ ...editValues, calories: parseFloat(e.target.value) || 0 })}
            className="bg-white/10 border-white/20 text-white text-lg font-bold"
          />
        </div>
        <div className="bg-white/5 rounded-2xl p-4">
          <label className="text-xs text-white/60 block mb-2">{t("health_score") || "Health"}</label>
          <div className="w-full h-10 rounded-xl bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 relative overflow-hidden">
            <div
              className="h-full bg-white/30 transition-all duration-300"
              style={{ width: `${100 - (result.health_score || 50)}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
              {result.health_score || 50}
            </span>
          </div>
        </div>
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Protein", key: "protein_g", unit: "g" },
          { label: "Carbs", key: "carbs_g", unit: "g" },
          { label: "Fats", key: "fats_g", unit: "g" }
        ].map((macro) => (
          <div key={macro.key} className="bg-white/5 rounded-xl p-3">
            <p className="text-xs text-white/60 mb-2">{macro.label}</p>
            <Input
              type="number"
              value={editValues[macro.key] || 0}
              onChange={(e) => setEditValues({ ...editValues, [macro.key]: parseFloat(e.target.value) || 0 })}
              className="bg-white/10 border-white/20 text-white font-semibold text-center"
              placeholder="0"
            />
            <p className="text-xs text-white/40 text-center mt-1">{macro.unit}</p>
          </div>
        ))}
      </div>

      {/* Confidence */}
      <div className="text-center py-2">
        <p className="text-xs text-white/60">
          {t("confidence") || "Confidence"}: <span className="text-teal-300 font-semibold">{result.confidence || 0}%</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={onCancel}
          disabled={uploading}
          variant="outline"
          className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          {t("cancel")}
        </Button>
        <Button
          onClick={handleSave}
          disabled={uploading}
          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              {t("save_meal")}
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}