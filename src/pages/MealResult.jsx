import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { X, Loader2, AlertCircle, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { useMeal } from "@/components/MealContext";
import { useMealsStore } from "@/components/MealsStore";
import { createPageUrl } from "@/utils";
import { debugLogger } from "@/components/DebugOverlay";
import MealAnalysisOverlay from "@/components/home/MealAnalysisOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MealResult() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { capturedFile, resetMeal } = useMeal();
  const { addMeal, formatLocalDateKey } = useMealsStore();

  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [items, setItems] = useState([]);
  const [confidence, setConfidence] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    console.log("🔍 MEAL_RESULT_MOUNT", { 
      hasCapturedFile: !!capturedFile, 
      fileSize: capturedFile?.size 
    });

    // CRITICAL: Check for photo in multiple sources
    if (!capturedFile) {
      console.error("❌ NO_CAPTURED_FILE - checking storage...");
      
      // Try to restore from storage as fallback
      const storedDataUrl = sessionStorage.getItem("balancen_last_capture") || 
                           localStorage.getItem("meal_last_capture_dataurl");
      
      if (storedDataUrl) {
        console.warn("⚠️ RESTORING_FROM_STORAGE");
        // Don't navigate away - let context restore the file
        setTimeout(() => {
          if (!capturedFile) {
            console.error("❌ RESTORE_FAILED - redirecting to Home");
            navigate(createPageUrl("Home"));
          }
        }, 500);
        return;
      }
      
      console.error("❌ NO_PHOTO_FOUND - redirecting to Home");
      navigate(createPageUrl("Home"));
      return;
    }

    // Show instant preview
    const previewUrl = URL.createObjectURL(capturedFile);
    setImagePreview(previewUrl);
    console.log("✅ PREVIEW_SET", { previewUrl: previewUrl.substring(0, 50) });

    // Start analysis immediately
    console.log("🚀 ANALYSIS_STARTED");
    analyzePhoto();
  }, [capturedFile, navigate]);

  const analyzePhoto = async () => {
    if (!capturedFile) {
      console.error("❌ ANALYSIS_BLOCKED - no capturedFile");
      setError("Photo not available. Please try again.");
      setAnalyzing(false);
      return;
    }

    console.log("📸 ANALYSIS_STARTING", { fileSize: capturedFile.size });

    try {
      setAnalyzing(true);
      setError(null);

      // Upload file
      console.log("☁️ UPLOADING_FILE...");
      const { file_url } = await base44.integrations.Core.UploadFile({
        file: capturedFile
      });
      console.log("✅ FILE_UPLOADED", { file_url: file_url.substring(0, 50) });

      // Analyze with AI
      console.log("🤖 AI_ANALYSIS_STARTING...");
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this food photo and provide detailed nutritional estimates in JSON format: { items: [{name: "food name", calories: number, protein: number, carbs: number, fats: number, portion: "size estimate"}, ...], total_calories: number, total_protein: number, total_carbs: number, total_fats: number, health_score: 0-100, confidence: 0-100 }. Provide realistic estimates.`,
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

      console.log("✅ ANALYSIS_SUCCESS", {
        itemsCount: analysis.items?.length || 0,
        totalCalories: analysis.total_calories,
        confidence: analysis.confidence
      });

      // Format items
      const formattedItems = (analysis.items || []).map(item => ({
        name: item.name,
        calories: Math.round(item.calories || 0),
        portion: item.portion
      }));

      // CRITICAL: Ensure we have at least calories
      if (!analysis.total_calories && formattedItems.length === 0) {
        console.error("❌ ANALYSIS_EMPTY - no data returned");
        throw new Error("Could not detect any food in this photo");
      }

      setResult({ ...analysis, file_url });
      setItems(formattedItems);
      const conf = Math.round(analysis.confidence || 0);
      setConfidence(conf);
      setEditValues({
        calories: Math.round(analysis.total_calories || 0),
        protein_g: Math.round(analysis.total_protein || 0),
        carbs_g: Math.round(analysis.total_carbs || 0),
        fats_g: Math.round(analysis.total_fats || 0)
      });
      setAnalyzing(false);
    } catch (err) {
      console.error("❌ ANALYSIS_FAILED", err);
      setError(err.message || "Analysis failed. Please try again.");
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    debugLogger.log('SAVE_MEAL_START', 'User clicked save', { 
      calories: editValues.calories,
      protein: editValues.protein_g,
      items: items.length
    });
    
    // VALIDATION BLOCK
    if (!result?.file_url) {
      debugLogger.log('SAVE_MEAL_FAIL', 'No file URL', { hasResult: !!result });
      toast.error("Cannot save - photo upload failed");
      return;
    }
    
    if (!editValues.calories || editValues.calories === 0) {
      debugLogger.log('SAVE_MEAL_FAIL', 'No calories', editValues);
      toast.error("Please add calorie estimate");
      return;
    }

    setUploading(true);
    
    try {
      const now = new Date();
      const dateKey = formatLocalDateKey(now);
      const meal_time = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });

      // Auto-detect meal type by time
      const hour = now.getHours();
      let mealType = "snack";
      if (hour >= 5 && hour < 11) mealType = "breakfast";
      else if (hour >= 11 && hour < 16) mealType = "lunch";
      else if (hour >= 16 && hour < 22) mealType = "dinner";

      console.log("📝 CREATING_MEAL", { dateKey, time: meal_time, mealType });

      // Create meal object for local store
      const meal = {
        id: crypto.randomUUID(),
        dateKey,
        createdAt: now.toISOString(),
        photoUri: result.file_url,
        mealType,
        totals: {
          calories: editValues.calories,
          protein: editValues.protein_g,
          carbs: editValues.carbs_g,
          fats: editValues.fats_g
        },
        items: items.map(item => ({
          name: item.name,
          calories: item.calories,
          portion: item.portion
        })),
        confidence: confidence || 0
      };

      // Add to local store FIRST (optimistic)
      addMeal(meal);
      debugLogger.log('SAVE_MEAL_LOCAL', 'Added to local store', { 
        id: meal.id, 
        dateKey,
        calories: meal.totals.calories 
      });

      // Then persist to backend
      let backendSuccess = false;
      try {
        const mealLog = await base44.entities.MealLog.create({
          date: dateKey,
          meal_time,
          photo_url: result.file_url,
          estimated_calories: editValues.calories,
          estimated_protein: editValues.protein_g,
          estimated_carbs: editValues.carbs_g,
          estimated_fats: editValues.fats_g
        });
        backendSuccess = true;
        debugLogger.log('SAVE_MEAL_BACKEND', 'Backend save OK', { id: mealLog.id });
      } catch (backendErr) {
        debugLogger.log('SAVE_MEAL_BACKEND_FAIL', backendErr.message, { error: backendErr });
      }

      // Update check-in
      try {
        await base44.functions.invoke('updateDailyCheckIn', {
          food_photo_url: result.file_url,
          estimated_calories: editValues.calories,
          meal_photo_fire_awarded: false
        });
        debugLogger.log('CHECKIN_UPDATED', 'Check-in updated');
      } catch (err) {
        debugLogger.log('CHECKIN_UPDATE_FAIL', err.message);
      }

      // Verify save in localStorage
      const savedMeals = JSON.parse(localStorage.getItem("balancen.mealsByDate") || "{}");
      const verifyMeal = savedMeals[dateKey]?.find(m => m.id === meal.id);
      
      if (!verifyMeal) {
        debugLogger.log('SAVE_MEAL_FAIL', 'Meal not in storage after save', { 
          dateKey,
          storageKeys: Object.keys(savedMeals)
        });
        throw new Error("Meal not found in storage after save");
      }

      // Calculate totals after save
      const todayMeals = savedMeals[dateKey] || [];
      const totalsAfterSave = todayMeals.reduce((acc, m) => ({
        calories: acc.calories + (m.totals?.calories || 0),
        protein: acc.protein + (m.totals?.protein || 0)
      }), { calories: 0, protein: 0 });

      debugLogger.log('SAVE_MEAL_SUCCESS', 'Save verified', { 
        mealId: meal.id,
        mealCalories: verifyMeal.totals.calories,
        todayMealsCount: todayMeals.length,
        todayTotalCalories: totalsAfterSave.calories,
        backendSuccess 
      });
      
      // Success feedback
      toast.success(`${t("meal_saved")} ✓ +${editValues.calories} kcal`);
      
      // Clean up context
      resetMeal();
      
      // Navigate and log reload totals after 1s
      navigate(createPageUrl("Home"));
      debugLogger.log('NAV_TO_HOME', 'Redirecting to Home');
      
      setTimeout(() => {
        const reloadMeals = JSON.parse(localStorage.getItem("balancen.mealsByDate") || "{}");
        const todayMeals = reloadMeals[dateKey] || [];
        const totals = todayMeals.reduce((acc, m) => ({
          calories: acc.calories + (m.totals?.calories || 0),
          protein: acc.protein + (m.totals?.protein || 0)
        }), { calories: 0, protein: 0 });
        
        debugLogger.log('AFTER_SAVE_RELOAD', 'Home should show totals', {
          mealsCount: todayMeals.length,
          totalCalories: totals.calories,
          totalProtein: totals.protein
        });
      }, 1000);
      
    } catch (err) {
      debugLogger.log('SAVE_MEAL_FAIL', err.message, { error: err });
      toast.error(t("error_saving") + ": " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    resetMeal();
    navigate(createPageUrl("Home"));
  };

  if (!capturedFile) {
    navigate(createPageUrl("Home"));
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
        {/* Photo Preview - VISIBLE */}
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
              opacity: 0.4,
              zIndex: 0
            }}
          />
        )}
        
        {/* Analysis Overlay */}
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "2rem" }}>
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "rgba(16, 185, 129, 0.2)",
            marginBottom: "1.5rem"
          }}>
            <Loader2 size={48} style={{ color: "rgb(16 185 129)", animation: "spin 1s linear infinite" }} />
          </div>
          
          <p style={{ color: "white", fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>
            {t("analyzing_meal")}
          </p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem", marginBottom: "1rem" }}>
            {t("please_wait")}
          </p>
          
          {/* Progress Dots */}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(16, 185, 129, 0.5)",
                  animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`
                }}
              />
            ))}
          </div>
        </div>
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
        {/* Photo Preview - STILL VISIBLE on error */}
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
        
        <div style={{ maxWidth: "20rem", textAlign: "center", position: "relative", zIndex: 10 }}>
          <AlertCircle size={56} style={{ margin: "0 auto 1.5rem", color: "rgb(248 113 113)" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "white", marginBottom: "0.75rem" }}>
            {t("couldnt_recognize_food")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "2rem", fontSize: "1rem" }}>
            {t("try_again_or_manual")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              onClick={() => {
                setError(null);
                setAnalyzing(true);
                analyzePhoto();
              }}
              style={{
                padding: "1rem",
                borderRadius: "1rem",
                background: "linear-gradient(to right, rgb(16 185 129), rgb(5 150 105))",
                color: "white",
                fontWeight: "600",
                fontSize: "1rem",
                cursor: "pointer",
                border: "none"
              }}
            >
              {t("retry_photo")}
            </button>
            <button
              onClick={() => navigate(createPageUrl("AddMeal"))}
              style={{
                padding: "1rem",
                borderRadius: "1rem",
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                fontWeight: "600",
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              {t("add_manually")}
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: "1rem",
                borderRadius: "1rem",
                backgroundColor: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.6)",
                fontWeight: "500",
                fontSize: "0.875rem",
                cursor: "pointer"
              }}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RESULT - USER CONFIRMATION SCREEN
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 50, backgroundColor: "rgba(0,0,0,0.5)", overflowY: "auto" }}>
      <div style={{ minHeight: "100vh", backgroundColor: "rgb(15 23 42)", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10, backgroundColor: "rgb(15 23 42)" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "white" }}>
              {t("meal_analysis")}
            </h2>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: "0.25rem" }}>
              {t("review_and_confirm")}
            </p>
          </div>
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

          {/* Detected Foods Summary */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ 
              backgroundColor: "rgba(16, 185, 129, 0.1)", 
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "1rem",
              padding: "1rem",
              marginBottom: "1rem"
            }}>
              <p style={{ fontSize: "0.75rem", color: "rgba(16, 185, 129, 1)", fontWeight: "600", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                ✓ {t("detected_items")}
              </p>
              <p style={{ color: "white", fontSize: "0.875rem", fontWeight: "500" }}>
                {items.length > 0 ? items.map(i => i.name).join(", ") : t("food_detected")}
              </p>
            </div>
            
            {/* Detailed Items */}
            {items.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "140px", overflowY: "auto" }}>
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "0.75rem",
                      padding: "0.75rem"
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ color: "white", fontWeight: "600", fontSize: "0.875rem" }}>
                        {item.name}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>
                        ~{item.portion || t("estimated")}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ color: "rgb(16 185 129)", fontWeight: "bold", fontSize: "1.125rem" }}>
                        ~{item.calories}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>
                        {t("cal")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Calories - PROMINENT */}
          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "block", fontSize: "0.875rem", color: "rgba(255,255,255,0.7)", fontWeight: "600", marginBottom: "0.75rem" }}>
              {t("total_calories")}
            </label>
            <div style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "1rem",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <input
                type="number"
                value={editValues.calories}
                onChange={(e) => setEditValues({ ...editValues, calories: parseFloat(e.target.value) || 0 })}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  textAlign: "center",
                  outline: "none"
                }}
              />
              <span style={{ fontSize: "1.25rem", color: "rgba(255,255,255,0.6)", fontWeight: "600", marginLeft: "0.5rem" }}>
                kcal
              </span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: "0.5rem" }}>
              {t("tap_to_edit")}
            </p>
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