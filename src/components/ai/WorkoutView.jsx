import React from "react";
import { useTranslation } from "@/components/TranslationProvider";
import { Dumbbell, Clock, Flame, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkoutView({ workout, onClose }) {
  const { t } = useTranslation();

  if (!workout) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Dumbbell size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {t('your_workout') || 'Your Workout'}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-white/80">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {workout.total_duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame size={14} />
                      ~{workout.calories_burned_estimate} {t('cal') || 'cal'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Motivation */}
            {workout.motivation && (
              <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-2xl p-4 border border-teal-400/30">
                <p className="text-white/90 text-sm leading-relaxed">
                  {workout.motivation}
                </p>
              </div>
            )}

            {/* Warm-up */}
            {workout.warmup?.length > 0 && (
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">
                  🔥 {t('warmup') || 'Warm-up'}
                </h3>
                <div className="space-y-3">
                  {workout.warmup.map((exercise, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{exercise.exercise}</h4>
                        <span className="text-xs text-cyan-300">{exercise.duration}</span>
                      </div>
                      <p className="text-sm text-white/70">{exercise.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Workout */}
            {workout.main_workout?.length > 0 && (
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-5 border border-blue-400/30">
                <h3 className="text-lg font-bold text-white mb-4">
                  💪 {t('main_workout') || 'Main Workout'}
                </h3>
                <div className="space-y-3">
                  {workout.main_workout.map((exercise, idx) => (
                    <div key={idx} className="bg-white/10 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-white">{exercise.exercise}</h4>
                        <span className="text-xs text-blue-300">{exercise.equipment_needed}</span>
                      </div>
                      <div className="flex gap-4 text-sm text-white/70 mb-2">
                        <span>{exercise.sets} {t('sets') || 'sets'}</span>
                        <span>{exercise.reps}</span>
                        <span>{t('rest') || 'Rest'}: {exercise.rest}</span>
                      </div>
                      <p className="text-xs text-white/60 italic">{exercise.tips}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cool-down */}
            {workout.cooldown?.length > 0 && (
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">
                  🧘 {t('cooldown') || 'Cool-down'}
                </h3>
                <div className="space-y-3">
                  {workout.cooldown.map((exercise, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{exercise.exercise}</h4>
                        <span className="text-xs text-purple-300">{exercise.duration}</span>
                      </div>
                      <p className="text-sm text-white/70">{exercise.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progressive Overload */}
            {workout.progressive_overload && (
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-5 border border-purple-400/30">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={20} className="text-purple-300" />
                  <h3 className="text-lg font-bold text-white">
                    {t('progressive_overload') || 'Progressive Overload'}
                  </h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-white/50 mb-1">{t('weeks') || 'Weeks'} 1-2:</p>
                    <p className="text-sm text-white/80">{workout.progressive_overload.week_1_2}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 mb-1">{t('weeks') || 'Weeks'} 3-4:</p>
                    <p className="text-sm text-white/80">{workout.progressive_overload.week_3_4}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 mb-1">{t('weeks') || 'Weeks'} 5+:</p>
                    <p className="text-sm text-white/80">{workout.progressive_overload.week_5_plus}</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={onClose}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold"
            >
              {t('close') || 'Close'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}