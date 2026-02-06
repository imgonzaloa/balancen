import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useTranslation } from "@/components/TranslationProvider";
import { Target, Users, User, Zap, Leaf, Mountain, ArrowRight, Check } from "lucide-react";

const steps = [
  {
    id: "language",
    title: "Choose your language",
    subtitle: "You can change this anytime in settings.",
    options: [
      { value: "en", label: "🇬🇧 English", icon: null, color: "bg-blue-500" },
      { value: "es", label: "🇪🇸 Español", icon: null, color: "bg-red-500" },
    ],
  },
  {
    id: "primary_goal",
    title: "What do you want to improve?",
    subtitle: "This helps us set the right starting point.",
    options: [
      { value: "consistency", label: "Stay consistent", icon: Target, color: "bg-teal-500" },
      { value: "weight_loss", label: "Lose weight", icon: Leaf, color: "bg-emerald-500" },
      { value: "healthy_habits", label: "Build healthy habits", icon: Zap, color: "bg-orange-500" },
      { value: "stay_active", label: "Stay active", icon: Mountain, color: "bg-purple-500" },
    ],
  },
  {
    id: "social_mode",
    title: "How will you use Balancen?",
    subtitle: "You can change this later.",
    options: [
      { value: "just_me", label: "Just me", icon: User, color: "bg-indigo-500" },
      { value: "with_friends", label: "With friends", icon: Users, color: "bg-pink-500" },
      { value: "with_team", label: "With my team", icon: Users, color: "bg-rose-500" },
    ],
  },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [selections, setSelections] = useState({});
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const { changeLanguage } = useTranslation();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const step = currentStep >= 0 ? steps[currentStep] : null;

  const handleSelect = (value) => {
    setSelections({ ...selections, [step.id]: value });
    
    // Change language immediately if language selection
    if (step.id === "language") {
      changeLanguage(value);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    
    const OWNER_EMAIL = "imgonzaloa@gmail.com";
    
    // Owner gets premium automatically
    const isOwner = user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
    
    console.log("🔐 Onboarding - Creating profile for:", user.email, "isOwner:", isOwner);
    
    // Check if invited as collaborator
    const collaborators = await base44.entities.Collaborator.filter({
      email: user.email.toLowerCase(),
      has_registered: false
    });
    const isCollaborator = collaborators.length > 0;
    
    await base44.entities.UserProfile.create({
      display_name: user?.full_name?.split(" ")[0] || "User",
      role: isOwner ? "owner" : "user",
      language: selections.language || "en",
      primary_goal: selections.primary_goal,
      social_mode: selections.social_mode,
      current_streak: 0,
      longest_streak: 0,
      total_checkins: 0,
      onboarding_completed: true,
      badges: [],
      is_premium: isOwner || isCollaborator,
      premium_status: (isOwner || isCollaborator) ? "active" : undefined,
    });
    
    // Marcar colaborador como registrado
    if (isCollaborator) {
      await base44.entities.Collaborator.update(collaborators[0].id, {
        has_registered: true
      });
    }
    
    window.location.href = createPageUrl("OnboardingTransition");
  };

  const handleNext = async () => {
    if (currentStep === -1) {
      setCurrentStep(0);
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const isLastStep = currentStep === steps.length - 1;
  const hasSelection = currentStep === -1 || selections[step?.id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Progress */}
      {currentStep >= 0 && (
        <div className="px-6 pt-8 relative z-10">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  i <= currentStep ? "bg-teal-400" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-6 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {currentStep === -1 ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="text-center flex flex-col items-center justify-center h-full"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-5xl font-black bg-gradient-to-r from-white to-teal-100 bg-clip-text text-transparent mb-6">
                  Welcome to Balancen
                </h1>
                <p className="text-2xl text-teal-200 font-semibold mb-8">
                  Build consistency, not perfection.
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-2xl font-bold text-white mb-2">
                {step.title}
              </h1>
              <p className="text-teal-200 mb-8">{step.subtitle}</p>

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
                          ? "border-teal-400 bg-white/20 backdrop-blur-sm"
                          : "border-white/20 bg-white/10 backdrop-blur-sm hover:border-white/40"
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {Icon && (
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isSelected ? option.color : "bg-white/10"
                          }`}
                        >
                          <Icon
                            size={24}
                            className={isSelected ? "text-white" : "text-white/60"}
                          />
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className={`font-semibold ${isSelected ? "text-white" : "text-white/80"}`}>
                          {option.label}
                        </p>
                        {option.description && (
                          <p className="text-sm text-white/60">{option.description}</p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-teal-400 flex items-center justify-center">
                          <Check size={14} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom */}
      <div className="px-6 pb-8 relative z-10">
        <motion.button
          onClick={handleNext}
          disabled={!hasSelection || saving}
          className={`w-full py-5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
            hasSelection
              ? "bg-gradient-to-r from-teal-400 to-emerald-500 text-white shadow-xl shadow-teal-500/50"
              : "bg-white/10 text-white/40 border-2 border-white/20"
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
              {currentStep === -1 ? "Get started" : isLastStep ? "Start" : "Continue"}
              <ArrowRight size={20} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}