import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Target, Lightbulb, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AIHealthInsights({ profile, recentCheckIns }) {
  const [dismissed, setDismissed] = useState([]);
  const queryClient = useQueryClient();

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ["aiRecommendations"],
    queryFn: async () => {
      // Get existing recommendations
      const existing = await base44.entities.AIRecommendation.filter(
        { user_email: profile.created_by, dismissed: false },
        "-created_date",
        3
      );
      
      // If we have recent ones, return them
      const recentRecs = existing.filter(r => {
        const age = Date.now() - new Date(r.created_date).getTime();
        return age < 24 * 60 * 60 * 1000; // Less than 24 hours old
      });
      
      if (recentRecs.length > 0) return recentRecs;

      // Generate new recommendations using AI
      const last7Days = recentCheckIns.slice(0, 7);
      const avgSteps = last7Days.reduce((sum, c) => sum + (c.steps || 0), 0) / last7Days.length;
      const avgCalories = last7Days.reduce((sum, c) => sum + (c.estimated_calories || 0), 0) / last7Days.length;
      const checkInRate = last7Days.filter(c => c.completed).length;
      
      const prompt = `You are a health and wellness coach. Analyze this user's data and provide 2-3 SHORT, actionable recommendations:

User Profile:
- Goal: ${profile.main_goal}
- Intensity: ${profile.intensity_level}
- Current streak: ${profile.current_streak} days
- Check-in rate (last 7 days): ${checkInRate}/7
- Average steps: ${Math.round(avgSteps)} (goal: ${profile.steps_goal || 8000})
- Average calories: ${Math.round(avgCalories)} (goal: ${profile.calories_goal || 'not set'})

Provide specific, encouraging advice. Each recommendation should be 1-2 sentences max. Focus on what they're doing well and small improvements.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  type: { type: "string", enum: ["motivation", "nutrition", "activity", "recovery"] }
                }
              }
            }
          }
        }
      });

      // Save recommendations to database
      const saved = await Promise.all(
        result.recommendations.map(rec =>
          base44.entities.AIRecommendation.create({
            user_email: profile.created_by,
            recommendation_text: rec.text,
            type: rec.type,
            priority: "medium",
          })
        )
      );

      return saved;
    },
    enabled: !!profile && recentCheckIns.length > 0 && profile.ai_recommendations_enabled !== false,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const dismissMutation = useMutation({
    mutationFn: (recId) => base44.entities.AIRecommendation.update(recId, { dismissed: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(["aiRecommendations"]);
    },
  });

  const visibleRecs = recommendations.filter(r => !dismissed.includes(r.id));

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 flex items-center justify-center">
        <Loader2 size={24} className="text-white animate-spin" />
      </div>
    );
  }

  if (visibleRecs.length === 0) return null;

  const typeIcons = {
    motivation: TrendingUp,
    nutrition: Target,
    activity: Sparkles,
    recovery: Lightbulb,
  };

  const typeColors = {
    motivation: "from-purple-400/30 to-pink-400/30",
    nutrition: "from-green-400/30 to-emerald-400/30",
    activity: "from-orange-400/30 to-amber-400/30",
    recovery: "from-blue-400/30 to-cyan-400/30",
  };

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={18} className="text-teal-300" />
        <h3 className="text-white font-semibold">AI Insights</h3>
      </div>

      {visibleRecs.map((rec, index) => {
        const Icon = typeIcons[rec.type] || Lightbulb;
        const colorClass = typeColors[rec.type] || typeColors.recovery;

        return (
          <motion.div
            key={rec.id}
            className="relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${colorClass} rounded-full blur-2xl`} />
            
            <div className="relative z-10 flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-white" />
              </div>
              
              <div className="flex-1">
                <p className="text-white text-sm leading-relaxed">{rec.recommendation_text}</p>
                <p className="text-teal-200 text-xs mt-1 capitalize">{rec.type}</p>
              </div>

              <button
                onClick={() => {
                  setDismissed([...dismissed, rec.id]);
                  dismissMutation.mutate(rec.id);
                }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <X size={16} className="text-white/60" />
              </button>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}