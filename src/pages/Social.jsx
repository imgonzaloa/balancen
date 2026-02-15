import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Lock, Plus, UserPlus, Flame, Activity, MessageSquare } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import InviteSystemCard from "@/components/social/InviteSystemCard";
import StatusChip from "@/components/groups/StatusChip";
import { SocialSkeleton } from "@/components/ui/ScreenSkeleton";
import PullToRefresh from "@/components/PullToRefresh";

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
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const isPremium = profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator';

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
    enabled: !!user?.email && isPremium,
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

  const { data: friends = [] } = useQuery({
    queryKey: ["friends", user?.email],
    queryFn: async () => {
      const [sent, received] = await Promise.all([
        base44.entities.Friend.filter({ created_by: user?.email }),
        base44.entities.Friend.filter({ friend_user_id: user?.email })
      ]);
      return [...sent, ...received].filter(f => f);
    },
    enabled: !!user?.email && isPremium,
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

  const { data: friendProfiles = [] } = useQuery({
    queryKey: ["friendProfiles", friends.map(f => f.friend_user_id || f.created_by)],
    queryFn: async () => {
      const friendIds = friends.map(f => 
        f.created_by === user?.email ? f.friend_user_id : f.created_by
      );
      if (friendIds.length === 0) return [];
      // Fetch profiles with small delays to avoid rate limit
      const profiles = [];
      for (let i = 0; i < friendIds.length; i++) {
        if (i > 0) await new Promise(resolve => setTimeout(resolve, 100));
        const p = await base44.entities.UserProfile.filter({ created_by: friendIds[i] });
        profiles.push(p[0]);
      }
      return profiles.filter(Boolean);
    },
    enabled: isPremium && friends.length > 0,
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

  if (!user || !profile) {
    return <SocialSkeleton />;
  }

  return (
    <PullToRefresh>
      <div className="min-h-screen" style={{ minHeight: '100dvh', paddingBottom: '96px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-2xl mx-auto px-6 pb-8 space-y-4">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-white mb-1">
            {t('social')}
          </h1>
          <p className="text-white/70 text-sm">
            {t('connect_compete_share')}
          </p>
        </div>

        {/* Invite Friends Card - Always visible */}
        <InviteSystemCard profile={profile} />

        {/* Social Feed Quick Access */}
        <button
          onClick={() => navigate(createPageUrl('Feed'))}
          className="w-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 backdrop-blur-xl border border-teal-400/30 rounded-3xl p-6 hover:from-teal-500/30 hover:to-emerald-500/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                <MessageSquare size={24} className="text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-bold text-lg">
                  {t('social_feed') || 'Social Feed'}
                </h3>
                <p className="text-teal-200 text-sm">
                  {t('share_and_connect') || 'Share progress with friends'}
                </p>
              </div>
            </div>
            <Plus size={24} className="text-teal-300" />
          </div>
        </button>

        {/* Friend Feed Section - PREMIUM ONLY */}
        <div className="space-y-4">
          {!isPremium ? (
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
                <h3 className="text-white font-black text-xl mb-2">{t('locked_feature')}</h3>
                <p className="text-white/90 text-sm mb-6 leading-relaxed">
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
          ) : (
            <>
             <div className="flex items-center justify-between">
               <h2 className="text-white font-black text-lg flex items-center gap-2">
                 <Users size={20} />
                 {t('my_friends')}
               </h2>
               <Button
                 onClick={() => navigate(createPageUrl('Friends'))}
                 size="sm"
                 variant="outline"
                 className="border-white/20 bg-white/10 text-white hover:bg-white/20 rounded-full h-9 px-4"
               >
                 <UserPlus size={16} className="mr-1" />
                 {t('add_friend')}
               </Button>
             </div>

             {friendProfiles.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
              <Users size={40} className="text-white/30 mx-auto mb-3" />
              <p className="text-white/80 font-bold mb-1">{t('no_friends_yet')}</p>
              <p className="text-white/60 text-sm mb-4">{t('invite_friends_to_join')}</p>
              <Button
                onClick={() => navigate(createPageUrl('Friends'))}
                className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl"
              >
                <UserPlus size={16} className="mr-2" />
                {t('add_friend')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {friendProfiles.slice(0, 5).map((friend, idx) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {friend.display_name?.charAt(0) || "?"}
                      </div>
                      {friend.status_text && (
                        <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded-full border-2 border-slate-900">
                          ✨
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">{friend.display_name}</p>
                      {friend.status_text && (
                        <StatusChip status={{ status_text: friend.status_text, status_updated_at: friend.status_updated_at }} />
                      )}
                      <div className="flex items-center gap-3 text-xs mt-2">
                        <span className="flex items-center gap-1 text-orange-300">
                          <Flame size={12} />
                          {friend.current_streak || 0}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-300">
                          <Activity size={12} />
                          {friend.total_checkins || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {friendProfiles.length > 5 && (
                <button
                  onClick={() => navigate(createPageUrl('Friends'))}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  {t('view_all')} ({friendProfiles.length})
                </button>
              )}
              </div>
              )}
              </>
              )}
              </div>

        {/* Groups Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-black text-lg flex items-center gap-2">
              <Users size={20} />
              {t('your_groups')}
            </h2>
            {isPremium && (
              <Button
                onClick={() => navigate(createPageUrl('Groups'))}
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full h-9 px-4"
              >
                <Plus size={16} className="mr-1" />
                {t('create_group_btn')}
              </Button>
            )}
          </div>

          {!isPremium ? (
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
                <h3 className="text-white font-black text-xl mb-2">{t('locked_feature')}</h3>
                <p className="text-white/90 text-sm mb-6 leading-relaxed">
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
            <div className="space-y-3">
              {myGroups.map((group) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`${createPageUrl('GroupDetail')}?id=${group.id}`)}
                  className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/30 hover:border-purple-500/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg">{group.name}</h3>
                      <p className="text-purple-200 text-sm">{group.member_count || 0} {t('members')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Flame size={18} className="text-amber-400" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </PullToRefresh>
  );
}