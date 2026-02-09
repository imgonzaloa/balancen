import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { X, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { useMeal } from "@/components/MealContext";
import { createPageUrl } from "@/utils";
import MealAnalysisOverlay from "@/components/home/MealAnalysisOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MealResult() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { capturedFile, resetMeal } = useMeal();

  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!capturedFile) {
      navigate(createPageUrl("Home"));
      return;
    }

    // Show instant preview
    setImagePreview(URL.createObjectURL(capturedFile));

    // Start analysis
    analyzePhoto();
  }, [capturedFile, navigate]);

  const analyzePhoto = async () => {
    if (!capturedFile) return;

    try {
      setAnalyzing(true);
      setError(null);

      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({
        file: capturedFile
      });

      // Analyze with AI
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

      // Format items
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

      // Update check-in
      try {
        await base44.functions.invoke('updateDailyCheckIn', {
          food_photo_url: result.file_url,
          estimated_calories: editValues.calories,
          meal_photo_fire_awarded: false
        });
      } catch (err) {
        console.error('Check-in update error:', err);
      }

      toast.success(t("meal_saved"));
      resetMeal();
      navigate(createPageUrl("Home"));
    } catch (err) {
      toast.error(t("error_saving"));
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    resetMeal();
    navigate(createPageUrl("Home"));
  };

  if (!capturedFile) {
    return null;
  }

  // ANALYZING
  if (analyzing) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 50,
          backgroundColor: "rgba(0,0,0,0.95)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Loader2 size={48} style={{ color: "rgb(20 184 166)", animation: "spin 1s linear infinite", marginBottom: "1.5rem" }} />
        <p style={{ color: "white", fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.5rem" }}>
          {t("analyzing_meal")}
        </p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
          {t("please_wait")}
        </p>

        {/* Instant preview in background */}
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Captured meal"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.3,
              zIndex: 0
            }}
          />
        )}
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 50,
          backgroundColor: "rgba(0,0,0,0.95)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem"
        }}
      >
        <div style={{ maxWidth: "20rem", textAlign: "center" }}>
          <AlertCircle size={48} style={{ margin: "0 auto 1rem", color: "rgb(248 113 113)" }} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "white", marginBottom: "0.5rem" }}>
            {t("analysis_failed")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "2rem", fontSize: "0.875rem" }}>
            {error}
          </p>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handleCancel}
              style={{
                flex: 1,
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
            <button
              onClick={() => {
                setAnalyzing(true);
                analyzePhoto();
              }}
              style={{
                flex: 1,
                padding: "1rem",
                borderRadius: "1rem",
                background: "linear-gradient(to right, rgb(16 185 129), rgb(5 150 105))",
                color: "white",
                fontWeight: "600",
                cursor: "pointer",
                border: "none"
              }}
            >
              {t("retry")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RESULT
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 50, backgroundColor: "rgba(0,0,0,0.5)", overflowY: "auto" }}>
      <div style={{ minHeight: "100vh", backgroundColor: "rgb(15 23 42)", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10, backgroundColor: "rgb(15 23 42)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "white" }}>
            {t("meal_analysis")}
          </h2>
          <button
            onClick={handleCancel}
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

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", maxWidth: "32rem", margin: "0 auto", width: "100%" }}>
          {/* Preview */}
          {imagePreview && (
            <div style={{ marginBottom: "2rem" }}>
              <MealAnalysisOverlay
                imageUrl={imagePreview}
                items={items}
                onItemsChange={setItems}
              />
            </div>
          )}

          {/* Items list */}
          <div style={{ marginBottom: "2rem" }}>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", fontWeight: "600", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              {t("detected_items")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "128px", overflowY: "auto" }}>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.5rem",
                    padding: "0.75rem"
                  }}
                >
                  <div>
                    <p style={{ color: "white", fontWeight: "500", fontSize: "0.875rem" }}>
                      {item.name}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>
                      {item.portion || t("estimated")}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: "white", fontWeight: "bold" }}>
                      {item.calories}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>
                      {t("cal")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calories */}
          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.5rem" }}>
              {t("calories")}
            </label>
            <input
              type="number"
              value={editValues.calories}
              onChange={(e) => setEditValues({ ...editValues, calories: parseFloat(e.target.value) || 0 })}
              style={{
                width: "100%",
                padding: "0.75rem",
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "0.75rem",
                color: "white",
                fontSize: "1.125rem",
                fontWeight: "bold"
              }}
            />
          </div>

          {/* Macros */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "2rem" }}>
            {[
              { label: t("protein"), key: "protein_g", unit: "g" },
              { label: t("carbs"), key: "carbs_g", unit: "g" },
              { label: t("fats"), key: "fats_g", unit: "g" }
            ].map((macro) => (
              <div key={macro.key} style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "0.75rem", padding: "0.75rem" }}>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.5rem" }}>
                  {macro.label}
                </p>
                <input
                  type="number"
                  value={editValues[macro.key] || 0}
                  onChange={(e) => setEditValues({ ...editValues, [macro.key]: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "0.5rem",
                    color: "white",
                    fontWeight: "600",
                    textAlign: "center"
                  }}
                  placeholder="0"
                />
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "0.25rem" }}>
                  {macro.unit}
                </p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handleCancel}
              disabled={uploading}
              style={{
                flex: 1,
                padding: "1rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                fontWeight: "600",
                cursor: uploading ? "not-allowed" : "pointer",
                opacity: uploading ? 0.5 : 1
              }}
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={uploading}
              style={{
                flex: 1,
                padding: "1rem",
                borderRadius: "0.75rem",
                background: "linear-gradient(to right, rgb(16 185 129), rgb(5 150 105))",
                color: "white",
                fontWeight: "600",
                cursor: uploading ? "not-allowed" : "pointer",
                border: "none",
                opacity: uploading ? 0.7 : 1
              }}
            >
              {uploading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  {t("saving")}
                </span>
              ) : (
                t("save_meal")
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}