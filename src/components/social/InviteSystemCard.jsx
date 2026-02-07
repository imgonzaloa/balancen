import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, Share2, Copy, Check, Gift } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function InviteSystemCard({ profile }) {
  const { lang } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

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

  const generateInviteLink = async () => {
    if (generating) return;
    
    setGenerating(true);
    try {
      // Generate unique invite code
      const inviteCode = `${profile.created_by.split('@')[0]}-${Date.now().toString(36)}`;
      
      // Create invite record
      await base44.entities.Invite.create({
        inviter_email: profile.created_by,
        inviter_name: profile.display_name,
        invite_code: inviteCode,
        status: "invited",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

      const inviteUrl = `${window.location.origin}/Onboarding?invite=${inviteCode}`;
      
      // Try native share first
      if (navigator.share) {
        await navigator.share({
          title: lang === "es" ? "Únete a mí en la app" : "Join me on the app",
          text: lang === "es" 
            ? "¡Hola! Te invito a unirte a esta app de bienestar. ¡Alcancemos nuestros objetivos juntos! 🔥"
            : "Hey! I'm inviting you to join this wellness app. Let's reach our goals together! 🔥",
          url: inviteUrl,
        });
        toast.success(lang === "es" ? "Invitación compartida" : "Invite shared");
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success(lang === "es" ? "Link copiado" : "Link copied");
      }
    } catch (error) {
      console.error("Invite error:", error);
      toast.error(lang === "es" ? "Error al generar invitación" : "Failed to generate invite");
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async () => {
    const inviteCode = `${profile.created_by.split('@')[0]}-${Date.now().toString(36)}`;
    const inviteUrl = `${window.location.origin}/Onboarding?invite=${inviteCode}`;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(lang === "es" ? "Link copiado" : "Link copied");
    } catch (error) {
      toast.error(lang === "es" ? "Error al copiar" : "Failed to copy");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/30 shadow-xl"
    >
      <div className="flex items-start gap-4 mb-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
          <Gift size={28} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-xl mb-1">
            {lang === "es" ? "Invita amigos" : "Invite Friends"}
          </h3>
          <p className="text-white/70 text-sm leading-relaxed">
            {lang === "es" 
              ? "Por cada 3 amigos que se suscriban a Premium, ganás 1 mes gratis"
              : "For every 3 friends who subscribe to Premium, get 1 free month"}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white/80 text-sm font-medium">
            {lang === "es" ? "Progreso" : "Progress"}
          </p>
          <p className="text-white font-bold text-lg">
            {pendingCount}/3
          </p>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(pendingCount / 3) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 shadow-lg"
          />
        </div>
        {totalReferrals > 0 && (
          <p className="text-emerald-300 text-xs mt-2 font-semibold">
            🎉 {totalReferrals} {totalReferrals === 1 ? (lang === "es" ? "amigo convertido" : "friend converted") : (lang === "es" ? "amigos convertidos" : "friends converted")}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={generateInviteLink}
          disabled={generating}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold h-12 rounded-xl shadow-lg"
        >
          <Share2 size={18} className="mr-2" />
          {lang === "es" ? "Compartir" : "Share"}
        </Button>
        <Button
          onClick={copyLink}
          variant="outline"
          className="border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 h-12 px-4 rounded-xl"
        >
          {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
        </Button>
      </div>
    </motion.div>
  );
}