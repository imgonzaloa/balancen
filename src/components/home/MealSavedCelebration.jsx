import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Sparkles } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

const MealSavedCelebration = React.memo(function MealSavedCelebration({ show, onComplete }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }

      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onComplete?.(), 300);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 shadow-2xl border-4 border-white/30"
          >
            <div className="flex flex-col items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, ease: "easeInOut" }}
              >
                <CheckCircle size={64} className="text-white" />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <h3 className="text-2xl font-black text-white mb-1">
                  {t("meal_saved") || "Meal Saved!"}
                </h3>
                <p className="text-white/80 text-sm flex items-center gap-1 justify-center">
                  <Sparkles size={14} />
                  {t("great_job") || "Great job tracking"}
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Confetti particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: 0, 
                y: 0, 
                scale: 0,
                opacity: 1 
              }}
              animate={{ 
                x: (Math.random() - 0.5) * 300,
                y: (Math.random() - 0.5) * 300,
                scale: [0, 1, 0],
                opacity: [1, 1, 0]
              }}
              transition={{ 
                duration: 1.5,
                ease: "easeOut"
              }}
              className="absolute"
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: `hsl(${Math.random() * 360}, 70%, 60%)`
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default MealSavedCelebration;