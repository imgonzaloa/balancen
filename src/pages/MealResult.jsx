import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { X, Loader2, AlertCircle, Check, Plus, Minus, ChevronDown, ChevronUp, RefreshCw, Edit3, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { useMeal } from "@/components/MealContext";
import { useMealsStore } from "@/components/MealsStore";
import { useAppState } from "@/components/AppStateContext";
import { createPageUrl } from "@/utils";
import SharePrompt from "@/components/meal/SharePrompt";

const FREE_DAILY_LIMIT = 5;

// Progress steps for analysis loader
const ANALYSIS_STEPS = [
  { key: "uploading_photo", progress: 15 },
  { key: "reading_photo", progress: 35 },
  { key: "identifying_foods", progress: 60 },
  { key: "calculating_nutrition", progress: 85 },
  { key: "finalizing", progress: 98 },
];

function AnalysisLoader({ imagePreview, stepIndex }) {
  const { t } = useTranslation();
  const step = ANALYSIS_STEPS[Math.min(stepIndex, ANALYSIS_STEPS.length - 1)];
  const progress = step?.progress ?? 0;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Blurred photo background */}
      {imagePreview && (
        <img
          src={imagePreview}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          style={{ filter: "blur(8px)", transform: "scale(1.1)" }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8">
        {/* Spinner ring */}
        <div className="relative w-24 h-24 mb-8">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="42" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
            <circle
              cx="48" cy="48" r="42"
              stroke="url(#loaderGrad)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="264"
              strokeDashoffset={264 - (progress / 100) * 264}
              style={{ transition: "stroke-dashoffset 0.7s ease" }}
            />
            <defs>
              <linearGradient id="loaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-black text-xl">{progress}%</span>
          </div>
        </div>

        <h2 className="text-white text-2xl font-black mb-2 text-center">
          {t("analyzing_meal")}
        </h2>
        <p className="text-white/70 text-base text-center mb-8">
          {t(step?.key || "please_wait")}
        </p>

        {/* Step dots */}
        <div className="flex gap-2">
          {ANALYSIS_STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-500"
              style={{
                width: i <= stepIndex ? "20px" : "8px",
                height: "8px",
                backgroundColor: i <= stepIndex ? "rgb(20 184 166)" : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FoodItem({ item, onUpdate, onRemove }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const macroFields = [
    { label: `${t('calories')} (kcal)`, field: "calories", color: "text-teal-300" },
    { label: `${t('protein')} (g)`, field: "protein", color: "text-blue-400" },
    { label: `${t('carbs')} (g)`, field: "carbs", color: "text-amber-400" },
    { label: `${t('fats')} (g)`, field: "fats", color: "text-pink-400" },
  ];

  return (
    <div className="bg-white/8 rounded-2xl border border-white/10 overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer active:bg-white/5"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">{item.name}</p>
          {item.portion && (
            <p className="text-white/50 text-xs mt-0.5">{item.portion}</p>
          )}
        </div>
        <div className="text-right flex items-center gap-2">
          <div>
            <p className="text-teal-300 font-black text-base">{item.calories}</p>
            <p className="text-white/40 text-[10px] uppercase font-bold">kcal</p>
          </div>
          {expanded ? (
            <ChevronUp size={16} className="text-white/40" />
          ) : (
            <ChevronDown size={16} className="text-white/40" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-white/10 pt-2">
              {macroFields.map(({ label, field, color }) => (
                <div key={field} className="flex items-center justify-between">
                  <span className="text-white/60 text-xs">{label}</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/60 active:scale-90"
                      onClick={() => onUpdate(item.id, field, Math.max(0, (item[field] || 0) - 5))}
                    >
                      <Minus size={10} />
                    </button>
                    <span className={`${color} font-black text-sm w-10 text-center`}>
                      {item[field] || 0}
                    </span>
                    <button
                      className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/60 active:scale-90"
                      onClick={() => onUpdate(item.id, field, (item[field] || 0) + 5)}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => onRemove(item.id)}
                className="w-full mt-1 py-1.5 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30 active:scale-95"
              >
                {t('remove_item') || 'Remove'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ManualEntryForm({ imagePreview, onSave, onCancel }) {
  const { t } = useTranslation();
  const [values, setValues] = useState({ calories: "", protein: "", carbs: "", fats: "" });
  const [mealName, setMealName] = useState("");

  const set = (field, val) => setValues(v => ({ ...v, [field]: val }));

  const fields = [
    { label: `${t('calories')} (kcal)`, field: "calories", color: "text-teal-300", required: true },
    { label: `${t('protein')} (g)`, field: "protein", color: "text-blue-400" },
    { label: `${t('carbs')} (g)`, field: "carbs", color: "text-amber-400" },
    { label: `${t('fats')} (g)`, field: "fats", color: "text-pink-400" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {imagePreview && (
        <img src={imagePreview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" style={{ filter: "blur(6px)" }} />
      )}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4" style={{ paddingTop: 'env(safe-area-inset-top, 48px)' }}>
          <button onClick={onCancel} className="p-2 rounded-xl bg-white/10 text-white active:scale-90">
            <X size={20} />
          </button>
          <h2 className="text-white font-black text-lg">{t('add_manually')}</h2>
          <div className="w-9" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-4">
          {imagePreview && (
            <div className="w-full h-40 rounded-2xl overflow-hidden border border-white/10">
              <img src={imagePreview} alt="Meal" className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <label className="text-white/60 text-xs font-bold uppercase tracking-wide mb-1.5 block">
              {t('meal_name_optional') || `${t('meal')} (${t('optional') || 'optional'})`}
            </label>
            <input
              value={mealName}
              onChange={e => setMealName(e.target.value)}
              placeholder="e.g. Chicken salad..."
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-teal-500/60"
            />
          </div>

          {fields.map(({ label, field, color, required }) => (
            <div key={field}>
              <label className="text-white/60 text-xs font-bold uppercase tracking-wide mb-1.5 block">
                {label}{required && <span className="text-red-400 ml-1">*</span>}
              </label>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={values[field]}
                onChange={e => set(field, e.target.value)}
                placeholder="0"
                className={`w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 ${color} placeholder-white/30 text-sm font-black focus:outline-none focus:border-teal-500/60`}
              />
            </div>
          ))}
        </div>

        <div className="px-5 pt-4 border-t border-white/10" style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}>
          <button
            onClick={() => {
              if (!values.calories || parseInt(values.calories) === 0) {
                toast.error(t('enter_calories') || "Please enter calories");
                return;
              }
              onSave({
                items: mealName ? [{ name: mealName, calories: parseInt(values.calories) || 0, protein: parseInt(values.protein) || 0, carbs: parseInt(values.carbs) || 0, fats: parseInt(values.fats) || 0 }] : [],
                totals: {
                  calories: parseInt(values.calories) || 0,
                  protein: parseInt(values.protein) || 0,
                  carbs: parseInt(values.carbs) || 0,
                  fats: parseInt(values.fats) || 0,
                }
              });
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black text-lg shadow-xl shadow-teal-500/30 active:scale-95 flex items-center justify-center gap-2 mb-3"
          >
            <Check size={20} />
            {t('save_meal') || t('confirm_save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MealResult() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const { capturedFile, previewUrl, resetMeal } = useMeal();
  const { addMeal, formatLocalDateKey } = useMealsStore();
  const { profile } = useAppState();

  const [phase, setPhase] = useState("analyzing"); // analyzing | review | saving | error | manual | share
  const [stepIndex, setStepIndex] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [savedTotals, setSavedTotals] = useState(null);
  const [savedPhotoUrl, setSavedPhotoUrl] = useState(null);
  const uploadedUrlRef = useRef(null); // ref so save paths always see latest value
  const [foodItems, setFoodItems] = useState([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [confidence, setConfidence] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const hasRun = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Keep ref in sync with state
  useEffect(() => { uploadedUrlRef.current = uploadedUrl; }, [uploadedUrl]);

  // Set preview from context or stored URL — IMMEDIATELY on mount so we never show blank
  useEffect(() => {
    const stored = sessionStorage.getItem("balancen_last_capture") || localStorage.getItem("meal_last_capture_dataurl");
    const resolvedPreview = previewUrl || stored;
    if (resolvedPreview) {
      setImagePreview(resolvedPreview);
    } else if (!capturedFile) {
      // Only redirect if there is truly nothing
      navigate(createPageUrl("Home"));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Log key events for debug panel
  useEffect(() => {
    console.log("🔬 ANALYZE_START");
  }, []);

  // Run analysis once
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    runAnalysis();
  }, []);

  const advanceStep = (idx) => {
    setStepIndex(idx);
    return new Promise(r => setTimeout(r, 600));
  };

  const runAnalysis = async () => {
    setPhase("analyzing");
    setStepIndex(0);

    // Check daily AI scan limit for free users
    const isPremium = profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator';
    if (!isPremium && profile) {
      try {
        const today = new Date().toISOString().split("T")[0];
        const todayMealLogs = await base44.entities.MealLog.filter({ date: today });
        const aiScans = todayMealLogs.filter(m => m.photo_url);
        if (aiScans.length >= FREE_DAILY_LIMIT) {
          setPhase("limit_reached");
          return;
        }
      } catch (_) {
        // If check fails, allow analysis to proceed
      }
    }

    // Use file from context; fall back to a blob reconstructed from stored dataUrl
    let file = capturedFile;
    if (!file) {
      const stored = sessionStorage.getItem("balancen_last_capture") || localStorage.getItem("meal_last_capture_dataurl");
      if (stored) {
        try {
          const blob = await fetch(stored).then(r => r.blob());
          if (blob.size > 0) file = new File([blob], "meal.jpg", { type: "image/jpeg" });
        } catch (_) {}
      }
    }

    if (!file) {
      setErrorMsg(t('try_again_or_manual') || "No photo available.");
      setPhase("error");
      return;
    }

    try {
      await advanceStep(0); // uploading_photo

      // Always upload first — so we always have a photo_url for manual saves too
      let file_url = uploadedUrlRef.current;
      if (!file_url) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file });
        file_url = uploadResult.file_url;
        setUploadedUrl(file_url);
        uploadedUrlRef.current = file_url;
      }

      await advanceStep(1); // reading_photo
      await advanceStep(2); // identifying_foods

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional nutritionist. Analyze this food photo precisely. Return a JSON with: items (array of each food with name, calories, protein, carbs, fats as numbers, portion as descriptive string), total_calories, total_protein, total_carbs, total_fats (all numbers), health_score (0-100), confidence (0-100 integer). Be accurate and realistic. If you cannot detect any food, set confidence to 0 and items to empty array.`,
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

      await advanceStep(3); // calculating_nutrition
      await advanceStep(4); // finalizing

      const conf = Math.round(analysis.confidence ?? 0);
      const items = (analysis.items || []).map((item, i) => ({
        id: crypto.randomUUID(),
        name: item.name || `Food ${i + 1}`,
        calories: Math.round(item.calories || 0),
        protein: Math.round(item.protein || 0),
        carbs: Math.round(item.carbs || 0),
        fats: Math.round(item.fats || 0),
        portion: item.portion || "",
      }));

      // If confidence is very low or no items, go to manual — photo is already uploaded
      if (conf < 20 && items.length === 0) {
        setConfidence(conf);
        setPhase("error");
        setErrorMsg(t('couldnt_recognize_food') || "Could not identify food in this photo.");
        return;
      }

      setFoodItems(items);
      setTotals({
        calories: Math.round(analysis.total_calories || items.reduce((s, i) => s + i.calories, 0)),
        protein: Math.round(analysis.total_protein || items.reduce((s, i) => s + i.protein, 0)),
        carbs: Math.round(analysis.total_carbs || items.reduce((s, i) => s + i.carbs, 0)),
        fats: Math.round(analysis.total_fats || items.reduce((s, i) => s + i.fats, 0)),
      });
      setConfidence(conf);
      setPhase("review");
      console.log("✅ ANALYZE_OK", { items: items.length, calories: analysis.total_calories, confidence: conf });

      if (navigator.vibrate) navigator.vibrate(40);
    } catch (err) {
      console.error("❌ ANALYZE_FAIL:", err?.message);
      setErrorMsg(t('try_again_or_manual') || "Analysis failed. You can still add this meal manually.");
      setPhase("error");
    }
  };

  const recalcTotals = (items) => {
    setTotals({
      calories: items.reduce((s, i) => s + (i.calories || 0), 0),
      protein: items.reduce((s, i) => s + (i.protein || 0), 0),
      carbs: items.reduce((s, i) => s + (i.carbs || 0), 0),
      fats: items.reduce((s, i) => s + (i.fats || 0), 0),
    });
  };

  const handleItemUpdate = (id, field, value) => {
    const updated = foodItems.map(item =>
      item.id === id ? { ...item, [field]: Math.max(0, Math.round(value)) } : item
    );
    setFoodItems(updated);
    recalcTotals(updated);
  };

  const handleItemRemove = (id) => {
    const updated = foodItems.filter(item => item.id !== id);
    setFoodItems(updated);
    recalcTotals(updated);
  };

  const persistMeal = async ({ items: saveItems, totals: saveTotals, photoUrl }) => {
    const now = new Date();
    const dateKey = formatLocalDateKey(now);
    const hour = now.getHours();
    let mealType = "snack";
    if (hour >= 5 && hour < 11) mealType = "breakfast";
    else if (hour >= 11 && hour < 16) mealType = "lunch";
    else if (hour >= 16 && hour < 22) mealType = "dinner";

    const resolvedPhotoUrl = photoUrl || uploadedUrlRef.current || uploadedUrl || "";

    const meal = {
      id: crypto.randomUUID(),
      dateKey,
      createdAt: now.toISOString(),
      photoUri: resolvedPhotoUrl,
      mealType,
      totals: saveTotals,
      items: saveItems,
      confidence,
    };

    console.log("💾 SAVE_START", { calories: saveTotals.calories, dateKey });

    // 1. Optimistic local save — updates Home/Progress immediately
    addMeal(meal);

    // 2. Backend persist — AWAITED so we know it succeeded
    const meal_time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    try {
      await base44.entities.MealLog.create({
        date: dateKey,
        meal_time,
        photo_url: resolvedPhotoUrl,
        estimated_calories: saveTotals.calories,
        estimated_protein: saveTotals.protein,
        estimated_carbs: saveTotals.carbs,
        estimated_fats: saveTotals.fats,
      });
      console.log("✅ SAVE_OK - MealLog created");
    } catch (err) {
      console.error("❌ SAVE_FAIL - MealLog:", err?.message);
      // Local store already has the meal — still functional
    }

    // 3. Verify local store actually has the meal (flush is debounced 100ms — force-read state)
    // We rely on addMeal() being synchronous in React state, so just log after a tick
    await new Promise(r => setTimeout(r, 150));
    try {
      const storedRaw = localStorage.getItem("balancen.mealsByDate");
      const parsed = JSON.parse(storedRaw || "{}");
      const todayMeals = parsed[dateKey] || [];
      const verifyOk = todayMeals.some(m => m.id === meal.id);
      console.log(verifyOk ? "✅ SAVE_VERIFY_OK" : "⚠️ SAVE_VERIFY_FAIL", {
        todayMealsCount: todayMeals.length,
        TODAY_TOTALS_AFTER_SAVE: todayMeals.reduce((a, m) => a + (m.totals?.calories || 0), 0)
      });
    } catch (_) {
      console.warn("⚠️ SAVE_VERIFY_FAIL - could not read localStorage");
    }

    // Fire-and-forget daily check-in update
    base44.functions.invoke('updateDailyCheckIn', {
      food_photo_url: resolvedPhotoUrl,
      estimated_calories: saveTotals.calories,
      meal_photo_fire_awarded: false,
    }).catch(() => {});

    return meal;
  };

  const handleConfirmSave = async () => {
    if (totals.calories === 0) {
      toast.error(t('enter_calories') || "Please add at least calorie info");
      return;
    }
    setSaving(true);
    try {
      await persistMeal({ items: foodItems, totals, photoUrl: uploadedUrl });
      setSavedTotals(totals);
      setSavedPhotoUrl(uploadedUrlRef.current || uploadedUrl || imagePreview);
      resetMeal();
      setPhase("share");
    } catch (err) {
      console.error("❌ SAVE_FAIL:", err);
      toast.error(t('save_failed') || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = async ({ items: saveItems, totals: saveTotals }) => {
    setSaving(true);
    try {
      let photoUrl = uploadedUrlRef.current || uploadedUrl;
      if (!photoUrl) {
        const fileToUpload = capturedFile || await (async () => {
          const stored = sessionStorage.getItem("balancen_last_capture") || localStorage.getItem("meal_last_capture_dataurl");
          if (!stored) return null;
          const blob = await fetch(stored).then(r => r.blob()).catch(() => null);
          return blob?.size > 0 ? new File([blob], "meal.jpg", { type: "image/jpeg" }) : null;
        })();
        if (fileToUpload) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: fileToUpload });
          photoUrl = file_url;
          setUploadedUrl(file_url);
          uploadedUrlRef.current = file_url;
        }
      }
      await persistMeal({ items: saveItems, totals: saveTotals, photoUrl });
      toast.success(`${t("meal_saved")} • +${saveTotals.calories} kcal`);
      resetMeal();
      navigate(createPageUrl("Home"), { replace: true });
    } catch (err) {
      console.error("❌ SAVE_FAIL (manual):", err);
      toast.error(t('save_failed') || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    resetMeal();
    navigate(createPageUrl("Home"));
  };

  // ─── PHASES ───

  if (phase === "limit_reached") {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {imagePreview && (
          <img src={imagePreview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" style={{ filter: "blur(6px)" }} />
        )}
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between px-5 pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
            <button onClick={handleCancel} className="p-2 rounded-xl bg-white/10 text-white">
              <X size={20} />
            </button>
            <h2 className="text-white font-black text-lg">{t('ai_scan')}</h2>
            <div className="w-9" />
          </div>

          <div className="flex-1 px-5 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-2 shadow-xl shadow-amber-500/30">
              <Crown size={40} className="text-white" />
            </div>
            <h3 className="text-white font-black text-2xl">Daily limit reached</h3>
            <p className="text-white/60 text-sm max-w-xs">
              You've used all {FREE_DAILY_LIMIT} free AI scans for today. Come back tomorrow or upgrade to Premium for unlimited scans.
            </p>
          </div>

          <div className="px-5 pt-4 space-y-3 border-t border-white/10" style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}>
            <button
              onClick={() => navigate(createPageUrl("Premium"))}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-lg flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-amber-500/30"
            >
              <Crown size={20} />
              Upgrade to Premium
            </button>
            <button
              onClick={() => setPhase("manual")}
              className="w-full py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white font-bold flex items-center justify-center gap-2 active:scale-95"
            >
              <Edit3 size={18} />
              {t('add_manually')}
            </button>
            <button onClick={handleCancel} className="w-full py-3 text-white/50 font-semibold text-sm active:opacity-60">
              {t('discard') || 'Discard'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "analyzing") {
    return <AnalysisLoader imagePreview={imagePreview} stepIndex={stepIndex} />;
  }

  if (phase === "manual") {
    return (
      <ManualEntryForm
        imagePreview={imagePreview}
        onSave={handleManualSave}
        onCancel={handleCancel}
      />
    );
  }

  if (phase === "error") {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {imagePreview && (
          <img src={imagePreview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" style={{ filter: "blur(6px)" }} />
        )}
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between px-5 pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
            <button onClick={handleCancel} className="p-2 rounded-xl bg-white/10 text-white">
              <X size={20} />
            </button>
            <h2 className="text-white font-black text-lg">{t('review_meal')}</h2>
            <div className="w-9" />
          </div>

          {/* Photo preserved */}
          {imagePreview && (
            <div className="mx-5 rounded-2xl overflow-hidden border border-white/10 mb-6">
              <img src={imagePreview} alt="Meal" className="w-full h-48 object-cover" />
            </div>
          )}

          <div className="flex-1 px-5 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
              <AlertCircle size={32} className="text-amber-400" />
            </div>
            <h3 className="text-white font-black text-xl text-center">
              {t('couldnt_recognize_food') || "Couldn't identify food"}
            </h3>
            <p className="text-white/60 text-sm text-center max-w-xs">
              {errorMsg || t('try_again_or_manual')}
            </p>
          </div>

          <div className="px-5 pt-4 space-y-3 border-t border-white/10" style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}>
            <button
              onClick={() => setPhase("manual")}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black text-lg flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-teal-500/30"
            >
              <Edit3 size={20} />
              {t('add_manually')}
            </button>
            <button
              onClick={() => { hasRun.current = false; runAnalysis(); }}
              className="w-full py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white font-bold flex items-center justify-center gap-2 active:scale-95"
            >
              <RefreshCw size={18} />
              {t('retry_photo') || 'Try Again'}
            </button>
            <button onClick={handleCancel} className="w-full py-3 text-white/50 font-semibold text-sm active:opacity-60">
              {t('discard') || 'Discard'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── SHARE PHASE ───
  if (phase === "share") {
    return (
      <SharePrompt
        totals={savedTotals}
        photoUrl={savedPhotoUrl}
        user={profile}
        onShare={async () => {
          try {
            await base44.entities.Post.create({
              author_email: profile?.created_by || "",
              author_name: profile?.display_name || "",
              author_avatar: profile?.avatar_url || "",
              content: `Just logged a meal — ${savedTotals?.calories} kcal 🍽️`,
              post_type: "meal",
              image_url: savedPhotoUrl || "",
              meal_data: {
                calories: savedTotals?.calories || 0,
                protein: savedTotals?.protein || 0,
                carbs: savedTotals?.carbs || 0,
                fats: savedTotals?.fats || 0,
              },
            });
            toast.success(lang === 'es' ? '¡Compartido en tu feed!' : lang === 'pt' ? 'Compartilhado no seu feed!' : 'Shared to your feed!');
          } catch (err) {
            console.error("Share failed:", err);
          }
          navigate(createPageUrl("Home"), { replace: true });
        }}
        onSkip={() => navigate(createPageUrl("Home"), { replace: true })}
      />
    );
  }

  // ─── REVIEW SCREEN ───
  const confidenceColor = confidence >= 70 ? "text-emerald-400" : confidence >= 40 ? "text-amber-400" : "text-red-400";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Header */}
      <div
        className="flex-shrink-0 bg-slate-950/95 border-b border-white/10 px-5 flex items-center justify-between"
        style={{ paddingTop: "env(safe-area-inset-top, 48px)", paddingBottom: "12px" }}
      >
        <button onClick={handleCancel} className="p-2 rounded-xl bg-white/10 text-white active:scale-90">
          <X size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-white font-black text-base">{t("review_meal")}</h2>
          <p className={`text-xs font-bold ${confidenceColor}`}>
            {confidence}% {t("confidence")}
          </p>
        </div>
        <div className="w-9" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Photo */}
        {imagePreview && (
          <div className="w-full h-52 relative overflow-hidden">
            <img src={imagePreview} alt="Meal" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950" />
          </div>
        )}

        <div className="px-5 pb-4 space-y-4 -mt-4 relative">
          {/* Totals summary */}
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-white/50 text-xs font-bold uppercase tracking-wide">{t('total_calories')}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-white font-black text-4xl">{totals.calories}</span>
                  <span className="text-white/50 font-bold text-sm">kcal</span>
                </div>
              </div>
              <button
                onClick={() => setPhase("manual")}
                className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white/70 text-xs font-bold flex items-center gap-1.5 active:scale-90"
              >
                <Edit3 size={12} />
                {t('edit_manually') || t('add_manually')}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
              {[
                { labelKey: 'protein', value: totals.protein, color: "text-blue-400" },
                { labelKey: 'carbs', value: totals.carbs, color: "text-amber-400" },
                { labelKey: 'fats', value: totals.fats, color: "text-pink-400" },
              ].map(({ labelKey, value, color }) => (
                <div key={labelKey} className="text-center">
                  <p className={`${color} font-black text-lg`}>{value}g</p>
                  <p className="text-white/40 text-[10px] uppercase font-bold">{t(labelKey)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Low confidence warning */}
          {confidence < 50 && (
            <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 flex items-start gap-3">
              <AlertCircle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-amber-300 text-xs font-medium">
                {t('low_confidence_warning') || 'Low confidence. Please review and adjust values before saving.'}
              </p>
            </div>
          )}

          {/* Food items */}
          {foodItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-black text-sm uppercase tracking-wide">{t('detected_foods') || 'Detected Foods'}</h3>
                <span className="text-white/40 text-xs font-bold">{foodItems.length} {t('items') || 'items'}</span>
              </div>
              {foodItems.map(item => (
                <FoodItem
                  key={item.id}
                  item={item}
                  onUpdate={handleItemUpdate}
                  onRemove={handleItemRemove}
                />
              ))}
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>

      {/* Save bar */}
      <div
        className="flex-shrink-0 px-5 pt-4 border-t border-white/10 bg-slate-950/95 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 24px)" }}
      >
        <button
          onClick={handleConfirmSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black text-lg shadow-xl shadow-teal-500/30 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 transition-transform"
        >
          {saving ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <>
              <Check size={22} />
              {t("confirm_save")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}