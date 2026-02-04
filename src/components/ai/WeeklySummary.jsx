import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Calendar, TrendingUp, Flame, Award, Target, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WeeklySummary({ profile, checkIns }) {
  const { data: summary, isLoading, refetch } = useQuery({
    queryKey: ["weeklySummary", profile?.id],
    queryFn: async () => {
      const last7Days = checkIns.slice(0, 7);
      
      const stats = {
        checkInCount: last7Days.filter(c => c.completed).length,
        avgSteps: Math.round(last7Days.reduce((sum, c) => sum + (c.steps || 0), 0) / 7),
        avgCalories: Math.round(last7Days.reduce((sum, c) => sum + (c.estimated_calories || 0), 0) / 7),
        avgSleep: last7Days.filter(c => c.sleep_hours).length > 0 
          ? (last7Days.reduce((sum, c) => sum + (c.sleep_hours || 0), 0) / last7Days.filter(c => c.sleep_hours).length).toFixed(1)
          : 0,
        goodFoodDays: last7Days.filter(c => c.food_rating === "great").length,
      };

      const prompt = `You are a motivational health coach. Create an encouraging weekly summary for this user:

Weekly Stats:
- Check-ins completed: ${stats.checkInCount}/7
- Average daily steps: ${stats.avgSteps} (goal: ${profile.steps_goal || 8000})
- Average daily calories: ${stats.avgCalories} ${profile.calories_goal ? `(goal: ${profile.calories_goal})` : ''}
- Days with great food: ${stats.goodFoodDays}/7
- Current streak: ${profile.current_streak} days
- Main goal: ${profile.main_goal}

Provide:
1. A celebratory opening (1 sentence)
2. Highlight 2-3 key wins from the week
3. Suggest 1-2 areas for gentle improvement
4. End with an inspiring challenge for next week

Keep it warm, personal, and encouraging. Max 150 words total.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            opening: { type: "string" },
            wins: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            challenge: { type: "string" }
          }
        }
      });

      return { ...result, stats };
    },
    enabled: !!profile && checkIns.length >= 7,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 flex items-center justify-center">
        <Loader2 size={32} className="text-white animate-spin" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <motion.div
      className="relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/20 rounded-3xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
            <Calendar size={22} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Your Week in Review</h3>
            <p className="text-purple-200 text-sm">AI-generated insights</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{summary.stats.checkInCount}</p>
            <p className="text-xs text-white/60">Check-ins</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{summary.stats.avgSteps}</p>
            <p className="text-xs text-white/60">Avg Steps</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{summary.stats.goodFoodDays}</p>
            <p className="text-xs text-white/60">Great Days</p>
          </div>
        </div>

        {/* Summary Content */}
        <div className="space-y-4">
          <div>
            <p className="text-white font-medium text-lg mb-2">{summary.opening}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award size={16} className="text-emerald-300" />
              <p className="text-emerald-200 font-semibold text-sm">Key Wins</p>
            </div>
            <ul className="space-y-1">
              {summary.wins.map((win, i) => (
                <li key={i} className="text-white text-sm flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">✓</span>
                  <span>{win}</span>
                </li>
              ))}
            </ul>
          </div>

          {summary.improvements.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-blue-300" />
                <p className="text-blue-200 font-semibold text-sm">Growth Areas</p>
              </div>
              <ul className="space-y-1">
                {summary.improvements.map((imp, i) => (
                  <li key={i} className="text-white text-sm flex items-start gap-2">
                    <span className="text-blue-400 mt-1">→</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-400/30">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={16} className="text-amber-300" />
              <p className="text-amber-200 font-semibold text-sm">Next Week's Challenge</p>
            </div>
            <p className="text-white text-sm">{summary.challenge}</p>
          </div>
        </div>

        <Button
          onClick={() => refetch()}
          variant="ghost"
          className="w-full mt-4 text-white hover:bg-white/10"
        >
          <TrendingUp size={16} className="mr-2" />
          Regenerate Summary
        </Button>
      </div>
    </motion.div>
  );
}