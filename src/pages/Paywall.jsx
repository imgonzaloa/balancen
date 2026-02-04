import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Flame, Users, TrendingUp, Award, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

const features = [
  { icon: Flame, text: "Unlimited streaks" },
  { icon: Users, text: "Groups & team challenges" },
  { icon: TrendingUp, text: "Full habit tracking" },
  { icon: Award, text: "Rewards & rankings" },
];

export default function Paywall() {
  const [selectedPlan, setSelectedPlan] = useState("yearly");

  const plans = {
    monthly: { price: 6.99, label: "Monthly", period: "month" },
    yearly: { price: 49.99, label: "Yearly", period: "year", save: "Save over 40%" },
  };

  const handleSkip = () => {
    window.location.href = createPageUrl("Home");
  };

  const handleContinue = () => {
    alert("Payment integration coming soon. This is a demo.");
    window.location.href = createPageUrl("Home");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10">
        {/* Skip button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleSkip}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Hero */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="inline-block mb-6"
            animate={{ 
              rotate: [-5, 5, -5],
              scale: [1, 1.05, 1]
            }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <Flame size={72} className="text-teal-300 drop-shadow-lg" fill="currentColor" />
          </motion.div>
          <h1 className="text-4xl font-black text-white mb-3">
            Keep your streak alive
          </h1>
          <p className="text-xl text-teal-200">
            Balancen works best when consistency becomes a habit.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          className="space-y-3 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Icon size={24} className="text-white" />
                </div>
                <p className="text-white text-base font-medium">{feature.text}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Plans */}
        <motion.div
          className="flex gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {Object.entries(plans).map(([key, plan]) => (
            <button
              key={key}
              onClick={() => setSelectedPlan(key)}
              className={`flex-1 relative overflow-hidden rounded-2xl p-5 transition-all ${
                selectedPlan === key
                  ? "bg-white/20 border-2 border-teal-400 shadow-xl shadow-teal-500/50 scale-105"
                  : "bg-white/10 border-2 border-white/20"
              }`}
            >
              {plan.save && (
                <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  {plan.save}
                </div>
              )}
              <p className="text-white/80 text-sm mb-1 font-medium">{plan.label}</p>
              <p className="text-3xl font-black text-white">€{plan.price}</p>
              <p className="text-white/60 text-xs mt-1">/ {plan.period}</p>
            </button>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleContinue}
            className="w-full py-7 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-white font-bold text-lg shadow-2xl shadow-teal-500/50"
          >
            Continue with Balancen
          </Button>
          
          <button
            onClick={handleSkip}
            className="w-full py-4 text-white/60 hover:text-white/80 font-medium transition-colors"
          >
            Not now
          </button>

          <p className="text-center text-white/50 text-sm">
            Cancel anytime.
          </p>
        </motion.div>
      </div>
    </div>
  );
}