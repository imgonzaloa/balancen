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

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-indigo-50 to-indigo-50/80 backdrop-blur-sm pt-6 pb-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={createPageUrl("Home")}
                className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"
              >
                <ChevronLeft size={20} className="text-slate-600" />
              </Link>
              <h1 className="text-xl font-bold text-slate-800">Mis grupos</h1>
            </div>
            <Button
              onClick={() => setShowCreate(true)}
              className="rounded-xl bg-indigo-500 hover:bg-indigo-600"
            >
              <Plus size={18} className="mr-1" />
              Crear
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {groups.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <Users size={40} className="text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Aún no tienes grupos
            </h3>
            <p className="text-slate-500 mb-6">
              Crea uno o únete con un código
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setShowCreate(true)}
                className="rounded-xl bg-indigo-500 hover:bg-indigo-600"
              >
                <Plus size={18} className="mr-1" />
                Crear grupo
              </Button>
              <Button
                onClick={() => setShowJoin(true)}
                variant="outline"
                className="rounded-xl"
              >
                Unirme
              </Button>
            </div>
          </motion.div>
        )}

        {/* Groups List */}
        <div className="space-y-4 mt-4">
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
                  className="block bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                        {group.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800">{group.name}</h3>
                          {membership?.role === "admin" && (
                            <Crown size={14} className="text-amber-500" />
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
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
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        {copiedCode === group.invite_code ? (
                          <Check size={18} className="text-green-500" />
                        ) : (
                          <Copy size={18} className="text-slate-400" />
                        )}
                      </button>
                      <ArrowRight size={18} className="text-slate-300" />
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
              onClick={() => setShowJoin(true)}
              variant="outline"
              className="w-full rounded-xl py-6"
            >
              Unirme con código
            </Button>
          </motion.div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Crear grupo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Nombre del grupo"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="rounded-xl py-6"
              />
              <Button
                onClick={() => createGroupMutation.mutate(newGroupName)}
                disabled={!newGroupName.trim() || createGroupMutation.isPending}
                className="w-full rounded-xl py-6 bg-indigo-500 hover:bg-indigo-600"
              >
                {createGroupMutation.isPending ? "Creando..." : "Crear grupo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Join Dialog */}
        <Dialog open={showJoin} onOpenChange={setShowJoin}>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Unirse a grupo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Código de invitación"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="rounded-xl py-6 text-center text-lg tracking-widest"
                maxLength={6}
              />
              <Button
                onClick={() => joinGroupMutation.mutate(joinCode)}
                disabled={joinCode.length < 6 || joinGroupMutation.isPending}
                className="w-full rounded-xl py-6 bg-indigo-500 hover:bg-indigo-600"
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