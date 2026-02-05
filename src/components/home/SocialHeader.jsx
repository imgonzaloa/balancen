import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SocialHeader({ currentUser }) {
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

  // Check if status is expired (older than 24 hours)
  const isStatusValid = (statusUpdatedAt) => {
    if (!statusUpdatedAt) return false;
    const statusDate = new Date(statusUpdatedAt);
    const now = new Date();
    const hoursDiff = (now - statusDate) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  const sortedProfiles = [...friendProfiles].sort((a, b) => (b.fire_total || 0) - (a.fire_total || 0));

  return (
    <div className="mb-6 -mx-5 px-5">
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
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
            transition={{ delay: sortedProfiles.length * 0.05 }}
          >
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center hover:bg-white/20 transition-colors shadow-lg">
              <Plus size={24} className="text-white" />
            </div>
            <p className="text-white text-xs text-center mt-1">Invite</p>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}