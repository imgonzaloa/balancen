import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    display_name: "",
    primary_goal: "consistency",
    intensity_level: "normal",
    social_mode: "just_me",
  });

  useEffect(() => {
    base44.auth.me().then(setUser);
    
    // Check for referral code in URL
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get("invite");
    if (inviteCode) {
      localStorage.setItem("pending_referral", inviteCode);
    }
  }, []);

  const handleComplete = async () => {
    try {
      await base44.entities.UserProfile.create({
        ...formData,
        onboarding_completed: true,
      });

      // Process referral if exists
      const pendingReferral = localStorage.getItem("pending_referral");
      if (pendingReferral) {
        try {
          await base44.functions.invoke("handleReferralSignup", {
            invite_code: pendingReferral,
          });
          localStorage.removeItem("pending_referral");
        } catch (err) {
          console.error("Referral processing failed:", err);
        }
      }

      navigate(createPageUrl("Home"));
    } catch (error) {
      toast.error("Error creating profile");
    }
  };

  const goals = [
    { value: "consistency", label: "Be more consistent", emoji: "🎯" },
    { value: "eat_better", label: "Eat better", emoji: "🥗" },
    { value: "move_more", label: "Move more", emoji: "🏃" },
    { value: "train_regularly", label: "Train regularly", emoji: "💪" },
  ];

  const intensities = [
    { value: "easy", label: "Easy", desc: "Gentle pace" },
    { value: "normal", label: "Normal", desc: "Balanced approach" },
    { value: "challenging", label: "Challenging", desc: "Push yourself" },
  ];

  const socialModes = [
    { value: "just_me", label: "Solo", emoji: "🧘", desc: "Private journey" },
    { value: "with_friends", label: "With Friends", emoji: "👥", desc: "Share progress" },
    { value: "with_team", label: "Team", emoji: "🏆", desc: "Join groups" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <Sparkles className="w-16 h-16 text-teal-400 mx-auto mb-4" />
                <h1 className="text-3xl font-black text-white mb-2">Welcome!</h1>
                <p className="text-white/60">Let's personalize your experience</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
                <label className="text-white font-semibold mb-3 block">What should we call you?</label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Your name"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 text-lg"
                />
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!formData.display_name}
                className="w-full h-14 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-lg rounded-2xl"
              >
                Continue <ChevronRight className="ml-2" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">What's your main goal?</h2>
                <p className="text-white/60">Choose what matters most</p>
              </div>

              <div className="space-y-3">
                {goals.map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => setFormData({ ...formData, primary_goal: goal.value })}
                    className={`w-full p-4 rounded-2xl border-2 transition-all ${
                      formData.primary_goal === goal.value
                        ? "border-teal-400 bg-teal-500/20"
                        : "border-white/20 bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{goal.emoji}</span>
                      <span className="text-white font-semibold">{goal.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              <Button
                onClick={() => setStep(3)}
                className="w-full h-14 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-lg rounded-2xl"
              >
                Continue <ChevronRight className="ml-2" />
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">Choose your pace</h2>
                <p className="text-white/60">How challenging should it be?</p>
              </div>

              <div className="space-y-3">
                {intensities.map((intensity) => (
                  <button
                    key={intensity.value}
                    onClick={() => setFormData({ ...formData, intensity_level: intensity.value })}
                    className={`w-full p-4 rounded-2xl border-2 transition-all ${
                      formData.intensity_level === intensity.value
                        ? "border-teal-400 bg-teal-500/20"
                        : "border-white/20 bg-white/5"
                    }`}
                  >
                    <p className="text-white font-semibold">{intensity.label}</p>
                    <p className="text-white/60 text-sm">{intensity.desc}</p>
                  </button>
                ))}
              </div>

              <Button
                onClick={() => setStep(4)}
                className="w-full h-14 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-lg rounded-2xl"
              >
                Continue <ChevronRight className="ml-2" />
              </Button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">How do you prefer to use the app?</h2>
                <p className="text-white/60">You can change this later</p>
              </div>

              <div className="space-y-3">
                {socialModes.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setFormData({ ...formData, social_mode: mode.value })}
                    className={`w-full p-4 rounded-2xl border-2 transition-all ${
                      formData.social_mode === mode.value
                        ? "border-teal-400 bg-teal-500/20"
                        : "border-white/20 bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl">{mode.emoji}</span>
                      <span className="text-white font-semibold">{mode.label}</span>
                    </div>
                    <p className="text-white/60 text-sm text-left ml-11">{mode.desc}</p>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleComplete}
                className="w-full h-14 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-lg rounded-2xl"
              >
                Get Started <ChevronRight className="ml-2" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}