import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Camera, TrendingUp, CheckCircle } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { Button } from "@/components/ui/button";

export default function PrecisionModal({ isOpen, onClose, confidence }) {
  const { lang } = useTranslation();

  const tips = [
    {
      icon: Camera,
      title: lang === "es" ? "Fotos claras" : "Clear photos",
      desc: lang === "es" 
        ? "Tomá fotos con buena iluminación y ángulo directo"
        : "Take photos with good lighting and direct angle",
    },
    {
      icon: Target,
      title: lang === "es" ? "Porciones visibles" : "Visible portions",
      desc: lang === "es"
        ? "Mostrá el plato completo para mejor estimación"
        : "Show the whole plate for better estimation",
    },
    {
      icon: TrendingUp,
      title: lang === "es" ? "Contexto" : "Context",
      desc: lang === "es"
        ? "Incluí objetos de referencia como tenedores o vasos"
        : "Include reference objects like forks or glasses",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-white/20 shadow-2xl z-50 p-6 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center mb-4 border border-teal-500/30">
                  <Target size={32} className="text-teal-300" />
                </div>
                <h2 className="text-white font-bold text-2xl mb-2">
                  {lang === "es" ? "Precisión de IA" : "AI Precision"}
                </h2>
                <p className="text-white/70 leading-relaxed">
                  {lang === "es"
                    ? "Nuestra IA analiza tus fotos para estimar calorías y macros. La precisión actual es del "
                    : "Our AI analyzes your photos to estimate calories and macros. Current precision is "}
                  <span className="text-teal-300 font-bold">{confidence}%</span>
                </p>
              </div>

              {/* How it works */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-400" />
                  {lang === "es" ? "Cómo funciona" : "How it works"}
                </h3>
                <ul className="space-y-2 text-white/70 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 mt-1">•</span>
                    <span>
                      {lang === "es"
                        ? "Detectamos ingredientes y porciones"
                        : "We detect ingredients and portions"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 mt-1">•</span>
                    <span>
                      {lang === "es"
                        ? "Estimamos calorías basado en bases de datos nutricionales"
                        : "We estimate calories based on nutritional databases"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 mt-1">•</span>
                    <span>
                      {lang === "es"
                        ? "Calculamos macronutrientes (proteína, carbos, grasas)"
                        : "We calculate macronutrients (protein, carbs, fats)"}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Tips to improve */}
              <div>
                <h3 className="text-white font-semibold mb-4">
                  {lang === "es" ? "Mejorá la precisión" : "Improve precision"}
                </h3>
                <div className="space-y-3">
                  {tips.map((tip, idx) => {
                    const Icon = tip.icon;
                    return (
                      <div
                        key={idx}
                        className="bg-white/5 rounded-xl p-4 border border-white/10"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                            <Icon size={20} className="text-teal-300" />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm mb-1">
                              {tip.title}
                            </p>
                            <p className="text-white/60 text-xs">{tip.desc}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold h-12 rounded-xl"
              >
                {lang === "es" ? "Entendido" : "Got it"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}