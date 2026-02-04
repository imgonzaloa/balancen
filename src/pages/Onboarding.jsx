import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Target, Users, User, Zap, Leaf, Mountain, ArrowRight, Check } from "lucide-react";

const steps = [
  {
    id: "goal",
    title: "¿Cuál es tu meta principal?",
    subtitle: "Esto nos ayuda a personalizar tu experiencia",
    options: [
      { value: "consistency", label: "Ser más consistente", icon: Target, color: "bg-teal-500" },
      { value: "eat_better", label: "Comer mejor", icon: Leaf, color: "bg-emerald-500" },
      { value: "move_more", label: "Moverme más", icon: Zap, color: "bg-orange-500" },
    ],
  },
  {
    id: "mode",
    title: "¿Cómo quieres usar la app?",
    subtitle: "Puedes cambiar esto después",
    options: [
      { value: "solo", label: "Solo", description: "A mi ritmo", icon: User, color: "bg-indigo-500" },
      { value: "with_friends", label: "Con amigos", description: "Juntos es mejor", icon: Users, color: "bg-pink-500" },
    ],
  },
  {
    id: "intensity",
    title: "¿Qué intensidad prefieres?",
    subtitle: "Empieza fácil, ajusta después",
    options: [
      { value: "easy", label: "Fácil", description: "Sin presión", icon: Leaf, color: "bg-green-500" },
      { value: "normal", label: "Normal", description: "Balance perfecto", icon: Target, color: "bg-blue-500" },
      { value: "challenging", label: "Desafiante", description: "Empujarme", icon: Mountain, color: "bg-purple-500" },
    ],
  },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({});
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const step = steps[currentStep];

  const handleSelect = (value) => {
    setSelections({ ...selections, [step.id]: value });
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setSaving(true);
      await base44.entities.UserProfile.create({
        display_name: user?.full_name?.split(" ")[0] || "Usuario",
        goal: selections.goal,
        use_mode: selections.mode,
        intensity: selections.intensity,
        current_streak: 0,
        longest_streak: 0,
        total_checkins: 0,
        onboarding_completed: true,
        badges: [],
      });
      window.location.href = createPageUrl("Home");
    }
  };

  const isLastStep = currentStep === steps.length - 1;
  const hasSelection = selections[step?.id];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-8">
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i <= currentStep ? "bg-teal-500" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              {step.title}
            </h1>
            <p className="text-slate-500 mb-8">{step.subtitle}</p>

            <div className="space-y-3">
              {step.options.map((option) => {
                const Icon = option.icon;
                const isSelected = selections[step.id] === option.value;

                return (
                  <motion.button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                      isSelected
                        ? "border-teal-500 bg-teal-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isSelected ? option.color : "bg-slate-100"
                      }`}
                    >
                      <Icon
                        size={24}
                        className={isSelected ? "text-white" : "text-slate-500"}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-semibold ${isSelected ? "text-teal-700" : "text-slate-700"}`}>
                        {option.label}
                      </p>
                      {option.description && (
                        <p className="text-sm text-slate-500">{option.description}</p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                        <Check size={14} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom */}
      <div className="px-6 pb-8">
        <motion.button
          onClick={handleNext}
          disabled={!hasSelection || saving}
          className={`w-full py-5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
            hasSelection
              ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-xl shadow-teal-200"
              : "bg-slate-200 text-slate-400"
          }`}
          whileHover={hasSelection ? { scale: 1.02 } : {}}
          whileTap={hasSelection ? { scale: 0.98 } : {}}
        >
          {saving ? (
            <motion.div
              className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
          ) : (
            <>
              {isLastStep ? "Empezar" : "Continuar"}
              <ArrowRight size={20} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}