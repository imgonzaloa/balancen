import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus } from "lucide-react";
import { getLocalDateKey } from "@/lib/utils";

function getTodayKey() {
  return `balancen_water_today_${getLocalDateKey()}`;
}

function loadWater() {
  try {
    const raw = localStorage.getItem(getTodayKey());
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

function saveWater(val) {
  try {
    localStorage.setItem(getTodayKey(), String(val));
  } catch {}
}

function Bar({ color, value, goal, label, unit = "g" }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-white/60 text-xs font-semibold">{label}</span>
        <span className="text-white/70 text-xs font-bold">
          {Math.round(value)}<span className="text-white/40">/{goal}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function MacroBreakdownBar({ protein, carbs, fats, lang, profile }) {
  const [open, setOpen] = useState(true);
  const [water, setWater] = useState(loadWater);

  // Reset water if date changed
  useEffect(() => {
    setWater(loadWater());
  }, []);

  const handleAddWater = (e) => {
    e.stopPropagation();
    setWater((prev) => {
      const next = Math.min(prev + 1, 20);
      saveWater(next);
      return next;
    });
  };

  // Goals from profile or sensible defaults
  const cal = profile?.calories_goal || 2000;
  const proteinGoal = Math.round((cal * 0.3) / 4);
  const carbsGoal = Math.round((cal * 0.4) / 4);
  const fatsGoal = Math.round((cal * 0.3) / 9);
  const waterGoal = 8;

  const label = {
    protein: lang === "nl" ? "Eiwit" : lang === "en" ? "Protein" : "Proteína",
    carbs: lang === "nl" ? "Koolhydraten" : lang === "en" ? "Carbs" : "Carbohidratos",
    fats: lang === "nl" ? "Vetten" : lang === "en" ? "Fats" : "Grasas",
    water: lang === "nl" ? "Water" : lang === "en" ? "Water" : "Agua",
    title: lang === "nl" ? "Macro's & Hydratatie" : lang === "en" ? "Macros & Hydration" : "Macros & Hidratación",
  };

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header — tappable */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 active:bg-white/5 transition-colors"
      >
        <span className="text-white/70 text-xs font-bold uppercase tracking-wide">{label.title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={16} className="text-white/40" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
              <Bar color="bg-blue-400" value={protein} goal={proteinGoal} label={label.protein} />
              <Bar color="bg-amber-400" value={carbs} goal={carbsGoal} label={label.carbs} />
              <Bar color="bg-rose-400" value={fats} goal={fatsGoal} label={label.fats} />

              {/* Water row */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-xs font-semibold">{label.water}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/70 text-xs font-bold">
                      {water}<span className="text-white/40">/{waterGoal} 🥛</span>
                    </span>
                    <button
                      onClick={handleAddWater}
                      className="w-5 h-5 rounded-full bg-cyan-500/30 border border-cyan-400/40 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Plus size={11} className="text-cyan-300" />
                    </button>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-cyan-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((water / waterGoal) * 100, 100)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}