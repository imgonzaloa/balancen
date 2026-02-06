import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/TranslationProvider";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const BAD_WORDS = ["fuck", "shit", "bitch", "asshole", "damn", "puta", "mierda", "carajo", "pendejo", "idiota"];

export default function SetStatusModal({ isOpen, onClose, currentStatus, profile, onUpdate }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(currentStatus || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const containsBadWord = (text) => {
    const lowerText = text.toLowerCase();
    return BAD_WORDS.some(word => lowerText.includes(word));
  };

  const handleSave = async () => {
    if (status.length > 32) {
      setError(t("status_too_long"));
      return;
    }

    if (containsBadWord(status)) {
      setError(t("status_inappropriate"));
      return;
    }

    setSaving(true);
    try {
      await base44.entities.UserProfile.update(profile.id, {
        status_text: status.trim() || null,
        status_updated_at: status.trim() ? new Date().toISOString() : null
      });
      toast.success(t("status_updated"));
      onUpdate();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await base44.entities.UserProfile.update(profile.id, {
        status_text: null,
        status_updated_at: null
      });
      toast.success(t("status_cleared"));
      onUpdate();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 max-w-md w-full border border-white/10"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">{t("set_status")}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X size={18} className="text-white" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value.slice(0, 32));
                  setError("");
                }}
                placeholder={t("status_placeholder")}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-teal-400 outline-none"
                maxLength={32}
              />
              <p className="text-xs text-white/40 mt-1">
                {status.length}/32 {t("characters")}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-xl px-3 py-2">
                <AlertCircle size={16} className="text-red-400" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              {currentStatus && (
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={saving}
                  className="flex-1"
                >
                  {t("clear_status")}
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={saving || !status.trim()}
                className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500"
              >
                {saving ? t("saving") : t("save")}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}