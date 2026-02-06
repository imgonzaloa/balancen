import React, { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Flame, Save, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/TranslationProvider";
import { toast } from "sonner";

export default function QuickStatsUpdate({ 
  todayCheckIn, 
  profile, 
  onUpdate 
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [steps, setSteps] = useState(todayCheckIn?.steps || 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({ steps });
      setEditing(false);
      toast.success(t("stats_updated"));
    } catch (error) {
      toast.error(t("error_updating_stats"));
    } finally {
      setSaving(false);
    }
  };

  const stepsGoal = profile?.steps_goal || 8000;
  const stepsProgress = Math.min((steps / stepsGoal) * 100, 100);

  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-cyan-400/30 to-blue-400/30 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">{t("quick_update")}</h3>
              <p className="text-white/60 text-xs">{t("update_anytime")}</p>
            </div>
          </div>
          
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <Edit2 size={14} className="text-white" />
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="text-white text-xs font-medium mb-2 block">
                {t("steps")}
              </label>
              <input
                type="number"
                value={steps}
                onChange={(e) => setSteps(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-lg font-bold focus:border-cyan-300 outline-none"
                placeholder="0"
              />
              <p className="text-white/40 text-xs mt-1">
                {t("goal_text")}: {stepsGoal.toLocaleString()}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setSteps(todayCheckIn?.steps || 0);
                  setEditing(false);
                }}
                variant="outline"
                className="flex-1 bg-white/5 hover:bg-white/10 border-white/20 text-white"
                disabled={saving}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                disabled={saving}
              >
                <Save size={16} className="mr-2" />
                {saving ? t("saving") : t("save")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {steps.toLocaleString()}
              </span>
              <span className="text-sm text-white/60">{t("steps")}</span>
            </div>

            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${stepsProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">
                {steps >= stepsGoal ? t("goal_reached") : `${(stepsGoal - steps).toLocaleString()} ${t("steps")} ${t("remaining")}`}
              </span>
              <span className="text-white font-bold">{Math.round(stepsProgress)}%</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}