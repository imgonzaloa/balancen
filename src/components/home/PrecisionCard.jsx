import React from "react";
import { Target, TrendingUp, AlertCircle } from "lucide-react";

export default function PrecisionCard({ precision, mealsLogged, lang }) {
  const getColor = (p) => {
    if (p >= 80) return "from-emerald-500 to-teal-500";
    if (p >= 50) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  const getMessage = (p) => {
    if (p >= 80) {
      return lang === "es" 
        ? "Excelente precisión. Datos confiables." 
        : "Excellent precision. Reliable data.";
    }
    if (p >= 50) {
      return lang === "es" 
        ? "Buena precisión. Registra más comidas." 
        : "Good precision. Log more meals.";
    }
    return lang === "es" 
      ? "Baja precisión. Necesitas más datos." 
      : "Low precision. Need more data.";
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} className="text-white/70" />
            <p className="text-white/70 text-sm font-semibold">
              {lang === "es" ? "Precisión Diaria" : "Daily Precision"}
            </p>
          </div>
          <p className="text-white/50 text-xs">
            {mealsLogged} {lang === "es" ? "comidas registradas" : "meals logged"}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-black bg-gradient-to-r ${getColor(precision)} bg-clip-text text-transparent`}>
            {precision}%
          </p>
        </div>
      </div>

      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full bg-gradient-to-r ${getColor(precision)} transition-all duration-1000`}
          style={{ width: `${precision}%` }}
        />
      </div>

      <p className="text-white/60 text-xs leading-relaxed">
        {getMessage(precision)}
      </p>
    </div>
  );
}