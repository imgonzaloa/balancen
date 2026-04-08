import React, { useState } from "react";
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getLocalDateKey } from "@/lib/utils";

function Sparkline({ data }) {
  if (!data || data.length < 2) return null;
  const values = data.map(d => d.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 80, H = 32;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  });

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="#14b8a6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* last dot */}
      {(() => {
        const last = points[points.length - 1].split(",");
        return <circle cx={last[0]} cy={last[1]} r="3" fill="#14b8a6" />;
      })()}
    </svg>
  );
}

function WeightLogModal({ onClose, onSaved, lang }) {
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const val = parseFloat(weight);
    if (!val || val < 20 || val > 300) {
      toast.error(lang === 'es' ? 'Ingresa un peso válido' : lang === 'nl' ? 'Voer een geldig gewicht in' : 'Enter a valid weight');
      return;
    }
    setSaving(true);
    try {
      await base44.entities.ProgressSnapshot.create({
        date: getLocalDateKey(),
        weight: val,
      });
      toast.success(lang === 'es' ? `Peso guardado: ${val} kg` : lang === 'nl' ? `Gewicht opgeslagen: ${val} kg` : `Weight saved: ${val} kg`);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-t-3xl p-6 pb-10"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
        <h3 className="text-white font-black text-lg mb-5 text-center">
          {lang === 'es' ? 'Registrar peso' : lang === 'nl' ? 'Gewicht registreren' : 'Log Weight'}
        </h3>
        <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3 border border-white/10 mb-5">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="20"
            max="300"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="0.0"
            autoFocus
            className="flex-1 bg-transparent text-white font-black text-4xl text-center focus:outline-none placeholder-white/20"
          />
          <span className="text-white/50 font-bold text-lg">kg</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !weight}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black text-lg shadow-xl shadow-teal-500/30 active:scale-95 disabled:opacity-50 transition-transform"
        >
          {saving ? '...' : (lang === 'es' ? 'Guardar' : lang === 'nl' ? 'Opslaan' : 'Save')}
        </button>
      </div>
    </div>
  );
}

export default function WeightTrackingCard({ snapshots = [], lang, userEmail }) {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  // Sort by date ascending, take last 7
  const sorted = [...snapshots]
    .filter(s => s.weight)
    .sort((a, b) => a.date.localeCompare(b.date));
  const last7 = sorted.slice(-7);
  const current = last7[last7.length - 1];
  const previous = last7[last7.length - 2];

  const diff = current && previous ? +(current.weight - previous.weight).toFixed(1) : null;
  const diffColor = diff === null ? '' : diff < 0 ? 'text-emerald-400' : diff > 0 ? 'text-red-400' : 'text-white/50';
  const DiffIcon = diff === null ? null : diff < 0 ? TrendingDown : diff > 0 ? TrendingUp : Minus;

  return (
    <>
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">
            {lang === 'es' ? 'Peso actual' : lang === 'nl' ? 'Huidig gewicht' : 'Weight'}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center hover:bg-teal-500/40 active:scale-90 transition-all"
          >
            <Plus size={16} className="text-teal-300" />
          </button>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            {current ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-white">{current.weight}</span>
                  <span className="text-white/50 font-bold text-base">kg</span>
                </div>
                {diff !== null && (
                  <div className={`flex items-center gap-1 mt-1 ${diffColor}`}>
                    {DiffIcon && <DiffIcon size={13} strokeWidth={2.5} />}
                    <span className="text-sm font-bold">
                      {diff > 0 ? '+' : ''}{diff} kg
                    </span>
                    <span className="text-white/30 text-xs font-medium ml-0.5">
                      {lang === 'es' ? 'vs anterior' : lang === 'nl' ? 'vs vorige' : 'vs last'}
                    </span>
                  </div>
                )}
                {!current && (
                  <p className="text-white/40 text-sm mt-1">
                    {lang === 'es' ? 'Sin datos aún' : lang === 'nl' ? 'Nog geen data' : 'No data yet'}
                  </p>
                )}
              </>
            ) : (
              <p className="text-white/40 text-sm">
                {lang === 'es' ? 'Registra tu peso con +' : lang === 'nl' ? 'Log je gewicht met +' : 'Log your weight with +'}
              </p>
            )}
          </div>

          {last7.length >= 2 && (
            <div className="flex-shrink-0 pb-1">
              <Sparkline data={last7} />
              <p className="text-white/30 text-[10px] text-right mt-1">
                {lang === 'es' ? 'últimas 7' : lang === 'nl' ? 'laatste 7' : 'last 7'}
              </p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <WeightLogModal
          lang={lang}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ['progressSnapshots', userEmail] });
          }}
        />
      )}
    </>
  );
}