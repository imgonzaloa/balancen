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
      className="bg-gradient-to-r from-orange-500/30 via-red-500/20 to-pink-500/30 backdrop-blur-xl border border-orange-500/50 rounded-3xl p-6 text-center space-y-4"
    >
      {/* Flame animation */}
      <motion.div
        animate={{ 
          scale: [1, 1.15, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 2.5,
          ease: "easeInOut"
        }}
        className="text-6xl inline-block"
      >
        🔥
      </motion.div>

      {/* Streak number */}
       <div className="space-y-2 flex flex-col items-center justify-center">
         <p className="text-sm text-white/70 font-semibold uppercase tracking-wide">{t("current_streak")}</p>
         <motion.p 
           key={streak}
           initial={{ scale: 1.3, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ type: "spring", stiffness: 200, damping: 15 }}
           className="text-6xl font-black bg-gradient-to-r from-orange-300 to-red-300 bg-clip-text text-transparent leading-none tabular-nums" 
           style={{ fontVariantNumeric: "tabular-nums" }}
         >
           {streak}
         </motion.p>
         <p className="text-white/60 text-sm font-medium">{t("days")} {t("on_fire")}</p>
       </div>

      {/* Fire total */}
      <div className="flex items-center justify-center gap-2 bg-black/40 rounded-full px-5 py-2.5 w-fit mx-auto border border-orange-400/20">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <Flame size={16} className="text-orange-400" />
        </motion.div>
        <motion.span 
          key={fireTotal}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-white font-bold text-sm tabular-nums" 
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {fireTotal || 0} {t("fire")}
        </motion.span>
      </div>

      {/* Motivation message */}
      <p className="text-xs text-orange-200 italic mt-2">
        "{t("keep_flame_alive")}"
      </p>
    </motion.div>
  );
}