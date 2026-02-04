import React from "react";
import { motion } from "framer-motion";
import { Moon, Droplets, Heart, Battery } from "lucide-react";

export default function WellnessTracker({ 
  sleepHours, 
  sleepQuality,
  hydrated,
  waterGlasses,
  recoveryScore,
  showInputs = false,
  onSleepChange,
  onSleepQualityChange,
  onHydratedChange,
  onWaterChange
}) {
  const getRecoveryColor = (score) => {
    if (score >= 70) return "from-emerald-400 to-green-500";
    if (score >= 40) return "from-amber-400 to-orange-500";
    return "from-red-400 to-rose-500";
  };

  const getRecoveryText = (score) => {
    if (score >= 70) return "¡Excelente!";
    if (score >= 40) return "Moderado";
    return "Bajo";
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-2xl" />
      
      <h4 className="font-bold text-white text-lg mb-4 relative z-10 flex items-center gap-2">
        <Battery size={20} />
        Bienestar
      </h4>

      <div className="space-y-4 relative z-10">
        {/* Sleep */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Moon size={18} className="text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-white font-medium">Sueño</p>
              {showInputs ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    step="0.5"
                    value={sleepHours || ""}
                    onChange={(e) => onSleepChange?.(parseFloat(e.target.value))}
                    placeholder="0"
                    className="w-16 text-sm px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white outline-none"
                  />
                  <span className="text-xs text-blue-200">hrs</span>
                </div>
              ) : (
                <p className="text-xs text-blue-200">
                  {sleepHours ? `${sleepHours}h` : "No registrado"}
                </p>
              )}
            </div>
          </div>
          {sleepQuality && !showInputs && (
            <span className={`text-xs px-2 py-1 rounded-lg ${
              sleepQuality === "great" ? "bg-emerald-500/20 text-emerald-300" :
              sleepQuality === "ok" ? "bg-amber-500/20 text-amber-300" :
              "bg-red-500/20 text-red-300"
            }`}>
              {sleepQuality === "great" ? "Bien" : sleepQuality === "ok" ? "Ok" : "Mal"}
            </span>
          )}
        </div>

        {/* Hydration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Droplets size={18} className="text-cyan-300" />
            </div>
            <div>
              <p className="text-sm text-white font-medium">Hidratación</p>
              {showInputs ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={waterGlasses || ""}
                    onChange={(e) => onWaterChange?.(parseInt(e.target.value))}
                    placeholder="0"
                    className="w-16 text-sm px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white outline-none"
                  />
                  <span className="text-xs text-cyan-200">vasos</span>
                </div>
              ) : (
                <p className="text-xs text-cyan-200">
                  {waterGlasses ? `${waterGlasses} vasos` : hydrated ? "✓" : "No registrado"}
                </p>
              )}
            </div>
          </div>
          {showInputs && (
            <button
              onClick={() => onHydratedChange?.(!hydrated)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                hydrated 
                  ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/50" 
                  : "bg-white/10 text-white/50 border border-white/20"
              }`}
            >
              {hydrated ? "✓" : "×"}
            </button>
          )}
        </div>

        {/* Recovery Score */}
        {recoveryScore !== null && recoveryScore !== undefined && (
          <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-pink-300" />
                <span className="text-sm text-white font-medium">Recuperación</span>
              </div>
              <span className="text-2xl font-bold text-white">{recoveryScore}%</span>
            </div>
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getRecoveryColor(recoveryScore)} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${recoveryScore}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-white/60 mt-2">{getRecoveryText(recoveryScore)}</p>
          </div>
        )}
      </div>
    </div>
  );
}