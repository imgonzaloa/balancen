import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTranslation } from "@/components/TranslationProvider";
import { UIVersionManager } from "@/components/UIVersionManager";
import SetStatusModal from "@/components/groups/SetStatusModal";
import OwnerRoleChecker from "@/components/OwnerRoleChecker";
import StreakFire from "@/components/ui/StreakFire";
import MealPhotoCapture from "@/components/meal/MealPhotoCapture";
import MealAnalysisResult from "@/components/meal/MealAnalysisResult";
import DailyCalorieDisplay from "@/components/meal/DailyCalorieDisplay";
import CalorieTracker from "@/components/nutrition/CalorieTracker";
import AIPremiumUpsell from "@/components/ai/AIPremiumUpsell";

export default function Home() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const today = new Date().toISOString().split("T")[0];

  const { data: todayMeals = [] } = useQuery({
    queryKey: ["meals", today, user?.email],
    queryFn: async () => {
      return base44.entities.MealLog.filter(
        { created_by: user?.email, date: today },
        "-meal_time"
      );
    },
    enabled: !!user?.email,
    staleTime: 30000,
  });

  // Redirect to onboarding if no profile
  if (!profileLoading && !profile && user) {
    window.location.href = createPageUrl("Onboarding");
    return null;
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("good_morning");
    if (hour < 19) return t("good_afternoon");
    return t("good_evening");
  };

  // Handle meal photo submission to AI
  const handleMealPhotoSubmit = async (photoBase64) => {
    if (!photoBase64) return;
    
    setIsAnalyzing(true);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this food photo and provide detailed calorie and nutrition estimates. Return JSON with:
{
  "detected_items": ["item1", "item2"],
  "estimated_calories": number (total kcal),
  "estimated_protein": number (grams),
  "estimated_carbs": number (grams),
  "estimated_fats": number (grams),
  "health_score": 1-5 (1=unhealthy, 5=very healthy)
}
Be realistic and conservative with calorie estimates.`,
        file_urls: [photoBase64],
        response_json_schema: {
          type: "object",
          properties: {
            detected_items: { type: "array", items: { type: "string" } },
            estimated_calories: { type: "number" },
            estimated_protein: { type: "number" },
            estimated_carbs: { type: "number" },
            estimated_fats: { type: "number" },
            health_score: { type: "number" }
          },
          required: ["detected_items", "estimated_calories", "estimated_protein", "estimated_carbs", "estimated_fats", "health_score"]
        }
      });
      
      setAnalysisResult(result);
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to analyze meal. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmMeal = async (mealData) => {
    try {
      await base44.entities.MealLog.create({
        date: today,
        meal_time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        meal_type: "logged",
        estimated_calories: Math.round(mealData.estimated_calories),
        estimated_protein: Math.round(mealData.estimated_protein),
        estimated_carbs: Math.round(mealData.estimated_carbs),
        estimated_fats: Math.round(mealData.estimated_fats)
      });

      toast.success("🍽️ Meal logged!");
      queryClient.invalidateQueries({ queryKey: ["meals", today] });
      setAnalysisResult(null);
    } catch (error) {
      console.error("Error logging meal:", error);
      toast.error("Failed to log meal");
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center">
        <motion.div
          className="text-white text-lg"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {t('loading')}...
        </motion.div>
      </div>
    );
  }

  const consumedCalories = todayMeals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0);
  const goalCalories = profile?.calories_goal || 2000;
  const remainingCalories = Math.max(0, goalCalories - consumedCalories);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
      <OwnerRoleChecker user={user} profile={profile} />
      <UIVersionManager user={user} profile={profile} />
      
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10">
        {/* Header */}
        <motion.div 
          className="flex justify-between items-start mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <p className="text-teal-200 text-sm font-medium mb-1">{greeting()}</p>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-teal-100 bg-clip-text text-transparent">
              {profile?.display_name || user?.full_name?.split(" ")[0] || "User"}
            </h1>
          </div>
          <StreakFire streak={profile?.current_streak || 0} />
        </motion.div>

        {/* Daily Calories Display */}
        <DailyCalorieDisplay 
          consumed={consumedCalories}
          remaining={remainingCalories}
          goal={goalCalories}
        />

        {/* Analysis Result Card */}
        {analysisResult && (
          <MealAnalysisResult
            result={analysisResult}
            onConfirm={handleConfirmMeal}
            onCancel={() => setAnalysisResult(null)}
            isLoading={isAnalyzing}
          />
        )}

        {/* Main CTA - Add Meal Button */}
        {!analysisResult && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MealPhotoCapture 
              onPhotoSelect={handleMealPhotoSubmit}
              isLoading={isAnalyzing}
            />
          </motion.div>
        )}

        {/* Status */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <SetStatusModal
            currentStatus={profile?.status_text}
            profile={profile}
            onUpdate={() => {
              queryClient.invalidateQueries(["profile"]);
            }}
            trigger={
              <button className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">✨</div>
                  <div className="flex-1">
                    <p className="text-xs text-white/60 mb-1">Status</p>
                    {profile?.status_text ? (
                      <p className="text-white font-medium">{profile.status_text}</p>
                    ) : (
                      <p className="text-white/40">Set daily status</p>
                    )}
                  </div>
                </div>
              </button>
            }
          />
        </motion.div>

        {/* Meal History */}
        {todayMeals.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-white font-semibold mb-3">Today's Meals</h3>
            <div className="space-y-2">
              {todayMeals.map((meal, idx) => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/10 border border-white/20 rounded-xl p-3 flex justify-between items-center"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{meal.meal_time}</p>
                  </div>
                  <p className="text-orange-300 font-bold">{meal.estimated_calories} kcal</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Premium Upsell */}
        {!profile?.is_premium && profile?.role !== "owner" && todayMeals.length >= 2 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <AIPremiumUpsell />
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative overflow-hidden rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-teal-400/30 to-emerald-400/30 rounded-full blur-2xl" />
            <p className="text-xs text-teal-100 mb-2 font-medium relative z-10">Meals Logged</p>
            <p className="text-3xl font-bold text-white relative z-10">{todayMeals.length}</p>
          </div>
          <div className="relative overflow-hidden rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-amber-400/30 to-orange-400/30 rounded-full blur-2xl" />
            <p className="text-xs text-amber-100 mb-2 font-medium relative z-10">Current Streak</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent relative z-10">{profile?.current_streak || 0} 🔥</p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Link
            to={createPageUrl("Groups")}
            className="rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 flex items-center gap-3 hover:bg-white/20 transition-all shadow-lg"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <Users size={18} className="text-white" />
            </div>
            <span className="font-semibold text-white text-sm">Groups</span>
          </Link>

          <Link
            to={createPageUrl("Friends")}
            className="rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 flex items-center gap-3 hover:bg-white/20 transition-all shadow-lg"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <Users size={18} className="text-white" />
            </div>
            <span className="font-semibold text-white text-sm">Friends</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}