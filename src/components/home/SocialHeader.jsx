import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Flame, Crown } from "lucide-react";
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

  const allProfiles = [...friendProfiles, ...groupMembers];
  const uniqueProfiles = allProfiles.filter((profile, index, self) =>
    index === self.findIndex(p => p.created_by === profile.created_by)
  );

  const isStatusValid = (statusUpdatedAt) => {
    if (!statusUpdatedAt) return false;
    const statusDate = new Date(statusUpdatedAt);
    const now = new Date();
    const hoursDiff = (now - statusDate) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  const sortedProfiles = [...uniqueProfiles].sort((a, b) => (b.fire_total || 0) - (a.fire_total || 0));
  const highestStreak = Math.max(currentUserProfile?.fire_total || 0, ...sortedProfiles.map(p => p.fire_total || 0));
  const currentUserIsTop = (currentUserProfile?.fire_total || 0) === highestStreak && highestStreak > 0;

  return (
    <div className="mb-5 -mx-5 px-5 overflow-visible">
      {/* SOCIAL STORIES ROW */}
      <div 
        className="flex items-start gap-3 overflow-x-auto overflow-y-visible pb-3 pt-2" 
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Current User */}
        <motion.div 
          className="flex-shrink-0 flex flex-col items-center w-[70px]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="relative mb-2">
            {/* Glow effect for current user - UPDATED */}
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 blur-lg opacity-70 animate-pulse" />
            
            {/* Top indicator for highest streak */}
            {currentUserIsTop && (
              <motion.div 
                className="absolute -top-3 left-1/2 -translate-x-1/2 z-20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <Crown size={14} className="text-amber-400 drop-shadow-lg" />
              </motion.div>
            )}
            
            {/* Status ring */}
            <div className="absolute -inset-0.5 rounded-full border-2 border-teal-400/50" />
            
            {/* Avatar */}
            {currentUserProfile?.profile_photo || currentUserProfile?.avatar_url ? (
              <img
                src={currentUserProfile.profile_photo || currentUserProfile.avatar_url}
                alt="You"
                className="relative w-[68px] h-[68px] rounded-full object-cover border-3 border-teal-400 shadow-2xl"
              />
            ) : (
              <div className="relative w-[68px] h-[68px] rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xl font-bold border-3 border-teal-400 shadow-2xl">
                {currentUserProfile?.display_name?.charAt(0) || "?"}
              </div>
            )}
            
            {/* Fire Badge */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-600 rounded-full px-2 py-0.5 flex items-center gap-0.5 shadow-lg border-2 border-slate-900 z-10">
              <Flame size={10} className="text-white" />
              <span className="text-white text-[10px] font-bold">{currentUserProfile?.fire_total || 0}</span>
            </div>
          </div>
          
          <p className="text-teal-300 text-[10px] text-center font-bold truncate w-full">You</p>
        </motion.div>

        {/* Friends/Group Members */}
        {sortedProfiles.map((profile, index) => {
          const showStatus = profile.status_text && isStatusValid(profile.status_updated_at);
          const isTopStreak = (profile.fire_total || 0) === highestStreak && highestStreak > 0;
          const fireTotal = profile.fire_total || 0;
          
          // Determine border color based on streak level
          let borderColor = "border-white/20";
          if (fireTotal >= 30) borderColor = "border-amber-400/60";
          else if (fireTotal >= 15) borderColor = "border-purple-400/50";
          else if (fireTotal >= 7) borderColor = "border-emerald-400/40";
          
          return (
            <motion.div
              key={profile.id}
              className="flex-shrink-0 flex flex-col items-center w-[68px]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (index + 1) * 0.05 }}
            >
              <div className="relative mb-2">
                {/* Status Overlay */}
                {showStatus && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-md z-20 max-w-[60px] truncate font-medium">
                    {profile.status_emoji} {profile.status_text}
                  </div>
                )}
                
                {/* Top indicator for highest streak */}
                {isTopStreak && !currentUserIsTop && (
                  <motion.div 
                    className="absolute -top-3 left-1/2 -translate-x-1/2 z-20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + (index * 0.05), type: "spring" }}
                  >
                    <Crown size={14} className="text-amber-400 drop-shadow-lg" />
                  </motion.div>
                )}
                
                {/* Status ring based on streak level */}
                <div className={`absolute -inset-0.5 rounded-full border-2 ${borderColor}`} />
                
                {/* Avatar */}
                {profile.profile_photo || profile.avatar_url ? (
                  <img
                    src={profile.profile_photo || profile.avatar_url}
                    alt={profile.display_name}
                    className={`w-16 h-16 rounded-full object-cover border-2 ${borderColor} shadow-lg`}
                  />
                ) : (
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-lg font-bold border-2 ${borderColor} shadow-lg`}>
                    {profile.display_name?.charAt(0) || "?"}
                  </div>
                )}
                
                {/* Fire Badge */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-600 rounded-full px-2 py-0.5 flex items-center gap-0.5 shadow-lg border-2 border-slate-900 z-10">
                  <Flame size={10} className="text-white" />
                  <span className="text-white text-[10px] font-bold">{fireTotal}</span>
                </div>
              </div>
              
              {/* Name */}
              <p className="text-white/80 text-[10px] text-center font-medium truncate w-full">
                {profile.display_name?.split(" ")[0]}
              </p>
            </motion.div>
          );
        })}
        
        {/* Invite Button */}
        <Link to={createPageUrl("Friends")}>
          <motion.div
            className="flex-shrink-0 flex flex-col items-center w-[68px]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (sortedProfiles.length + 1) * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="mb-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-dashed border-white/40 flex items-center justify-center shadow-lg">
                <Plus size={26} className="text-white" />
              </div>
            </div>
            <p className="text-white/70 text-[10px] text-center font-semibold">Invite</p>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}