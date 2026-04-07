import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, Gift, MessageCircle } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function InviteSystemCard({ profile }) {
  const { t, lang } = useTranslation();
  const [copied, setCopied] = useState(false);

  const inviteCode = useMemo(() => {
    if (!profile?.id) return null;
    return profile.id.slice(0, 8).toLowerCase();
  }, [profile?.id]);

  const inviteUrl = inviteCode ? `${window.location.origin}/?invite=${inviteCode}` : '';

  const shareMessage = useMemo(() => {
    if (!inviteCode) return '';
    const messages = {
      es: `¡Únete a mí en Balancen! Usa mi código ${inviteCode} para 5 días Premium gratis. ${inviteUrl}`,
      en: `Join me on Balancen! Use my code ${inviteCode} for 5 free Premium days. ${inviteUrl}`,
      nl: `Doe mee met Balancen! Gebruik mijn code ${inviteCode} voor 5 gratis Premium dagen. ${inviteUrl}`,
    };
    return messages[lang] || messages.en;
  }, [inviteCode, lang, inviteUrl]);

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t('copied') || 'Copied!');
    } catch (error) {
      toast.error(t('copy_failed') || 'Copy failed');
    }
  };

  const shareLink = async () => {
    if (!inviteCode || !shareMessage) {
      toast.error(t('copy_failed') || 'Unable to generate link');
      return;
    }
    
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join Balancen", text: shareMessage });
        return;
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error(t('share_failed') || 'Share failed');
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t('link_copied'));
    } catch (error) {
      toast.error(t('copy_failed'));
    }
  };

  const shareWhatsApp = () => {
    if (!shareMessage) {
      toast.error(t('copy_failed') || 'Unable to generate link');
      return;
    }
    const encoded = encodeURIComponent(shareMessage);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
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
               {t('invite_description') || 'You + your friend both get 5 extra Premium days'}
             </p>
           </div>
         </div>

         {inviteCode && (
           <div className="mb-5 p-4 bg-white/10 rounded-2xl border border-white/20">
             <p className="text-white/70 text-xs mb-2 uppercase tracking-wider">{t('invite_code') || 'Your invite code'}</p>
             <button
               onClick={copyInviteCode}
               className="font-mono text-lg font-bold text-purple-300 mb-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 active:scale-95"
             >
               {inviteCode}
               {copied && <Check size={16} className="text-emerald-400" />}
             </button>
             <p className="text-white/60 text-xs">{t('share_invite') || 'Share this link to invite friends'}</p>
           </div>
         )}

         <div className="space-y-3">
           <Button
             onClick={shareLink}
             disabled={!inviteCode}
             className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold h-12 rounded-xl shadow-xl shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
           >
             <Share2 size={18} />
             {t('share') || 'Share Invite Link'}
           </Button>

           <Button
             onClick={shareWhatsApp}
             disabled={!inviteCode}
             className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-xl shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
           >
             <MessageCircle size={18} />
             {lang === 'es' ? 'Compartir por WhatsApp' : lang === 'nl' ? 'Delen op WhatsApp' : 'Share on WhatsApp'}
           </Button>
         </div>
      </div>
    </motion.div>
  );
}