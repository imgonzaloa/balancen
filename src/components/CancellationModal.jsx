import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const LOSS_ITEMS = {
  es: [
    'Análisis IA de comidas',
    'Feed social y retos con amigos',
    'Tu racha y misiones diarias',
    'Fotos de progreso y métricas'
  ],
  en: [
    'AI meal analysis',
    'Social feed and challenges',
    'Your streak and daily missions',
    'Progress photos and metrics'
  ],
  nl: [
    'AI-maaltijdanalyse',
    'Sociale feed en uitdagingen',
    'Je reeks en dagelijkse missies',
    'Voortgangsfoto\'s en statistieken'
  ]
};

const TRANSLATIONS = {
  es: {
    loss_header: 'Si cancelas, perderás acceso a:',
    special_offer: 'Oferta especial — solo para vos',
    annual_price: '€39.99',
    discount_price: '€31.99',
    badge: '20% de descuento — oferta única',
    subtitle: 'Renovación con 20% de descuento. Solo disponible ahora.',
    apply_btn: 'Aplicar descuento — €31.99',
    cancel_btn: 'Cancelar de todas formas',
    processing: 'Procesando...',
    confirm_cancel: '¿Estás seguro?',
    confirm_text: 'Esta acción no se puede deshacer. Perderás acceso a todas las características premium.',
    confirm_cancel_btn: 'Sí, cancelar',
    keep_btn: 'Mantener suscripción',
    discount_applied: '¡Descuento aplicado! Tu próxima renovación será €31.99'
  },
  en: {
    loss_header: 'If you cancel, you\'ll lose access to:',
    special_offer: 'Special offer — just for you',
    annual_price: '$39.99',
    discount_price: '$31.99',
    badge: '20% off — one-time offer',
    subtitle: 'Renewal with 20% off. Only available right now.',
    apply_btn: 'Apply discount — $31.99',
    cancel_btn: 'Cancel anyway',
    processing: 'Processing...',
    confirm_cancel: 'Are you sure?',
    confirm_text: 'This action cannot be undone. You\'ll lose access to all premium features.',
    confirm_cancel_btn: 'Yes, cancel',
    keep_btn: 'Keep subscription',
    discount_applied: 'Discount applied! Your next renewal will be €31.99'
  },
  nl: {
    loss_header: 'Bij annulering verlies je toegang tot:',
    special_offer: 'Speciaal aanbod — alleen voor jou',
    annual_price: '€39.99',
    discount_price: '€31.99',
    badge: '20% korting — eenmalig aanbod',
    subtitle: 'Verlenging met 20% korting. Alleen nu beschikbaar.',
    apply_btn: 'Korting toepassen — €31,99',
    cancel_btn: 'Toch annuleren',
    processing: 'Bezig...',
    confirm_cancel: 'Weet je het zeker?',
    confirm_text: 'Deze actie kan niet ongedaan worden gemaakt. Je verliest toegang tot alle premium-functies.',
    confirm_cancel_btn: 'Ja, annuleren',
    keep_btn: 'Abonnement houden',
    discount_applied: 'Korting toegepast! Je volgende verlenging wordt €31,99'
  }
};

export default function CancellationModal({ isOpen, onClose, userEmail, lang, onConfirmCancel }) {
  const [step, setStep] = useState('offer'); // 'offer' or 'confirm'
  const [loading, setLoading] = useState(false);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const handleApplyDiscount = async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      // Call backend function to apply discount
      await base44.functions.invoke('applyRetentionDiscount', {
        userEmail,
        discountedPrice: 31.99
      });

      // Update UserProfile with retention flag
      const profiles = await base44.entities.UserProfile.filter({ created_by: userEmail });
      if (profiles?.[0]?.id) {
        await base44.entities.UserProfile.update(profiles[0].id, {
          retention_offer_accepted: true
        });
      }

      toast.success(t.discount_applied);
      onClose();
    } catch (error) {
      toast.error(lang === 'es' ? 'Error al aplicar descuento' : lang === 'nl' ? 'Fout bij toepassen korting' : 'Error applying discount');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAnyway = () => {
    setStep('confirm');
  };

  const handleConfirmCancel = async () => {
    setLoading(true);
    try {
      await onConfirmCancel?.();
      onClose();
    } finally {
      setLoading(false);
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            style={{ pointerEvents: 'auto' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="w-full max-w-md mx-auto mb-0 bg-slate-900 rounded-t-3xl shadow-2xl">
              <div className="p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} className="text-white/60" />
                </button>

                {step === 'offer' ? (
                  <>
                    {/* Loss Aversion Section */}
                    <div className="mt-2">
                      <p className="text-white/70 text-sm font-bold mb-3">
                        {t.loss_header}
                      </p>
                      <div className="space-y-2">
                        {LOSS_ITEMS[lang].map((item, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <X size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                            <span className="text-white/80 text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Special Offer Card */}
                    <div className="bg-gradient-to-r from-amber-600/30 to-orange-600/30 border border-amber-500/40 rounded-2xl p-4">
                      <div className="text-center space-y-2">
                        <p className="text-white text-sm font-bold">{t.special_offer}</p>
                        <div className="inline-block bg-amber-400/20 border border-amber-400/50 rounded-lg px-2.5 py-1 mb-2">
                          <p className="text-amber-300 text-xs font-bold">{t.badge}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-white/50 text-sm line-through">{t.annual_price}</p>
                          <p className="text-amber-300 text-3xl font-black">{t.discount_price}</p>
                          <p className="text-white/40 text-xs">/año</p>
                        </div>
                        <p className="text-white/60 text-xs pt-2">{t.subtitle}</p>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="space-y-3 pt-2">
                      <button
                        onClick={handleApplyDiscount}
                        disabled={loading}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-black text-sm shadow-lg shadow-teal-500/30 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <><Loader2 size={16} className="animate-spin" /> {t.processing}</>
                        ) : (
                          <><Check size={16} /> {t.apply_btn}</>
                        )}
                      </button>
                      <button
                        onClick={handleCancelAnyway}
                        disabled={loading}
                        className="w-full py-3 rounded-2xl border border-red-500/40 text-red-400 font-semibold text-sm hover:bg-red-500/10 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {t.cancel_btn}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Confirmation Screen */}
                    <div className="text-center space-y-4">
                      <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                          <AlertCircle size={32} className="text-red-400" />
                        </div>
                      </div>
                      <div>
                        <p className="text-white text-lg font-black mb-2">{t.confirm_cancel}</p>
                        <p className="text-white/60 text-sm">{t.confirm_text}</p>
                      </div>
                    </div>

                    {/* Confirmation Buttons */}
                    <div className="space-y-3 pt-4">
                      <button
                        onClick={handleConfirmCancel}
                        disabled={loading}
                        className="w-full py-4 rounded-2xl bg-red-500/80 hover:bg-red-500 text-white font-black text-sm shadow-lg shadow-red-500/30 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <><Loader2 size={16} className="animate-spin" /> {t.processing}</>
                        ) : (
                          <>{t.confirm_cancel_btn}</>
                        )}
                      </button>
                      <button
                        onClick={() => setStep('offer')}
                        disabled={loading}
                        className="w-full py-3 rounded-2xl border border-white/20 text-white font-semibold text-sm hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {t.keep_btn}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}