import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ChevronLeft, Trophy, Users, Mail, Settings, Shield, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AdminLeaderboard from "@/components/groups/AdminLeaderboard";
import MemberLeaderboard from "@/components/groups/MemberLeaderboard";
import InviteMembersPanel from "@/components/groups/InviteMembersPanel";
import WinnersPanel from "@/components/groups/WinnersPanel";
import GroupSettingsPanel from "@/components/groups/GroupSettingsPanel";
import BroadcastPanel from "@/components/groups/BroadcastPanel";

export default function GroupDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("leaderboard");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get("id");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["campusGroup", groupId],
    queryFn: async () => {
      const groups = await base44.entities.Group.filter({ id: groupId });
      return groups[0] || null;
    },
    enabled: !!groupId,
  });

  const { data: myMembership } = useQuery({
    queryKey: ["myMembership", groupId, user?.email],
    queryFn: async () => {
      const members = await base44.entities.GroupMember.filter({ group_id: groupId, user_email: user.email });
      return members[0] || null;
    },
    enabled: !!groupId && !!user?.email,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["campusMembers", groupId],
    queryFn: async () => {
      const membersList = await base44.entities.GroupMember.filter({ group_id: groupId });
      const withProfiles = await Promise.all(
        membersList.map(async (m) => {
          const profiles = await base44.entities.UserProfile.filter({ created_by: m.user_email });
          const profile = profiles[0];
          // Calculate consistency score
          let daysCompleted = m.days_completed || 0;
          let totalDays = 1;
          if (group?.start_date && group?.end_date) {
            const start = new Date(group.start_date);
            const end = new Date(group.end_date);
            const now = new Date();
            totalDays = Math.ceil((Math.min(now, end) - start) / 86400000);
            totalDays = Math.max(1, totalDays);
          }
          const consistencyPercent = Math.round((daysCompleted / totalDays) * 100);
          return {
            ...m,
            profile,
            totalDays,
            consistencyPercent,
          };
        })
      );
      return withProfiles.sort((a, b) => b.consistencyPercent - a.consistencyPercent);
    },
    enabled: !!groupId && !!group,
  });

  const isAdmin = myMembership?.role === "admin";

  const adminTabs = [
    { id: "leaderboard", icon: Trophy, label: "Leaderboard" },
    { id: "messages", icon: Megaphone, label: "Messages" },
    { id: "invite", icon: Mail, label: "Invite" },
    { id: "winners", icon: Shield, label: "Winners" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];
  const memberTabs = [
    { id: "leaderboard", icon: Trophy, label: "Leaderboard" },
    { id: "members", icon: Users, label: "Members" },
    { id: "messages", icon: Megaphone, label: "Messages" },
  ];
  const tabs = isAdmin ? adminTabs : memberTabs;

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center">
        <div className="text-white/60">Loading group…</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center">
        <div className="text-white/60">Group not found.</div>
      </div>
    );
  }

  const startDate = group.start_date ? new Date(group.start_date) : null;
  const endDate = group.end_date ? new Date(group.end_date) : null;
  const now = new Date();
  const totalDays = startDate && endDate ? Math.ceil((endDate - startDate) / 86400000) : null;
  const daysPassed = startDate ? Math.max(0, Math.ceil((now - startDate) / 86400000)) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900">
      <div className="max-w-lg mx-auto px-4 pb-28 pt-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(createPageUrl("Groups"))}
              className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <ChevronLeft size={20} className="text-white" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white truncate">{group.name}</h1>
                {isAdmin && (
                  <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <Shield size={10} />Admin
                  </span>
                )}
              </div>
              <p className="text-white/50 text-xs capitalize">{group.group_type} · {group.member_count || members.length} members</p>
            </div>
          </div>

          {/* Progress bar */}
          {totalDays && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex justify-between text-xs text-white/60 mb-2">
                <span>Day {Math.min(daysPassed, totalDays)} of {totalDays}</span>
                <span>{group.start_date} → {group.end_date}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (daysPassed / totalDays) * 100)}%` }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10 mb-6">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg"
                  : "text-white/50 hover:text-white/70"
              }`}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === "leaderboard" && isAdmin && (
            <AdminLeaderboard members={members} group={group} loading={membersLoading} user={user} />
          )}
          {activeTab === "leaderboard" && !isAdmin && (
            <MemberLeaderboard members={members} group={group} loading={membersLoading} currentUserEmail={user?.email} />
          )}
          {activeTab === "members" && (
            <MemberLeaderboard members={members} group={group} loading={membersLoading} currentUserEmail={user?.email} />
          )}
          {activeTab === "invite" && isAdmin && (
            <InviteMembersPanel group={group} user={user} onInvited={() => queryClient.invalidateQueries({ queryKey: ["campusMembers"] })} />
          )}
          {activeTab === "winners" && isAdmin && (
            <WinnersPanel group={group} members={members} user={user} />
          )}
          {activeTab === "settings" && isAdmin && (
            <GroupSettingsPanel group={group} user={user} members={members}
              onUpdated={() => queryClient.invalidateQueries({ queryKey: ["campusGroup"] })} />
          )}
          {activeTab === "messages" && (
            <BroadcastPanel group={group} user={user} members={members} isAdmin={isAdmin} />
          )}
        </motion.div>
      </div>
    </div>
  );
}