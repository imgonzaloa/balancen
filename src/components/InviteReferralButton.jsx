/**
 * Invite/Referral Button
 * Generates unique referral link and tracks rewards
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '@/components/TranslationProvider';
import { toast } from 'sonner';

export default function InviteReferralButton({ profile, user }) {
  const { t, lang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const handleGenerateLink = async () => {
    try {
      const code = `${user?.email?.split('@')[0]}_${Date.now()}`.replace(/[^a-z0-9_]/g, '');
      const link = `${window.location.origin}${window.location.pathname}?invite=${code}`;
      setInviteLink(link);

      // Log referral code for tracking
      await base44.entities.Invite?.create?.({
        inviter_email: user?.email,
        inviter_name: profile?.display_name,
        invite_code: code,
        status: 'invited',
      }).catch(() => {});

    } catch (err) {
      toast.error(lang === 'es' ? 'Error generando link' : lang === 'nl' ? 'Fout bij genereren link' : 'Error generating link');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success(lang === 'es' ? 'Link copiado' : lang === 'nl' ? 'Link gekopieerd' : 'Link copied');
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Balancen',
          text: lang === 'es' ? 'Únete a Balancen conmigo!' : lang === 'nl' ? 'Doe mee met Balancen!' : 'Join Balancen with me!',
          url: inviteLink,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <>
      {/* Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          if (!inviteLink) {
            handleGenerateLink();
          }
          setIsOpen(true);
        }}
        className="w-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl p-4 border border-blue-400/30 text-left flex items-center gap-3 hover:from-blue-500/30 hover:to-purple-500/30 transition-all"
      >
        <div className="w-10 h-10 rounded-lg bg-blue-500/30 flex items-center justify-center">
          <Share2 size={20} className="text-blue-300" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">
            {lang === 'es' ? 'Invitar Amigos' : lang === 'nl' ? 'Vrienden uitnodigen' : 'Invite Friends'}
          </p>
          <p className="text-blue-200 text-xs">
            {lang === 'es' ? '+1 mes gratis cada 3 amigos' : lang === 'nl' ? '+1 maand gratis per 3 vrienden' : '+1 free month per 3 friends'}
          </p>
        </div>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-0 bottom-0 max-w-lg mx-auto px-4 z-[201] pb-4"
            >
              <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">
                    {lang === 'es' ? 'Compartir Link' : lang === 'nl' ? 'Link delen' : 'Share Link'}
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/60 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                {inviteLink && (
                  <>
                    {/* Link Display */}
                    <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10 break-all">
                      <p className="text-white text-xs font-mono">{inviteLink}</p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCopyLink}
                        className="flex-1 bg-teal-500 hover:bg-teal-600 h-10"
                      >
                        <Copy size={16} className="mr-2" />
                        {lang === 'es' ? 'Copiar' : lang === 'nl' ? 'Kopiëren' : 'Copy'}
                        </Button>
                        <Button
                         onClick={handleShareLink}
                         className="flex-1 bg-blue-500 hover:bg-blue-600 h-10"
                        >
                         <Share2 size={16} className="mr-2" />
                         {lang === 'es' ? 'Compartir' : lang === 'nl' ? 'Delen' : 'Share'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}