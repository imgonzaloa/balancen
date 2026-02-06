import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Sparkles, Crown, TrendingUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTranslation } from "@/components/TranslationProvider";

export default function AIPremiumUpsell() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  // Don't show for owner
  if (profile?.role === "owner") return null;
  
  return (
    <motion.div
      className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl border-2 border-amber-400/30 rounded-3xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-amber-400/40 to-orange-400/40 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-amber-300" />
              <span className="text-xs font-semibold text-amber-200 uppercase tracking-wide">{t("premium_only")}</span>
            </div>
            <h3 className="text-white font-bold text-xl">{t("ai_health_coach")}</h3>
          </div>
        </div>

        <p className="text-white/90 mb-4 leading-relaxed">
          {t("unlock_personalized_insights")}
        </p>

        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center">
              <TrendingUp size={12} className="text-emerald-300" />
            </div>
            <span>{t("personalized_health_insights")}</span>
          </div>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <div className="w-5 h-5 rounded-full bg-purple-400/20 flex items-center justify-center">
              <Sparkles size={12} className="text-purple-300" />
            </div>
            <span>{t("weekly_ai_summaries")}</span>
          </div>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center">
              <Zap size={12} className="text-amber-300" />
            </div>
            <span>{t("smart_challenge_suggestions")}</span>
          </div>
        </div>

        <Link to={createPageUrl("Premium")}>
          <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95">
            <Crown size={18} className="inline mr-2" />
            {t("upgrade_to_premium_cta")}
          </button>
        </Link>
      </div>
    </motion.div>
  );
}