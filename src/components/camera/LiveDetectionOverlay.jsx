import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { LiveDetectionService } from "./LiveDetectionService";
import { getFoodName, getGuidance } from "./foodTranslations";

export default function LiveDetectionOverlay({ videoRef }) {
  const { lang } = useTranslation();
  const [detectionState, setDetectionState] = useState(null);
  const serviceRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Initialize service
    serviceRef.current = new LiveDetectionService();

    // Start detection loop
    intervalRef.current = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        processFrame();
      }
    }, 800); // Sample every 800ms

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (serviceRef.current) {
        serviceRef.current.reset();
      }
    };
  }, []);

  const processFrame = async () => {
    try {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0) return;

      // Create canvas to sample frame
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Process with service
      const result = await serviceRef.current.processFrame(canvas);
      
      setDetectionState(result);

    } catch (err) {
      console.log("[DETECTION] Error:", err);
    }
  };

  if (!detectionState) return null;

  // Render guidance state
  if (detectionState.state === "GUIDANCE") {
    return (
      <div className="absolute inset-0 pointer-events-none z-[6] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 bg-black/70 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg"
        >
          <p className="text-white text-sm font-semibold">
            {getGuidance(detectionState.guidance, lang)}
          </p>
        </motion.div>
      </div>
    );
  }

  // Render scanning state
  if (detectionState.state === "SCANNING") {
    return (
      <div className="absolute inset-0 pointer-events-none z-[6] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-4 py-2 bg-black/70 backdrop-blur-md rounded-2xl border border-emerald-500/30 shadow-lg flex items-center gap-2"
        >
          <Loader2 size={16} className="text-emerald-400 animate-spin" />
          <p className="text-white text-sm font-semibold">
            {getGuidance("SCANNING", lang)}
          </p>
        </motion.div>
      </div>
    );
  }

  // Render stable/locked state with food label + calorie preview
  const foodName = getFoodName(detectionState.label, lang);
  const isLocked = detectionState.state === "LOCKED";
  const calories = detectionState.calories;

  return (
    <div className="absolute inset-0 pointer-events-none z-[6]">
      {/* Primary food label - centered */}
      <motion.div
        key={detectionState.label}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <div className={`px-4 py-2 backdrop-blur-xl rounded-2xl shadow-2xl border ${
          isLocked 
            ? "bg-emerald-500/90 border-emerald-400/50" 
            : "bg-black/80 border-white/30"
        }`}>
          <div className="flex items-center gap-2">
            {isLocked && <CheckCircle size={16} className="text-white" />}
            <div>
              <p className="text-white text-sm font-bold whitespace-nowrap">
                {foodName}
              </p>
              <p className="text-white/80 text-xs text-center">
                {Math.round(detectionState.confidence * 100)}%
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Live calorie preview card - bottom */}
      {calories && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 px-4 py-3 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl min-w-[180px]"
        >
          <p className="text-white/60 text-xs text-center mb-1">
            {lang === "es" ? "Calorías estimadas" : "Estimated calories"}
          </p>
          <p className="text-white text-lg font-bold text-center">
            ~{calories.min}–{calories.max} kcal
          </p>
        </motion.div>
      )}

      {/* Locked badge */}
      {isLocked && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-20 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-emerald-500/90 backdrop-blur-md rounded-full border border-emerald-400/50 shadow-lg"
        >
          <p className="text-white text-xs font-semibold flex items-center gap-1">
            <CheckCircle size={12} />
            {getGuidance("LOCKED", lang)}
          </p>
        </motion.div>
      )}

      {/* Scanning pulse animation */}
      {detectionState.state === "STABLE" && !isLocked && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-emerald-400/50"
        />
      )}
    </div>
  );
}