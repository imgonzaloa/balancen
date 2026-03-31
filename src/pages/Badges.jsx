import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ChevronLeft, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BadgeCard, { badgeConfig } from "@/components/ui/BadgeCard";

export default function Badges() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: badges = [] } = useQuery({
    queryKey: ["badges", user?.email],
    queryFn: () => base44.entities.Badge.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const earnedTypes = new Set(badges.map(b => b.badge_type));
  const allBadgeTypes = Object.keys(badgeConfig);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900/30 to-slate-900">
      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 pt-6 pb-4 z-10">
          <div className="flex items-center gap-4">
            <Link
              to={createPageUrl("Home")}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center"
            >
              <ChevronLeft size={20} className="text-white" />
            </Link>
            <h1 className="text-xl font-bold text-white">Mis logros</h1>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 mb-6 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Logros desbloqueados</p>
              <p className="text-4xl font-bold mt-1">
                {badges.length}/{allBadgeTypes.length}
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <span className="text-3xl">🏆</span>
            </div>
          </div>
        </motion.div>

        {/* Earned Badges */}
        {badges.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-semibold text-white mb-4">Conseguidos</h2>
            <div className="grid grid-cols-3 gap-4">
              {badges.map((badge, i) => (
                <motion.div
                  key={badge.id}
                  className="flex flex-col items-center gap-2 bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-3"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <BadgeCard badgeType={badge.badge_type} earned />
                  <span className="text-xs font-medium text-white text-center">
                    {badgeConfig[badge.badge_type]?.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Locked Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">Por desbloquear</h2>
          <div className="space-y-3">
            {allBadgeTypes
              .filter(type => !earnedTypes.has(type))
              .map((type, i) => {
                const config = badgeConfig[type];
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={type}
                    className="bg-white/5 border border-white/5 opacity-50 rounded-2xl p-4 flex items-center gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 0.5, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center relative">
                      <Icon size={28} className="text-white/30" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                        <Lock size={10} className="text-white/50" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{config.label}</p>
                      <p className="text-sm text-white/60">{config.description}</p>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}