import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emojiOptions = ["😊", "🔥", "💪", "🎯", "✨", "🚀", "💯", "⚡", "🌟", "👑"];

export default function SetStatusModal({ isOpen, onClose, onSave, currentStatus }) {
  const [emoji, setEmoji] = useState(currentStatus?.emoji || "");
  const [text, setText] = useState(currentStatus?.text || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ emoji, text });
    setSaving(false);
    onClose();
  };

  const handleClear = async () => {
    setSaving(true);
    await onSave({ emoji: "", text: "" });
    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-white/20"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={18} className="text-white" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Set your status</h2>
          </div>

          {/* Emoji Picker */}
          <div className="mb-4">
            <Label className="text-teal-200 mb-2 block">Choose an emoji</Label>
            <div className="flex flex-wrap gap-2">
              {emojiOptions.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-12 h-12 rounded-xl text-2xl transition-all ${
                    emoji === e
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 scale-110 shadow-lg"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Status Text */}
          <div className="mb-6">
            <Label className="text-teal-200 mb-2 block">Status text (max 20 chars)</Label>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 20))}
              placeholder="What's happening?"
              maxLength={20}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl"
            />
            <p className="text-xs text-white/60 mt-1 text-right">{text.length}/20</p>
          </div>

          {/* Preview */}
          {(emoji || text) && (
            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs text-white/60 mb-2">Preview:</p>
              <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm px-3 py-1.5 rounded-full">
                {emoji} {text}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleClear}
              disabled={saving}
              className="flex-1 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
            >
              Clear status
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || (!emoji && !text)}
              className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>

          <p className="text-xs text-white/50 text-center mt-4">
            Status expires after 24 hours
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}