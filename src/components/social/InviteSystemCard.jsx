import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, Gift } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function InviteSystemCard({ profile }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const inviteCode = useMemo(() => {
    if (!profile?.id) return null;
    return profile.id.slice(0, 8).toLowerCase();
  }, [profile?.id]);

  const shareLink = async () => {
    if (!inviteCode) {
      toast.error(t('copy_failed') || 'Unable to generate link');
      return;
    }
    const inviteUrl = `${window.location.origin}/?invite=${inviteCode}`;
    const shareMessage = `Join me on Balancen! ${inviteUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join Balancen", text: shareMessage, url: inviteUrl });
        return;
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error(t('share_failed') || 'Share failed');
        }
      }
    }

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
               {t('invite_description') || 'You + your friend both get 7 extra Premium days'}
             </p>
           </div>
         </div>

         {inviteCode && (
           <div className="mb-5 p-4 bg-white/10 rounded-2xl border border-white/20">
             <p className="text-white/70 text-xs mb-2 uppercase tracking-wider">{t('invite_code') || 'Your invite code'}</p>
             <div className="font-mono text-lg font-bold text-purple-300 mb-3">{inviteCode}</div>
             <p className="text-white/60 text-xs mb-3">{t('share_invite') || 'Share this link to invite friends'}</p>
             <div className="p-2 bg-white/5 rounded-lg break-all text-xs text-white/50 mb-4">
               {window.location.origin}/?invite={inviteCode}
             </div>
           </div>
         )}

         <Button
           onClick={shareLink}
           disabled={!inviteCode}
           className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold h-12 rounded-xl shadow-xl shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
         >
           {copied ? <Check size={18} className="text-emerald-400" /> : <Share2 size={18} />}
           {copied ? (t('copied') || 'Copied!') : (t('share') || 'Share Invite Link')}
         </Button>
      </div>
    </motion.div>
  );
}