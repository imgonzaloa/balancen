import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SocialHeader({ currentUser, currentUserProfile }) {
  const { data: friends = [] } = useQuery({
    queryKey: ["acceptedFriends", currentUser?.email],
    queryFn: async () => {
      const sentRequests = await base44.entities.Friend.filter({
        user_email: currentUser.email,
        status: "accepted"
      });
      const receivedRequests = await base44.entities.Friend.filter({
        friend_email: currentUser.email,
        status: "accepted"
      });
      
      const friendEmails = [
        ...sentRequests.map(r => r.friend_email),
        ...receivedRequests.map(r => r.user_email)
      ];
      
      return friendEmails;
    },
    enabled: !!currentUser?.email,
  });

  const { data: friendProfiles = [] } = useQuery({
    queryKey: ["friendProfiles", friends.join(",")],
    queryFn: async () => {
      if (friends.length === 0) return [];
      const profiles = await Promise.all(
        friends.map(email =>
          base44.entities.UserProfile.filter({ created_by: email }).then(p => p[0] || null)
        )
      );
      return profiles.filter(p => p !== null);
    },
    enabled: friends.length > 0,
  });

  // Get group members
  const { data: groups = [] } = useQuery({
    queryKey: ["userGroups", currentUser?.email],
    queryFn: async () => {
      const memberships = await base44.entities.GroupMember.filter({ user_email: currentUser.email });
      return memberships.map(m => m.group_id);
    },
    enabled: !!currentUser?.email,
  });

  const { data: groupMembers = [] } = useQuery({
    queryKey: ["groupMembers", groups.join(",")],
    queryFn: async () => {
      if (groups.length === 0) return [];
      const allMembers = await Promise.all(
        groups.map(groupId =>
          base44.entities.GroupMember.filter({ group_id: groupId })
        )
      );
      const flatMembers = allMembers.flat();
      const uniqueEmails = [...new Set(flatMembers.map(m => m.user_email))].filter(email => email !== currentUser.email);
      
      const profiles = await Promise.all(
        uniqueEmails.map(email =>
          base44.entities.UserProfile.filter({ created_by: email }).then(p => p[0] || null)
        )
      );
      return profiles.filter(p => p !== null);
    },
    enabled: groups.length > 0,
  });

  // Combine friends and group members, remove duplicates
  const allProfiles = [...friendProfiles, ...groupMembers];
  const uniqueProfiles = allProfiles.filter((profile, index, self) =>
    index === self.findIndex(p => p.created_by === profile.created_by)
  );

  // Check if status is expired (older than 24 hours)
  const isStatusValid = (statusUpdatedAt) => {
    if (!statusUpdatedAt) return false;
    const statusDate = new Date(statusUpdatedAt);
    const now = new Date();
    const hoursDiff = (now - statusDate) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  const sortedProfiles = [...uniqueProfiles].sort((a, b) => (b.fire_total || 0) - (a.fire_total || 0));

  return (
    <div className="mb-6">
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
        <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-3">Your Network</h3>
        <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-hide">
          {/* Current User */}
          <div className="flex-shrink-0">
            <div className="relative">
              {currentUserProfile?.profile_photo || currentUserProfile?.avatar_url ? (
                <img
                  src={currentUserProfile.profile_photo || currentUserProfile.avatar_url}
                  alt="You"
                  className="w-16 h-16 rounded-full object-cover border-2 border-teal-400 shadow-lg shadow-teal-500/50"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-lg font-bold border-2 border-teal-400 shadow-lg shadow-teal-500/50">
                  {currentUserProfile?.display_name?.charAt(0) || "?"}
                </div>
              )}
              
              {/* Fire Badge */}
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-2 py-0.5 flex items-center gap-0.5 shadow-lg border-2 border-slate-900">
                <Flame size={10} className="text-white" />
                <span className="text-white text-xs font-bold">{currentUserProfile?.fire_total || 0}</span>
              </div>
            </div>
            <p className="text-teal-300 text-xs text-center mt-1 font-medium">You</p>
          </div>

          {/* Friends/Group Members */}
          {sortedProfiles.map((profile, index) => {
          const showStatus = profile.status_text && isStatusValid(profile.status_updated_at);
          
          return (
            <motion.div
              key={profile.id}
              className="flex-shrink-0"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="relative">
                {/* Avatar */}
                {profile.profile_photo || profile.avatar_url ? (
                  <img
                    src={profile.profile_photo || profile.avatar_url}
                    alt={profile.display_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/30 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-lg font-bold border-2 border-white/30 shadow-lg">
                    {profile.display_name?.charAt(0) || "?"}
                  </div>
                )}
                
                {/* Status Overlay */}
                {showStatus && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg max-w-[80px] truncate">
                    {profile.status_emoji} {profile.status_text}
                  </div>
                )}
                
                {/* Fire Badge */}
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full px-2 py-0.5 flex items-center gap-0.5 shadow-lg border-2 border-slate-900">
                  <Flame size={10} className="text-white" />
                  <span className="text-white text-xs font-bold">{profile.fire_total || 0}</span>
                </div>
              </div>
              
              {/* Name */}
              <p className="text-white text-xs text-center mt-1 truncate max-w-[64px]">
                {profile.display_name?.split(" ")[0]}
              </p>
            </motion.div>
          );
        })}
        
        {/* Invite Button */}
        <Link to={createPageUrl("Friends")}>
          <motion.div
            className="flex-shrink-0 flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (sortedProfiles.length + 1) * 0.05 }}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white/30 flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
              <Plus size={28} className="text-white" />
            </div>
            <p className="text-white text-xs text-center mt-1 font-medium">Invite</p>
          </motion.div>
        </Link>
        </div>

        {sortedProfiles.length === 0 && (
        <p className="text-white/50 text-xs text-center mt-2">
          Add friends to see their progress here
        </p>
        )}
        </div>
        </div>
        );
        }