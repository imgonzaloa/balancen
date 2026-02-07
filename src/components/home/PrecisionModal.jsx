import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Camera, List, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/TranslationProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PrecisionModal({ isOpen, onClose, currentAccuracy = 75 }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const factors = [
    {
      icon: Camera,
      label: t("factor_more_meals"),
      potential: "+15%",
      color: "text-emerald-400"
    },
    {
      icon: List,
      label: t("factor_confirm_ingredients"),
      potential: "+10%",
      color: "text-blue-400"
    },
    {
      icon: Target,
      label: t("factor_clear_photo"),
      potential: "+8%",
      color: "text-purple-400"
    }
  ];

  const handleImprove = () => {
    onClose();
    navigate(createPageUrl("CameraScreen"));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[101] max-w-lg mx-auto"
          >
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-3xl border-t border-x border-white/20 shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-white/10">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-2">
                    {t("what_is_precision")}
                  </h2>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {t("precision_explanation")}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X size={18} className="text-white/80" />
                </button>
              </div>

              {/* Current Accuracy */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="transform -rotate-90" width="80" height="80">
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <motion.circle
                        cx="40"
                        cy="40"
                        r="34"
                        stroke="url(#accuracyGradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 34}
                        initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - currentAccuracy / 100) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                      <defs>
                        <linearGradient id="accuracyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-white text-xl font-black">{currentAccuracy}%</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold mb-1">{t("estimated_accuracy")}</p>
                    <p className="text-emerald-400 text-sm font-medium">
                      {currentAccuracy >= 85 ? "Excelente" : currentAccuracy >= 70 ? "Bueno" : "Mejorable"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Factors */}
              <div className="p-6">
                <h3 className="text-white font-semibold mb-4">
                  {t("precision_factors")}
                </h3>
                <div className="space-y-3">
                  {factors.map((factor, i) => {
                    const Icon = factor.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/10"
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${factor.color === "text-emerald-400" ? "from-emerald-500/20 to-teal-500/20" : factor.color === "text-blue-400" ? "from-blue-500/20 to-cyan-500/20" : "from-purple-500/20 to-pink-500/20"} flex items-center justify-center`}>
                          <Icon size={20} className={factor.color} />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{factor.label}</p>
                        </div>
                        <p className={`${factor.color} font-bold text-sm`}>{factor.potential}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* CTA */}
              <div className="p-6 pt-0 pb-8">
                <Button
                  onClick={handleImprove}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold h-14 rounded-xl shadow-xl shadow-emerald-500/30"
                >
                  {t("improve_precision")}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}