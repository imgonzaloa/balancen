import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const CACHE_PREFIX = "balancen_ai_insight_";

const labels = {
  es: { title: "Consejo del día", cta: "Ver mi plan completo", loading: "Generando tu consejo de hoy..." },
  en: { title: "Daily insight", cta: "View my full plan", loading: "Generating your daily insight..." },
  nl: { title: "Dagelijks inzicht", cta: "Mijn volledige plan bekijken", loading: "Je dagelijkse inzicht genereren..." },
};

export default function DailyAIInsightCard({ lang, onViewPlan }) {
  const l = labels[lang] || labels.es;
  const today = new Date().toISOString().split("T")[0];
  const cacheKey = `${CACHE_PREFIX}${today}`;

  const [insight, setInsight] = useState(() => {
    try { return localStorage.getItem(cacheKey) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(!insight);

  useEffect(() => {
    if (insight) return;
    let cancelled = false;
    const fetch = async () => {
      try {
        const res = await base44.functions.invoke("aiGoalsAssistant", { lang, mode: "daily_insight" });
        const text = res?.data?.insight || res?.data?.message || res?.data?.text || null;
        if (!cancelled && text) {
          setInsight(text);
          try { localStorage.setItem(cacheKey, text); } catch {}
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-gradient-to-br from-purple-500/15 to-pink-500/15 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/25">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
          <Sparkles size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-purple-300 font-bold text-xs uppercase tracking-wide mb-2">{l.title}</p>

          {loading ? (
            <div className="space-y-2">
              <div className="h-3 bg-white/10 rounded-full animate-pulse w-full" />
              <div className="h-3 bg-white/10 rounded-full animate-pulse w-4/5" />
              <div className="h-3 bg-white/10 rounded-full animate-pulse w-3/5" />
            </div>
          ) : insight ? (
            <p className="text-white/90 text-sm leading-relaxed">{insight}</p>
          ) : null}
        </div>
      </div>

      {!loading && (
        <div className="mt-4">
          <Button
            onClick={onViewPlan}
            className="w-full h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-[0.98]"
          >
            {l.cta}
          </Button>
        </div>
      )}
    </div>
  );
}