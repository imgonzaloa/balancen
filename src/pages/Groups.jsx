import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Users, ChevronRight, Shield, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import JoinByCodeModal from "@/components/groups/JoinByCodeModal";

export default function Groups() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ["groupMemberships", user?.email],
    queryFn: async () => {
      const members = await base44.entities.GroupMember.filter({ user_email: user.email });
      if (!members.length) return [];
      const groups = await Promise.all(
        members.map(m =>
          base44.entities.Group.filter({ id: m.group_id }).then(r => r[0]).catch(() => null)
        )
      );
      return members
        .map((m, i) => ({ membership: m, group: groups[i] }))
        .filter(x => x.group);
    },
    enabled: !!user?.email,
  });

  const handleGroupCreated = (group) => {
    queryClient.invalidateQueries({ queryKey: ["groupMemberships"] });
    setShowCreate(false);
    navigate(createPageUrl("GroupDashboard") + `?id=${group.id}`);
  };

  const handleJoined = () => {
    queryClient.invalidateQueries({ queryKey: ["groupMemberships"] });
    setShowJoinCode(false);
  };

  const groupTypeColors = {
    campus: "from-blue-500 to-indigo-600",
    team: "from-emerald-500 to-teal-600",
    friends: "from-pink-500 to-rose-600",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full filter blur-3xl" />
        <div className="absolute -bottom-8 right-20 w-72 h-72 bg-cyan-500 rounded-full filter blur-3xl" />
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24 pt-8 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Groups</h1>
            <p className="text-teal-200 text-sm mt-1">{memberships.length} active groups</p>
          </div>
          <Button onClick={() => setShowCreate(true)}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl px-4 py-2 flex items-center gap-2 font-semibold shadow-lg">
            <Plus size={18} />
            Create Group
          </Button>
        </motion.div>

        {/* Groups List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-28 bg-white/5 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : memberships.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-white/50" />
            </div>
            <p className="text-white font-semibold text-lg mb-1">No groups yet</p>
            <p className="text-white/50 text-sm mb-6">Create a Campus group to challenge your team</p>
            <Button onClick={() => setShowCreate(true)}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl px-6">
              Create your first group
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {memberships.map(({ membership, group }, idx) => {
              const gradient = groupTypeColors[group.group_type] || groupTypeColors.campus;
              const isAdmin = membership.role === "admin";
              const startDate = group.start_date ? new Date(group.start_date) : null;
              const endDate = group.end_date ? new Date(group.end_date) : null;
              const now = new Date();
              const totalDays = startDate && endDate
                ? Math.ceil((endDate - startDate) / 86400000)
                : null;
              const daysPassed = startDate
                ? Math.max(0, Math.ceil((now - startDate) / 86400000))
                : null;

              return (
                <motion.div key={group.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(createPageUrl("GroupDashboard") + `?id=${group.id}`)}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 cursor-pointer hover:bg-white/10 transition-all active:scale-98">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white text-lg shadow-lg`}>
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-bold text-lg leading-tight">{group.name}</h3>
                          {isAdmin && (
                            <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Shield size={10} />Admin
                            </span>
                          )}
                        </div>
                        <p className="text-white/50 text-xs capitalize">{group.group_type} · {group.member_count || 1} members</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-white/30 mt-1" />
                  </div>

                  {totalDays && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-white/50 mb-1">
                        <span className="flex items-center gap-1"><Calendar size={10} />Day {Math.min(daysPassed, totalDays)}/{totalDays}</span>
                        <span>{group.start_date} → {group.end_date}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
                          style={{ width: `${Math.min(100, (daysPassed / totalDays) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}

            <button onClick={() => setShowJoinCode(true)}
              className="w-full text-center text-white/40 text-sm py-3 hover:text-white/60 transition-colors">
              Have a code? Join by code
            </button>
          </div>
        )}
      </div>

      <CreateGroupModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        user={user}
        onCreated={handleGroupCreated}
      />
      <JoinByCodeModal
        open={showJoinCode}
        onClose={() => setShowJoinCode(false)}
        user={user}
        onJoined={handleJoined}
      />
    </div>
  );
}