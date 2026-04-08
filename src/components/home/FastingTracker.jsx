import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Timer, Play, Square } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const PRESETS = [
  { label: "16:8", hours: 16 },
  { label: "18:6", hours: 18 },
  { label: "20:4", hours: 20 },
  { label: "14:10", hours: 14 },
];

function getLabels(lang) {
  return {
    title: lang === "es" ? "Ayuno intermitente" : lang === "nl" ? "Intermittent vasten" : "Intermittent Fasting",
    fasting: lang === "es" ? "Ayunando" : lang === "nl" ? "Vasten" : "Fasting",
    eating: lang === "es" ? "Comiendo" : lang === "nl" ? "Eetvenster" : "Eating window",
    startFast: lang === "es" ? "Comenzar ayuno" : lang === "nl" ? "Start vasten" : "Start fasting",
    endFast: lang === "es" ? "Terminar ayuno" : lang === "nl" ? "Stop vasten" : "End fasting",
    goal: lang === "es" ? "Meta" : lang === "nl" ? "Doel" : "Goal",
    remaining: lang === "es" ? "restante" : lang === "nl" ? "resterend" : "remaining",
    completed: lang === "es" ? "¡Ayuno completado! 🎉" : lang === "nl" ? "Vasten voltooid! 🎉" : "Fast complete! 🎉",
    window: lang === "es" ? "Ventana de ayuno" : lang === "nl" ? "Vastenvenster" : "Fasting window",
  };
}

export default function FastingTracker({ profile, lang, onProfileUpdate }) {
  const [open, setOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);

  const fastingStart = profile?.fasting_start || null;
  const eatingWindowHours = profile?.eating_window_hours || 16;
  const goalSeconds = eatingWindowHours * 3600;
  const isActive = !!fastingStart;

  const labels = getLabels(lang);

  // Tick every second while fasting
  useEffect(() => {
    if (!isActive) { setElapsed(0); return; }
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(fastingStart).getTime()) / 1000);
      setElapsed(Math.max(0, diff));
    };
    update();
    timerRef.current = setInterval(update, 1000);
    return () => clearInterval(timerRef.current);
  }, [fastingStart, isActive]);

  const pct = Math.min((elapsed / goalSeconds) * 100, 100);
  const hours = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;
  const isComplete = elapsed >= goalSeconds;

  const circumference = 2 * Math.PI * 54; // r=54
  const strokeDash = (pct / 100) * circumference;

  const handleSetWindow = async (hours) => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      await base44.entities.UserProfile.update(profile.id, { eating_window_hours: hours });
      onProfileUpdate?.({ ...profile, eating_window_hours: hours });
    } catch {
      toast.error(lang === "es" ? "Error al guardar" : "Error saving");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      if (isActive) {
        await base44.entities.UserProfile.update(profile.id, { fasting_start: null });
        onProfileUpdate?.({ ...profile, fasting_start: null });
        toast.success(lang === "es" ? "Ayuno terminado" : lang === "nl" ? "Vasten gestopt" : "Fast ended");
      } else {
        const now = new Date().toISOString();
        await base44.entities.UserProfile.update(profile.id, { fasting_start: now });
        onProfileUpdate?.({ ...profile, fasting_start: now });
        toast.success(lang === "es" ? "Ayuno iniciado" : lang === "nl" ? "Vasten gestart" : "Fast started");
      }
    } catch {
      toast.error(lang === "es" ? "Error al guardar" : "Error saving");
    } finally {
      setSaving(false);
    }
  };

  const ringColor = isComplete ? "#34d399" : isActive ? "#14b8a6" : "#475569";

  return (
    <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 active:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? "bg-teal-500/20" : "bg-white/5"}`}>
            <Timer size={16} className={isActive ? "text-teal-300" : "text-white/40"} />
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-sm">{labels.title}</p>
            {isActive ? (
              <p className="text-teal-300 text-xs font-semibold">
                {String(hours).padStart(2,"0")}:{String(mins).padStart(2,"0")} {labels.fasting.toLowerCase()}
              </p>
            ) : (
              <p className="text-white/40 text-xs">{eatingWindowHours}h {labels.window.toLowerCase()}</p>
            )}
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5">
              {/* Circular timer */}
              <div className="flex flex-col items-center gap-3 pt-2">
                <div className="relative w-36 h-36">
                  <svg width="144" height="144" className="-rotate-90">
                    <circle cx="72" cy="72" r="54" stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="none" />
                    <circle
                      cx="72" cy="72" r="54"
                      stroke={ringColor}
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference - strokeDash}
                      style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {isActive ? (
                      <>
                        <p className="text-white font-black text-2xl leading-none">
                          {String(hours).padStart(2,"0")}:{String(mins).padStart(2,"0")}
                        </p>
                        <p className="text-white/40 text-xs mt-0.5">
                          {String(secs).padStart(2,"0")}s
                        </p>
                        <p className={`text-xs font-bold mt-1 ${isComplete ? "text-emerald-400" : "text-teal-300"}`}>
                          {Math.round(pct)}%
                        </p>
                      </>
                    ) : (
                      <>
                        <Timer size={24} className="text-white/20 mb-1" />
                        <p className="text-white/40 text-xs">{eatingWindowHours}h</p>
                      </>
                    )}
                  </div>
                </div>

                {isComplete && (
                  <p className="text-emerald-400 text-sm font-bold text-center">{labels.completed}</p>
                )}

                {isActive && !isComplete && (
                  <p className="text-white/50 text-xs text-center">
                    {Math.max(0, eatingWindowHours - hours)}h {Math.max(0, 59 - mins)}m {labels.remaining}
                  </p>
                )}
              </div>

              {/* Preset selector */}
              <div>
                <p className="text-white/50 text-xs font-bold uppercase tracking-wide mb-2">{labels.window}</p>
                <div className="flex gap-2">
                  {PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => handleSetWindow(p.hours)}
                      disabled={saving}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        eatingWindowHours === p.hours
                          ? "bg-teal-500 text-white shadow"
                          : "bg-white/8 text-white/50 border border-white/10 hover:border-white/30"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA button */}
              <button
                onClick={handleToggle}
                disabled={saving}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  isActive
                    ? "bg-red-500/20 border border-red-400/40 text-red-300 hover:bg-red-500/30"
                    : "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30"
                }`}
              >
                {isActive
                  ? <><Square size={14} />{labels.endFast}</>
                  : <><Play size={14} />{labels.startFast}</>
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}