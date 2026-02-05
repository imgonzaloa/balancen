import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function SocialCompletionStatus({ user }) {
  // Fetch friends
  const { data: friendsList = [] } = useQuery({
    queryKey: ["friends", user?.email],
    queryFn: async () => {
      const friends = await base44.entities.Friend.filter({ 
        created_by: user?.email,
        status: "accepted" 
      });
      return friends || [];
    },
    enabled: !!user?.email,
  });

  // Get today's date
  const today = new Date().toISOString().split("T")[0];

  // Fetch friend profiles and their check-ins
  const { data: friendsWithStatus = [] } = useQuery({
    queryKey: ["friendsStatus", friendsList, today],
    queryFn: async () => {
      if (friendsList.length === 0) return [];
      
      const friendsData = await Promise.all(
        friendsList.slice(0, 5).map(async (friend) => {
          // Get friend's profile
          const profiles = await base44.entities.UserProfile.filter({ 
            created_by: friend.friend_user_id 
          });
          const profile = profiles[0];
          
          // Get friend's today check-in
          const checkIns = await base44.entities.DailyCheckIn.filter({
            created_by: friend.friend_user_id,
            date: today,
            completed: true
          });
          
          return {
            name: friend.display_name || profile?.display_name || "Friend",
            completed: checkIns.length > 0,
            avatar: friend.avatar_url || profile?.avatar_url
          };
        })
      );
      
      return friendsData;
    },
    enabled: friendsList.length > 0,
  });

  const completedCount = friendsWithStatus.filter(f => f.completed).length;
  const totalFriends = friendsWithStatus.length;

  if (friendsWithStatus.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
        <p className="text-xs text-teal-300 font-semibold mb-2">Today's Activity</p>
        <div className="flex items-center gap-2 text-sm text-white/80">
          <span className="text-red-400">⚠</span>
          <span>You haven't completed yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-teal-300 font-semibold">Today's Activity</p>
        <span className="text-xs text-white/60">{completedCount}/{totalFriends} completed</span>
      </div>
      
      <div className="space-y-2">
        {friendsWithStatus.map((friend, idx) => (
          <motion.div
            key={idx}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            {friend.avatar ? (
              <img 
                src={friend.avatar} 
                alt={friend.name}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                {friend.name.charAt(0)}
              </div>
            )}
            <span className="text-sm text-white/80 flex-1">{friend.name}</span>
            {friend.completed ? (
              <CheckCircle size={16} className="text-emerald-400" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-white/20" />
            )}
          </motion.div>
        ))}
        
        {/* Current User Status */}
        <motion.div
          className="flex items-center gap-3 pt-2 mt-2 border-t border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold">
            You
          </div>
          <span className="text-sm text-white/80 flex-1 font-semibold">You</span>
          <AlertCircle size={16} className="text-red-400" />
        </motion.div>
      </div>
    </div>
  );
}