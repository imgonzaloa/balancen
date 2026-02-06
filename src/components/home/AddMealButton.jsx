import React from "react";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function AddMealButton({ onClick }) {
  const { t } = useTranslation();

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="w-full py-10 rounded-3xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-600 hover:via-emerald-600 hover:to-cyan-600 text-white font-bold text-2xl shadow-2xl shadow-teal-500/50 flex items-center justify-center gap-3 active:shadow-lg transition-all relative overflow-hidden group"
    >
      {/* Background pulse */}
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-3xl"
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />

      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        <Camera size={32} />
      </motion.div>
      <span className="relative z-10">{t("add_meal") || "Add Meal"}</span>
    </motion.button>
  );
}