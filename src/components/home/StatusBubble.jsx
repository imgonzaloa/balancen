import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import SetStatusModal from "@/components/groups/SetStatusModal";
import { useTranslation } from "@/components/TranslationProvider";

export default function StatusBubble({ profile, onUpdate }) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

  // Check if status is still valid (< 24h old)
  const isStatusExpired = () => {
    if (!profile?.status_updated_at) return true;
    const updatedAt = new Date(profile.status_updated_at);
    const now = new Date();
    const hoursDiff = (now - updatedAt) / (1000 * 60 * 60);
    return hoursDiff >= 24;
  };

  const hasActiveStatus = profile?.status_text && !isStatusExpired();

  return (
    <>
      <motion.button
        onClick={() => setModalOpen(true)}
        className="relative group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Avatar circle */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold shadow-lg border-2 border-white/20">
          {profile?.display_name?.charAt(0) || "U"}
        </div>

        {/* Status bubble or sparkle indicator */}
        {hasActiveStatus ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-white rounded-full px-2 py-0.5 shadow-lg border border-teal-300"
          >
            <p className="text-[10px] font-semibold text-slate-900 max-w-[60px] truncate">
              {profile.status_text}
            </p>
          </motion.div>
        ) : (
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full p-1 shadow-lg"
          >
            <Sparkles size={10} className="text-white" />
          </motion.div>
        )}
      </motion.button>

      {/* Status Modal */}
      <SetStatusModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentStatus={profile?.status_text}
        profile={profile}
        onUpdate={onUpdate}
      />
    </>
  );
}