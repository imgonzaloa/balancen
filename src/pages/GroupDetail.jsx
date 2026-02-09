import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ChevronLeft, Users, Trophy, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTranslation } from "@/components/TranslationProvider";
import GroupLeaderboard from "@/components/social/GroupLeaderboard";
import GroupFeed from "@/components/social/GroupFeed";

export default function GroupDetail() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("leaderboard");

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
    queryFn: async () => {
      const membersList = await base44.entities.GroupMember.filter({ group_id: groupId });
      const profiles = await Promise.all(
        membersList.map(async (m) => {
          const p = await base44.entities.UserProfile.filter({ created_by: m.user_email });
          return { ...m, profile: p[0] };
        })
      );
      return profiles;
    },
    enabled: !!groupId,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  // Mock posts for now (can be replaced with actual Post entity later)
  const posts = [];

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center">
        <p className="text-white/60">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            to={createPageUrl("Social")}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{group.name}</h1>
            <p className="text-purple-200 text-sm">{members.length} {t('members')}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white/10 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10">
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === "leaderboard"
                ? "bg-amber-500 text-white shadow-lg"
                : "text-white/60 hover:text-white/80"
            }`}
          >
            <Trophy size={16} className="inline mr-2" />
            {t('leaderboard')}
          </button>
          <button
            onClick={() => setActiveTab("feed")}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === "feed"
                ? "bg-teal-500 text-white shadow-lg"
                : "text-white/60 hover:text-white/80"
            }`}
          >
            <FileText size={16} className="inline mr-2" />
            {t('feed')}
          </button>
        </div>

        {/* Content */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
          {activeTab === "leaderboard" && <GroupLeaderboard members={members} />}
          {activeTab === "feed" && (
            <GroupFeed
              posts={posts}
              userProfile={profile}
              onPostMeal={() => {}}
              onPostStatus={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
}