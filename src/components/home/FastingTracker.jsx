import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Timer, Play, Square, Clock } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "balancen_fasting";

const PRESETS = [
  { label: "16:8", hours: 16 },
  { label: "18:6", hours: 18 },
  { label: "20:4", hours: 20 },
];

const txt = {
  title:       { es: "⏱ Ayuno intermitente", en: "⏱ Intermittent Fasting", nl: "⏱ Intermittent vasten" },
  startFast:   { es: "Iniciar ayuno",   en: "Start fast",   nl: "Vast starten" },
  breakFast:   { es: "Romper ayuno",    en: "Break fast",   nl: "Vast breken" },
  fasting:     { es: "Ayunando",        en: "Fasting",      nl: "Aan het vasten" },
  eating:      { es: "Ventana de comida", en: "Eating window", nl: "Eetvenster actief" },
  remaining:   { es: "restante",        en: "remaining",    nl: "resterend" },
  ends:        { es: "Termina a las",   en: "Ends at",      nl: "Eindigt om" },
  goal:        { es: "Meta",            en: "Goal",         nl: "Doel" },
  custom:      { es: "Horas personalizadas", en: "Custom hours", nl: "Aangepast" },
  completed:   { es: "¡Ayuno completado! 🎉", en: "Fast complete! 🎉", nl: "Vasten voltooid! 🎉" },
  started:     { es: "¡Ayuno iniciado!", en: "Fast started!", nl: "Vasten gestart!" },
  broken:      { es: "Ayuno terminado", en: "Fast ended",   nl: "Vasten gestopt" },
  window:      { es: "Protocolo",       en: "Protocol",     nl: "Protocol" },
};
const T = (key, lang) => txt[key]?.[lang] || txt[key]?.en || "";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { fasting_start_time: null, eating_window: 16 };
  } catch {
    return { fasting_start_time: null, eating_window: 16 };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatHHMM(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function FastingTracker({ lang = "en" }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(loadState);
  const [elapsed, setElapsed] = useState(0);
  const [customHours, setCustomHours] = useState("");
  const timerRef = useRef(null);

  const { fasting_start_time, eating_window } = state;
  const goalSeconds = eating_window * 3600;
  const isActive = !!fasting_start_time;

  // After fasting goal is reached, we're in the eating window
  const isEating = isActive && elapsed >= goalSeconds;
  const eatWindowGoalSeconds = (24 - eating_window) * 3600;

  // Tick
  useEffect(() => {
    if (!isActive) { setElapsed(0); clearInterval(timerRef.current); return; }
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(fasting_start_time).getTime()) / 1000);
      setElapsed(Math.max(0, diff));
    };
    update();
    timerRef.current = setInterval(update, 1000);
    return () => clearInterval(timerRef.current);
  }, [fasting_start_time, isActive]);

  const update = useCallback((patch) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      saveState(next);
      return next;
    });
  }, []);

  const handleStartFast = () => {
    update({ fasting_start_time: new Date().toISOString() });
    toast.success(T("started", lang));
  };

  const handleBreakFast = () => {
    update({ fasting_start_time: null });
    toast.success(T("broken", lang));
  };

  const handlePreset = (hours) => {
    update({ eating_window: hours });
  };

  const handleCustom = () => {
    const h = parseFloat(customHours);
    if (!h || h < 1 || h > 23) return;
    update({ eating_window: h });
    setCustomHours("");
  };

  // Progress values
  let ringPct, ringColor, displayHours, displayMins, displaySecs, centerLabel, remainingLabel, endTimeLabel;
  const circumference = 2 * Math.PI * 54;

  if (!isActive) {
    ringPct = 0;
    ringColor = "#475569";
  } else if (!isEating) {
    // Fasting phase
    ringPct = Math.min((elapsed / goalSeconds) * 100, 100);
    ringColor = ringPct >= 100 ? "#34d399" : "#14b8a6";
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    displayHours = h; displayMins = m; displaySecs = s;
    const endTime = new Date(new Date(fasting_start_time).getTime() + goalSeconds * 1000);
    endTimeLabel = `${T("ends", lang)} ${formatHHMM(endTime)}`;
    const remSec = Math.max(0, goalSeconds - elapsed);
    const rh = Math.floor(remSec / 3600);
    const rm = Math.floor((remSec % 3600) / 60);
    remainingLabel = `${rh}h ${rm}m ${T("remaining", lang)}`;
    centerLabel = T("fasting", lang);
  } else {
    // Eating window phase — count elapsed since eating started
    const eatElapsed = elapsed - goalSeconds;
    ringPct = Math.min((eatElapsed / eatWindowGoalSeconds) * 100, 100);
    ringColor = "#10b981";
    const h = Math.floor(eatElapsed / 3600);
    const m = Math.floor((eatElapsed % 3600) / 60);
    const s = eatElapsed % 60;
    displayHours = h; displayMins = m; displaySecs = s;
    const remSec = Math.max(0, eatWindowGoalSeconds - eatElapsed);
    const rh = Math.floor(remSec / 3600);
    const rm = Math.floor((remSec % 3600) / 60);
    remainingLabel = `${rh}h ${rm}m ${T("remaining", lang)}`;
    centerLabel = T("eating", lang);
  }

  const strokeDash = (ringPct / 100) * circumference;

  return (
    <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 active:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? (isEating ? "bg-emerald-500/20" : "bg-teal-500/20") : "bg-white/5"}`}>
            <Timer size={16} className={isActive ? (isEating ? "text-emerald-300" : "text-teal-300") : "text-white/40"} />
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-sm">{T("title", lang)}</p>
            {isActive ? (
              <p className={`text-xs font-semibold ${isEating ? "text-emerald-300" : "text-teal-300"}`}>
                {isEating ? T("eating", lang) : `${String(displayHours).padStart(2,"0")}:${String(displayMins).padStart(2,"0")} ${T("fasting", lang).toLowerCase()}`}
              </p>
            ) : (
              <p className="text-white/40 text-xs">{eating_window}h {T("goal", lang).toLowerCase()}</p>
            )}
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
      </button>

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

              {/* Ring */}
              <div className="flex flex-col items-center gap-2 pt-2">
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
                          {String(displayHours).padStart(2,"0")}:{String(displayMins).padStart(2,"0")}
                        </p>
                        <p className="text-white/40 text-[11px] mt-0.5">{String(displaySecs).padStart(2,"0")}s</p>
                        <p className={`text-[10px] font-bold mt-0.5 ${isEating ? "text-emerald-400" : "text-teal-300"}`}>
                          {centerLabel}
                        </p>
                      </>
                    ) : (
                      <>
                        <Clock size={22} className="text-white/20 mb-1" />
                        <p className="text-white/40 text-xs">{eating_window}h</p>
                      </>
                    )}
                  </div>
                </div>

                {isActive && remainingLabel && (
                  <p className="text-white/50 text-xs text-center">{remainingLabel}</p>
                )}
                {isActive && endTimeLabel && (
                  <p className="text-white/40 text-[11px] text-center flex items-center gap-1">
                    <Clock size={10} />{endTimeLabel}
                  </p>
                )}
                {isActive && isEating && (
                  <p className="text-emerald-400 text-xs font-bold">{T("completed", lang)}</p>
                )}
              </div>

              {/* Protocol selector */}
              <div>
                <p className="text-white/50 text-xs font-bold uppercase tracking-wide mb-2">{T("window", lang)}</p>
                <div className="flex gap-2 mb-2">
                  {PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => handlePreset(p.hours)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        eating_window === p.hours
                          ? "bg-teal-500 text-white shadow"
                          : "bg-white/8 text-white/50 border border-white/10 hover:border-white/30"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {/* Custom input */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={23}
                    value={customHours}
                    onChange={e => setCustomHours(e.target.value)}
                    placeholder={T("custom", lang)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder-white/25 focus:outline-none focus:border-teal-400"
                  />
                  <button
                    onClick={handleCustom}
                    className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white/70 text-xs font-bold hover:bg-white/20 transition-colors"
                  >
                    OK
                  </button>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex gap-2">
                {!isActive ? (
                  <button
                    onClick={handleStartFast}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30 active:scale-[0.98] transition-all"
                  >
                    <Play size={14} />{T("startFast", lang)}
                  </button>
                ) : (
                  <button
                    onClick={handleBreakFast}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-red-500/20 border border-red-400/40 text-red-300 hover:bg-red-500/30 active:scale-[0.98] transition-all"
                  >
                    <Square size={14} />{T("breakFast", lang)}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}