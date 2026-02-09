import React from "react";
import { Target, Camera, Utensils, Scale } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function PrecisionCard({ mealsCount, hasPhotos, hasManualEntry }) {
  const { lang } = useTranslation();

  // Calculate precision based on meal logging quality
  const calculatePrecision = () => {
    if (mealsCount === 0) return 0;
    
    let score = 30; // Base score for logging
    
    if (hasPhotos) score += 40; // Photo logging is more accurate
    if (mealsCount >= 3) score += 20; // Complete day
    if (hasManualEntry) score += 10; // Manual entry adds detail
    
    return Math.min(score, 100);
  };

  const precision = calculatePrecision();

  const getColor = () => {
    if (precision >= 80) return "text-emerald-400";
    if (precision >= 60) return "text-teal-400";
    if (precision >= 40) return "text-yellow-400";
    return "text-orange-400";
  };

  const getTip = () => {
    if (mealsCount === 0) {
      return lang === "es" 
        ? "Registra tu primera comida para empezar"
        : "Log your first meal to get started";
    }
    if (!hasPhotos) {
      return lang === "es"
        ? "Usa fotos para mayor precisión"
        : "Use photos for better accuracy";
    }
    if (mealsCount < 3) {
      return lang === "es"
        ? "Registra 3 comidas para el día completo"
        : "Log 3 meals for a complete day";
    }
    return lang === "es"
      ? "¡Excelente! Seguimiento completo"
      : "Excellent! Complete tracking";
  };

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-2xl p-5 border border-blue-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-blue-300" />
          <h4 className="text-white font-semibold text-sm">
            {lang === "es" ? "Precisión Diaria" : "Daily Precision"}
          </h4>
        </div>
        <div className={`text-2xl font-black ${getColor()}`}>
          {precision}%
        </div>
      </div>

      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full bg-gradient-to-r from-blue-400 to-cyan-400`}
          style={{ width: `${precision}%`, transition: 'width 0.5s ease' }}
        />
      </div>

      <p className="text-white/60 text-xs">{getTip()}</p>
    </div>
  );
}