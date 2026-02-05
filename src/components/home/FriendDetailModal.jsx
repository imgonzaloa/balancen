import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FriendDetailModal({ friend, onClose }) {
  if (!friend) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-sm bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 border border-white/20 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-white" />
          </button>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            {friend.avatar_url ? (
              <img
                src={friend.avatar_url}
                alt={friend.display_name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-2xl mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white/30 shadow-2xl mb-4">
                {friend.display_name.charAt(0).toUpperCase()}
              </div>
            )}

            <h2 className="text-2xl font-bold text-white mb-2">{friend.display_name}</h2>

            {/* Fire Count */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg">
              <Flame size={20} className="text-white" fill="currentColor" />
              <span className="text-lg font-bold text-white">{friend.fire_count} Fire</span>
            </div>
          </div>

          {/* Status */}
          {friend.status_text && (
            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
              <p className="text-sm text-white/60 mb-1">Status</p>
              <p className="text-white font-medium">{friend.status_text}</p>
            </div>
          )}

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            Close
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}