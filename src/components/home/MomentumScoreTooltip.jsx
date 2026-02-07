import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/components/TranslationProvider";

export default function MomentumScoreTooltip() {
  const { lang } = useTranslation();
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/60 cursor-help"
      >
        ?
      </button>
      
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute left-0 top-6 w-64 p-3 bg-black/95 backdrop-blur-xl rounded-lg border border-white/20 shadow-2xl z-20"
          >
            <p className="text-white text-xs font-semibold mb-2">
              {lang === "es" ? "¿Qué es Momentum Score?" : "What is Momentum Score?"}
            </p>
            <p className="text-white/70 text-[10px] leading-relaxed mb-2">
              {lang === "es" 
                ? "Un indicador que combina:"
                : "An indicator that combines:"}
            </p>
            <ul className="text-white/60 text-[10px] space-y-1 list-disc list-inside">
              <li>{lang === "es" ? "Consistencia de registro" : "Tracking consistency"}</li>
              <li>{lang === "es" ? "Adherencia a tu meta" : "Goal adherence"}</li>
              <li>{lang === "es" ? "Balance de macronutrientes" : "Macro balance"}</li>
              <li>{lang === "es" ? "Frecuencia de uso" : "Usage frequency"}</li>
            </ul>
            <p className="text-emerald-400 text-[9px] mt-2 font-semibold">
              {lang === "es" 
                ? "→ Nunca baja a cero, siempre progresa"
                : "→ Never resets to zero, always progresses"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}