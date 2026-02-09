import React from "react";
import { motion } from "framer-motion";
import { Lock, Crown } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PremiumLockOverlay({ feature }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 text-center relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-pink-400/10 rounded-full blur-3xl" />
      <div className="relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Lock size={32} className="text-white" />
        </div>
        <h3 className="text-white font-bold text-xl mb-2">{t('locked_feature')}</h3>
        <p className="text-white/80 text-sm mb-6 leading-relaxed">
          {feature || t('unlock_social')}
        </p>
        <Button
          onClick={() => navigate(createPageUrl('Premium'))}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-8 rounded-2xl shadow-xl"
        >
          <Crown size={18} className="mr-2" />
          {t('upgrade_now')}
        </Button>
      </div>
    </motion.div>
  );
}