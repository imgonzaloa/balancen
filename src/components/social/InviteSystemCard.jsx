import React, { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, Gift } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function InviteSystemCard({ profile }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const { data: referralProgress } = useQuery({
    queryKey: ["referralProgress", profile?.created_by],
    queryFn: async () => {
      const progress = await base44.entities.ReferralProgress.filter({
        user_email: profile.created_by
      });
      return progress[0] || { pending_referrals_count: 0, total_successful_referrals: 0 };
    },
    enabled: !!profile?.created_by,
  });

  const pendingCount = referralProgress?.pending_referrals_count || 0;
  const totalReferrals = referralProgress?.total_successful_referrals || 0;

  const copyLink = async () => {
    if (!profile?.created_by) {
      toast.error(t('copy_failed') || 'Unable to generate link');
      return;
    }
    const inviteCode = `${profile.created_by.split('@')[0]}-${Date.now().toString(36)}`;
    const inviteUrl = `${window.location.origin}/Onboarding?invite=${inviteCode}`;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t('link_copied'));
    } catch (error) {
      toast.error(t('copy_failed'));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/30 shadow-2xl shadow-purple-500/10 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-pink-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-400/10 rounded-full blur-3xl" />
      <div className="relative z-10">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
            <Gift size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-xl mb-1">
              {t('invite_friends')}
            </h3>
            <p className="text-white/80 text-sm leading-relaxed">
              You + your friend both get 7 extra Premium days
            </p>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/90 text-sm font-semibold">
              {t('progress')}
            </p>
            <p className="text-white font-bold text-xl">
              {pendingCount}/3
            </p>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(pendingCount / 3) * 100}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 shadow-lg"
            />
          </div>
          {totalReferrals > 0 && (
            <p className="text-emerald-300 text-xs mt-2 font-semibold">
              🎉 {totalReferrals} {t('friends_converted')}
            </p>
          )}
        </div>

        <div className="flex gap-3">
           <Button
             onClick={copyLink}
             disabled={!profile?.created_by}
             className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold h-12 rounded-xl shadow-xl shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
           </Button>
         </div>
      </div>
    </motion.div>
  );
}