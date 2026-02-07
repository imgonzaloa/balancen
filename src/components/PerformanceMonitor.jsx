import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fps: 60,
    renderTime: 0,
    memory: 0,
  });
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId;
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        setMetrics(prev => ({
          ...prev,
          fps,
          renderTime: currentTime - lastTime,
          memory: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0,
        }));
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    
    return () => cancelAnimationFrame(animationId);
  }, []);
  
  // Toggle with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'p' && e.ctrlKey && e.shiftKey) {
        setShow(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-[9999] bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg p-3 text-xs font-mono"
        >
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-white/60">FPS:</span>
              <span className={`font-bold ${metrics.fps < 30 ? 'text-red-400' : metrics.fps < 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                {metrics.fps}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-white/60">Memory:</span>
              <span className="text-white">{metrics.memory} MB</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-white/40 text-[10px]">Ctrl+Shift+P to toggle</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}