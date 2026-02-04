import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Plus, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ChallengeSuggestions({ profile, checkIns }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["challengeSuggestions"],
    queryFn: async () => {
      const last14Days = checkIns.slice(0, 14);
      const avgSteps = Math.round(last14Days.reduce((sum, c) => sum + (c.steps || 0), 0) / 14);
      
      const prompt = `You are a fitness challenge designer. Based on this user's data, suggest 3 personalized challenges:

User Data:
- Main goal: ${profile.main_goal}
- Intensity level: ${profile.intensity_level}
- Current streak: ${profile.current_streak} days
- Average steps (14 days): ${avgSteps}
- Steps goal: ${profile.steps_goal || 8000}

Create 3 different challenges that are:
1. Achievable based on their current performance
2. Progressively challenging
3. Aligned with their goals
4. Time-bound (7-30 days)

Each challenge should have a catchy name, clear goal number, duration, and type (streak/steps/checkins).`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            challenges: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string", enum: ["streak", "steps", "checkins"] },
                  goal: { type: "number" },
                  duration_days: { type: "number" }
                }
              }
            }
          }
        }
      });

      return result.challenges;
    },
    enabled: expanded && !!profile && checkIns.length > 0,
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (challenge) => {
      const startDate = new Date().toISOString().split("T")[0];
      const endDate = new Date(Date.now() + challenge.duration_days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      // Create a personal challenge (no group_id)
      return base44.entities.Challenge.create({
        name: challenge.name,
        description: challenge.description,
        type: challenge.type,
        goal: challenge.goal,
        start_date: startDate,
        end_date: endDate,
        active: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["challenges"]);
      toast.success("Challenge accepted!");
      setExpanded(false);
    },
  });

  return (
    <motion.div
      className="relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-amber-400/30 to-orange-400/30 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-white font-semibold">AI Challenge Suggestions</h3>
              <p className="text-teal-200 text-sm">Personalized for you</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-white"
          >
            ▼
          </motion.div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="text-white animate-spin" />
                  </div>
                ) : (
                  suggestions?.map((challenge, index) => (
                    <motion.div
                      key={index}
                      className="bg-white/10 rounded-2xl p-4 border border-white/10"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <Trophy size={16} className="text-amber-300" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold mb-1">{challenge.name}</h4>
                          <p className="text-white/70 text-sm mb-2">{challenge.description}</p>
                          <div className="flex items-center gap-4 text-xs text-white/60 mb-3">
                            <span>Goal: {challenge.goal.toLocaleString()}</span>
                            <span>Duration: {challenge.duration_days} days</span>
                            <span className="capitalize">{challenge.type}</span>
                          </div>
                          <Button
                            onClick={() => createChallengeMutation.mutate(challenge)}
                            disabled={createChallengeMutation.isPending}
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                          >
                            <Plus size={14} className="mr-1" />
                            Accept Challenge
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}