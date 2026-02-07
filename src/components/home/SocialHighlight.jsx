import React from "react";
import { motion } from "framer-motion";
import { Users, Flame } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SocialHighlight({ friendsCount, topFriendStreak }) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  
  if (friendsCount === 0) return null;
  
  return (
    <motion.button
      onClick={() => navigate(createPageUrl("Social"))}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className="w-full bg-gradient-to-r from-teal-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl p-4 border border-teal-500/30"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-sm">
              {lang === "es" 
                ? `${friendsCount} ${friendsCount === 1 ? 'amigo activo' : 'amigos activos'}`
                : `${friendsCount} ${friendsCount === 1 ? 'friend' : 'friends'} active`}
            </p>
            {topFriendStreak > 0 && (
              <div className="flex items-center gap-1">
                <Flame size={12} className="text-orange-400" />
                <p className="text-white/60 text-xs">
                  {lang === "es" ? `Mejor racha: ${topFriendStreak}` : `Top streak: ${topFriendStreak}`}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="text-teal-300 text-xs font-medium">
          {lang === "es" ? "Ver todo" : "View all"}
        </div>
      </div>
    </motion.button>
  );
}