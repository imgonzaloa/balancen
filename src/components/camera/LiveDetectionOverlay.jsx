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
  const confidence = detectionState.confidence;

  return (
    <div className="absolute inset-0 pointer-events-none z-[6]">
      {/* AI Scanning Indicator */}
      {!isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-8 left-1/2 -translate-x-1/2"
        >
          <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-emerald-500/30">
            <p className="text-emerald-400 text-xs font-medium flex items-center gap-2">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              />
              {lang === "es" ? "IA analizando composición" : "AI analyzing composition"}
            </p>
          </div>
        </motion.div>
      )}

      {/* Primary food label - centered, never clipped */}
      <motion.div
        key={detectionState.label}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="absolute top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm flex justify-center"
      >
        <div className={`px-4 py-3 backdrop-blur-xl rounded-2xl shadow-2xl border w-full ${
          isLocked 
            ? "bg-emerald-500/90 border-emerald-400/50" 
            : confidence >= 0.8 
              ? "bg-black/85 border-emerald-500/40"
              : "bg-black/75 border-white/20"
        }`}>
          <div className="flex items-center gap-3">
            {(isLocked || confidence >= 0.8) && <CheckCircle size={18} className="text-white flex-shrink-0" />}
            <div className="text-center flex-1 min-w-0">
              <p className="text-white text-sm font-bold mb-1 truncate">
                {foodName}
              </p>
              
              {/* Confidence indicator */}
              <div className="text-[10px] text-white/70">
                {Math.round(confidence * 100)}% {lang === "es" ? "confianza" : "confidence"}
              </div>
            </div>
          </div>
          
          {/* Trust reinforcement */}
          {confidence >= 0.8 && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <p className="text-white/60 text-[9px] text-center leading-tight">
                {lang === "es" 
                  ? "Análisis completo basado en IA nutricional avanzada"
                  : "Complete analysis based on advanced nutritional AI"}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Live calorie preview with portion indicator */}
      {calories && confidence >= 0.8 && (
        <motion.div
          key={`calories-${detectionState.label}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute bottom-44 left-1/2 -translate-x-1/2"
        >
          <div className="px-5 py-3 bg-black/85 backdrop-blur-xl rounded-2xl border border-emerald-500/30 shadow-2xl">
            <p className="text-white/60 text-[10px] text-center mb-1 uppercase tracking-wide">
              {lang === "es" ? "Rango estimado" : "Estimate range"}
            </p>
            <p className="text-white text-xl font-black text-center tabular-nums">
              {calories.min}–{calories.max}
            </p>
            <p className="text-white/40 text-xs text-center mb-2">kcal</p>
            
            {/* Portion size indicator */}
            <div className="flex items-center justify-center gap-1 pt-2 border-t border-white/10">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i}
                    className={`w-1.5 h-3 rounded-sm ${i <= 2 ? 'bg-emerald-400' : 'bg-white/20'}`}
                  />
                ))}
              </div>
              <span className="text-white/60 text-[10px] ml-1">
                {lang === "es" ? "porción med" : "medium serving"}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Confidence < 80%: Show suggestion chips */}
      {confidence < 0.8 && confidence > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-44 left-1/2 -translate-x-1/2 flex flex-wrap gap-2 justify-center max-w-[85%]"
        >
          <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/20 text-white text-xs font-medium">
            {foodName} {Math.round(confidence * 100)}%
          </div>
        </motion.div>
      )}

      {/* Scanning pulse animation */}
      {detectionState.state === "STABLE" && !isLocked && (
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 border-emerald-400/40"
        />
      )}

      {/* Locked check badge */}
      {isLocked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute top-20 left-1/2 -translate-x-1/2"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg border-2 border-white/30">
            <CheckCircle size={20} className="text-white" />
          </div>
        </motion.div>
      )}
    </div>
  );
}