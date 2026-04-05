import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, UserPlus, Flame, Activity, MessageSquare, Trophy, Share2, GraduationCap } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import InviteSystemCard from "@/components/social/InviteSystemCard";
import StatusChip from "@/components/groups/StatusChip";
import { SocialSkeleton } from "@/components/ui/ScreenSkeleton";
import { withTimeout } from "@/components/utils/fetchWithTimeout";
import { useAppState } from "@/components/AppStateContext";
import GlobalHeader from "@/components/GlobalHeader";
import ShareSummaryModal from "@/components/social/ShareSummaryModal";
import { useMealsStore } from "@/components/MealsStore";
import PullToRefresh from "@/components/PullToRefresh";
import { useBlockedUsers } from "@/components/hooks/useBlockedUsers";

export default function Social() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ✅ Use global AppState - eliminates duplicate auth call and lag on every tab visit
  const { user, profile, isInitialized, profileLoading } = useAppState();

  const blockedUsers = useBlockedUsers(user?.email);
  const isPremium = profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator';
  const isCampusAdmin = profile?.role === 'campus_admin' || profile?.role === 'owner';
  const [showShareModal, setShowShareModal] = React.useState(false);
  const { getTodayMeals } = useMealsStore();
  const todayMeals = React.useMemo(() => getTodayMeals(), [getTodayMeals]);

  const { data: myGroups = [] } = useQuery({
    queryKey: ["myGroups", user?.email],
    queryFn: async () => {
      const members = await withTimeout(
        base44.entities.GroupMember.filter({ user_email: user?.email }),
        3000
      );
      const groupIds = members.map(m => m.group_id);
      if (groupIds.length === 0) return [];
      const groups = await Promise.all(
        groupIds.map(id => withTimeout(base44.entities.Group.filter({ id }), 2000).catch(() => []))
      );
      return groups.flat();
    },
    enabled: !!user?.email,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  const { data: friends = [] } = useQuery({
    queryKey: ["friends", user?.email],
    queryFn: async () => {
      const [sent, received] = await Promise.all([
        withTimeout(base44.entities.Friend.filter({ created_by: user?.email }), 3000).catch(() => []),
        withTimeout(base44.entities.Friend.filter({ friend_user_id: user?.email }), 3000).catch(() => [])
      ]);
      return [...sent, ...received].filter(Boolean);
    },
    enabled: !!user?.email,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  const { data: friendProfiles = [] } = useQuery({
    queryKey: ["friendProfiles", friends.map(f => f.id).join(',')],
    queryFn: async () => {
      const friendIds = friends.map(f =>
        f.created_by === user?.email ? f.friend_user_id : f.created_by
      ).filter(id => !blockedUsers.includes(id));
      if (friendIds.length === 0) return [];
      const results = await Promise.all(
        friendIds.slice(0, 10).map(id =>
          withTimeout(base44.entities.UserProfile.filter({ created_by: id }), 2000)
            .then(p => p[0])
            .catch(() => null)
        )
      );
      return results.filter(Boolean);
    },
    enabled: friends.length > 0 && blockedUsers.length >= 0,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  // ✅ Refetch without reloading the page
  const handleRefetch = React.useCallback(() => {
    console.log('[SOCIAL] Refetching data');
    queryClient.invalidateQueries({ queryKey: ["myGroups"] });
    queryClient.invalidateQueries({ queryKey: ["friends"] });
    queryClient.invalidateQueries({ queryKey: ["friendProfiles"] });
  }, [queryClient]);

  // Show skeleton only while booting or actively loading profile for a known user
  if (!isInitialized) {
    return <SocialSkeleton />;
  }

  // Anonymous
  if (!user?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Users size={40} className="text-white/30" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-3">{t('connect_with_friends')}</h2>
          <p className="text-white/60 mb-8">{t('sign_in_to_see_social')}</p>
          <Button
            onClick={() => navigate(createPageUrl('Profile'))}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold"
          >
            {t('go_to_profile')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh>
    <div style={{ minHeight: '100%', paddingBottom: '8px' }}>
      <div className="max-w-2xl mx-auto px-6 pb-8 space-y-4">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-white mb-1">{t('social')}</h1>
          <p className="text-white/70 text-sm">{t('connect_compete_share')}</p>
        </div>

        {/* Invite Friends Card */}
        <InviteSystemCard profile={profile} />

        {/* Quick action cards: Feed, Challenges, Share */}
        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => navigate(createPageUrl('Feed'))}
            className="w-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 backdrop-blur-xl border border-teal-400/30 rounded-2xl p-4 hover:from-teal-500/30 transition-all flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
              <MessageSquare size={20} className="text-white" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-white font-bold">{t('social_feed')}</h3>
              <p className="text-teal-200 text-xs">{t('share_and_connect')}</p>
            </div>
            <Plus size={20} className="text-teal-300" />
          </button>

          <button
            type="button"
            onClick={() => navigate(createPageUrl('Challenges'))}
            className="w-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl border border-amber-400/30 rounded-2xl p-4 hover:from-amber-500/30 transition-all flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Trophy size={20} className="text-white" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-white font-bold">{lang === 'es' ? 'Retos' : lang === 'pt' ? 'Desafios' : 'Challenges'}</h3>
              <p className="text-amber-200 text-xs">{lang === 'es' ? 'Únete a retos grupales o individuales' : lang === 'pt' ? 'Entre em desafios em grupo ou individuais' : 'Join group or solo challenges'}</p>
            </div>
            <Plus size={20} className="text-amber-300" />
          </button>

          {isPremium && (
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="w-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-400/30 rounded-2xl p-4 hover:from-purple-500/30 transition-all flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Share2 size={20} className="text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-white font-bold">{lang === 'es' ? 'Compartir Resumen' : lang === 'pt' ? 'Compartilhar Resumo' : 'Share Summary'}</h3>
                <p className="text-purple-200 text-xs">{lang === 'es' ? 'Comparte tus stats de hoy o de la semana' : lang === 'pt' ? 'Compartilhe suas stats de hoje ou da semana' : "Share today's or weekly stats"}</p>
              </div>
            </button>
          )}

          {isCampusAdmin && (
            <button
              type="button"
              onClick={() => navigate(createPageUrl('CampusAdminHub'))}
              className="w-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-xl border border-teal-400/30 rounded-2xl p-4 hover:from-teal-500/30 transition-all flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <GraduationCap size={20} className="text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-white font-bold">Campus</h3>
                <p className="text-teal-200 text-xs">Create & manage a private campus group</p>
              </div>
              <Plus size={20} className="text-teal-300" />
            </button>
          )}
        </div>

        {showShareModal && profile && (
          <ShareSummaryModal
            profile={profile}
            todayMeals={todayMeals}
            onClose={() => setShowShareModal(false)}
          />
        )}

        {/* Friends section */}
        <div className="space-y-4">
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
              <Button onClick={() => navigate(createPageUrl('Friends'))} className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl">
                <UserPlus size={16} className="mr-2" />
                {t('add_friend')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {friendProfiles.slice(0, 5).map((friend) => (
                <div
                  key={friend.id}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {friend.display_name?.charAt(0) || "?"}
                      </div>
                      {friend.status_text && (
                        <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded-full border-2 border-slate-900">✨</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">{friend.display_name}</p>
                      {friend.status_text && (
                        <StatusChip status={{ status_text: friend.status_text, status_updated_at: friend.status_updated_at }} />
                      )}
                      <div className="flex items-center gap-3 text-xs mt-2">
                        <span className="flex items-center gap-1 text-orange-300">
                          <Flame size={12} />{friend.current_streak || 0}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-300">
                          <Activity size={12} />{friend.total_checkins || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {friendProfiles.length > 5 && (
                <button
                  type="button"
                  onClick={() => navigate(createPageUrl('Friends'))}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  {t('view_all')} ({friendProfiles.length})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Groups section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-black text-lg flex items-center gap-2">
              <Users size={20} />
              {t('your_groups')}
            </h2>
            <Button
              onClick={() => navigate(createPageUrl('Groups'))}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full h-9 px-4"
            >
              <Plus size={16} className="mr-1" />{t('create_group_btn')}
            </Button>
          </div>

          {myGroups.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
              <Users size={40} className="text-white/30 mx-auto mb-3" />
              <p className="text-white/80 font-bold mb-1">{t('no_groups_joined')}</p>
              <p className="text-white/60 text-sm mb-4">{t('create_join_group')}</p>
              <Button onClick={() => navigate(createPageUrl('Groups'))} className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl">
                <Plus size={16} className="mr-2" />{t('join_group_btn')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {myGroups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => navigate(`${createPageUrl('GroupDetail')}?id=${group.id}`)}
                  className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/30 hover:border-purple-500/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg">{group.name}</h3>
                      <p className="text-purple-200 text-sm">{group.member_count || 0} {t('members')}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Flame size={18} className="text-amber-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual refresh button */}
        <button
          type="button"
          onClick={handleRefetch}
          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/10 transition-colors"
        >
          {t('reload')}
        </button>
      </div>
    </div>
    </PullToRefresh>
  );
}