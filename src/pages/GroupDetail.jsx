import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ChevronLeft, Copy, Check, Crown, Flame, Circle, Trophy, Target, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import MemberCard from "@/components/groups/MemberCard";
import SetStatusModal from "@/components/groups/SetStatusModal";
import StatusChip from "@/components/groups/StatusChip";

export default function GroupDetail() {
  const [user, setUser] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get("id");

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: group } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const groups = await base44.entities.Group.filter({ id: groupId });
      return groups[0] || null;
    },
    enabled: !!groupId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["groupMembers", groupId],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: groupId }),
    enabled: !!groupId,
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ["challenges", groupId],
    queryFn: () => base44.entities.Challenge.filter({ group_id: groupId, active: true }),
    enabled: !!groupId,
  });

  // Fetch all member profiles
  const { data: memberProfiles = [] } = useQuery({
    queryKey: ["memberProfiles", members.map(m => m.user_email).join(",")],
    queryFn: async () => {
      if (members.length === 0) return [];
      const emails = members.map(m => m.user_email);
      const profiles = await Promise.all(
        emails.map(email => 
          base44.entities.UserProfile.filter({ created_by: email }).then(p => p[0] || null)
        )
      );
      return profiles;
    },
    enabled: members.length > 0,
  });

  // Fetch current user's profile
  const { data: currentUserProfile } = useQuery({
    queryKey: ["profile", user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  // Merge members with their profiles and sort by fire_total
  const enrichedMembers = members.map(member => {
    const profile = memberProfiles.find(p => p?.created_by === member.user_email);
    return {
      ...member,
      profile,
      fire_total: profile?.fire_total || member.current_streak || 0
    };
  });

  const sortedMembers = [...enrichedMembers].sort((a, b) => b.fire_total - a.fire_total);

  const handleStatusUpdate = () => {
    queryClient.invalidateQueries(["memberProfiles"]);
    queryClient.invalidateQueries(["profile"]);
  };

  const copyCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.invite_code);
    setCopiedCode(true);
    toast.success("Code copied");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!group) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to={createPageUrl("Groups")}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={20} className="text-white" />
            </Link>
            <h1 className="text-2xl font-bold text-white">{group.name}</h1>
          </div>
          <Button
            onClick={() => setStatusModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg"
            size="sm"
          >
            <Sparkles size={16} className="mr-1" />
            Note
          </Button>
        </div>

        {/* Group Header Card */}
        <motion.div
          className="relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/70 text-sm">Members</p>
                <p className="text-4xl font-bold text-white">{members.length}</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {group.name.charAt(0)}
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="flex-1">
                <p className="text-xs text-white/70">Invite Code</p>
                <p className="text-lg font-bold tracking-widest text-white">{group.invite_code}</p>
              </div>
              <button
                onClick={copyCode}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
              >
                {copiedCode ? (
                  <Check size={20} className="text-emerald-300" />
                ) : (
                  <Copy size={20} className="text-white" />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Active Challenges */}
        {challenges.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" />
              Active Challenges
            </h2>
            
            <div className="space-y-3">
              {challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800">{challenge.name}</h3>
                      <p className="text-sm text-slate-500">{challenge.description}</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                      {challenge.type}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-600">
                      <Target size={14} />
                      <span>Goal: {challenge.goal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <TrendingUp size={14} />
                      <span>Ends: {new Date(challenge.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Members Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <Flame size={24} className="text-orange-400" />
            Members
          </h2>
          
          <div className="space-y-4">
            {sortedMembers.map((member, index) => (
              <MemberCard
                key={member.id}
                member={member}
                userProfile={member.profile}
                rank={index}
                isCurrentUser={member.user_email === user?.email}
              />
            ))}
          </div>
        </motion.div>

        {/* Set Status Modal */}
        <SetStatusModal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          currentStatus={currentUserProfile?.status_text}
          profile={currentUserProfile}
          onUpdate={handleStatusUpdate}
        />
      </div>
    </div>
  );
}