import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const generateAffiliateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function CreateAffiliateModal({ isOpen, onClose, onSubmit, lang }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && !code) {
      setCode(generateAffiliateCode());
      setName('');
    }
  }, [isOpen]);

  const handleGenerate = () => {
    setCode(generateAffiliateCode());
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ code, name });
    setName('');
    setCode('');
  };

  const labels = {
    es: {
      title: 'Crear Código de Afiliado',
      influencer: 'Nombre del influencer/coach',
      code: 'Código de afiliado',
      regen: 'Regenerar',
      discount: '20% de descuento en plan anual',
      create: 'Crear código',
      cancel: 'Cancelar',
      copied: 'Copiado',
    },
    nl: {
      title: 'Maak Affiliatecode',
      influencer: 'Naam influencer/coach',
      code: 'Affiliatecode',
      regen: 'Regenereren',
      discount: '20% korting op jaarplan',
      create: 'Code maken',
      cancel: 'Annuleren',
      copied: 'Gekopieerd',
    },
    en: {
      title: 'Create Affiliate Code',
      influencer: 'Influencer/Coach Name',
      code: 'Affiliate Code',
      regen: 'Regenerate',
      discount: '20% discount on annual plan',
      create: 'Create Code',
      cancel: 'Cancel',
      copied: 'Copied',
    },
  };

  const t = labels[lang] || labels.en;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed inset-0 flex items-end z-50 pointer-events-none"
          >
            <div className="w-full bg-slate-800 rounded-t-3xl p-6 pointer-events-auto space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black text-white">{t.title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white/60" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Influencer Name */}
                <div>
                  <label className="text-white/70 text-xs font-bold uppercase tracking-wider block mb-2">
                    {t.influencer}
                  </label>
                  <Input
                    ref={inputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'es' ? 'e.g., Juan Pérez' : lang === 'nl' ? 'bv. Jan Jansen' : 'e.g., John Smith'}
                    className="bg-white/5 border-white/20 text-white placeholder-white/30 rounded-xl"
                  />
                </div>

                {/* Generated Code */}
                <div>
                  <label className="text-white/70 text-xs font-bold uppercase tracking-wider block mb-2">
                    {t.code}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={code}
                      readOnly
                      className="bg-white/5 border-white/20 text-white font-mono text-lg font-bold rounded-xl"
                    />
                    <button
                      onClick={handleCopy}
                      className="p-3 bg-teal-500/20 border border-teal-400/30 rounded-xl hover:bg-teal-500/30 transition-colors flex-shrink-0"
                      title={t.copied}
                    >
                      {copied ? (
                        <Check size={18} className="text-teal-300" />
                      ) : (
                        <Copy size={18} className="text-teal-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                  <p className="text-emerald-300 text-xs leading-relaxed">
                    ✓ {t.discount}
                  </p>
                </div>

                {/* Regen button */}
                <Button
                  onClick={handleGenerate}
                  variant="outline"
                  className="w-full text-white/70 border-white/20 hover:bg-white/5"
                >
                  {t.regen}
                </Button>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1 text-white/70 border-white/20 hover:bg-white/5"
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!name.trim()}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold disabled:opacity-50"
                  >
                    {t.create}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}