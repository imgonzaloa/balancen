import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, Users, Crown, Copy, Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Groups() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
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

  const { data: memberships = [] } = useQuery({
    queryKey: ["memberships", user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups", memberships],
    queryFn: async () => {
      const groupIds = memberships.map(m => m.group_id);
      if (groupIds.length === 0) return [];
      const allGroups = await base44.entities.Group.list();
      return allGroups.filter(g => groupIds.includes(g.id));
    },
    enabled: memberships.length > 0,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (name) => {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const group = await base44.entities.Group.create({
        name,
        invite_code: inviteCode,
        member_count: 1,
        is_private: true,
      });
      
      await base44.entities.GroupMember.create({
        group_id: group.id,
        user_email: user.email,
        display_name: profile?.display_name || user?.full_name,
        role: "admin",
        current_streak: profile?.current_streak || 0,
        checked_in_today: false,
      });
      
      // Add badge for joining first group
      const existingBadge = await base44.entities.Badge.filter({
        user_email: user.email,
        badge_type: "joined_group"
      });
      if (existingBadge.length === 0) {
        await base44.entities.Badge.create({
          badge_id: `joined_group_${user.email}`,
          user_email: user.email,
          badge_type: "joined_group",
          earned_date: new Date().toISOString().split("T")[0],
        });
      }
      
      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["memberships"]);
      queryClient.invalidateQueries(["groups"]);
      setShowCreate(false);
      setNewGroupName("");
      toast.success("¡Grupo creado!");
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (code) => {
      const allGroups = await base44.entities.Group.filter({ invite_code: code.toUpperCase() });
      if (allGroups.length === 0) throw new Error("Código no válido");
      
      const group = allGroups[0];
      
      // Check if already member
      const existing = await base44.entities.GroupMember.filter({
        group_id: group.id,
        user_email: user.email,
      });
      if (existing.length > 0) throw new Error("Ya eres miembro");
      
      await base44.entities.GroupMember.create({
        group_id: group.id,
        user_email: user.email,
        display_name: profile?.display_name || user?.full_name,
        role: "member",
        current_streak: profile?.current_streak || 0,
        checked_in_today: false,
      });
      
      await base44.entities.Group.update(group.id, {
        member_count: group.member_count + 1,
      });
      
      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["memberships"]);
      queryClient.invalidateQueries(["groups"]);
      setShowJoin(false);
      setJoinCode("");
      toast.success("¡Te uniste al grupo!");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Block free users
  const handleGroupAction = (action) => {
    if (!profile?.is_premium) {
      window.location.href = createPageUrl("Paywall");
      return;
    }
    action();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-lg mx-auto px-5 pb-24 relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={createPageUrl("Home")}
                className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <ChevronLeft size={20} className="text-white" />
              </Link>
              <h1 className="text-2xl font-bold text-white">Mis grupos</h1>
            </div>
            <Button
              onClick={() => handleGroupAction(() => setShowCreate(true))}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 border-0 shadow-lg"
            >
              <Plus size={18} className="mr-1" />
              Crear
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {groups.length === 0 && (
          <motion.div
            className="text-center py-16 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500/30 to-emerald-500/30 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto mb-6">
              <Users size={48} className="text-teal-200" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Aún no tienes grupos
            </h3>
            <p className="text-teal-200 mb-8">
              Crea uno o únete con un código
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => handleGroupAction(() => setShowCreate(true))}
                className="rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 border-0 shadow-xl px-6 py-6"
              >
                <Plus size={18} className="mr-2" />
                Crear grupo
              </Button>
              <Button
                onClick={() => handleGroupAction(() => setShowJoin(true))}
                variant="outline"
                className="rounded-2xl bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 px-6 py-6"
              >
                Unirme
              </Button>
            </div>
          </motion.div>
        )}

        {/* Groups List */}
        <div className="space-y-4 mt-6">
          {groups.map((group, i) => {
            const membership = memberships.find(m => m.group_id === group.id);
            
            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={createPageUrl(`GroupDetail?id=${group.id}`)}
                  className="block bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 hover:bg-white/15 transition-all shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {group.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white">{group.name}</h3>
                          {membership?.role === "admin" && (
                            <Crown size={16} className="text-amber-400" />
                          )}
                        </div>
                        <p className="text-sm text-teal-200">
                          {group.member_count} {group.member_count === 1 ? "miembro" : "miembros"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          copyCode(group.invite_code);
                        }}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        {copiedCode === group.invite_code ? (
                          <Check size={18} className="text-emerald-400" />
                        ) : (
                          <Copy size={18} className="text-white/60" />
                        )}
                      </button>
                      <ArrowRight size={18} className="text-white/40" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Join Button */}
        {groups.length > 0 && (
          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={() => handleGroupAction(() => setShowJoin(true))}
              variant="outline"
              className="w-full rounded-2xl py-6 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
            >
              Unirme con código
            </Button>
          </motion.div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="rounded-3xl bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Crear grupo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Nombre del grupo"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="rounded-xl py-6 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Button
                onClick={() => createGroupMutation.mutate(newGroupName)}
                disabled={!newGroupName.trim() || createGroupMutation.isPending}
                className="w-full rounded-xl py-6 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 border-0"
              >
                {createGroupMutation.isPending ? "Creando..." : "Crear grupo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Join Dialog */}
        <Dialog open={showJoin} onOpenChange={setShowJoin}>
          <DialogContent className="rounded-3xl bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Unirse a grupo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Código de invitación"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="rounded-xl py-6 text-center text-lg tracking-widest bg-white/10 border-white/20 text-white placeholder:text-white/50"
                maxLength={6}
              />
              <Button
                onClick={() => joinGroupMutation.mutate(joinCode)}
                disabled={joinCode.length < 6 || joinGroupMutation.isPending}
                className="w-full rounded-xl py-6 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 border-0"
              >
                {joinGroupMutation.isPending ? "Uniéndose..." : "Unirme"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}