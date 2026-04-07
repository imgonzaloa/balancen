import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const LABELS = {
  es: {
    title: "Misiones de hoy",
    missions: [
      "Registrá una comida",
      "Mantente dentro de tu meta",
      "Registrá 3 comidas",
      "Compartí una comida con amigos",
      "Alcanzá tu meta de agua",
    ],
    perfect: "Día perfecto 🔥",
    perfectSub: "¡Completaste todas las misiones de hoy!",
  },
  en: {
    title: "Today's missions",
    missions: [
      "Log a meal",
      "Stay within your goal",
      "Log 3 meals",
      "Share a meal with friends",
      "Reach your water goal",
    ],
    perfect: "Perfect day 🔥",
    perfectSub: "You completed all of today's missions!",
  },
  pt: {
    title: "Missões de hoje",
    missions: [
      "Registre uma refeição",
      "Fique dentro da sua meta",
      "Registre 3 refeições",
      "Compartilhe uma refeição com amigos",
      "Alcance sua meta de água",
    ],
    perfect: "Dia perfeito 🔥",
    perfectSub: "Você completou todas as missões de hoje!",
  },
};

function getTodayWaterKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `balancen_water_today_${y}-${m}-${day}`;
}

function CheckIcon({ done }) {
  return (
    <motion.div
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        done ? "bg-teal-500 border-teal-400" : "border-white/30"
      }`}
      animate={done ? { scale: [1, 1.35, 0.9, 1.1, 1] } : { scale: 1 }}
      transition={done ? { type: "spring", stiffness: 350, damping: 12, duration: 0.5 } : {}}
    >
      <AnimatePresence>
        {done && (
          <motion.svg
            key="check"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            width="10" height="10" viewBox="0 0 10 10" fill="none"
          >
            <motion.path
              d="M2 5 L4.2 7.5 L8 3"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25 }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DailyMissionsPanel({ lang = "es", mealCount, caloriesProgress, userEmail, onNavigate }) {
  const l = LABELS[lang] || LABELS.es;
  const today = new Date().toISOString().split("T")[0];
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [prevAllDone, setPrevAllDone] = useState(false);

  // Read water from localStorage (same key as MacroBreakdownBar)
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(getTodayWaterKey());
        setWaterGlasses(raw ? parseInt(raw, 10) : 0);
      } catch { setWaterGlasses(0); }
    };
    read();
    // Poll every 5s to pick up changes from MacroBreakdownBar
    const id = setInterval(read, 5000);
    return () => clearInterval(id);
  }, []);

  // Check if user has a post from today
  const { data: todayPosts = [] } = useQuery({
    queryKey: ["todayPosts", userEmail, today],
    queryFn: () => base44.entities.Post.filter({ created_by: userEmail }),
    enabled: !!userEmail,
    staleTime: 60000,
    select: (posts) => posts.filter(p => p.created_date?.startsWith(today)),
  });

  const missions = [
    { label: l.missions[0], done: mealCount >= 1, nav: "CameraScreen" },
    { label: l.missions[1], done: caloriesProgress >= 80 && caloriesProgress <= 120, nav: "Progress" },
    { label: l.missions[2], done: mealCount >= 3, nav: "CameraScreen" },
    { label: l.missions[3], done: todayPosts.length >= 1, nav: "Social" },
    { label: l.missions[4], done: waterGlasses >= 8, nav: null },
  ];

  const completedCount = missions.filter(m => m.done).length;
  const allDone = completedCount === 5;

  // Trigger celebration only when transitioning to all-done
  const [showCelebration, setShowCelebration] = useState(false);
  useEffect(() => {
    if (allDone && !prevAllDone) setShowCelebration(true);
    setPrevAllDone(allDone);
  }, [allDone]);

  return (
    <div className="bg-gradient-to-br from-amber-500/15 to-orange-500/15 backdrop-blur-xl rounded-2xl p-5 border border-amber-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/80 text-xs font-bold uppercase tracking-wide">{l.title}</p>
        <span className={`text-xs font-black ${allDone ? "text-amber-300" : "text-amber-300/70"}`}>
          {completedCount}/5
        </span>
      </div>

      {/* Perfect day celebration */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            key="perfect"
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mb-3 bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-400/40 rounded-xl px-4 py-2.5 text-center"
          >
            <p className="text-amber-200 font-black text-sm">{l.perfect}</p>
            <p className="text-amber-300/70 text-xs mt-0.5">{l.perfectSub}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mission list */}
      <div className="space-y-2">
        {missions.map((m, i) => (
          <button
            key={i}
            onClick={() => m.nav && onNavigate?.(m.nav)}
            className={`flex items-center gap-3 w-full py-1 px-2 -mx-2 rounded-xl transition-colors ${
              m.nav ? "hover:bg-white/5 active:scale-95 cursor-pointer" : "cursor-default"
            }`}
          >
            <CheckIcon done={m.done} />
            <span className={`text-xs text-left ${m.done ? "text-white/90 font-semibold line-through decoration-white/30" : "text-white/50"}`}>
              {m.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}