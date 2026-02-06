import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Copy, Users, Flame, TrendingUp, Medal, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Groups() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: myGroups = [] } = useQuery({
    queryKey: ["groupMemberships", user?.email],
    queryFn: async () => {
      const members = await base44.entities.GroupMember.filter({ user_email: user?.email });
      const groupIds = members.map(m => m.group_id);
      if (groupIds.length === 0) return [];
      const groups = await Promise.all(
        groupIds.map(id => base44.entities.Group.filter({ id }))
      );
      return groups.flat().map((group, idx) => ({ ...group, memberCount: members[idx]?.members?.length || 1 }));
    },
    enabled: !!user?.email,
  });

  const { data: groupMembersData = {} } = useQuery({
    queryKey: ["groupMembers", myGroups.map(g => g.id)],
    queryFn: async () => {
      const result = {};
      for (const group of myGroups) {
        const members = await base44.entities.GroupMember.filter({ group_id: group.id }, "-current_streak");
        const profiles = await Promise.all(
          members.map(async (m) => {
            const p = await base44.entities.UserProfile.filter({ created_by: m.user_email });
            return { ...m, profile: p[0] };
          })
        );
        result[group.id] = profiles;
      }
      return result;
    },
    enabled: myGroups.length > 0,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (name) => {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const group = await base44.entities.Group.create({
        name,
        invite_code: code,
        member_count: 1,
      });
      await base44.entities.GroupMember.create({
        group_id: group.id,
        user_email: user.email,
        display_name: user.full_name,
        role: "admin",
      });
      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupMemberships"] });
      setShowCreateDialog(false);
      setNewGroupName("");
      toast.success(t("group_created") || "Group created!");
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (code) => {
      const groups = await base44.entities.Group.filter({ invite_code: code });
      if (groups.length === 0) throw new Error("Group not found");
      const group = groups[0];
      await base44.entities.GroupMember.create({
        group_id: group.id,
        user_email: user.email,
        display_name: user.full_name,
      });
      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupMemberships"] });
      setShowJoinDialog(false);
      setInviteCode("");
      toast.success(t("joined_group") || "Joined group!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(t("code_copied"));
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute -bottom-8 right-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24 pt-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">{t("groups") || "Groups"}</h1>
            <p className="text-teal-200 text-sm mt-1">{myGroups.length} groups joined</p>
          </div>

          <div className="flex gap-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-500 hover:bg-emerald-600 rounded-full p-2">
                  <Plus size={20} />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">{t("create_group") || "Create Group"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder="Group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <Button
                    onClick={() => createGroupMutation.mutate(newGroupName)}
                    disabled={!newGroupName || createGroupMutation.isPending}
                    className="w-full bg-emerald-500 hover:bg-emerald-600"
                  >
                    {t("create")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
              <DialogTrigger asChild>
                <Button className="bg-teal-500 hover:bg-teal-600 rounded-full p-2">
                  <Users size={20} />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">{t("join_group") || "Join Group"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder="Invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="bg-slate-800 border-slate-700 text-white text-center text-lg tracking-widest"
                  />
                  <Button
                    onClick={() => joinGroupMutation.mutate(inviteCode)}
                    disabled={!inviteCode || joinGroupMutation.isPending}
                    className="w-full bg-teal-500 hover:bg-teal-600"
                  >
                    {t("join")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Groups List */}
        {myGroups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center"
          >
            <Users size={48} className="text-white/40 mx-auto mb-4" />
            <p className="text-white/60 mb-2">{t("no_groups_yet") || "No groups yet"}</p>
            <p className="text-white/40 text-sm">{t("create_or_join_group") || "Create or join a group to get started!"}</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {myGroups.map((group, idx) => {
              const members = groupMembersData[group.id] || [];
              const sortedMembers = members.sort((a, b) => (b.profile?.current_streak || 0) - (a.profile?.current_streak || 0));

              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link to={`${createPageUrl("GroupDetail")}?id=${group.id}`}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-5 hover:border-purple-500/50 transition-all cursor-pointer"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">{group.name}</h3>
                          <p className="text-sm text-purple-200">{members.length} members</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleCopyCode(group.invite_code);
                          }}
                          className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 transition-colors"
                          title="Copy invite code"
                        >
                          <Copy size={16} className={copiedCode === group.invite_code ? "text-emerald-400" : "text-purple-300"} />
                        </button>
                      </div>

                      {/* Top performers */}
                      <div className="space-y-2">
                        {sortedMembers.slice(0, 3).map((member, i) => (
                          <div key={member.id} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {i === 0 && <Medal size={16} className="text-yellow-400" />}
                              {i === 1 && <Medal size={16} className="text-gray-300" />}
                              {i === 2 && <Medal size={16} className="text-orange-400" />}
                              <div className="min-w-0">
                                <p className="text-white font-medium text-sm truncate">{member.profile?.display_name || member.display_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Flame size={14} className="text-orange-400" />
                              <span className="text-white font-bold text-sm">{member.profile?.current_streak || 0}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}