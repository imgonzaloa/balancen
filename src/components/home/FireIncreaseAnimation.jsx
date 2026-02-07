import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";

const FireIncreaseAnimation = React.memo(function FireIncreaseAnimation({ show, amount = 1, onComplete }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onComplete) onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: -50 }}
          exit={{ opacity: 0, scale: 0.8, y: -100 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"
        >
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-6 py-4 flex items-center gap-3 shadow-2xl shadow-orange-500/50">
            <Flame className="text-white" size={32} />
            <span className="text-white font-black text-3xl">+{amount}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default FireIncreaseAnimation;