import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";

function calcCalories({ gender, weight_kg, height_cm, age, activity_level }) {
  const w = parseFloat(weight_kg);
  const h = parseFloat(height_cm);
  const a = parseFloat(age);
  if (!w || !h || !a) return null;
  const bmr = gender === "female"
    ? 10 * w + 6.25 * h - 5 * a - 161
    : 10 * w + 6.25 * h - 5 * a + 5;
  const multipliers = { sedentary: 1.2, light: 1.375, active: 1.55, very_active: 1.725 };
  return Math.round(bmr * (multipliers[activity_level] || 1.375));
}

const ACTIVITY_OPTIONS = [
  { value: "sedentary",  labels: { es: "Sedentario", en: "Sedentary", pt: "Sedentário" } },
  { value: "light",      labels: { es: "Poco activo", en: "Lightly active", pt: "Pouco ativo" } },
  { value: "active",     labels: { es: "Activo", en: "Active", pt: "Ativo" } },
  { value: "very_active",labels: { es: "Muy activo", en: "Very active", pt: "Muito ativo" } },
];

export default function BodyGoalsFields({ profile, updateMutation, lang }) {
  const l = lang || "en";

  const [fields, setFields] = useState({
    height_cm: profile?.height_cm || profile?.height || "",
    weight_kg: profile?.weight_kg || profile?.weight || "",
    age: profile?.age || "",
    gender: profile?.gender || null,
    activity_level: profile?.activity_level || null,
  });

  // Sync when profile loads
  useEffect(() => {
    if (!profile) return;
    setFields({
      height_cm: profile.height_cm || profile.height || "",
      weight_kg: profile.weight_kg || profile.weight || "",
      age: profile.age || "",
      gender: profile.gender || null,
      activity_level: profile.activity_level || null,
    });
  }, [profile?.id]);

  const handleSave = (updated) => {
    const merged = { ...fields, ...updated };
    setFields(merged);
    const calories = calcCalories(merged);
    const payload = {
      height_cm: merged.height_cm ? parseFloat(merged.height_cm) : undefined,
      weight_kg: merged.weight_kg ? parseFloat(merged.weight_kg) : undefined,
      age: merged.age ? parseInt(merged.age) : undefined,
      gender: merged.gender,
      activity_level: merged.activity_level,
    };
    if (calories) payload.calories_goal = calories;
    updateMutation.mutate(payload);
  };

  const inputCls = "w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-teal-300 outline-none text-base";
  const toggleBase = "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border";
  const activeToggle = "bg-teal-500/30 border-teal-400/60 text-teal-200";
  const inactiveToggle = "bg-white/5 border-white/20 text-white/60 hover:border-white/40";

  const labels = {
    height: { es: "Altura (cm)", en: "Height (cm)", pt: "Altura (cm)" }[l],
    weight: { es: "Peso (kg)", en: "Weight (kg)", pt: "Peso (kg)" }[l],
    age:    { es: "Edad", en: "Age", pt: "Idade" }[l],
    gender: { es: "Género", en: "Gender", pt: "Gênero" }[l],
    male:   { es: "Hombre", en: "Male", pt: "Masculino" }[l],
    female: { es: "Mujer", en: "Female", pt: "Feminino" }[l],
    activity: { es: "Nivel de actividad", en: "Activity level", pt: "Nível de atividade" }[l],
    calculated: { es: "Calorías calculadas automáticamente al guardar.", en: "Calories will be recalculated automatically on save.", pt: "Calorias serão recalculadas automaticamente ao salvar." }[l],
  };

  return (
    <div className="space-y-4">
      {/* Height & Weight */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-white/80 text-xs mb-1.5 block">{labels.height}</Label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="170"
            value={fields.height_cm}
            onChange={e => setFields(f => ({ ...f, height_cm: e.target.value }))}
            onBlur={() => handleSave({})}
            className={inputCls}
          />
        </div>
        <div>
          <Label className="text-white/80 text-xs mb-1.5 block">{labels.weight}</Label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="70"
            value={fields.weight_kg}
            onChange={e => setFields(f => ({ ...f, weight_kg: e.target.value }))}
            onBlur={() => handleSave({})}
            className={inputCls}
          />
        </div>
      </div>

      {/* Age */}
      <div>
        <Label className="text-white/80 text-xs mb-1.5 block">{labels.age}</Label>
        <input
          type="number"
          inputMode="numeric"
          placeholder="25"
          value={fields.age}
          onChange={e => setFields(f => ({ ...f, age: e.target.value }))}
          onBlur={() => handleSave({})}
          className={inputCls}
        />
      </div>

      {/* Gender */}
      <div>
        <Label className="text-white/80 text-xs mb-1.5 block">{labels.gender}</Label>
        <div className="flex gap-2">
          {["male", "female"].map(g => (
            <button
              key={g}
              onClick={() => handleSave({ gender: g })}
              className={`${toggleBase} ${fields.gender === g ? activeToggle : inactiveToggle}`}
            >
              {g === "male" ? `👨 ${labels.male}` : `👩 ${labels.female}`}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Level */}
      <div>
        <Label className="text-white/80 text-xs mb-1.5 block">{labels.activity}</Label>
        <div className="grid grid-cols-2 gap-2">
          {ACTIVITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSave({ activity_level: opt.value })}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border text-left ${
                fields.activity_level === opt.value ? activeToggle : inactiveToggle
              }`}
            >
              {opt.labels[l] || opt.labels.en}
            </button>
          ))}
        </div>
      </div>

      <p className="text-white/30 text-xs">{labels.calculated}</p>
    </div>
  );
}