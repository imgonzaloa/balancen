import React, { useState } from "react";
import { Copy, Share2, MessageCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";

const APP_URL = window.location.origin;

function getInvitesSent() {
  try { return parseInt(localStorage.getItem("balancen_invites_sent") || "0", 10); } catch { return 0; }
}
function incrementInvitesSent() {
  localStorage.setItem("balancen_invites_sent", String(getInvitesSent() + 1));
}

export default function FriendInviteCard({ profile, joinedCount = 0 }) {
  const { t, lang } = useTranslation();
  const [codeCopied, setCodeCopied] = useState(false);

  // Stable invite code based on profile.id
  const inviteCode = profile?.id
    ? profile.id.slice(0, 8).toLowerCase()
    : "invite";
  const inviteUrl = `${APP_URL}/?invite=${inviteCode}`;
  const shareMessage = `${t('friend_invite_message') || 'Join me on Balancen!'} ${inviteUrl}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
      toast.success(t('copied') || 'Copied!');
    } catch { 
      toast.error(t('copy_failed') || 'Copy failed'); 
    }
  };

  const handleShareLink = async () => {
    incrementInvitesSent();
    if (navigator.share) {
      try {
        await navigator.share({ title: t('join_balancen') || 'Join me on Balancen!', text: shareMessage, url: inviteUrl });
        return;
      } catch (e) {
        if (e.name !== 'AbortError') {
          // User cancelled share, fallback to copy
        }
      }
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success(t('link_copied') || 'Link copied!');
    } catch { 
      toast.error(t('copy_failed') || 'Copy failed'); 
    }
  };

  const handleWhatsApp = () => {
    incrementInvitesSent();
    const encoded = encodeURIComponent(shareMessage);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-400/30 rounded-2xl p-5 mb-6 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-white font-black text-lg">{t('invite_header') || 'Invite friends, eat better together'} 🍽️</h2>
        <p className="text-white/60 text-sm mt-1">
          {t('invite_benefit') || 'Your friends join free. You both get 7 extra days of Premium.'}
        </p>
      </div>

      {/* Invite code pill */}
      <button
        onClick={handleCopyCode}
        className="w-full flex items-center justify-between bg-white/10 rounded-xl px-4 py-2 active:opacity-70 transition-opacity"
      >
        <span className="text-teal-300 font-mono font-bold text-sm tracking-wider">{inviteCode}</span>
        {codeCopied
          ? <Check size={16} className="text-emerald-400" />
          : <Copy size={16} className="text-white/50" />}
      </button>

      {/* Share buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleShareLink}
          className="flex-1 flex items-center justify-center gap-2 bg-teal-500 text-white font-bold text-sm py-2.5 rounded-xl active:opacity-80 transition-opacity"
        >
          <Share2 size={15} />
          {t('share_link') || 'Share link'}
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-bold text-sm py-2.5 rounded-xl active:opacity-80 transition-opacity"
        >
          <MessageCircle size={15} />
          WhatsApp
        </button>
      </div>

      {/* Friends joined counter */}
      <p className="text-white/50 text-sm text-center">
        {joinedCount > 0
          ? `${joinedCount} ${lang === 'es' ? (joinedCount > 1 ? 'amigos' : 'amigo') : lang === 'nl' ? (joinedCount > 1 ? 'vrienden' : 'vriend') : (joinedCount > 1 ? 'friends' : 'friend')} ${t('joined_with_link') || 'joined with your link'}`
          : t('be_first_invite') || 'Be the first to invite someone!'}
      </p>
    </div>
  );
}