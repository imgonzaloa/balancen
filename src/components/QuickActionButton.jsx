import React from "react";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const QuickActionButton = React.memo(function QuickActionButton() {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate(createPageUrl("CameraScreen"))}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full shadow-2xl shadow-emerald-500/40 flex items-center justify-center z-40 border-2 border-white/20 touch-feedback"
    >
      <Camera size={28} className="text-white" />
      
      {/* Pulsing ring */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-full bg-emerald-400/30"
      />
    </motion.button>
  );
});

export default QuickActionButton;