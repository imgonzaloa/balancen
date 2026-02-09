import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Lock, Plus, Trophy, Flame, TrendingUp } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import InviteSystemCard from "@/components/social/InviteSystemCard";
import { SocialSkeleton } from "@/components/ui/ScreenSkeleton";

export default function Social() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: myGroups = [] } = useQuery({
    queryKey: ["myGroups", user?.email],
    queryFn: async () => {
      const members = await base44.entities.GroupMember.filter({ user_email: user?.email });
      const groupIds = members.map(m => m.group_id);
      if (groupIds.length === 0) return [];
      const groups = await Promise.all(
        groupIds.map(id => base44.entities.Group.filter({ id }))
      );
      return groups.flat();
    },
    enabled: !!user?.email && !!profile?.is_premium,
  });

  const isPremium = profile?.is_premium || false;

  if (!user || !profile) {
    return <SocialSkeleton />;
  }

  return (
    <div className="min-h-screen" style={{ minHeight: '100dvh', paddingBottom: '96px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-2xl mx-auto px-6 pt-4 pb-8 space-y-5">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-white mb-1">
            {t('social')}
          </h1>
          <p className="text-white/60 text-sm">
            {t('connect_compete_share')}
          </p>
        </div>

        {/* Invite Friends Card - Always visible */}
        <InviteSystemCard profile={profile} />

        {/* Groups Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-black text-lg flex items-center gap-2">
              <Users size={20} />
              {t('your_groups')}
            </h2>
            {isPremium && (
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate(createPageUrl('Groups'))}
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full h-9 px-4"
                >
                  <Plus size={16} className="mr-1" />
                  {t('create_group_btn')}
                </Button>
              </div>
            )}
          </div>

          {!isPremium ? (
            /* Premium Lock */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-400/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Lock size={32} className="text-white" />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">{t('locked_feature')}</h3>
                <p className="text-white/80 text-sm mb-6 leading-relaxed">
                  {t('unlock_social')}
                </p>
                <Button
                  onClick={() => navigate(createPageUrl('Premium'))}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-8 rounded-2xl shadow-xl"
                >
                  {t('upgrade_now')}
                </Button>
              </div>
            </motion.div>
          ) : myGroups.length === 0 ? (
            /* Empty State */
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
              <Users size={40} className="text-white/30 mx-auto mb-3" />
              <p className="text-white/80 font-bold mb-1">{t('no_groups_joined')}</p>
              <p className="text-white/60 text-sm mb-4">{t('create_join_group')}</p>
              <Button
                onClick={() => navigate(createPageUrl('Groups'))}
                className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl"
              >
                <Plus size={16} className="mr-2" />
                {t('join_group_btn')}
              </Button>
            </div>
          ) : (
            /* Groups List */
            <div className="space-y-3">
              {myGroups.map((group) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`${createPageUrl('GroupDetail')}?id=${group.id}`)}
                  className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/30 hover:border-purple-500/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-white font-bold text-lg">{group.name}</h3>
                      <p className="text-purple-200 text-sm">{group.member_count || 0} {t('members')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Trophy size={20} className="text-amber-400" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                        <TrendingUp size={20} className="text-teal-400" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/70">
                    <div className="flex items-center gap-1">
                      <Flame size={14} className="text-orange-400" />
                      <span>{t('leaderboard')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-teal-400" />
                      <span>{t('feed')}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats - Premium only */}
        {isPremium && myGroups.length > 0 && (
          <div className="bg-gradient-to-br from-teal-500/15 to-emerald-500/15 backdrop-blur-xl rounded-2xl p-5 border border-teal-500/20">
            <h3 className="text-teal-300/90 text-xs font-bold uppercase tracking-wider mb-3">
              {t('this_week')}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-black text-white mb-1">
                  {profile?.fire_total || 0}
                </div>
                <div className="text-[10px] text-white/50 uppercase tracking-wider font-bold">
                  {t('fire_points')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-white mb-1">
                  {profile?.current_streak || 0}
                </div>
                <div className="text-[10px] text-white/50 uppercase tracking-wider font-bold">
                  {t('current_streak')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-white mb-1">
                  {myGroups.length}
                </div>
                <div className="text-[10px] text-white/50 uppercase tracking-wider font-bold">
                  {t('groups')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}