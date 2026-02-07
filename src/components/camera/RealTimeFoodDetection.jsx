import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function RealTimeFoodDetection({ videoRef, isActive }) {
  const [detection, setDetection] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalRef = useRef(null);
  const lastProcessTime = useRef(0);

  useEffect(() => {
    if (!isActive || !videoRef?.current) {
      setDetection(null);
      return;
    }

    const processFrame = async () => {
      // Throttle to 2 seconds between detections
      const now = Date.now();
      if (now - lastProcessTime.current < 2000) return;
      
      if (isProcessing) return;

      try {
        setIsProcessing(true);
        lastProcessTime.current = now;

        const video = videoRef.current;
        if (!video || video.readyState !== 4) return;

        // Capture frame
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        // Convert to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.7));
        
        // Quick AI detection
        const { data } = await base44.integrations.Core.InvokeLLM({
          prompt: "Identify the main food item in this image. Return ONLY the food name and estimated calories in format: 'FoodName|Calories'. If no food visible, return 'None|0'",
          file_urls: [URL.createObjectURL(blob)],
          add_context_from_internet: false,
        });

        const [foodName, calories] = (data?.split('|') || ['None', '0']);
        
        if (foodName !== 'None') {
          setDetection({
            name: foodName,
            calories: parseInt(calories) || 0,
            confidence: 85,
          });
        } else {
          setDetection(null);
        }
      } catch (error) {
        console.error("Detection error:", error);
      } finally {
        setIsProcessing(false);
      }
    };

    intervalRef.current = setInterval(processFrame, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, videoRef, isProcessing]);

  return (
    <AnimatePresence>
      {detection && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-24 left-1/2 -translate-x-1/2 z-30"
        >
          <div className="bg-gradient-to-br from-emerald-500/95 to-teal-500/95 backdrop-blur-xl rounded-2xl px-6 py-4 shadow-2xl border border-white/30">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles size={24} className="text-white" />
              </motion.div>
              <div>
                <p className="text-white font-bold text-lg leading-tight">{detection.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Zap size={12} className="text-amber-300" />
                    <span className="text-white/90 text-xs font-semibold">~{detection.calories} kcal</span>
                  </div>
                  <span className="text-white/70 text-xs">•</span>
                  <span className="text-white/70 text-xs">{detection.confidence}% confidence</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}