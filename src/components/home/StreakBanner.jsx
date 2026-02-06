import React from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function StreakBanner({ streak, fireTotal }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-orange-500/30 via-red-500/20 to-pink-500/30 backdrop-blur-xl border border-orange-500/50 rounded-3xl p-6 text-center space-y-3"
    >
      {/* Flame animation */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-5xl inline-block"
      >
        🔥
      </motion.div>

      {/* Streak number */}
      <div>
        <p className="text-sm text-white/70 font-medium">{t("current_streak") || "Current Streak"}</p>
        <p className="text-5xl font-bold bg-gradient-to-r from-orange-300 to-red-300 bg-clip-text text-transparent">
          {streak}
        </p>
        <p className="text-white/60 text-sm mt-1">{t("days") || "days"} on fire</p>
      </div>

      {/* Fire total */}
      <div className="flex items-center justify-center gap-2 bg-black/30 rounded-full px-4 py-2 w-fit mx-auto">
        <Flame size={16} className="text-orange-400" />
        <span className="text-white font-bold">{fireTotal || 0} total fire</span>
      </div>

      {/* Motivation message */}
      <p className="text-xs text-orange-200 italic">
        "Keep the flame alive — one meal at a time."
      </p>
    </motion.div>
  );
}