import { motion } from "framer-motion";
import { Flame } from "lucide-react";

export default function StreakFire({ streak, size = "default" }) {
  const sizes = {
    small: { icon: 20, text: "text-lg", container: "p-2" },
    default: { icon: 32, text: "text-2xl", container: "p-3" },
    large: { icon: 48, text: "text-4xl", container: "p-4" },
  };
  
  const s = sizes[size] || sizes.default;
  const isActive = streak > 0;
  
  return (
    <motion.div 
      className={`relative overflow-hidden flex items-center gap-3 ${s.container} rounded-2xl ${
        isActive 
          ? "bg-gradient-to-br from-orange-500 to-amber-600 shadow-xl shadow-orange-500/50" 
          : "bg-white/10 backdrop-blur-sm border border-white/20"
      }`}
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-t from-orange-600/50 to-transparent" />
      )}
      <motion.div
        animate={isActive ? { 
          y: [0, -3, 0],
          rotate: [-3, 3, -3],
          scale: [1, 1.1, 1]
        } : {}}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="relative z-10"
      >
        <Flame 
          size={s.icon} 
          className={isActive ? "text-white drop-shadow-lg" : "text-white/40"} 
          fill={isActive ? "white" : "none"}
        />
      </motion.div>
      <span className={`${s.text} font-black relative z-10 ${isActive ? "text-white drop-shadow-lg" : "text-white/50"}`}>
        {streak}
      </span>
    </motion.div>
  );
}