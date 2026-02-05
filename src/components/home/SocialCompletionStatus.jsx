import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Crown } from "lucide-react";

export default function SocialCompletionStatus({ user, profile, todayCheckIn }) {
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

  const today = new Date().toISOString().split("T")[0];

  const { data: friendsWithStatus = [] } = useQuery({
    queryKey: ["friendsStatus", friendsList, today],
    queryFn: async () => {
      if (friendsList.length === 0) return [];
      
      const friendsData = await Promise.all(
        friendsList.slice(0, 5).map(async (friend) => {
          const profiles = await base44.entities.UserProfile.filter({ 
            created_by: friend.friend_user_id 
          });
          const friendProfile = profiles[0];
          
          const checkIns = await base44.entities.DailyCheckIn.filter({
            created_by: friend.friend_user_id,
            date: today
          });
          const checkIn = checkIns[0];
          
          const completed = checkIn?.checkin_fire_awarded && 
                           checkIn?.meal_photo_fire_awarded && 
                           checkIn?.steps_fire_awarded;
          
          return {
            name: friend.display_name || friendProfile?.display_name || "Friend",
            completed: completed || false,
            avatar: friend.avatar_url || friendProfile?.avatar_url,
            fire: friendProfile?.fire_total || 0
          };
        })
      );
      
      return friendsData.sort((a, b) => b.fire - a.fire);
    },
    enabled: friendsList.length > 0,
  });

  const userCompleted = todayCheckIn?.checkin_fire_awarded && 
                        todayCheckIn?.meal_photo_fire_awarded && 
                        todayCheckIn?.steps_fire_awarded &&
                        (!profile?.calories_goal || todayCheckIn?.calories_fire_awarded);
  
  const userFire = profile?.fire_total || 0;
  const leader = friendsWithStatus[0];
  const fireToPassLeader = leader ? Math.max(0, leader.fire - userFire + 1) : 0;
  const completedCount = friendsWithStatus.filter(f => f.completed).length + (userCompleted ? 1 : 0);
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
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-teal-300 font-semibold">🏆 Leaderboard</p>
          <p className="text-xs text-white/60">{completedCount}/{totalFriends + 1} completed today</p>
        </div>
        {leader && userFire < leader.fire && (
          <motion.p 
            className="text-xs text-orange-300 font-bold"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            🔥 You need +{fireToPassLeader} fire to pass {leader.name}
          </motion.p>
        )}
        {leader && userFire >= leader.fire && (
          <p className="text-xs text-emerald-300 font-bold">
            👑 You're leading today!
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        {/* Leader */}
        {leader && (
          <motion.div
            className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Crown size={14} className="text-amber-400 flex-shrink-0" />
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              leader.completed ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60"
            }`}>
              {leader.name.charAt(0)}
            </div>
            <span className="text-xs text-white/80 flex-1 font-medium">{leader.name}</span>
            {leader.completed ? (
              <CheckCircle size={12} className="text-emerald-400" />
            ) : (
              <span className="text-xs text-orange-300">pending</span>
            )}
          </motion.div>
        )}

        {/* Other Friends */}
        {friendsWithStatus.slice(1).map((friend, idx) => (
          <motion.div
            key={idx}
            className="flex items-center gap-3 pl-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (idx + 1) * 0.05 }}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              friend.completed ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60"
            }`}>
              {friend.name.charAt(0)}
            </div>
            <span className="text-xs text-white/70 flex-1">{friend.name}</span>
            {friend.completed ? (
              <CheckCircle size={12} className="text-emerald-400" />
            ) : (
              <span className="text-xs text-orange-300">pending</span>
            )}
          </motion.div>
        ))}

        {/* Current User */}
        <motion.div
          className="flex items-center gap-3 pt-2 mt-2 border-t border-white/10 pl-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold">
            {profile?.display_name?.charAt(0) || "U"}
          </div>
          <span className="text-xs text-white font-semibold flex-1">You</span>
          {userCompleted ? (
            <CheckCircle size={12} className="text-emerald-400" />
          ) : (
            <span className="text-xs text-red-400 font-bold">pending</span>
          )}
        </motion.div>
      </div>

      {/* Competition Message */}
      {!userCompleted && (
        <motion.div
          className="mt-3 text-center"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <p className="text-xs text-orange-300 font-semibold">
            ⚡ Complete now to jump ahead
          </p>
        </motion.div>
      )}
    </div>
  );
}