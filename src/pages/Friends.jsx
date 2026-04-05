import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Users, CheckCircle, XCircle, Flame, Activity, MessageCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { createPageUrl } from "@/utils";
import StatusChip from "@/components/groups/StatusChip";
import { useBlockedUsers } from "@/components/hooks/useBlockedUsers";

export default function Friends() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [friendEmail, setFriendEmail] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const queryClient = useQueryClient();
  const blockedUsers = useBlockedUsers(user?.email);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.UserProfile.filter({ created_by: user.email })
      .then(profiles => setProfile(profiles[0]));
  }, [user]);

  const { data: sentRequests = [] } = useQuery({
    queryKey: ["friendsSent", user?.email],
    queryFn: () => base44.entities.Friend.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: receivedRequests = [] } = useQuery({
    queryKey: ["friendsReceived", user?.email],
    queryFn: () => base44.entities.Friend.filter({ friend_email: user?.email }),
    enabled: !!user?.email,
  });

  const acceptedFriends = [...sentRequests, ...receivedRequests].filter(f => f.status === "accepted");

  const { data: friendProfiles = [] } = useQuery({
    queryKey: ["friendProfiles", acceptedFriends.map(f => f.user_email === user?.email ? f.friend_email : f.user_email)],
    queryFn: async () => {
      const emails = acceptedFriends
        .map(f => f.user_email === user?.email ? f.friend_email : f.user_email)
        .filter(email => !blockedUsers.includes(email));
      if (emails.length === 0) return [];
      const profileResults = await Promise.all(emails.map(email => base44.entities.UserProfile.filter({ created_by: email }).then(r => r[0]).catch(() => null)));
      return profileResults.filter(Boolean);
    },
    enabled: acceptedFriends.length > 0 && blockedUsers.length >= 0,
    staleTime: 10 * 60 * 1000,
  });

  const { data: friendMeals = [] } = useQuery({
    queryKey: ["friendMeals", acceptedFriends.map(f => f.user_email === user?.email ? f.friend_email : f.user_email)],
    queryFn: async () => {
      const emails = acceptedFriends
        .map(f => f.user_email === user?.email ? f.friend_email : f.user_email)
        .filter(email => !blockedUsers.includes(email));
      if (emails.length === 0) return [];
      const mealResults = await Promise.all(emails.map(email => base44.entities.MealLog.filter({ created_by: email }, '-date', 5).then(r => r.map(meal => ({ ...meal, friend_email: email }))).catch(() => [])));
      return mealResults.flat();
    },
    enabled: acceptedFriends.length > 0 && blockedUsers.length >= 0,
    staleTime: 10 * 60 * 1000,
  });

  const pendingRequests = receivedRequests.filter(f => f.status === "pending");

  const sendRequestMutation = useMutation({
    mutationFn: async (email) => {
      if (!user?.email) throw new Error("Not authenticated");
      const existing = [...sentRequests, ...receivedRequests].find(
        f => (f.user_email === email || f.friend_email === email)
      );
      if (existing) throw new Error(t("friend_request_exists"));
      return base44.entities.Friend.create({
        user_email: user.email,
        friend_email: email,
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendsSent"] });
      toast.success(t("friend_request_sent"));
      setFriendEmail("");
      setShowAddDialog(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const respondRequestMutation = useMutation({
    mutationFn: ({ requestId, status }) => 
      base44.entities.Friend.update(requestId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendsReceived"] });
      queryClient.invalidateQueries({ queryKey: ["friendsSent"] });
      toast.success(t("request_updated"));
    },
  });

  const isPremium = profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator';

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen relative overflow-hidden pb-24" style={{ minHeight: '100dvh' }}>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-2xl mx-auto px-6 pt-6 pb-8 relative z-10">
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
              <UserPlus size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('premium_feature') || 'Premium Feature'}</h3>
            <p className="text-white/70 text-sm mb-6">
              {t('unlock_friends_features') || 'Unlock friends features to connect with others'}
            </p>
            <button
              onClick={() => navigate(createPageUrl('Premium'))}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-8 py-3 rounded-2xl"
            >
              {t('upgrade_now') || 'Upgrade Now'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute -bottom-8 right-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24 pt-8 relative z-10">
        {/* Invite Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-400/30 rounded-2xl p-5 mb-4"
        >
          <h3 className="text-white font-black text-lg mb-1">Invite friends, eat better together 🍽️</h3>
          <p className="text-white/60 text-sm mb-3">You both get 7 extra days of Premium.</p>
          <button
            onClick={() => {
              const code = profile?.invite_code || profile?.id?.slice(0, 8);
              navigator.clipboard?.writeText(code).catch(() => {});
              toast.success("Copied!");
            }}
            className="bg-white/10 rounded-xl px-4 py-2 text-teal-300 font-mono font-bold text-sm w-full flex items-center justify-between mb-2 hover:bg-white/20 transition-colors"
          >
            <span>{profile?.invite_code || profile?.id?.slice(0, 8)}</span>
            <Copy size={16} />
          </button>
          <button
            onClick={() => {
              const code = profile?.invite_code || profile?.id?.slice(0, 8);
              const inviteMessages = {
                es: `Únete a Balancen! Usa mi código ${code} para un trial Premium gratis. https://balancen.app`,
                en: `Join me on Balancen! Use my code ${code} for a free Premium trial. https://balancen.app`,
                pt: `Junte-se a mim no Balancen! Use meu código ${code} para um trial Premium grátis. https://balancen.app`,
              };
              const msg = inviteMessages[lang] || inviteMessages.en;
              if (navigator.share) {
                navigator.share({ text: msg }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(msg).catch(() => {});
                toast.success(lang === 'es' ? '¡Copiado!' : lang === 'pt' ? 'Copiado!' : 'Copied!');
              }
            }}
            className="bg-teal-500 text-white font-bold rounded-xl px-4 py-3 w-full hover:bg-teal-600 transition-colors"
          >
            {lang === 'es' ? 'Compartir enlace de invitación' : lang === 'pt' ? 'Compartilhar link de convite' : 'Share invite link'}
          </button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">{t("friends_title")}</h1>
            <p className="text-teal-200 text-sm mt-1">{friendProfiles.length} {t("connected")}</p>
          </div>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-teal-500 hover:bg-teal-600 rounded-2xl">
                <UserPlus size={20} />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">{t("add_friend")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder={t("friend_email")}
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder-white/50"
                />
                <Button
                  onClick={() => sendRequestMutation.mutate(friendEmail)}
                  disabled={!friendEmail || sendRequestMutation.isPending}
                  className="w-full bg-teal-500 hover:bg-teal-600"
                >
                  {t("send_request")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Pending Requests */}
        <AnimatePresence>
          {pendingRequests.length > 0 && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-lg font-semibold text-white mb-3">{t("pending_requests")}</h2>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-medium">{request.user_email}</p>
                      <p className="text-teal-200 text-sm">{t("wants_to_connect")}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondRequestMutation.mutate({ requestId: request.id, status: "accepted" })}
                        className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors"
                      >
                        <CheckCircle size={20} className="text-emerald-300" />
                      </button>
                      <button
                        onClick={() => respondRequestMutation.mutate({ requestId: request.id, status: "rejected" })}
                        className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 transition-colors"
                      >
                        <XCircle size={20} className="text-red-300" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Friends List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Users size={20} />
            {t("my_friends")} ({friendProfiles.length})
          </h2>

          {friendProfiles.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center">
              <Users size={48} className="text-white/40 mx-auto mb-3" />
              <p className="text-white/60 mb-2">{t("no_friends_yet")}</p>
              <p className="text-white/40 text-sm">{t("add_friends_to_share")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {friendProfiles.map((friend, idx) => {
                const friendMeal = friendMeals.find(m => m.friend_email === friend.created_by);
                return (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {friend.display_name?.charAt(0) || "?"}
                        </div>
                        {friend.status_text && (
                          <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded-full border-2 border-slate-900">
                            ✨
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold">{friend.display_name}</p>
                        {friend.status_text && (
                          <StatusChip status={{ status_text: friend.status_text, status_updated_at: friend.status_updated_at }} />
                        )}
                        <div className="flex items-center gap-3 text-sm mt-2">
                          <span className="flex items-center gap-1 text-orange-300">
                            <Flame size={14} />
                            {friend.current_streak} {t("day_streak")}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-300">
                            <Activity size={14} />
                            {friend.total_checkins} {t("meals")}
                          </span>
                        </div>
                      </div>

                      {/* Chat Button */}
                      <button
                        onClick={() => navigate(createPageUrl('Chat'), { 
                          state: { 
                            friendEmail: friend.created_by, 
                            friendName: friend.display_name 
                          } 
                        })}
                        className="p-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 transition-colors flex-shrink-0"
                      >
                        <MessageCircle size={18} className="text-teal-300" />
                      </button>
                    </div>

                    {/* Last meal preview */}
                    {friendMeal && (
                      <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/60">
                        <p>{t("last_meal_label")}: {friendMeal.estimated_calories} kcal</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}