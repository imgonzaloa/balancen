import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, TrendingUp } from "lucide-react";

export default function SocialActivityFeed({ user }) {
  const [activities, setActivities] = useState([]);

  // Fetch recent friend activities
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

  // Fetch friend check-ins from today
  const { data: recentCheckIns = [] } = useQuery({
    queryKey: ["recentCheckIns", today, friendsList],
    queryFn: async () => {
      if (friendsList.length === 0) return [];
      
      const friendEmails = friendsList.map(f => f.friend_user_id);
      const allCheckIns = await base44.entities.DailyCheckIn.list("-updated_date", 10);
      
      // Filter for today's check-ins from friends
      const todayFriendCheckIns = allCheckIns.filter(c => 
        c.date === today && 
        friendEmails.includes(c.created_by) &&
        c.completed
      );
      
      // Match with friend data
      return todayFriendCheckIns.map(checkIn => {
        const friend = friendsList.find(f => f.friend_user_id === checkIn.created_by);
        return {
          name: friend?.display_name || "Someone",
          action: "just completed today's mission",
          timestamp: new Date(checkIn.updated_date).getTime()
        };
      }).slice(0, 3);
    },
    enabled: friendsList.length > 0,
    refetchInterval: 30000, // Refetch every 30s for "real-time" feel
  });

  // Simulate fire gain activities (based on check-ins)
  useEffect(() => {
    if (recentCheckIns.length > 0) {
      const activityList = recentCheckIns.flatMap((checkIn, idx) => [
        {
          id: `checkin-${idx}`,
          name: checkIn.name,
          action: checkIn.action,
          icon: "mission"
        },
        {
          id: `fire-${idx}`,
          name: checkIn.name,
          action: "gained +1 fire",
          icon: "fire"
        }
      ]);
      setActivities(activityList.slice(0, 4));
    }
  }, [recentCheckIns]);

  if (activities.length === 0) return null;

  return (
    <motion.div
      className="mt-3 bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3 }}
    >
      <p className="text-xs text-teal-300 font-semibold mb-2">Live Activity</p>
      <div className="space-y-2">
        <AnimatePresence>
          {activities.map((activity, idx) => (
            <motion.div
              key={activity.id}
              className="flex items-center gap-2 text-xs text-white/70"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: idx * 0.1 }}
            >
              {activity.icon === "fire" ? (
                <Flame size={12} className="text-orange-400" />
              ) : (
                <TrendingUp size={12} className="text-teal-400" />
              )}
              <span>
                <span className="text-white font-medium">{activity.name}</span> {activity.action}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}