import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, X } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useTranslation } from "@/components/TranslationProvider";

export default function StatusBubble({ profile, onUpdate }) {
  const { t } = useTranslation();
  const [showInput, setShowInput] = useState(false);
  const [statusText, setStatusText] = useState(profile?.status_text || "");
  const [saving, setSaving] = useState(false);

  // Check if status expired (24h)
  const isExpired = profile?.status_updated_at 
    ? new Date() - new Date(profile.status_updated_at) > 24 * 60 * 60 * 1000
    : true;

  const displayStatus = !isExpired && profile?.status_text ? profile.status_text : null;

  const handleSave = async () => {
    if (!statusText.trim() || statusText.length > 60) {
      toast.error(t("status_max_60_chars"));
      return;
    }

    setSaving(true);
    try {
      await base44.entities.UserProfile.update(profile.id, {
        status_text: statusText.trim(),
        status_updated_at: new Date().toISOString()
      });
      
      if (onUpdate) onUpdate();
      setShowInput(false);
      toast.success(t("status_updated"));
    } catch (err) {
      toast.error(t("error_updating_status"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      {/* Display Status Above Avatar */}
      <AnimatePresence>
        {displayStatus && !showInput && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg relative">
              {displayStatus}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-500 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Edit Bubble */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowInput(true)}
        className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 z-20"
      >
        <Edit3 size={14} className="text-white" />
      </motion.button>

      {/* Input Modal */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowInput(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-3xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">{t("add_daily_note")}</h3>
                <button
                  onClick={() => setShowInput(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <input
                type="text"
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                maxLength={60}
                placeholder={t("status_placeholder")}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 mb-2"
                autoFocus
              />
              
              <p className="text-white/40 text-xs mb-4">
                {statusText.length}/60 • {t("expires_24h")}
              </p>

              <button
                onClick={handleSave}
                disabled={saving || !statusText.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold disabled:opacity-50"
              >
                {saving ? t("saving") : t("save_status")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}