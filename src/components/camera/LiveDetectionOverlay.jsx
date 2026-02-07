import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveDetectionOverlay({ videoRef }) {
  const [detectedItems, setDetectedItems] = useState([]);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Start detection loop
    intervalRef.current = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        detectObjects();
      }
    }, 1200); // Sample every 1.2s for smooth experience

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const detectObjects = async () => {
    try {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0) return;

      // Create canvas to sample frame
      const canvas = document.createElement("canvas");
      canvas.width = 320; // Low res for speed
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Simulate lightweight detection (real impl would call AI)
      // For demo, generate random food items with confidence
      const possibleItems = [
        { name: "🍪 cookie", confidence: 0.85 },
        { name: "🥗 salad", confidence: 0.78 },
        { name: "🍎 apple", confidence: 0.92 },
        { name: "🍕 pizza", confidence: 0.88 },
        { name: "🥑 avocado", confidence: 0.81 },
        { name: "🍔 burger", confidence: 0.76 },
      ];

      // Randomly show 0-2 items
      const itemCount = Math.random() > 0.6 ? Math.floor(Math.random() * 2) + 1 : 0;
      
      if (itemCount > 0) {
        const selected = [];
        for (let i = 0; i < itemCount; i++) {
          const item = possibleItems[Math.floor(Math.random() * possibleItems.length)];
          selected.push({
            ...item,
            id: Math.random(),
            x: 20 + Math.random() * 60, // Random position %
            y: 20 + Math.random() * 60,
          });
        }
        setDetectedItems(selected);
      } else {
        setDetectedItems([]);
      }

    } catch (err) {
      // Silent fail - don't break camera
      console.log("Detection skipped");
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-[6]">
      <AnimatePresence>
        {detectedItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "absolute",
              left: `${item.x}%`,
              top: `${item.y}%`,
            }}
            className="px-3 py-1.5 bg-black/70 backdrop-blur-md rounded-full border border-white/20 shadow-lg"
          >
            <p className="text-white text-xs font-semibold whitespace-nowrap">
              {item.name}
            </p>
            <p className="text-white/60 text-[10px] text-center">
              {Math.round(item.confidence * 100)}%
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}