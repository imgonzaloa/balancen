import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ChevronLeft, Crown, Check, Sparkles, TrendingUp, Heart, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Sparkles, text: "IA avanzada con recomendaciones personalizadas", premium: true },
  { icon: Heart, text: "Análisis de recuperación y bienestar", premium: true },
  { icon: TrendingUp, text: "Progressive overload automático", premium: true },
  { icon: Users, text: "Desafíos exclusivos de grupo", premium: true },
  { icon: Zap, text: "Export de datos completo", premium: true },
  { icon: Check, text: "Sin anuncios", premium: true },
];

export default function Premium() {
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [region, setRegion] = useState("EU");

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const plans = {
    EU: {
      monthly: { price: 6.99, label: "Mensual", period: "month", currency: "€" },
      yearly: { price: 49.99, label: "Anual", period: "year", save: "Best Value", currency: "€" },
    },
    LATAM: {
      monthly: { price: 3.99, label: "Mensual", period: "month", currency: "$" },
      yearly: { price: 29.99, label: "Anual", period: "year", save: "Best Value", currency: "$" },
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to={createPageUrl("Settings")}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Upgrade a Premium</h1>
        </div>

        {/* Hero */}
        <motion.div
          className="relative overflow-hidden rounded-3xl p-8 mb-8 bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500 shadow-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
        >
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-300/30 rounded-full blur-2xl" />
          
          <div className="relative z-10 text-center">
            <motion.div
              className="inline-block mb-4"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <Crown size={64} className="text-white" />
            </motion.div>
            <h2 className="text-3xl font-black text-white mb-2">Balancen Premium</h2>
            <p className="text-white/90 text-lg">
              Build consistency, not perfection
            </p>
          </div>
        </motion.div>

        {/* Region Selector */}
        <motion.div
          className="flex gap-2 mb-6 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <button
            onClick={() => setRegion("EU")}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              region === "EU"
                ? "bg-white/20 text-white border border-amber-400"
                : "bg-white/10 text-white/60 border border-white/20"
            }`}
          >
            🇪🇺 EU/US
          </button>
          <button
            onClick={() => setRegion("LATAM")}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              region === "LATAM"
                ? "bg-white/20 text-white border border-amber-400"
                : "bg-white/10 text-white/60 border border-white/20"
            }`}
          >
            🌎 LATAM
          </button>
        </motion.div>

        {/* Plan Selection */}
        <motion.div
          className="flex gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {Object.entries(plans[region]).map(([key, plan]) => (
            <button
              key={key}
              onClick={() => setSelectedPlan(key)}
              className={`flex-1 relative overflow-hidden rounded-2xl p-5 transition-all ${
                selectedPlan === key
                  ? "bg-white/20 border-2 border-amber-400 shadow-lg shadow-amber-500/50"
                  : "bg-white/10 border-2 border-white/20"
              }`}
            >
              {plan.save && (
                <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  {plan.save}
                </div>
              )}
              <p className="text-white/80 text-sm mb-1">{plan.label}</p>
              <p className="text-3xl font-black text-white">{plan.currency}{plan.price}</p>
              <p className="text-white/60 text-xs mt-1">/ {plan.period === "year" ? "año" : "mes"}</p>
            </button>
          ))}
        </motion.div>

        {/* Features */}
        <motion.div
          className="space-y-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-white font-bold text-lg mb-4">Features Premium</h3>
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-white" />
                </div>
                <p className="text-white text-sm font-medium">{feature.text}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={() => alert("Integración de pago próximamente. Por ahora es demo.")}
            className="w-full py-7 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg shadow-2xl shadow-amber-500/50"
          >
            <Crown size={24} className="mr-2" />
            Empezar prueba gratis de 7 días
          </Button>
          <p className="text-center text-white/60 text-xs mt-4">
            Cancela cuando quieras. No se requiere tarjeta para el trial.
          </p>
        </motion.div>
      </div>
    </div>
  );
}