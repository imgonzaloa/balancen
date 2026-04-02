import React, { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { Button } from "@/components/ui/button";

export default function ProfileGoalsEdit({ profile, onClose, onUpdate }) {
  const { t, lang } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    primary_goal: profile?.primary_goal || "consistency",
    intensity_level: profile?.intensity_level || "normal",
    calories_goal: profile?.calories_goal || 2000,
  });

  const goals = [
    { value: "consistency", emoji: "🎯" },
    { value: "weight_loss", emoji: "⚖️" },
    { value: "healthy_habits", emoji: "🥗" },
    { value: "stay_active", emoji: "🏃" },
  ];

  const intensities = [
    { value: "easy" },
    { value: "normal" },
    { value: "challenging" },
  ];

  const handleSave = async () => {
    if (!profile?.id) return;

    setSaving(true);
    try {
      await base44.entities.UserProfile.update(profile.id, formData);
      toast.success(t('goal_updated'));
      onUpdate?.();
      onClose();
    } catch (err) {
      console.error("Failed to update goals:", err);
      toast.error(t('update_failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{t('edit_goals')}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Primary Goal */}
          <div>
            <label className="block text-white font-semibold mb-3">
              {t('main_goal')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {goals.map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => setFormData({ ...formData, primary_goal: goal.value })}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    formData.primary_goal === goal.value
                      ? "border-teal-400 bg-teal-500/20"
                      : "border-white/20 bg-white/5 hover:border-white/40"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{goal.emoji}</div>
                    <p className="text-white text-sm font-medium">
                      {t(goal.value)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Intensity */}
          <div>
            <label className="block text-white font-semibold mb-3">
              {t('intensity')}
            </label>
            <div className="space-y-2">
              {intensities.map((intensity) => (
                <button
                  key={intensity.value}
                  onClick={() => setFormData({ ...formData, intensity_level: intensity.value })}
                  className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                    formData.intensity_level === intensity.value
                      ? "border-teal-400 bg-teal-500/20"
                      : "border-white/20 bg-white/5 hover:border-white/40"
                  }`}
                >
                  <p className="text-white font-semibold">{t(intensity.value)}</p>
                  <p className="text-white/60 text-sm">{t(intensity.value + '_desc')}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Calories Goal */}
          <div>
            <label className="block text-white font-semibold mb-3">
              {t('daily_calories_limit')}
            </label>
            <input
              type="number"
              value={formData.calories_goal || ""}
              onChange={(e) => setFormData({ ...formData, calories_goal: parseInt(e.target.value) || null })}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-teal-400 outline-none text-lg"
              placeholder={lang === "es" ? "Ej.: 2000" : "e.g., 2000"}
            />
            <p className="text-white/50 text-xs mt-2">{t('optional_leave_empty')}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
            >
              {saving ? "..." : t('save_changes')}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}