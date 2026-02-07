import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Share2, Check, Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";

export default function InviteModal({ isOpen, onClose, profile }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState(null);
  const [stats, setStats] = useState(null);

  React.useEffect(() => {
    if (isOpen && profile) {
      loadStats();
    }
  }, [isOpen, profile]);

  const loadStats = async () => {
    try {
      const [invites, referralData] = await Promise.all([
        base44.entities.Invite.filter({ inviter_email: profile.created_by }),
        base44.entities.ReferralProgress.filter({ user_email: profile.created_by })
      ]);
      
      setStats({
        total: invites.length,
        subscribed: invites.filter(i => i.status === "subscribed").length,
        referralProgress: referralData[0] || null
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const generateInviteLink = async () => {
    if (inviteCode) return inviteCode;

    setLoading(true);
    try {
      // Generate unique code
      const code = Math.random().toString(36).substring(2, 12).toUpperCase();
      
      // Calculate expiry (7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invite record
      await base44.entities.Invite.create({
        inviter_email: profile.created_by,
        inviter_name: profile.display_name,
        invite_code: code,
        expires_at: expiresAt.toISOString()
      });

      // Track event
      base44.analytics.track({
        eventName: "invite_created",
        properties: { channel: "modal" }
      });

      setInviteCode(code);
      return code;
    } catch (error) {
      toast.error("Error al crear invitación");
      console.error(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const code = await generateInviteLink();
    if (!code) return;

    const link = `https://balancen.app/invite?code=${code}`;
    await navigator.clipboard.writeText(link);
    
    setCopied(true);
    toast.success("¡Link copiado!");
    
    // Track
    base44.analytics.track({
      eventName: "invite_shared",
      properties: { channel: "copy" }
    });

    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const code = await generateInviteLink();
    if (!code) return;

    const link = `https://balancen.app/invite?code=${code}`;
    const text = t("invite_message_template")
      .replace("{name}", profile.display_name)
      .replace("{link}", link);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Balancen",
          text: text,
          url: link
        });
        
        base44.analytics.track({
          eventName: "invite_shared",
          properties: { channel: "native_share" }
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Share failed:", error);
        }
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(text);
      toast.success("Mensaje copiado - compartilo donde quieras");
    }
  };

  const referralsToNextReward = stats?.referralProgress 
    ? 3 - (stats.referralProgress.total_successful_referrals % 3)
    : 3;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/20 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 pb-4 bg-gradient-to-br from-teal-500/20 to-emerald-500/20">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <X size={24} />
              </button>
              
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <Users size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {t("invite_friends")}
                </h2>
                <p className="text-white/70 text-sm">
                  {t("invite_subtitle")}
                </p>
              </div>
            </div>

            {/* Reward Progress */}
            {stats?.referralProgress && (
              <div className="mx-6 -mt-2 mb-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Gift className="text-amber-400" size={20} />
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">
                      {stats.referralProgress.total_successful_referrals} / {Math.ceil(stats.referralProgress.total_successful_referrals / 3) * 3} {t("referrals")}
                    </p>
                    <p className="text-amber-200 text-xs">
                      {referralsToNextReward} {t("more_for_free_month")}
                    </p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${((stats.referralProgress.total_successful_referrals % 3) / 3) * 100}%` 
                    }}
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-400"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-6 space-y-3">
              <Button
                onClick={handleCopy}
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 h-14 text-base font-semibold"
              >
                {copied ? (
                  <>
                    <Check size={20} className="mr-2" />
                    {t("copied")}
                  </>
                ) : (
                  <>
                    <Copy size={20} className="mr-2" />
                    {t("copy_link")}
                  </>
                )}
              </Button>

              <Button
                onClick={handleShare}
                disabled={loading}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 h-14 text-base font-semibold"
              >
                <Share2 size={20} className="mr-2" />
                {t("share")}
              </Button>

              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                    <p className="text-xs text-white/60">{t("invites_sent")}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{stats.subscribed}</p>
                    <p className="text-xs text-white/60">{t("subscribed")}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer note */}
            <div className="px-6 pb-6 pt-2">
              <p className="text-xs text-white/50 text-center">
                {t("invite_reward_note")}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}