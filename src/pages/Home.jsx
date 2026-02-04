import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Users, Award, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import StreakFire from "@/components/ui/StreakFire";
import QuickCheckIn from "@/components/home/QuickCheckIn";
import WeekProgress from "@/components/home/WeekProgress";

export default function Home() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkIns"],
    queryFn: async () => {
      return base44.entities.DailyCheckIn.filter(
        { created_by: user?.email },
        "-date",
        30
      );
    },
    enabled: !!user?.email,
  });

  const today = new Date().toISOString().split("T")[0];
  const todayCheckIn = checkIns.find(c => c.date === today);

  const createCheckInMutation = useMutation({
    mutationFn: async (data) => {
      const existing = checkIns.find(c => c.date === data.date);
      if (existing) {
        return base44.entities.DailyCheckIn.update(existing.id, data);
      }
      return base44.entities.DailyCheckIn.create(data);
    },
    onSuccess: async (newCheckIn) => {
      queryClient.invalidateQueries(["checkIns"]);
      
      // Update streak
      if (profile) {
        const newStreak = profile.current_streak + 1;
        const longestStreak = Math.max(profile.longest_streak, newStreak);
        const totalCheckins = profile.total_checkins + 1;
        
        await base44.entities.UserProfile.update(profile.id, {
          current_streak: newStreak,
          longest_streak: longestStreak,
          total_checkins: totalCheckins,
        });
        
        // Check for badges
        const streakMilestones = [3, 7, 14, 30, 60, 100];
        for (const milestone of streakMilestones) {
          if (newStreak === milestone) {
            await base44.entities.Badge.create({
              badge_id: `streak_${milestone}_${user.email}_${Date.now()}`,
              user_email: user.email,
              badge_type: `streak_${milestone}`,
              earned_date: today,
            });
          }
        }
        
        // First check-in badge
        if (totalCheckins === 1) {
          await base44.entities.Badge.create({
            badge_id: `first_checkin_${user.email}`,
            user_email: user.email,
            badge_type: "first_checkin",
            earned_date: today,
          });
        }
        
        // First photo badge
        if (newCheckIn.food_photo_url) {
          const existingPhotoBadge = await base44.entities.Badge.filter({
            user_email: user.email,
            badge_type: "first_photo"
          });
          if (existingPhotoBadge.length === 0) {
            await base44.entities.Badge.create({
              badge_id: `first_photo_${user.email}`,
              user_email: user.email,
              badge_type: "first_photo",
              earned_date: today,
            });
          }
        }
        
        queryClient.invalidateQueries(["profile"]);
      }
    },
  });

  // Redirect to onboarding if no profile
  if (!profileLoading && !profile && user) {
    window.location.href = createPageUrl("Onboarding");
    return null;
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-lg mx-auto px-4 pb-24 pt-6">
        {/* Header */}
        <motion.div 
          className="flex justify-between items-start mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <p className="text-slate-500 text-sm">{greeting()}</p>
            <h1 className="text-2xl font-bold text-slate-800">
              {profile?.display_name || user?.full_name?.split(" ")[0] || "Usuario"}
            </h1>
          </div>
          
          <StreakFire streak={profile?.current_streak || 0} />
        </motion.div>

        {/* Main Check-in Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <QuickCheckIn 
            onComplete={(data) => createCheckInMutation.mutateAsync(data)}
            todayCheckIn={todayCheckIn}
          />
        </motion.div>

        {/* Week Progress */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <WeekProgress checkIns={checkIns} />
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          className="grid grid-cols-2 gap-4 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Total check-ins</p>
            <p className="text-2xl font-bold text-slate-800">{profile?.total_checkins || 0}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Mejor racha</p>
            <p className="text-2xl font-bold text-teal-600">{profile?.longest_streak || 0} días</p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="flex gap-3 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link
            to={createPageUrl("Groups")}
            className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Users size={20} className="text-indigo-600" />
            </div>
            <span className="font-medium text-slate-700">Grupos</span>
          </Link>
          
          <Link
            to={createPageUrl("Badges")}
            className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Award size={20} className="text-amber-600" />
            </div>
            <span className="font-medium text-slate-700">Logros</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}