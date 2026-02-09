import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Share2 } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { useAppState } from "@/components/AppStateContext";
import { SocialSkeleton } from "@/components/ui/ScreenSkeleton";
import InviteSystemCard from "@/components/social/InviteSystemCard";

export default function Social() {
  // ALL HOOKS AT TOP
  const { user, profile: cachedProfile, friends: cachedFriends, isInitialized } = useAppState();
  const { t, lang } = useTranslation();
  const [profile, setProfile] = useState(cachedProfile);
  const [friends, setFriends] = useState(cachedFriends || []);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(!cachedProfile);

  useEffect(() => {
    if (!user?.email || (cachedProfile && cachedFriends)) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [profileData, friendsData] = await Promise.all([
          base44.entities.UserProfile.filter({ created_by: user.email }),
          base44.entities.Friend.filter({ created_by: user.email }).catch(() => [])
        ]);

        setProfile(profileData[0] || null);
        setFriends(friendsData || []);

        // Fetch friend activities
        if (friendsData?.length > 0) {
          const today = new Date().toISOString().split("T")[0];
          const friendActivities = [];

          await Promise.all(friendsData.slice(0, 10).map(async (friend) => {
            try {
              const friendMeals = await base44.entities.MealLog.filter({
                created_by: friend.friend_email || friend.user_email,
                date: today,
              }, "-created_date", 3);

              friendMeals.forEach(meal => {
                friendActivities.push({
                  id: meal.id,
                  userName: friend.display_name,
                  time: new Date(meal.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  meal: {
                    photo_url: meal.photo_url,
                    estimated_calories: meal.estimated_calories
                  }
                });
              });
            } catch (err) {
              console.error("Error fetching friend activity:", err);
            }
          }));

          setActivities(friendActivities.sort((a, b) => new Date(b.time) - new Date(a.time)));
        }
      } catch (err) {
        console.error("Failed to fetch social data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.email, cachedProfile, cachedFriends]);

  if (!isInitialized || loading) {
    return <SocialSkeleton />;
  }

  return (
    <div className="min-h-screen pb-24" style={{ minHeight: '100dvh', overflowY: 'auto' }}>
      <div className="max-w-2xl mx-auto px-6 pt-2 pb-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-white mb-2">{t('social')}</h1>
          <p className="text-white/60 text-sm">
            {t('invite_friends_to_join')}
          </p>
        </div>

        {/* Invite System */}
        <InviteSystemCard profile={profile} />

        {/* Friend Activities or Empty State */}
        {friends.length === 0 ? (
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-3xl p-10 border border-purple-500/20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="text-7xl mb-4">🚀</div>
              <h3 className="text-white font-bold text-xl mb-2">
                {t('train_with_friends')}
              </h3>
              <p className="text-white/70 text-sm">
                {t('invite_friends_to_join')}
              </p>
            </div>
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                    {activity.userName?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{activity.userName}</p>
                    <p className="text-white/60 text-xs">
                      {t('meal_logged')} • {activity.time}
                    </p>
                    {activity.meal?.photo_url && (
                      <img src={activity.meal.photo_url} alt="Meal" className="mt-3 w-full h-36 object-cover rounded-xl" loading="lazy" />
                    )}
                    {activity.meal?.estimated_calories && (
                      <p className="text-teal-300 text-xs mt-2">{activity.meal.estimated_calories} kcal</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10 text-center">
            <div className="text-6xl mb-4">😴</div>
            <h3 className="text-white font-bold text-lg mb-2">
              {t('no_friends_yet')}
            </h3>
            <p className="text-white/60 text-sm">
              {t('invite_friends_to_join')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}