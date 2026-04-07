import React, { useMemo } from "react";

const LABELS = {
  es: { title: "Consistencia esta semana", days: ["Lu","Ma","Mi","Ju","Vi","Sa","Do"] },
  en: { title: "This week's consistency",  days: ["Mo","Tu","We","Th","Fr","Sa","Su"] },
  pt: { title: "Consistência esta semana", days: ["Se","Te","Qu","Qu","Se","Sá","Do"] },
};

const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function WeeklyConsistencyCard({ weekMeals, lang = "es" }) {
  const l = LABELS[lang] || LABELS.es;

  // Build Mon→Sun for the current ISO week
  const weekDays = useMemo(() => {
    const today = new Date();
    // day of week: 0=Sun…6=Sat → shift so Mon=0
    const dow = (today.getDay() + 6) % 7; // Mon=0, Sun=6
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - dow + i);
      return d.toISOString().split("T")[0];
    });
  }, []);

  const loggedDates = useMemo(() => new Set(weekMeals.map(m => m.date)), [weekMeals]);

  const daysLogged = weekDays.filter(d => loggedDates.has(d)).length;
  const pct = Math.round((daysLogged / 7) * 100);
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
      <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-4">{l.title}</p>

      <div className="flex items-center gap-6">
        {/* Ring */}
        <div className="relative flex-shrink-0 w-24 h-24">
          <svg width="96" height="96" className="-rotate-90" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="48" cy="48" r={RADIUS} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
            <circle
              cx="48" cy="48" r={RADIUS}
              stroke="#14b8a6"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">{pct}%</span>
            <span className="text-[10px] text-white/40">{daysLogged}/7</span>
          </div>
        </div>

        {/* Day dots */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            {weekDays.map((date, i) => {
              const logged = loggedDates.has(date);
              const isToday = date === today;
              return (
                <div key={date} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                      logged
                        ? "bg-teal-500 border-teal-400"
                        : isToday
                        ? "bg-transparent border-teal-500/50"
                        : "bg-transparent border-white/15"
                    }`}
                  >
                    {logged && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5 L4.2 7.5 L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-[9px] ${isToday ? "text-teal-400 font-bold" : "text-white/30"}`}>
                    {l.days[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}