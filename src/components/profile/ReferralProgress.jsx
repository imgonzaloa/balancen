import React from "react";
import { motion } from "framer-motion";
import { Gift, Users } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function ReferralProgress({ profile }) {
  const { lang } = useTranslation();
  
  const { data: referralProgress } = useQuery({
    queryKey: ["referralProgress", profile?.created_by],
    queryFn: async () => {
      const progress = await base44.entities.ReferralProgress.filter({
        user_email: profile.created_by
      });
      return progress[0] || null;
    },
    enabled: !!profile?.created_by,
  });
  
  if (!referralProgress) return null;
  
  const totalReferrals = referralProgress.total_successful_referrals || 0;
  const pendingReferrals = referralProgress.pending_referrals_count || 0;
  const rewardsGranted = referralProgress.rewards_granted_months || 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-5 border border-amber-500/30"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
          <Gift size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1">
            {lang === "es" ? "Programa de Referidos" : "Referral Program"}
          </h3>
          <p className="text-white/70 text-sm">
            {lang === "es" 
              ? "Invita amigos y gana Premium gratis"
              : "Invite friends and earn free Premium"}
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-amber-300" />
            <span className="text-white/80 text-sm">
              {lang === "es" ? "Amigos con Premium" : "Friends with Premium"}
            </span>
          </div>
          <span className="text-white font-bold">{totalReferrals}</span>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/60 text-xs">
              {lang === "es" ? "Progreso hacia próximo mes gratis" : "Progress to next free month"}
            </p>
            <p className="text-amber-300 font-bold text-sm">{pendingReferrals}/3</p>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(pendingReferrals / 3) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-400 to-orange-400"
            />
          </div>
        </div>
        
        {rewardsGranted > 0 && (
          <div className="pt-3 border-t border-white/10">
            <p className="text-emerald-300 text-sm font-semibold">
              {lang === "es" 
                ? `🎉 ${rewardsGranted} ${rewardsGranted === 1 ? 'mes' : 'meses'} gratis ganados`
                : `🎉 ${rewardsGranted} free ${rewardsGranted === 1 ? 'month' : 'months'} earned`}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}