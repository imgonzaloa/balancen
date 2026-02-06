import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle, X, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { toast } from "sonner";
import MealAnalysisOverlay from "./MealAnalysisOverlay";

export default function MealResultCard({ file, profile, onSave, onCancel }) {
  const { t } = useTranslation();
  const [analyzing, setAnalyzing] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    analyzePhoto();
  }, [file]);

  const analyzePhoto = async () => {
    try {
      setAnalyzing(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this food photo and provide detailed nutritional estimates. Return JSON with: { items: [{name: "food name", calories: estimated, protein: grams, carbs: grams, fats: grams, portion: "size estimate"}, ...], total_calories: sum, total_protein: sum, total_carbs: sum, total_fats: sum, health_score: 0-100, confidence: 0-100 }`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  calories: { type: "number" },
                  protein: { type: "number" },
                  carbs: { type: "number" },
                  fats: { type: "number" },
                  portion: { type: "string" }
                }
              }
            },
            total_calories: { type: "number" },
            total_protein: { type: "number" },
            total_carbs: { type: "number" },
            total_fats: { type: "number" },
            health_score: { type: "number" },
            confidence: { type: "number" }
          }
        }
      });

      // Format items for overlay display
      const formattedItems = (analysis.items || []).map(item => ({
        name: item.name,
        calories: Math.round(item.calories || 0),
        portion: item.portion
      }));

      setResult({ ...analysis, file_url });
      setItems(formattedItems);
      setEditValues({
        calories: analysis.total_calories,
        protein_g: analysis.total_protein,
        carbs_g: analysis.total_carbs,
        fats_g: analysis.total_fats
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

      // Create meal log
      await base44.entities.MealLog.create({
        date: today,
        meal_time,
        photo_url: result.file_url,
        estimated_calories: editValues.calories,
        estimated_protein: editValues.protein_g,
        estimated_carbs: editValues.carbs_g,
        estimated_fats: editValues.fats_g
      });

      // Call update check-in function to handle fire awards + 24h status auto-set
      try {
        await base44.functions.invoke('updateDailyCheckIn', {
          food_photo_url: result.file_url,
          estimated_calories: editValues.calories,
          meal_photo_fire_awarded: false
        });
      } catch (err) {
        console.error('Error updating check-in:', err);
      }

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
      {/* Preview with overlay */}
      <MealAnalysisOverlay 
        imageUrl={result.file_url} 
        items={items}
        onItemsChange={setItems}
      />

      {/* Detected Items List - Editable */}
      <div className="space-y-2">
        <p className="text-xs text-white/60 font-semibold uppercase">{t("detected_items") || "Detected Items"}</p>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3"
            >
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{item.name}</p>
                <p className="text-xs text-white/60">{item.portion || "estimated"}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">{item.calories}</p>
                <p className="text-xs text-white/60">cal</p>
              </div>
              <button
                onClick={() => setItems(items.filter((_, i) => i !== idx))}
                className="ml-3 p-1 hover:bg-red-500/20 rounded transition-colors"
              >
                <Trash2 size={16} className="text-red-400" />
              </button>
            </motion.div>
          ))}
        </div>
        <button className="w-full py-2 rounded-lg bg-teal-500/20 border border-teal-500/50 text-teal-300 text-sm font-medium hover:bg-teal-500/30 transition-colors flex items-center justify-center gap-2">
          <Plus size={16} />
          {t("add_manual_item") || "Add manual item"}
        </button>
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
          { label: t("protein") || "Protein", key: "protein_g", unit: "g" },
          { label: t("carbs") || "Carbs", key: "carbs_g", unit: "g" },
          { label: t("fats") || "Fats", key: "fats_g", unit: "g" }
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

      {/* AI Confidence & Health Score */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-xs text-white/60 mb-1">{t("confidence") || "AI Confidence"}</p>
          <div className="flex items-center justify-center gap-1">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-1 rounded-full ${
                    i < Math.round((result.confidence || 0) / 20)
                      ? "bg-teal-400"
                      : "bg-white/20"
                  }`}
                />
              ))}
            </div>
            <span className="text-white font-bold text-sm ml-2">{result.confidence || 0}%</span>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-xs text-white/60 mb-1">{t("health_score") || "Health"}</p>
          <div className="w-full h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 relative overflow-hidden">
            <div
              className="h-full bg-white/30 transition-all"
              style={{ width: `${100 - (result.health_score || 50)}%` }}
            />
          </div>
          <p className="text-white font-bold text-sm mt-1">{result.health_score || 50}/100</p>
        </div>
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