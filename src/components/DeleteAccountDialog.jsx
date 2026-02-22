import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '@/components/TranslationProvider';
import { toast } from 'sonner';

export default function DeleteAccountDialog({ isOpen, onClose, email }) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast.error(t('type_delete_confirm'));
      return;
    }

    setIsLoading(true);
    try {
      await base44.functions.invoke('deleteUserAccount', { email });
      toast.success(t('account_deleted'));
      setTimeout(() => base44.auth.logout('/'), 1000);
    } catch (err) {
      console.error('Delete account error:', err);
      toast.error(t('delete_account_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-0 top-1/2 -translate-y-1/2 max-w-sm mx-auto px-4 z-[201]"
          >
            <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertCircle size={24} className="text-red-400" />
              </div>

              <h2 className="text-xl font-bold text-white mb-2">
                {t('delete_account_title')}
              </h2>

              <p className="text-white/60 text-sm mb-6">
                {t('delete_account_message')}
              </p>

              <input
                type="text"
                placeholder={t('type_delete')}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 mb-6 focus:border-red-500 outline-none"
              />

              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 h-10 border-white/20 text-white hover:bg-white/10"
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isLoading || confirmText !== 'DELETE'}
                  className="flex-1 h-10 bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader size={16} className="mr-2 animate-spin" />
                      {t('deleting')}
                    </>
                  ) : (
                    t('delete')
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}