import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FirstStreakModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 px-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="relative bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X size={16} className="text-white" />
              </button>

              <div className="text-center">
                <motion.div
                  className="inline-block mb-6"
                  animate={{ 
                    rotate: [-5, 5, -5],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <Flame size={80} className="text-white drop-shadow-lg" fill="white" />
                </motion.div>

                <h2 className="text-3xl font-black text-white mb-3">
                  Your streak has started 🔥
                </h2>
                <p className="text-xl text-white/90 font-medium mb-8">
                  One day at a time.
                </p>

                <Button
                  onClick={onClose}
                  className="w-full py-6 rounded-2xl bg-white text-orange-600 hover:bg-white/90 font-bold text-lg shadow-xl"
                >
                  Keep going
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}