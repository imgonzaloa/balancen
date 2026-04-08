import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const MEAL_TYPES = [
  { key: "breakfast", emoji: "🌅", label: { es: "Desayuno", en: "Breakfast", nl: "Ontbijt" } },
  { key: "lunch",     emoji: "☀️", label: { es: "Almuerzo", en: "Lunch",     nl: "Lunch"   } },
  { key: "dinner",    emoji: "🌙", label: { es: "Cena",     en: "Dinner",    nl: "Diner"   } },
  { key: "snack",     emoji: "🍎", label: { es: "Snack",    en: "Snack",     nl: "Snack"   } },
];

const T = {
  calories:    { es: "Calorías",  en: "Calories",  nl: "Calorieën" },
  protein:     { es: "Proteína",  en: "Protein",   nl: "Eiwit"     },
  carbs:       { es: "Carbohid.", en: "Carbs",      nl: "Koolhyd."  },
  fats:        { es: "Grasas",    en: "Fats",       nl: "Vetten"    },
  notes_ph:    { es: "Notas (opcional)...", en: "Notes (optional)...", nl: "Notities (optioneel)..." },
  save:        { es: "Guardar",   en: "Save",       nl: "Opslaan"   },
  delete:      { es: "Eliminar comida", en: "Delete meal", nl: "Maaltijd verwijderen" },
  confirm_del: { es: "¿Eliminar esta comida?", en: "Delete this meal?", nl: "Maaltijd verwijderen?" },
  confirm_yes: { es: "Eliminar",  en: "Delete",     nl: "Verwijderen" },
  confirm_no:  { es: "Cancelar",  en: "Cancel",     nl: "Annuleren" },
  edit_meal:   { es: "Editar comida", en: "Edit meal", nl: "Maaltijd bewerken" },
};

const t = (key, lang) => T[key]?.[lang] || T[key]?.en || key;

export default function MealEditModal({ meal, lang = "en", userEmail, onClose, onSaved, onDeleted }) {
  const queryClient = useQueryClient();

  const [mealType, setMealType] = useState(meal?.mealType || meal?.meal_type || "");
  const [calories, setCalories] = useState(String(Math.round(meal?.totals?.calories || meal?.estimated_calories || 0)));
  const [protein, setProtein] = useState(String(Math.round(meal?.totals?.protein || meal?.estimated_protein || 0)));
  const [carbs, setCarbs] = useState(String(Math.round(meal?.totals?.carbs || meal?.estimated_carbs || 0)));
  const [fats, setFats] = useState(String(Math.round(meal?.totals?.fats || meal?.estimated_fats || 0)));
  const [notes, setNotes] = useState(meal?.notes || "");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const mealId = meal?.id;
  const photoSrc = meal?.photoUri || meal?.photo_url || null;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["mealLogs"] });
  };

  const handleSave = async () => {
    if (!mealId) return;
    setSaving(true);
    await base44.entities.MealLog.update(mealId, {
      meal_type: mealType || undefined,
      estimated_calories: Number(calories) || 0,
      estimated_protein: Number(protein) || 0,
      estimated_carbs: Number(carbs) || 0,
      estimated_fats: Number(fats) || 0,
      notes: notes || undefined,
    });
    invalidate();
    setSaving(false);
    onSaved?.();
    onClose();
  };

  const handleDelete = async () => {
    if (!mealId) return;
    setSaving(true);
    await base44.entities.MealLog.delete(mealId);
    invalidate();
    setSaving(false);
    onDeleted?.();
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="relative w-full max-w-lg bg-slate-900 rounded-t-3xl border-t border-white/10 overflow-hidden"
          style={{ maxHeight: "92vh", overflowY: "auto" }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <div className="px-5 pb-8 pt-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-black text-lg">{t("edit_meal", lang)}</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform">
                <X size={16} className="text-white/70" />
              </button>
            </div>

            {/* Photo thumbnail */}
            {photoSrc && (
              <div className="mb-4">
                <img
                  src={photoSrc}
                  alt="Meal"
                  className="w-20 h-20 rounded-2xl object-cover border border-white/10"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
            )}

            {/* Meal type */}
            <div className="mb-5">
              <div className="grid grid-cols-4 gap-2">
                {MEAL_TYPES.map((mt) => (
                  <button
                    key={mt.key}
                    onClick={() => setMealType(mt.key)}
                    className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border transition-all active:scale-95 ${
                      mealType === mt.key
                        ? "bg-teal-500/25 border-teal-400/60 shadow-lg shadow-teal-500/10"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xl">{mt.emoji}</span>
                    <span className={`text-[10px] font-bold truncate w-full text-center px-1 ${mealType === mt.key ? "text-teal-300" : "text-white/60"}`}>
                      {mt.label[lang] || mt.label.en}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nutrition inputs */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { key: "calories", val: calories, set: setCalories, unit: "kcal", color: "text-teal-300" },
                { key: "protein",  val: protein,  set: setProtein,  unit: "g",    color: "text-blue-400"  },
                { key: "carbs",    val: carbs,    set: setCarbs,    unit: "g",    color: "text-amber-400" },
                { key: "fats",     val: fats,     set: setFats,     unit: "g",    color: "text-pink-400"  },
              ].map(({ key, val, set, unit, color }) => (
                <div key={key} className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <label className={`text-[10px] font-black uppercase tracking-wide ${color} block mb-1`}>
                    {t(key, lang)}
                  </label>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      min="0"
                      className="bg-transparent text-white font-black text-2xl w-full outline-none border-none"
                      style={{ WebkitAppearance: "none", MozAppearance: "textfield" }}
                    />
                    <span className="text-white/40 text-xs font-bold">{unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="mb-5">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 200))}
                placeholder={t("notes_ph", lang)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm placeholder-white/30 resize-none outline-none focus:border-teal-400/50 transition-colors"
              />
              <p className="text-white/30 text-xs text-right mt-1">{notes.length}/200</p>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black py-4 rounded-2xl mb-3 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? "..." : t("save", lang)}
            </button>

            {/* Delete */}
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="w-full flex items-center justify-center gap-2 text-red-400 font-bold py-3 rounded-2xl border border-red-500/20 bg-red-500/5 active:scale-[0.98] transition-all"
              >
                <Trash2 size={16} />
                {t("delete", lang)}
              </button>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                <p className="text-white font-bold text-sm text-center mb-3">{t("confirm_del", lang)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirming(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 text-white/70 font-bold text-sm active:scale-95 transition-all"
                  >
                    {t("confirm_no", lang)}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
                  >
                    {t("confirm_yes", lang)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}