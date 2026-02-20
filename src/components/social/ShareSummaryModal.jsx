import React, { useState } from "react";
import { X, Share2, Copy, Check, Flame, Zap, Utensils, Droplets, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const PERIODS = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
];

function buildSummaryText({ period, profile, todayMeals, weeklyStats }) {
  const name = profile?.display_name || "I";
  const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (period === "today") {
    const calories = todayMeals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0);
    const streak = profile?.current_streak || 0;
    return `📊 ${name}'s daily summary (${date})\n\n` +
      `🔥 Streak: ${streak} days\n` +
      `🍽️ Meals logged: ${todayMeals.length}\n` +
      (calories > 0 ? `⚡ Calories: ${Math.round(calories)} kcal\n` : '') +
      `\nTracked with Balancen 💪`;
  } else {
    const { totalCheckins = 0, totalCalories = 0, streak = 0 } = weeklyStats || {};
    return `📊 ${name}'s weekly summary\n\n` +
      `🔥 Streak: ${streak} days\n` +
      `✅ Check-ins: ${totalCheckins}/7 days\n` +
      (totalCalories > 0 ? `⚡ Avg calories: ${Math.round(totalCalories / 7)} kcal/day\n` : '') +
      `\nTracked with Balancen 💪`;
  }
}

export default function ShareSummaryModal({ profile, todayMeals = [], weeklyStats = {}, onClose }) {
  const [period, setPeriod] = useState("today");
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [postedToFeed, setPostedToFeed] = useState(false);

  const summaryText = buildSummaryText({ period, profile, todayMeals, weeklyStats });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Summary copied!");
    } catch {
      toast.error("Failed to copy.");
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      handleCopy();
      return;
    }
    try {
      await navigator.share({ text: summaryText });
      toast.success("Shared!");
    } catch {}
  };

  const handlePostToFeed = async () => {
    setSharing(true);
    try {
      await base44.entities.Post.create({
        author_email: profile.created_by,
        author_name: profile.display_name,
        author_avatar: profile.avatar_url || profile.profile_photo,
        content: summaryText,
        post_type: "achievement",
        likes_count: 0,
        comments_count: 0,
      });
      setPostedToFeed(true);
      toast.success("Posted to your feed! 🎉");
    } catch {
      toast.error("Failed to post.");
    } finally {
      setSharing(false);
    }
  };

  const streak = profile?.current_streak || 0;
  const calories = todayMeals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-3xl sm:rounded-3xl border border-white/20 w-full sm:max-w-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Share2 size={20} className="text-teal-400" />
              Share Summary
            </h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <X size={20} className="text-white" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Period Toggle */}
            <div className="flex gap-2 bg-white/5 rounded-2xl p-1">
              {PERIODS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                    period === p.id
                      ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Stats Preview Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                  {profile?.profile_photo || profile?.avatar_url ? (
                    <img src={profile.profile_photo || profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    profile?.display_name?.charAt(0) || "?"
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{profile?.display_name}</p>
                  <p className="text-white/50 text-xs">{period === "today" ? "Today's summary" : "Weekly summary"}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Flame size={18} className="text-orange-400 mx-auto mb-1" />
                  <p className="text-white font-bold text-lg">{streak}</p>
                  <p className="text-white/50 text-xs">day streak</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Utensils size={18} className="text-teal-400 mx-auto mb-1" />
                  <p className="text-white font-bold text-lg">{todayMeals.length}</p>
                  <p className="text-white/50 text-xs">meals</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Zap size={18} className="text-amber-400 mx-auto mb-1" />
                  <p className="text-white font-bold text-lg">{calories > 0 ? Math.round(calories) : "—"}</p>
                  <p className="text-white/50 text-xs">kcal</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {!postedToFeed ? (
                <Button
                  onClick={handlePostToFeed}
                  disabled={sharing}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl py-3"
                >
                  {sharing ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Posting...</>
                  ) : (
                    "Post to Feed"
                  )}
                </Button>
              ) : (
                <div className="w-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl py-3 text-center font-semibold text-sm">
                  ✓ Posted to Feed
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleNativeShare}
                  variant="outline"
                  className="flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-xl"
                >
                  <Share2 size={16} className="mr-2" />
                  Share
                </Button>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-xl"
                >
                  {copied ? <Check size={16} className="mr-2 text-emerald-400" /> : <Copy size={16} className="mr-2" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}