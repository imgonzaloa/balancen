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
      className={`flex items-center gap-2 ${s.container} rounded-2xl ${
        isActive 
          ? "bg-gradient-to-br from-orange-100 to-amber-50" 
          : "bg-slate-100"
      }`}
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      <motion.div
        animate={isActive ? { 
          y: [0, -2, 0],
          rotate: [-2, 2, -2]
        } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <Flame 
          size={s.icon} 
          className={isActive ? "text-orange-500 fill-orange-400" : "text-slate-300"} 
        />
      </motion.div>
      <span className={`${s.text} font-bold ${isActive ? "text-orange-600" : "text-slate-400"}`}>
        {streak}
      </span>
    </motion.div>
  );
}