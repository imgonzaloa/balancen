import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "@/components/TranslationProvider";
import { createPageUrl } from "@/utils";

const TODAY_KEY = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function getScheduledTime() {
  const key = `meal_moment_time_${TODAY_KEY()}`;
  const stored = localStorage.getItem(key);
  if (stored) return parseInt(stored, 10);

  // Random time between 8:00 and 21:00 (in ms since midnight)
  const minMs = 8 * 60 * 60 * 1000;
  const maxMs = 21 * 60 * 60 * 1000;
  const scheduled = minMs + Math.floor(Math.random() * (maxMs - minMs));
  localStorage.setItem(key, String(scheduled));
  return scheduled;
}

function isDismissedToday() {
  return localStorage.getItem(`meal_moment_dismissed_${TODAY_KEY()}`) === "1";
}

function dismissToday() {
  localStorage.setItem(`meal_moment_dismissed_${TODAY_KEY()}`, "1");
}

function msSinceMidnight() {
  const now = new Date();
  return (
    now.getHours() * 3600000 +
    now.getMinutes() * 60000 +
    now.getSeconds() * 1000 +
    now.getMilliseconds()
  );
}

export default function MealMomentNotification() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  if (pathname.includes('CameraScreen') || pathname.includes('MealResult') || pathname.includes('PreviewScreen')) return null;

  useEffect(() => {
    if (isDismissedToday()) return;

    const scheduledMs = getScheduledTime();

    function checkAndShow() {
      if (isDismissedToday()) return;
      const now = msSinceMidnight();
      if (now >= scheduledMs) {
        setVisible(true);
      }
    }

    checkAndShow();
    const interval = setInterval(checkAndShow, 30000); // check every 30s
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    dismissToday();
    setVisible(false);
  };

  const handleScan = () => {
    dismissToday();
    setVisible(false);
    navigate(createPageUrl("CameraScreen"));
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="meal-moment"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed top-0 left-0 right-0 z-[9999] px-4 pt-3"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <div className="max-w-sm mx-auto bg-slate-800/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">
                {t("meal_moment_title")}
              </p>
              <p className="text-white/60 text-xs mt-0.5 truncate">
                {t("meal_moment_subtitle")}
              </p>
            </div>

            {/* Scan button */}
            <button
              onClick={handleScan}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-2 rounded-xl shrink-0 active:scale-95 transition-transform"
            >
              <Camera size={14} />
              {t("meal_moment_scan")}
            </button>

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="text-white/40 hover:text-white/70 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}