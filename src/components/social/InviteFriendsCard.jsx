import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Gift, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useTranslation } from "@/components/TranslationProvider";

export default function InviteFriendsCard({ profile }) {
  const { t, lang } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateInviteLink = async () => {
    try {
      setGenerating(true);
      
      // Generate unique invite code
      const inviteCode = `${profile.display_name.toLowerCase().replace(/\s/g, '')}-${Date.now().toString(36)}`;
      
      // Create invite record
      await base44.entities.Invite.create({
        inviter_email: profile.created_by,
        inviter_name: profile.display_name,
        invite_code: inviteCode,
        status: "invited",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

      const inviteUrl = `${window.location.origin}?invite=${inviteCode}`;
      
      // Share via native share if available
      if (navigator.share) {
        await navigator.share({
          title: lang === "es" ? "¡Únete a Heali!" : "Join Heali!",
          text: lang === "es" 
            ? `${profile.display_name} te invita a Heali. ¡Cada 3 amigos con Premium te dan 1 mes gratis!`
            : `${profile.display_name} invited you to Heali. Every 3 Premium friends = 1 free month!`,
          url: inviteUrl,
        });
        toast.success(lang === "es" ? "¡Invitación compartida!" : "Invite shared!");
      } else {
        // Fallback to copy
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-3xl p-6 border border-emerald-500/30 mb-6"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center flex-shrink-0">
          <Gift size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1">
            {lang === "es" ? "Invita y gana Premium" : "Invite & Earn Premium"}
          </h3>
          <p className="text-white/80 text-sm mb-4">
            {lang === "es" 
              ? "Cada 3 amigos que activen Premium = 1 mes gratis para vos"
              : "Every 3 friends who activate Premium = 1 free month for you"}
          </p>
          <Button
            onClick={generateInviteLink}
            disabled={generating}
            className="w-full bg-white hover:bg-white/90 text-emerald-600 rounded-2xl py-3 font-semibold shadow-lg"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                {lang === "es" ? "Generando..." : "Generating..."}
              </span>
            ) : copied ? (
              <>
                <Check size={18} className="mr-2" />
                {lang === "es" ? "Link copiado" : "Link copied"}
              </>
            ) : (
              <>
                <Share2 size={18} className="mr-2" />
                {lang === "es" ? "Invitar amigos" : "Invite Friends"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress tracker */}
      {profile?.referral_progress && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/60 text-xs">
              {lang === "es" ? "Progreso hacia próximo mes gratis" : "Progress to next free month"}
            </p>
            <p className="text-white font-bold text-sm">
              {profile.referral_progress % 3}/3
            </p>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
              style={{ width: `${((profile.referral_progress % 3) / 3) * 100}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}