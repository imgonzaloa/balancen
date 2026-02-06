import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Users, CheckCircle, XCircle, Flame, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";

export default function Friends() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [friendEmail, setFriendEmail] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  // Fetch friend requests sent by me
  const { data: sentRequests = [] } = useQuery({
    queryKey: ["friendsSent"],
    queryFn: () => base44.entities.Friend.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  // Fetch friend requests sent to me
  const { data: receivedRequests = [] } = useQuery({
    queryKey: ["friendsReceived"],
    queryFn: () => base44.entities.Friend.filter({ friend_email: user?.email }),
    enabled: !!user?.email,
  });

  const acceptedFriends = [...sentRequests, ...receivedRequests].filter(f => f.status === "accepted");
  const pendingRequests = receivedRequests.filter(f => f.status === "pending");

  // Fetch profiles for all friends
  const { data: friendProfiles = [] } = useQuery({
    queryKey: ["friendProfiles", acceptedFriends.map(f => f.user_email === user?.email ? f.friend_email : f.user_email)],
    queryFn: async () => {
      const emails = acceptedFriends.map(f => f.user_email === user?.email ? f.friend_email : f.user_email);
      if (emails.length === 0) return [];
      const profiles = await Promise.all(
        emails.map(async (email) => {
          const p = await base44.entities.UserProfile.filter({ created_by: email });
          return p[0] || null;
        })
      );
      return profiles.filter(Boolean);
    },
    enabled: acceptedFriends.length > 0,
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (email) => {
      // Check if already friends or pending
      const existing = [...sentRequests, ...receivedRequests].find(
        f => (f.user_email === email || f.friend_email === email)
      );
      if (existing) {
        throw new Error("Friend request already exists");
      }
      
      return base44.entities.Friend.create({
        user_email: user.email,
        friend_email: email,
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["friendsSent"]);
      toast.success(t("friend_request_sent"));
      setFriendEmail("");
      setShowAddDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || t("error_sending_request"));
    },
  });

  const respondRequestMutation = useMutation({
    mutationFn: ({ requestId, status }) => 
      base44.entities.Friend.update(requestId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(["friendsReceived"]);
      queryClient.invalidateQueries(["friendsSent"]);
      toast.success(t("request_updated"));
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute -bottom-8 right-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{t("friends_title")}</h1>
            <p className="text-teal-200 text-sm">{t("connect_and_share")}</p>
          </div>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-teal-500 hover:bg-teal-600 rounded-2xl">
                <UserPlus size={20} className="mr-2" />
                {t("add_friend")}
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
                  className="bg-slate-800 border-slate-700 text-white"
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
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-lg font-semibold text-white mb-3">{t("pending_requests")}</h2>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
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
                </div>
              ))}
            </div>
          </motion.div>
        )}

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
            <div className="space-y-3">
              {friendProfiles.map((friendProfile, index) => (
                <motion.div
                  key={friendProfile.id}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                      {friendProfile.display_name?.charAt(0) || "?"}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-white font-semibold">{friendProfile.display_name}</p>
                      <div className="flex items-center gap-3 text-sm mt-1">
                        <span className="flex items-center gap-1 text-orange-300">
                          <Flame size={14} />
                          {friendProfile.current_streak} {t("day_streak")}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-300">
                          <TrendingUp size={14} />
                          {friendProfile.total_checkins} {t("checkins")}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}