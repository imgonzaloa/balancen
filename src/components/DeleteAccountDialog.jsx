/**
 * Delete Account Confirmation Dialog
 * Handles account deletion with confirmation
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '@/components/TranslationProvider';
import { toast } from 'sonner';

export default function DeleteAccountDialog({ isOpen, onClose, email }) {
  const { t, lang } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast.error(lang === 'es' ? 'Escribí DELETE para confirmar' : 'Type DELETE to confirm');
      return;
    }

    setIsLoading(true);
    try {
      await base44.functions.invoke('deleteUserAccount', { email });
      toast.success(lang === 'es' ? 'Cuenta eliminada' : 'Account deleted');
      // Logout after 1 second
      setTimeout(() => base44.auth.logout('/'), 1000);
    } catch (err) {
      console.error('Delete account error:', err);
      toast.error(lang === 'es' ? 'Error al eliminar cuenta' : 'Error deleting account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-0 top-1/2 -translate-y-1/2 max-w-sm mx-auto px-4 z-[201]"
          >
            <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 shadow-2xl">
              {/* Icon */}
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertCircle size={24} className="text-red-400" />
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-white mb-2">
                {lang === 'es' ? 'Eliminar Cuenta' : 'Delete Account'}
              </h2>

              {/* Description */}
              <p className="text-white/60 text-sm mb-6">
                {lang === 'es'
                  ? 'Esta acción es irreversible. Todos tus datos serán eliminados.'
                  : 'This action is irreversible. All your data will be deleted.'}
              </p>

              {/* Confirmation input */}
              <input
                type="text"
                placeholder={lang === 'es' ? 'Escribe DELETE' : 'Type DELETE'}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 mb-6 focus:border-red-500 outline-none"
              />

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 h-10 border-white/20"
                >
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isLoading || confirmText !== 'DELETE'}
                  className="flex-1 h-10 bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader size={16} className="mr-2 animate-spin" />
                      {lang === 'es' ? 'Eliminando...' : 'Deleting...'}
                    </>
                  ) : (
                    lang === 'es' ? 'Eliminar' : 'Delete'
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