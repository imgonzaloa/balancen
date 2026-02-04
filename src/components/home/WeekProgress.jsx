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
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-slate-700">Esta semana</h4>
        <span className="text-sm text-teal-600 font-medium">{completedCount}/7 días</span>
      </div>
      
      <div className="flex justify-between gap-1">
        {weekDays.map((d, i) => (
          <motion.div
            key={d.date}
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className={`text-xs font-medium ${d.isToday ? "text-teal-600" : "text-slate-400"}`}>
              {d.day}
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                d.isCompleted
                  ? "bg-gradient-to-br from-teal-400 to-emerald-500"
                  : d.isToday
                  ? "bg-teal-100 border-2 border-teal-400"
                  : d.isPast
                  ? "bg-slate-100"
                  : "bg-slate-50 border border-slate-200"
              }`}
            >
              {d.isCompleted && <Check size={16} className="text-white" strokeWidth={3} />}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}