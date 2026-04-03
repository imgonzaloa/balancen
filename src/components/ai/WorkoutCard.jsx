import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useTranslation } from "@/components/TranslationProvider";
import { Dumbbell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function WorkoutCard({ onGenerate }) {
  const { t, lang } = useTranslation();
  const [generating, setGenerating] = useState(false);
  const [equipment, setEquipment] = useState("");
  const [level, setLevel] = useState("beginner");
  const [goals, setGoals] = useState("");
  const [duration, setDuration] = useState(30);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await base44.functions.invoke('aiWorkoutGenerator', {
        equipment,
        fitness_level: level,
        goals,
        duration_minutes: duration,
        lang
      });

      if (data.success) {
        onGenerate?.(data.workout);
        toast.success(t('workout_generated') || 'Workout generated');
      } else {
        toast.error(t('generation_failed') || 'Failed to generate workout');
      }
    } catch (err) {
      console.error('Generation error:', err);
      toast.error(t('generation_failed') || 'Failed to generate workout');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-6 border border-blue-400/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <Dumbbell size={24} className="text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">
            {t('ai_workout_generator') || 'AI Workout Generator'}
          </h3>
          <p className="text-white/70 text-sm">
            {t('adaptive_workout_plans') || 'Adaptive workout plans'}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-white/70 text-xs mb-1 block">
            {t('available_equipment') || 'Available Equipment'}
          </label>
          <input
            type="text"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            placeholder={t('equipment_placeholder') || 'e.g., dumbbells, resistance bands'}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40"
          />
        </div>

        <div>
          <label className="text-white/70 text-xs mb-1 block">
            {t('fitness_level') || 'Fitness Level'}
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
          >
            <option value="beginner">{t('beginner') || 'Beginner'}</option>
            <option value="intermediate">{t('intermediate') || 'Intermediate'}</option>
            <option value="advanced">{t('advanced') || 'Advanced'}</option>
          </select>
        </div>

        <div>
          <label className="text-white/70 text-xs mb-1 block">
            {t('workout_goals') || 'Workout Goals'}
          </label>
          <input
            type="text"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder={t('goals_placeholder') || 'e.g., build muscle, lose fat'}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40"
          />
        </div>

        <div>
          <label className="text-white/70 text-xs mb-1 block">
            {t('session_duration') || 'Session Duration'}
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
          >
            <option value={15}>15 {t('minutes') || 'min'}</option>
            <option value={30}>30 {t('minutes') || 'min'}</option>
            <option value={45}>45 {t('minutes') || 'min'}</option>
            <option value={60}>60 {t('minutes') || 'min'}</option>
          </select>
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold"
      >
        {generating ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {t('generating') || 'Generating...'}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Sparkles size={18} />
            {t('generate_workout') || 'Generate Workout'}
          </div>
        )}
      </Button>
    </div>
  );
}