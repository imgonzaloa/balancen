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
      
      const friends = await base44.entities.Friend.filter({ created_by: user.email });
      const friendEmails = friends.map(f => f.friend_user_id);
      
      const allPosts = await base44.entities.Post.filter({}, '-created_date', 50);
      
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
      
      const profiles = await Promise.all(
        friendEmails.map(email => base44.entities.UserProfile.filter({ created_by: email }))
      );
      const sharingEmails = friendEmails.filter((_, i) => profiles[i][0]?.share_meals === 'friends');
      if (sharingEmails.length === 0) return [];

      const mealArrays = await Promise.all(
        sharingEmails.map(email => base44.entities.MealLog.filter({ created_by: email }, "-created_date", 5))
      );
      const meals = mealArrays.flat();
      return meals.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  const { data: discoveryPosts = [] } = useQuery({
    queryKey: ['discovery-posts'],
    queryFn: async () => {
      try {
        const all = await base44.entities.Post.filter({ is_public: true }, '-created_date', 20);
        const friendIds = new Set((posts || []).map(p => p.id));
        return all.filter(p => !friendIds.has(p.id));
      } catch (_) {
        return [];
      }
    },
    staleTime: 60000,
  });

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasFriendContent = posts.length > 0 || friendMeals.length > 0;

  return (
    <div className="min-h-screen relative overflow-hidden pb-24" style={{ minHeight: '100dvh' }}>
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

        {/* Feed Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {hasFriendContent ? (
              <div className="space-y-4">
                {friendMeals.map(meal => (
                  <MealCard key={meal.id} meal={meal} currentUser={user} currentProfile={profile} />
                ))}
                {posts.map(post => (
                  <PostCard key={post.id} post={post} currentUserEmail={user.email} onUpdate={refetch} />
                ))}
                {discoveryPosts.length > 0 && (
                  <>
                    <div className="flex items-center justify-center gap-3 py-2">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/20" />
                      <p className="text-white/30 text-xs uppercase">✦ Discover ✦</p>
                      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/20" />
                    </div>
                    {discoveryPosts.map(post => (
                      <PostCard key={post.id} post={post} currentUserEmail={user.email} onUpdate={refetch} />
                    ))}
                  </>
                )}
              </div>
            ) : posts.length === 0 && discoveryPosts.length > 0 ? (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <p className="text-white font-black text-xl mb-1">
                    Discover what people are eating 🌍
                  </p>
                  <p className="text-white/50 text-sm mb-4">
                    Add friends to see their meals here
                  </p>
                </div>
                {discoveryPosts.map(post => (
                  <PostCard key={post.id} post={post} currentUserEmail={user.email} onUpdate={refetch} />
                ))}
              </div>
            ) : (
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
            )}
          </>
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