import React from "react";
import { motion } from "framer-motion";
import { Users, Flame, TrendingUp, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTranslation } from "@/components/TranslationProvider";

export default function SocialPreview({ friendsCount, groupsCount, userStreak }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Friends Preview */}
      <Link to={createPageUrl("Friends")}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-br from-teal-500/20 to-cyan-500/10 backdrop-blur-xl border border-teal-500/30 rounded-2xl p-4 hover:border-teal-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/30 flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-teal-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{t("friends") || "Friends"}</p>
                <p className="text-xs text-teal-200 font-medium">{friendsCount || 0} {t("connected") || "connected"}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/40 flex-shrink-0" />
          </div>
        </motion.div>
      </Link>

      {/* Groups Preview */}
      <Link to={createPageUrl("Groups")}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 hover:border-purple-500/50 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={20} className="text-purple-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{t("groups") || "Groups"}</p>
                <p className="text-xs text-purple-200 font-medium">{groupsCount || 0} {t("groups_joined") || "groups"}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/40 flex-shrink-0" />
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}