import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import FoodRating from "@/components/ui/FoodRating";
import MovementToggle from "@/components/ui/MovementToggle";
import CheckInButton from "@/components/ui/CheckInButton";
import StepsCounter from "@/components/home/StepsCounter";
import WeightTracker from "@/components/home/WeightTracker";
import { useTranslation } from "@/components/TranslationProvider";

export default function QuickCheckIn({ onComplete, todayCheckIn, profile, yesterdayCheckIn, showFireReward }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(todayCheckIn ? "done" : "main");
  const [foodRating, setFoodRating] = useState(todayCheckIn?.food_rating || null);
  const [movedToday, setMovedToday] = useState(todayCheckIn?.moved_today ?? null);
  const [steps, setSteps] = useState(todayCheckIn?.steps || 0);
  const [weight, setWeight] = useState(todayCheckIn?.weight || null);
  const [photoUrl, setPhotoUrl] = useState(todayCheckIn?.food_photo_url || null);
  const [estimatedCal, setEstimatedCal] = useState(todayCheckIn?.estimated_calories || null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
      setUploading(false);
      
      setAnalyzing(true);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: "Analyze this food image and estimate the approximate total calories. Be brief and provide only the estimated calorie number. If you cannot identify food, respond with 0.",
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            calories: { type: "number", description: "Estimated total calories" },
            food_items: { type: "string", description: "Brief description of food" }
          }
        }
      });
      setEstimatedCal(result.calories || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    
    const checkInData = {
      date: today,
      food_rating: foodRating,
      moved_today: movedToday,
      steps: steps || 0,
      weight: weight,
      food_photo_url: photoUrl,
      estimated_calories: estimatedCal,
      completed: true
    };

    await onComplete(checkInData);
    setStep("reward");
    setTimeout(() => setStep("done"), 2000);
    setSaving(false);
  };

  const canSubmit = foodRating !== null || movedToday !== null;

  // Fire Reward Animation
  if (step === "reward" && showFireReward) {
    return (
      <motion.div 
        className="relative overflow-hidden rounded-3xl p-12 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 shadow-2xl flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          boxShadow: [
            "0 0 0 0 rgba(251, 146, 60, 0.7)",
            "0 0 0 40px rgba(251, 146, 60, 0)",
            "0 0 0 0 rgba(251, 146, 60, 0)"
          ]
        }}
        exit={{ opacity: 0, scale: 1.2 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: [0, 1.4, 1.2, 1], 
            rotate: [0, 20, -20, 0],
            filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
          }}
          transition={{ duration: 0.8, ease: "backOut" }}
          className="text-8xl mb-4"
        >
          🔥
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-black text-white"
        >
          +1 FIRE
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/80 font-medium mt-2"
        >
          Streak maintained!
        </motion.p>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.7, type: "spring", bounce: 0.5 }}
          className="mt-4 bg-white/20 rounded-full px-4 py-2"
        >
          <p className="text-sm text-white font-bold">🎯 Ranking updated!</p>
        </motion.div>
      </motion.div>
    );
  }

  if (step === "done" || todayCheckIn) {
    return (
      <motion.div 
        className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-2xl"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", bounce: 0.4 }}
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-300/30 rounded-full blur-2xl" />
        
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <motion.div 
            className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <Sparkles className="text-white" size={28} />
          </motion.div>
          <div>
            <h3 className="font-bold text-xl text-white">{t("checkin_completed")}</h3>
            <p className="text-emerald-100 text-sm font-medium">{t("keep_it_up")}</p>
          </div>
        </div>
        
        <div className="space-y-2 relative z-10">
          {(todayCheckIn?.food_rating || foodRating) && (
            <div className="flex items-center gap-2 text-sm bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-white">
              <span className="font-medium">Food:</span>
              <span className="font-bold capitalize">
                {(todayCheckIn?.food_rating || foodRating) === "great" ? t("great") + " ✓" : 
                 (todayCheckIn?.food_rating || foodRating) === "ok" ? t("ok") : t("poor")}
              </span>
            </div>
          )}
          
          {(todayCheckIn?.estimated_calories || estimatedCal) && (
            <div className="text-sm bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-white font-medium">
              Estimated calories: ~{todayCheckIn?.estimated_calories || estimatedCal} kcal
            </div>
          )}
          
          {(todayCheckIn?.steps || steps > 0) && (
            <div className="text-sm bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-white font-medium">
              Steps: {(todayCheckIn?.steps || steps).toLocaleString()} 🚶
            </div>
          )}
          
          {(todayCheckIn?.weight || weight) && (
            <div className="text-sm bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-white font-medium">
              Weight: {(todayCheckIn?.weight || weight).toFixed(1)} kg
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="relative overflow-hidden rounded-3xl p-6 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-teal-400/30 to-emerald-400/30 rounded-full blur-2xl" />
      <h3 className="font-bold text-2xl text-white mb-6 relative z-10">{t("how_was_today")}</h3>
      
      <div className="space-y-6 relative z-10">
        {/* Food Rating */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">
            {t("how_did_you_eat")}
          </label>
          <FoodRating value={foodRating} onChange={setFoodRating} />
        </div>

        {/* Photo Option */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">
            {t("food_photo_optional")}
          </label>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
          />
          
          {photoUrl ? (
            <div className="relative">
              <img 
                src={photoUrl} 
                alt="Comida" 
                className="w-full h-40 object-cover rounded-2xl"
              />
              <button
                onClick={() => {
                  setPhotoUrl(null);
                  setEstimatedCal(null);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-white" />
              </button>
              {analyzing ? (
                <div className="absolute bottom-2 left-2 bg-white/90 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-teal-500" />
                  <span className="text-sm">{t("analyzing")}</span>
                </div>
              ) : estimatedCal !== null && (
                <div className="absolute bottom-2 left-2 bg-white/90 rounded-xl px-3 py-2">
                  <span className="text-sm font-medium">~{estimatedCal} kcal</span>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-300 hover:bg-teal-50/50"
            >
              {uploading ? (
                <Loader2 size={20} className="animate-spin mr-2" />
              ) : (
                <Camera size={20} className="mr-2 text-teal-500" />
              )}
              <span className="text-slate-600">
                {uploading ? "Uploading..." : "Take photo"}
              </span>
            </Button>
          )}
        </div>

        {/* Movement */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">
            {t("did_you_move")}
          </label>
          <MovementToggle value={movedToday} onChange={setMovedToday} />
        </div>

        {/* Steps Counter */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">
            {t("steps_optional")}
          </label>
          <StepsCounter 
            steps={steps} 
            goal={profile?.steps_goal || 8000}
            showInput
            onChange={setSteps}
          />
        </div>

        {/* Weight Tracker */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">
            {t("weight_today_optional")}
          </label>
          <WeightTracker 
            currentWeight={weight}
            previousWeight={yesterdayCheckIn?.weight}
            startingWeight={profile?.starting_weight}
            showInput
            onChange={setWeight}
          />
        </div>

        {/* Submit */}
        <CheckInButton 
          completed={false} 
          onClick={handleSubmit} 
          loading={saving}
        />
        
        {!canSubmit && (
          <p className="text-center text-sm text-teal-200 font-medium">
            {t("select_at_least_one")}
          </p>
        )}
      </div>
    </motion.div>
  );
}