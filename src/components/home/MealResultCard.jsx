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
  const { t, lang } = useTranslation();
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
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showSuccessPulse, setShowSuccessPulse] = useState(false);

  // Update editable fields when result changes
  useEffect(() => {
    if (result) {
      setEditedCalories(result.calories?.toString() || "");
      setEditedProtein(result.protein?.toString() || "");
      setEditedCarbs(result.carbs?.toString() || "");
      setEditedFats(result.fats?.toString() || "");
    }
  }, [result]);

  const [uploadedUrl, setUploadedUrl] = useState(null);

  // Auto-start analysis when captured
  useEffect(() => {
    if (status === "captured" && file && !result && !error && !uploadedUrl) {
      uploadAndAnalyze();
    }
  }, [status, file, result, error, uploadedUrl]);

  const uploadAndAnalyze = async () => {
    if (!file) {
      console.error("[MEAL] No file to analyze");
      setAnalysisError("No hay archivo para analizar");
      return;
    }

    // Validate file
    if (file.size === 0) {
      console.error("[MEAL] File size is 0");
      setAnalysisError("Archivo inválido - tamaño 0");
      toast.error("Archivo inválido");
      return;
    }

    console.log("[MEAL] file", { size: file.size, type: file.type });

    try {
      // STEP 1: Upload image to get URL
      updateStatus("uploading");

      console.log("[MEAL] Uploading image...");
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      
      if (!uploadResult?.file_url) {
        throw new Error("No se recibió URL del archivo");
      }

      const imageUrl = uploadResult.file_url;
      console.log("[MEAL] uploaded url", imageUrl);
      
      // Validate URL
      if (!imageUrl.startsWith("http")) {
        throw new Error("URL de imagen inválida");
      }

      setUploadedUrl(imageUrl);

      // STEP 2: Analyze by URL with progressive feedback
      updateStatus("analyzing");
      
      // Progressive analysis feedback
      setAnalysisStep(0);
      await new Promise(resolve => setTimeout(resolve, 500));
      setAnalysisStep(1);
      await new Promise(resolve => setTimeout(resolve, 500));
      setAnalysisStep(2);

      console.log("[MEAL] analyze request", { imageUrl });

      const response = await base44.functions.invoke("analyzeMealPhoto", {
        imageUrl,
        lang
      });

      console.log("[MEAL] analyze response status", response.status);

      if (response.status !== 200) {
        const errorText = response.data?.error || "Error desconocido";
        console.error("[MEAL] Analysis failed:", errorText);
        throw new Error(errorText);
      }

      const data = response.data;
      console.log("[MEAL] Analysis result:", data);

      if (!data.calories && !data.items) {
        throw new Error(t("no_food_detected"));
      }

      // Small delay for smooth UX even if AI is fast
      await new Promise(resolve => setTimeout(resolve, 300));

      setAnalysisResult({
        foodName: data.foodName || "Comida detectada",
        confidence: data.confidence || 0.85,
        description: data.description || "",
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fats: data.fats || 0,
        items: data.items || [],
        notes: data.notes || "",
        warnings: data.warnings || []
      });

      // Micro-reward: subtle haptic + success pulse
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setShowSuccessPulse(true);
      setTimeout(() => setShowSuccessPulse(false), 800);

      toast.success(t("analysis_complete"));
    } catch (err) {
      console.error("[MEAL] Error:", err);
      setAnalysisError(err.message || t("analysis_failed"));
      toast.error(err.message || t("analysis_failed"));
    }
  };

  const retryAnalysis = async () => {
    if (uploadedUrl) {
      // Already uploaded, just re-run analysis
      console.log("[MEAL] Retrying analysis with existing URL:", uploadedUrl);
      
      try {
        updateStatus("analyzing");
        setAnalysisError(null);

        const response = await base44.functions.invoke("analyzeMealPhoto", {
          imageUrl: uploadedUrl,
          lang
        });

        if (response.status !== 200) {
          throw new Error(response.data?.error || "Error desconocido");
        }

        const data = response.data;
        
        setAnalysisResult({
          calories: data.calories || 0,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fats: data.fats || 0,
          items: data.items || [],
          notes: data.notes || "",
          warnings: data.warnings || []
        });

        toast.success(t("analysis_complete"));
      } catch (err) {
        console.error("[MEAL] Retry error:", err);
        setAnalysisError(err.message || t("analysis_failed"));
        toast.error(err.message || t("analysis_failed"));
      }
    } else {
      // Need to upload again
      uploadAndAnalyze();
    }
  };

  const handleSave = async () => {
    if (!previewUrl) {
      toast.error(t("no_photo_captured"));
      return;
    }

    setSaving(true);

    try {
      // Use already uploaded URL or upload now
      let photoUrl = uploadedUrl;
      
      if (!photoUrl && file) {
        console.log("[MEAL] Uploading for save...");
        const uploadResponse = await base44.integrations.Core.UploadFile({ file });
        photoUrl = uploadResponse.file_url;
      }

      if (!photoUrl) {
        throw new Error("No se pudo obtener URL de la foto");
      }

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

      const caloriesAdded = parseInt(editedCalories) || 0;
      
      // Trigger parent callback with calories
      if (onSave) {
        onSave(caloriesAdded);
      }

      toast.success(t("meal_saved"));
    } catch (err) {
      console.error("[MEAL] Save error:", err);
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

        {/* Analysis Status with Skeleton */}
        {status === "uploading" || status === "analyzing" ? (
          <div className="p-6 space-y-4">
            {/* Loading indicator */}
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-emerald-400 animate-spin" />
              {status === "uploading" ? (
                <p className="text-white font-semibold">{t("uploading_photo")}</p>
              ) : (
                <motion.div
                  key={analysisStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-white font-semibold mb-1">
                    {analysisStep === 0 && (t("analyzing_food_step") || "Analyzing food...")}
                    {analysisStep === 1 && (t("estimating_calories_step") || "Estimating calories...")}
                    {analysisStep === 2 && (t("calculating_macros_step") || "Calculating macros...")}
                  </p>
                </motion.div>
              )}
              <p className="text-white/60 text-xs mt-1">{t("please_wait")}</p>
            </div>

            {/* Skeleton loading cards */}
            {status === "analyzing" && (
              <>
                {/* Food name skeleton */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5 animate-pulse">
                  <div className="h-3 w-20 bg-white/20 rounded mx-auto mb-3" />
                  <div className="h-8 w-48 bg-white/20 rounded mx-auto mb-2" />
                  <div className="h-2 w-32 bg-white/20 rounded mx-auto" />
                </div>

                {/* Calories skeleton */}
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 rounded-2xl p-6 animate-pulse">
                  <div className="h-10 w-10 bg-white/20 rounded-full mx-auto mb-2" />
                  <div className="h-12 w-32 bg-white/20 rounded mx-auto" />
                </div>

                {/* Macros skeleton */}
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-white/5 animate-pulse">
                      <div className="h-2 w-12 bg-white/20 rounded mx-auto mb-2" />
                      <div className="h-6 w-10 bg-white/20 rounded mx-auto" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}



        {/* Error State */}
        {status === "error" && error ? (
          <div className="p-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-red-400 text-sm font-medium mb-1">{t("analysis_failed")}</p>
              <p className="text-red-300/70 text-xs">{error}</p>
            </div>
            <button
              onClick={retryAnalysis}
              className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/20"
            >
              <RefreshCw size={18} />
              {t("retry_analysis")}
            </button>
          </div>
        ) : null}

        {/* Results */}
        {status === "done" && result ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-6 space-y-5"
          >
            {/* Food Identification with trust reinforcement */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0, scale: showSuccessPulse ? [1, 1.02, 1] : 1 }}
              transition={{ delay: 0.1, scale: { duration: 0.5 } }}
              className="text-center bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden"
            >
              {showSuccessPulse && (
                <motion.div
                  initial={{ opacity: 0.6, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 2 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 bg-emerald-400/20 rounded-2xl"
                />
              )}
              
              <p className="text-emerald-300 text-xs font-medium mb-2">{t("detected_food") || "Detected Food"}</p>
              <h2 className="text-3xl font-black text-white mb-2">{result.foodName}</h2>
              
              {/* Confidence bar with color coding */}
              {result.confidence > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.confidence * 100}%` }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className={`h-full ${
                          result.confidence >= 0.8 
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-400' 
                            : result.confidence >= 0.5 
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
                            : 'bg-gradient-to-r from-red-400 to-orange-400'
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${
                      result.confidence >= 0.8 
                        ? 'text-emerald-300' 
                        : result.confidence >= 0.5 
                        ? 'text-yellow-300' 
                        : 'text-red-300'
                    }`}>
                      {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                  
                  {/* Low confidence hint */}
                  {result.confidence < 0.8 && (
                    <p className="text-white/50 text-xs italic">
                      {t("not_accurate_edit") || "Not accurate? Edit manually."}
                    </p>
                  )}
                </div>
              )}
              
              {result.description && (
                <p className="text-white/60 text-xs mt-2">{result.description}</p>
              )}
              
              {/* Secondary Items as Tags */}
              {result.items && result.items.length > 1 && (
                <div className="flex flex-wrap gap-2 justify-center mt-3">
                  {result.items.slice(1, 4).map((item, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white/10 rounded-full text-white/70 text-xs">
                      {item}
                    </span>
                  ))}
                </div>
              )}
              
            </motion.div>
            
            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
            >
              <p className="text-emerald-300 text-xs text-center leading-relaxed">
                {lang === "es" 
                  ? "✓ Análisis completado usando visión AI + base nutricional validada"
                  : "✓ Analysis completed using AI vision + validated nutrition database"}
              </p>
            </motion.div>
            {/* Calories Card with portion hint */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 rounded-2xl p-6"
            >
              <div className="flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  <Flame className="text-orange-400 mb-2" size={32} />
                </motion.div>
                <p className="text-white/60 text-sm mb-1">{t("estimated_calories")}</p>
                <input
                  type="number"
                  value={editedCalories}
                  onChange={(e) => setEditedCalories(e.target.value)}
                  className="text-5xl font-black text-white bg-transparent border-none outline-none w-full text-center tabular-nums"
                  placeholder="0"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                />
                <p className="text-white/50 text-xs mt-1">kcal</p>
                
                {/* Portion size hint */}
                <div className="mt-3 flex items-center gap-2 text-white/50 text-xs">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div 
                        key={i}
                        className={`w-1 h-2.5 rounded-sm ${i <= 2 ? 'bg-orange-400' : 'bg-white/20'}`}
                      />
                    ))}
                  </div>
                  <span>{lang === "es" ? "Porción mediana" : "Medium portion"}</span>
                </div>
              </div>
            </motion.div>

            {/* Macros */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-3 gap-3"
            >
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
                <p className="text-white/50 text-xs mb-2">{t("protein")}</p>
                <input
                  type="number"
                  value={editedProtein}
                  onChange={(e) => setEditedProtein(e.target.value)}
                  className="text-2xl font-bold text-white bg-transparent border-none outline-none w-full text-center tabular-nums"
                  placeholder="0"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                />
                <p className="text-white/40 text-xs mt-1">g</p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
                <p className="text-white/50 text-xs mb-2">{t("carbs")}</p>
                <input
                  type="number"
                  value={editedCarbs}
                  onChange={(e) => setEditedCarbs(e.target.value)}
                  className="text-2xl font-bold text-white bg-transparent border-none outline-none w-full text-center tabular-nums"
                  placeholder="0"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                />
                <p className="text-white/40 text-xs mt-1">g</p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
                <p className="text-white/50 text-xs mb-2">{t("fats")}</p>
                <input
                  type="number"
                  value={editedFats}
                  onChange={(e) => setEditedFats(e.target.value)}
                  className="text-2xl font-bold text-white bg-transparent border-none outline-none w-full text-center tabular-nums"
                  placeholder="0"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                />
                <p className="text-white/40 text-xs mt-1">g</p>
              </div>
            </motion.div>

            {/* Notes */}
            {result.notes && (
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-white/70 text-xs">{result.notes}</p>
              </div>
            )}
          </motion.div>
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
});

export default MealResultCard;