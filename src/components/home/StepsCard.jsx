import React, { useEffect, useState } from "react";
import { Footprints } from "lucide-react";
import { readStepsFromHealth, isHealthAvailable } from "@/lib/healthKit";

export default function StepsCard({ lang }) {
  const [data, setData] = useState(null); // { steps, caloriesBurned }
  const [notAvailable, setNotAvailable] = useState(false);

  useEffect(() => {
    if (!isHealthAvailable()) {
      setNotAvailable(true);
      return;
    }
    readStepsFromHealth().then((result) => {
      if (result) setData(result);
      else setNotAvailable(true);
    });
  }, []);

  const unavailableMsg =
    lang === 'nl' ? 'Beschikbaar in de native iOS/Android app'
    : lang === 'es' ? 'Disponible en la app nativa iOS/Android'
    : 'Available in the native iOS/Android app';

  return (
    <div className="bg-gradient-to-br from-emerald-500/15 to-teal-500/10 backdrop-blur-xl rounded-2xl p-4 border border-emerald-500/20 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
        <Footprints size={20} className="text-emerald-300" strokeWidth={2} />
      </div>
      {notAvailable ? (
        <p className="text-white/40 text-xs leading-relaxed flex-1">{unavailableMsg}</p>
      ) : data ? (
        <div className="flex-1">
          <p className="text-emerald-200 font-black text-sm">
            {lang === 'es' ? `Pasos hoy: ${data.steps.toLocaleString()}` : lang === 'nl' ? `Stappen vandaag: ${data.steps.toLocaleString()}` : `Steps today: ${data.steps.toLocaleString()}`}
          </p>
          <p className="text-emerald-300/60 text-xs mt-0.5">
            {lang === 'es' ? `Calorías quemadas estimadas: ${data.caloriesBurned} kcal` : lang === 'nl' ? `Geschatte verbrande calorieën: ${data.caloriesBurned} kcal` : `Estimated calories burned: ${data.caloriesBurned} kcal`}
          </p>
        </div>
      ) : (
        <p className="text-white/30 text-xs flex-1">
          {lang === 'es' ? 'Cargando pasos...' : lang === 'nl' ? 'Stappen laden...' : 'Loading steps...'}
        </p>
      )}
    </div>
  );
}