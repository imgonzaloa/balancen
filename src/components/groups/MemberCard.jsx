import React from "react";
import { motion } from "framer-motion";
import { Flame, Crown } from "lucide-react";

export default function MemberCard({ member, userProfile, rank, isCurrentUser }) {
  const isTop3 = rank < 3;
  
  // Calculate if status is expired (older than 24 hours)
  const isStatusExpired = () => {
    if (!userProfile?.status_updated_at) return true;
    const statusDate = new Date(userProfile.status_updated_at);
    const now = new Date();
    const hoursDiff = (now - statusDate) / (1000 * 60 * 60);
    return hoursDiff > 24;
  };

  const showStatus = userProfile?.status_text && !isStatusExpired();
  const fireTotal = userProfile?.fire_total || member.current_streak || 0;

  return (
    <motion.div
      className={`relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 flex items-center gap-4 shadow-lg ${
        isCurrentUser ? "ring-2 ring-teal-400" : ""
      }`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ delay: rank * 0.05 }}
    >
      {/* Rank Badge */}
      <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${
        rank === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white" :
        rank === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-white" :
        rank === 2 ? "bg-gradient-to-br from-orange-300 to-orange-500 text-white" :
        "bg-white/20 backdrop-blur-sm text-white border border-white/30"
      }`}>
        {rank + 1}
      </div>

      {/* Avatar with Status */}
      <div className="relative">
        {userProfile?.profile_photo || userProfile?.avatar_url ? (
          <img
            src={userProfile.profile_photo || userProfile.avatar_url}
            alt={member.display_name}
            className="w-16 h-16 rounded-full object-cover border-2 border-white/30 shadow-lg"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xl font-bold border-2 border-white/30 shadow-lg">
            {member.display_name?.charAt(0) || "?"}
          </div>
        )}
        
        {/* Status Overlay */}
        {showStatus && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap max-w-[120px] truncate shadow-lg z-10">
            {userProfile.status_text}
          </div>
        )}
        
        {/* Online indicator */}
        {member.checked_in_today && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-lg" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-bold text-white truncate ${isCurrentUser ? "text-teal-300" : ""}`}>
            {member.display_name}
          </span>
          {member.role === "admin" && (
            <Crown size={14} className="text-amber-400 flex-shrink-0" />
          )}
        </div>
        <div className="text-xs text-white/70">
          {member.current_streak || 0} {member.current_streak === 1 ? "day" : "days"}
        </div>
      </div>

      {/* Fire Count */}
      <div className="flex flex-col items-center gap-1">
        <div className={`flex items-center gap-1 px-3 py-2 rounded-xl ${
          fireTotal > 0 ? "bg-gradient-to-r from-orange-500/30 to-red-500/30 border border-orange-400/30" : "bg-white/5"
        }`}>
          <Flame size={20} className={fireTotal > 0 ? "text-orange-400" : "text-white/30"} />
          <span className={`font-bold text-lg ${fireTotal > 0 ? "text-orange-300" : "text-white/40"}`}>
            {fireTotal}
          </span>
        </div>
        {isTop3 && (
          <span className="text-xs text-white/60 font-medium">
            {rank === 0 ? "🥇" : rank === 1 ? "🥈" : "🥉"}
          </span>
        )}
      </div>
    </motion.div>
  );
}