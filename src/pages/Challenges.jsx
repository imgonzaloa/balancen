import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAppState } from "@/components/AppStateContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trophy, Flame, Droplets, Dumbbell, CheckSquare, Target, Plus, Users, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useEntitlement } from "@/components/hooks/useEntitlement";
import { useTranslation } from "@/components/TranslationProvider";

const PRESET_CHALLENGES_CONFIG = [
  {
    preset_id: "hydration_7",
    nameKey: "challenge_hydration_name",
    descKey: "challenge_hydration_desc",
    type: "consistency",
    goal: 7,
    icon: Droplets,
    color: "from-cyan-500 to-blue-500",
    badge: "💧",
    duration_days: 7,
  },
  {
    preset_id: "streak_30",
    nameKey: "challenge_streak_name",
    descKey: "challenge_streak_desc",
    type: "streak",
    goal: 30,
    icon: Flame,
    color: "from-orange-500 to-red-500",
    badge: "🔥",
    duration_days: 30,
  },
  {
    preset_id: "meals_21",
    nameKey: "challenge_meals_name",
    descKey: "challenge_meals_desc",
    type: "checkins",
    goal: 21,
    icon: CheckSquare,
    color: "from-emerald-500 to-teal-500",
    badge: "🥗",
    duration_days: 21,
  },
  {
    preset_id: "workout_10",
    nameKey: "challenge_workout_name",
    descKey: "challenge_workout_desc",
    type: "steps",
    goal: 10,
    icon: Dumbbell,
    color: "from-purple-500 to-violet-500",
    badge: "💪",
    duration_days: 14,
  },
  {
    preset_id: "consistency_14",
    nameKey: "challenge_consistency_name",
    descKey: "challenge_consistency_desc",
    type: "consistency",
    goal: 14,
    icon: Target,
    color: "from-amber-500 to-yellow-500",
    badge: "⭐",
    duration_days: 14,
  },
];

function PresetChallengeCard({ preset, onJoin, isJoining, myParticipations }) {
  const { t } = useTranslation();
  const Icon = preset.icon;
  const name = t(preset.nameKey);
  const description = t(preset.descKey);
  const alreadyJoined = myParticipations.some(p => p.challenge_name === name);
  const daysLeft = preset.duration_days;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10 overflow-hidden relative"
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${preset.color}`} />
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${preset.color} flex items-center justify-center flex-shrink-0`}>
          <Icon size={24} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-bold text-sm">{name}</h3>
            <span className="text-lg">{preset.badge}</span>
          </div>
          <p className="text-white/60 text-xs mt-1 leading-relaxed">{description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-white/40 text-xs">{daysLeft} {t("days_label")}</span>
            <span className="text-white/40 text-xs">•</span>
            <span className="text-white/40 text-xs capitalize">{preset.type}</span>
          </div>
        </div>
      </div>
      <Button
        onClick={() => onJoin(preset)}
        disabled={alreadyJoined || isJoining}
        className={`w-full mt-4 rounded-xl font-semibold ${
          alreadyJoined
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default"
            : `bg-gradient-to-r ${preset.color} text-white hover:opacity-90`
        }`}
      >
        {isJoining ? (
          <Loader2 size={16} className="animate-spin mr-2" />
        ) : alreadyJoined ? (
          <><Trophy size={16} className="mr-2" /> {t("joined")}</>
        ) : (
          <><Plus size={16} className="mr-2" /> {t("join_challenge")}</>
        )}
      </Button>
    </motion.div>
  );
}

