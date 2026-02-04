import { motion } from "framer-motion";
import { Check, Plus } from "lucide-react";

export default function CheckInButton({ completed, onClick, loading }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={loading || completed}
      className={`w-full py-6 rounded-3xl font-semibold text-xl flex items-center justify-center gap-3 transition-all ${
        completed
          ? "bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-lg shadow-emerald-200"
          : "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-xl shadow-teal-200 hover:shadow-2xl hover:shadow-teal-300"
      }`}
      whileHover={!completed ? { scale: 1.02 } : {}}
      whileTap={!completed ? { scale: 0.98 } : {}}
    >
      {loading ? (
        <motion.div
          className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
      ) : completed ? (
        <>
          <Check size={28} strokeWidth={3} />
          <span>¡Hecho hoy!</span>
        </>
      ) : (
        <>
          <Plus size={28} strokeWidth={3} />
          <span>Check-in</span>
        </>
      )}
    </motion.button>
  );
}