import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { Plus, Users, ArrowLeft } from "lucide-react";
import PostCard from "@/components/social/PostCard";
import CreatePost from "@/components/social/CreatePost";
import MealCard from "@/components/social/MealCard";
import { createPageUrl } from "@/utils";

export default function Feed() {
  const navigate = useNavigate();
  const { user, profile } = useAppState();
  const { t } = useTranslation();
  const [showCreatePost, setShowCreatePost] = useState(false);

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ['social-feed', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      // Get user's friends
      const friends = await base44.entities.Friend.filter({ created_by: user.email });
      const friendEmails = friends.map(f => f.friend_user_id);
      
      // Get posts from friends and self
      const allPosts = await base44.entities.Post.filter({}, '-created_date', 50);
      
      // Filter to only show posts from friends and self
      return allPosts.filter(
        post => post.created_by === user.email || friendEmails.includes(post.author_email)
      );
    },
    enabled: !!user?.email,
    staleTime: 60000,
  });

  const { data: friendMeals = [] } = useQuery({
    queryKey: ['friend-meals', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      const friends = await base44.entities.Friend.filter({ created_by: user.email });
      const friendEmails = friends.map(f => f.friend_user_id);
      if (friendEmails.length === 0) return [];
      
      const meals = [];
      for (let i = 0; i < friendEmails.length; i++) {
        if (i > 0) await new Promise(resolve => setTimeout(resolve, 150));
        const userProfiles = await base44.entities.UserProfile.filter({ created_by: friendEmails[i] });
        if (userProfiles[0]?.share_meals === 'friends') {
          const userMeals = await base44.entities.MealLog.filter({ created_by: friendEmails[i] }, "-created_date", 5);
          meals.push(...userMeals);
        }
      }
      return meals.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Check premium
  const isPremium = profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator';

  if (!isPremium) {
    return (
      <div className="min-h-screen relative overflow-hidden pb-24" style={{ minHeight: '100dvh' }}>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate(createPageUrl('Social'))}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('premium_feature') || 'Premium Feature'}</h3>
            <p className="text-white/70 text-sm mb-6">
              {t('unlock_social_feed') || 'Unlock social feed to share and connect with friends'}
            </p>
            <button
              onClick={() => navigate(createPageUrl('Premium'))}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-8 py-3 rounded-2xl"
            >
              {t('upgrade_now') || 'Upgrade Now'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-24" style={{ minHeight: '100dvh' }}>
      {/* Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 right-0 w-96 h-96 bg-teal-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(createPageUrl('Social'))}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Users size={24} className="text-teal-400" />
                {t('social_feed') || 'Social Feed'}
              </h1>
              <p className="text-white/60 text-sm">
                {t('share_your_progress') || 'Share your progress with friends'}
              </p>
            </div>
          </div>
        </div>

        {/* Create Post Button */}
        <button
          onClick={() => setShowCreatePost(true)}
          className="w-full bg-white/10 backdrop-blur-xl rounded-3xl p-4 border border-white/20 hover:bg-white/20 transition-colors mb-6 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold overflow-hidden">
            {profile.avatar_url || profile.profile_photo ? (
              <img
                src={profile.avatar_url || profile.profile_photo}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{profile.display_name?.charAt(0) || '?'}</span>
            )}
          </div>
          <span className="text-white/60 flex-1 text-left">
            {t('whats_on_your_mind') || "What's on your mind?"}
          </span>
          <Plus size={20} className="text-teal-400" />
        </button>

        {/* Posts Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 h-48 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
            <Users size={48} className="text-white/40 mx-auto mb-4" />
            <h3 className="text-white font-bold mb-2">{t('no_posts_yet') || 'No posts yet'}</h3>
            <p className="text-white/60 text-sm mb-4">
              {t('be_first_to_share') || 'Be the first to share your progress!'}
            </p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl text-white font-semibold"
            >
              {t('create_post') || 'Create Post'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {friendMeals.map(meal => (
              <MealCard
                key={meal.id}
                meal={meal}
                currentUser={user}
                currentProfile={profile}
              />
            ))}
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserEmail={user.email}
                onUpdate={refetch}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePost
          userProfile={profile}
          onClose={() => setShowCreatePost(false)}
          onPostCreated={refetch}
        />
      )}
    </div>
  );
}