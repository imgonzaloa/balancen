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
          className="bg-gradient-to-br from-teal-500/20 to-cyan-500/10 backdrop-blur-xl border border-teal-500/30 rounded-2xl p-4 hover:bg-teal-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/30 flex items-center justify-center">
                <Users size={20} className="text-teal-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t("friends") || "Friends"}</p>
                <p className="text-xs text-teal-200">{friendsCount || 0} {t("connected") || "connected"}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-white/40" />
          </div>
        </motion.div>
      </Link>

      {/* Groups Preview */}
      <Link to={createPageUrl("Groups")}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 hover:bg-purple-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t("groups") || "Groups"}</p>
                <p className="text-xs text-purple-200">{groupsCount || 0} {t("groups_joined") || "groups"}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-white/40" />
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}