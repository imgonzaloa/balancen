import { motion } from "framer-motion";
import { Check } from "lucide-react";

const days = ["L", "M", "X", "J", "V", "S", "D"];

export default function WeekProgress({ checkIns = [] }) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  
  const weekDays = days.map((day, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    const dateStr = date.toISOString().split("T")[0];
    const isToday = dateStr === today.toISOString().split("T")[0];
    const isCompleted = checkIns.some(c => c.date === dateStr);
    const isPast = date < today && !isToday;
    
    return { day, date: dateStr, isToday, isCompleted, isPast };
  });

  const completedCount = weekDays.filter(d => d.isCompleted).length;

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-2xl" />
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h4 className="font-bold text-white text-lg">Esta semana</h4>
        <span className="text-sm bg-gradient-to-r from-teal-200 to-emerald-200 bg-clip-text text-transparent font-bold">{completedCount}/7 días</span>
      </div>
      
      <div className="flex justify-between gap-2 relative z-10">
        {weekDays.map((d, i) => (
          <motion.div
            key={d.date}
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className={`text-xs font-bold ${d.isToday ? "text-emerald-200" : "text-white/60"}`}>
              {d.day}
            </span>
            <motion.div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                d.isCompleted
                  ? "bg-gradient-to-br from-emerald-400 to-teal-500"
                  : d.isToday
                  ? "bg-white/20 border-2 border-emerald-300"
                  : d.isPast
                  ? "bg-white/5"
                  : "bg-white/10 border border-white/20"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {d.isCompleted && <Check size={18} className="text-white" strokeWidth={3} />}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}