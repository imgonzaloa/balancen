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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full py-4 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-600 hover:via-emerald-600 hover:to-cyan-600 text-white font-bold text-xl shadow-2xl shadow-teal-500/50 flex items-center justify-center gap-3 transition-all relative overflow-hidden group h-16"
    >
      {/* Background pulse */}
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-2xl"
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />

      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="relative z-10"
      >
        <Camera size={24} />
      </motion.div>
      <span className="relative z-10">{t("add_meal") || "Add Meal"}</span>
    </motion.button>
  );
}