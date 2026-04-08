import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Share2 } from "lucide-react";
import StoryCardGenerator from "./StoryCardGenerator";

const AUTO_DISMISS_SECS = 8;

export default function SharePrompt({ totals, photoUrl, user, onShare, onSkip }) {
  const [countdown, setCountdown] = useState(AUTO_DISMISS_SECS);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval);
          onSkip();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onSkip]);

  const handleShare = async () => {
    setSharing(true);
    await onShare();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center px-6">
      {/* Blurred photo background */}
      {photoUrl && (
        <img
          src={photoUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-15"
          style={{ filter: "blur(12px)", transform: "scale(1.1)" }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        {/* Checkmark */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-5 shadow-xl shadow-emerald-500/40"
        >
          <Check size={40} className="text-white" strokeWidth={3} />
        </motion.div>

        {/* Calories text */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-5"
        >
          <h2 className="text-white font-black text-3xl mb-1">Meal saved!</h2>
          <p className="text-teal-300 font-black text-xl">+{totals?.calories} kcal</p>
        </motion.div>

        {/* Meal photo thumbnail */}
        {photoUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl mb-8"
          >
            <img src={photoUrl} alt="Meal" className="w-full h-full object-cover" />
          </motion.div>
        )}

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full space-y-3"
        >
          <button
            onClick={handleShare}
            disabled={sharing}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-teal-500/30 active:scale-95 transition-transform disabled:opacity-70"
          >
            <Share2 size={20} />
            Share to feed
          </button>

          <StoryCardGenerator
            mealName={totals?.mealName || 'Meal'}
            macros={{
              calories: totals?.calories || 0,
              protein: totals?.protein || 0,
              carbs: totals?.carbs || 0,
              fats: totals?.fats || 0,
            }}
            streak={user?.current_streak || 0}
            onShared={onSkip}
          />

          <button
            onClick={onSkip}
            className="w-full py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-base active:scale-95 transition-transform"
          >
            Keep it private
            <span className="ml-2 text-white/40 text-sm font-normal">({countdown}s)</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}