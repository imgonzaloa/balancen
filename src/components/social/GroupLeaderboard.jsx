import React from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Medal } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function GroupLeaderboard({ members }) {
  const { t } = useTranslation();

  const sortedMembers = [...members].sort((a, b) => 
    (b.profile?.fire_total || 0) - (a.profile?.fire_total || 0)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={20} className="text-amber-400" />
        <h3 className="text-white font-bold text-lg">{t('leaderboard')}</h3>
        <span className="text-white/50 text-sm ml-auto">{t('this_week')}</span>
      </div>

      {sortedMembers.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
          <Trophy size={40} className="text-white/40 mx-auto mb-3" />
          <p className="text-white/60 text-sm">{t('no_members_yet')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedMembers.map((member, index) => {
            const rank = index + 1;
            const isTopThree = rank <= 3;
            
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  isTopThree
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/15 border-amber-500/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {/* Rank */}
                <div className="w-8 text-center flex-shrink-0">
                  {rank === 1 && <Medal size={24} className="text-yellow-400 mx-auto" />}
                  {rank === 2 && <Medal size={22} className="text-gray-300 mx-auto" />}
                  {rank === 3 && <Medal size={20} className="text-orange-400 mx-auto" />}
                  {rank > 3 && <span className="text-white/60 font-bold text-lg">#{rank}</span>}
                </div>

                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg border-2 border-white/20 flex-shrink-0">
                  {(member.profile?.display_name || member.display_name || "?").charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold truncate">
                    {member.profile?.display_name || member.display_name || t('unknown_user')}
                  </p>
                  <p className="text-white/60 text-xs">
                    {member.profile?.current_streak || 0} {t('day_streak')}
                  </p>
                </div>

                {/* Fire Points */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-400/30 rounded-full px-3 py-1.5">
                    <Flame size={16} className="text-orange-400" />
                    <span className="text-white font-black text-lg tabular-nums">
                      {member.profile?.fire_total || 0}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}