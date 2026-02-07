import React from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTranslation } from "@/components/TranslationProvider";

export default function GroupLeaderboardShortcut({ topMembers = [] }) {
  const { t } = useTranslation();

  if (topMembers.length === 0) return null;

  return (
    <Link to={createPageUrl("Groups")}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-5 cursor-pointer hover:border-purple-500/50 transition-all"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-400" size={20} />
            <h3 className="text-white font-bold">{t("group_leaderboard")}</h3>
          </div>
          <ChevronRight className="text-white/60" size={20} />
        </div>

        <div className="space-y-2">
          {topMembers.slice(0, 3).map((member, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white/5 rounded-xl p-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                  {(member.name || "?").charAt(0).toUpperCase()}
                </div>
                <p className="text-white text-sm font-medium">{member.name}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame size={14} className="text-orange-400" />
                <span className="text-white font-bold text-sm tabular-nums" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {member.fire || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </Link>
  );
}