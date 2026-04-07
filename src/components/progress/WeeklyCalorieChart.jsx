import React, { useMemo } from "react";

const DAY_LABELS = {
  es: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  pt: ["Do", "Se", "Te", "Qu", "Qu", "Se", "Sá"],
};

function barColor(calories, goal) {
  if (calories === 0) return "rgba(255,255,255,0.1)";
  const pct = (calories / goal) * 100;
  if (pct < 80) return "#f59e0b";   // amber — under
  if (pct > 120) return "#ef4444";  // red — over
  return "#10b981";                  // green — on target
}

export default function WeeklyCalorieChart({ weekMeals, caloriesGoal, lang = "es" }) {
  const labels = DAY_LABELS[lang] || DAY_LABELS.es;

  // Build last-7-days array oldest→newest
  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i)); // 6 days ago → today
      return d.toISOString().split("T")[0];
    });
  }, []);

  // Sum calories per day
  const calsByDay = useMemo(() => {
    const map = {};
    for (const m of weekMeals) {
      map[m.date] = (map[m.date] || 0) + (m.estimated_calories || 0);
    }
    return map;
  }, [weekMeals]);

  const goal = caloriesGoal || 2000;

  // Max calories across all days for scaling (cap at 150% of goal)
  const maxCals = Math.max(goal * 1.5, ...days.map(d => calsByDay[d] || 0));

  const CHART_H = 80; // px height of bar area

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">
          {lang === "es" ? "Calorías — 7 días" : lang === "pt" ? "Calorias — 7 dias" : "Calories — 7 days"}
        </p>
        <span className="text-white/40 text-[10px]">
          {lang === "es" ? `Meta: ${goal} kcal` : lang === "pt" ? `Meta: ${goal} kcal` : `Goal: ${goal} kcal`}
        </span>
      </div>

      {/* Goal line label */}
      <div className="relative" style={{ height: `${CHART_H + 36}px` }}>
        {/* Goal dashed line */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-white/20 pointer-events-none"
          style={{ top: `${CHART_H - (goal / maxCals) * CHART_H}px` }}
        />

        {/* Bars row */}
        <div className="absolute bottom-8 left-0 right-0 flex items-end gap-1.5 px-0.5">
          {days.map((date, i) => {
            const cals = Math.round(calsByDay[date] || 0);
            const barH = cals > 0 ? Math.max(4, (cals / maxCals) * CHART_H) : 0;
            const color = barColor(cals, goal);
            const d = new Date(date + "T12:00:00");
            const dayIdx = d.getDay(); // 0=Sun
            const label = labels[dayIdx];

            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-0.5">
                {/* Calorie total above bar */}
                <span
                  className="text-[9px] font-bold leading-none"
                  style={{ color: cals > 0 ? color : "transparent" }}
                >
                  {cals > 0 ? cals : "·"}
                </span>

                {/* Bar */}
                <div
                  className="w-full rounded-t-md transition-all duration-700 ease-out"
                  style={{
                    height: `${barH}px`,
                    backgroundColor: color,
                    minHeight: cals > 0 ? "4px" : "0px",
                  }}
                />
                {/* Empty placeholder to keep alignment when bar is 0 */}
                {cals === 0 && (
                  <div className="w-full rounded-t-md" style={{ height: "0px", backgroundColor: "transparent" }} />
                )}

                {/* Day label */}
                <span className="text-white/40 text-[10px] mt-1">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-1 flex-wrap">
        {[
          { color: "#10b981", label: lang === "es" ? "En meta" : lang === "pt" ? "Na meta" : "On goal" },
          { color: "#f59e0b", label: lang === "es" ? "Bajo" : lang === "pt" ? "Abaixo" : "Under" },
          { color: "#ef4444", label: lang === "es" ? "Sobre" : lang === "pt" ? "Acima" : "Over" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-white/40 text-[10px]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}