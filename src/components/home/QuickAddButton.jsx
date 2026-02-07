import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export default function QuickAddButton({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-24 right-6 z-40 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/40 flex items-center justify-center border-2 border-white/20"
    >
      <motion.div
        animate={{ rotate: [0, 90, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <Plus size={28} className="text-white" strokeWidth={3} />
      </motion.div>

      {/* Pulse ring */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute inset-0 rounded-full bg-emerald-400/30"
      />
    </motion.button>
  );
}