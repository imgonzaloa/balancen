import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationPermissionModal({ onAllow, onLater }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 bg-black/60"
        onClick={onLater}>
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md bg-slate-800 border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="text-center space-y-2">
            <p className="text-3xl">🔥</p>
            <h2 className="text-white text-xl font-black">Stay on track</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Get reminded before you break your streak.{"\n"}
              We'll only notify you when it matters.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onLater}
              className="flex-1 py-3 rounded-2xl border border-white/20 text-white/60 font-semibold text-sm">
              Maybe later
            </button>
            <button
              onClick={onAllow}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black text-sm">
              Sure! 🙌
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}