function ActiveChallengeCard({ participation, challenge }) {
  const { t } = useTranslation();
  if (!challenge) return null;
  const progress = Math.min((participation.current_progress / challenge.goal) * 100, 100);
  const daysLeft = challenge.end_date
    ? Math.max(0, Math.ceil((new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <p className="text-white font-semibold text-sm">{challenge.name}</p>
        {participation.completed && (
          <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">✓ {t("joined")}</span>
        )}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-white/70 text-xs font-medium whitespace-nowrap">
          {participation.current_progress}/{challenge.goal}
        </span>
      </div>
      {daysLeft !== null && (
        <p className="text-white/40 text-xs">{daysLeft} {t("days_remaining")}</p>
      )}
    </div>
  );
}

export default function Challenges() {
  const navigate = useNavigate();
  const { user, profile } = useAppState();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [joiningId, setJoiningId] = useState(null);
  const { isEntitled } = useEntitlement(profile);

  const { data: myParticipations = [] } = useQuery({
    queryKey: ["myParticipations", user?.email],
    queryFn: () => base44.entities.ChallengeParticipant.filter({ user_email: user.email }),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  const { data: myChallenges = [] } = useQuery({
    queryKey: ["myChallenges", myParticipations.map(p => p.challenge_id)],
    queryFn: async () => {
      if (myParticipations.length === 0) return [];
      const results = await Promise.all(
        myParticipations.map(p =>
          base44.entities.Challenge.filter({ id: p.challenge_id }).then(r => r[0]).catch(() => null)
        )
      );
      return results.filter(Boolean);
    },
    enabled: myParticipations.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const joinMutation = useMutation({
    mutationFn: async (preset) => {
      const start = new Date();
      const end = new Date(start.getTime() + preset.duration_days * 24 * 60 * 60 * 1000);

      // Create challenge record
      const challenge = await base44.entities.Challenge.create({
        name: t(preset.nameKey),
        description: t(preset.descKey),
        type: preset.type,
        goal: preset.goal,
        start_date: start.toISOString().split("T")[0],
        end_date: end.toISOString().split("T")[0],
        active: true,
      });

      // Create participation
      await base44.entities.ChallengeParticipant.create({
        challenge_id: challenge.id,
        user_email: user.email,
        current_progress: 0,
        completed: false,
      });

      return challenge;
    },
    onSuccess: (_, preset) => {
      queryClient.invalidateQueries({ queryKey: ["myParticipations"] });
      queryClient.invalidateQueries({ queryKey: ["myChallenges"] });
      toast.success(t("join_challenge_success"));
      setJoiningId(null);
    },
    onError: () => {
      toast.error(t("join_challenge_failed"));
      setJoiningId(null);
    },
  });

  const handleJoin = (preset) => {
    if (!isEntitled) {
      navigate(createPageUrl("Premium"));
      return;
    }
    setJoiningId(preset.preset_id);
    joinMutation.mutate(preset);
  };

  // Enrich participations with challenge name for duplicate check
  const enrichedParticipations = myParticipations.map(p => {
    const ch = myChallenges.find(c => c.id === p.challenge_id);
    return { ...p, challenge_name: ch?.name };
  });

  const activeChallenges = myParticipations.filter(p => !p.completed);

  return (
    <div className="min-h-screen pb-24" style={{ minHeight: '100dvh' }}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 space-y-6">
        {/* Premium upsell banner */}
        {!isEntitled && (
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 rounded-2xl px-4 py-3">
            <p className="text-amber-200 text-sm font-semibold">🏆 Únete a Premium para participar en retos</p>
            <button
              onClick={() => navigate(createPageUrl("Premium"))}
              className="shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Upgrade
            </button>
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy size={24} className="text-amber-400" />
            {t("challenges_title")}
          </h1>
          <p className="text-white/60 text-sm">{t("challenges_subtitle")}</p>
        </div>

        {/* Active Challenges */}
        {activeChallenges.length > 0 && (
          <div>
            <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
              <Flame size={18} className="text-orange-400" />
              {t("my_active_challenges")} ({activeChallenges.length})
            </h2>
            <div className="space-y-3">
              {activeChallenges.map(p => (
                <ActiveChallengeCard
                  key={p.id}
                  participation={p}
                  challenge={myChallenges.find(c => c.id === p.challenge_id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Featured Challenges */}
        <div>
          <h2 className="text-white font-bold text-base mb-3 flex items-center gap-2">
            <Target size={18} className="text-teal-400" />
            {t("featured_challenges")}
          </h2>
          <div className="space-y-3">
            {PRESET_CHALLENGES_CONFIG.map(preset => (
              <PresetChallengeCard
                key={preset.preset_id}
                preset={preset}
                onJoin={handleJoin}
                isJoining={joiningId === preset.preset_id}
                myParticipations={enrichedParticipations}
              />
            ))}
          </div>
        </div>

        {/* Group Challenges hint */}
        <button
          onClick={() => navigate(createPageUrl("Groups"))}
          className="w-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-5 border border-purple-400/30 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-sm">{t("group_challenges")}</p>
              <p className="text-white/50 text-xs">{t("group_challenges_desc")}</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-white/40" />
        </button>
      </div>
    </div>
  );
}