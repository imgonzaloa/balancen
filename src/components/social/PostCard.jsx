import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Award, Flame, Crown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import PostModerationMenu from "@/components/social/PostModerationMenu";

export default function PostCard({ post, currentUserEmail, onUpdate, featured }) {
  const { t, lang } = useTranslation();
  const [blocked, setBlocked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authorProfile, setAuthorProfile] = useState(null);

  useEffect(() => {
    const fetchAuthorProfile = async () => {
      try {
        const profiles = await base44.entities.UserProfile.filter({ created_by: post.author_email });
        if (profiles[0]) {
          setAuthorProfile(profiles[0]);
        }
      } catch (_) {}
    };
    if (post.author_email) {
      fetchAuthorProfile();
    }
  }, [post.author_email]);

  const handleLike = async () => {
    try {
      if (isLiked) {
        // Unlike
        const likes = await base44.entities.PostLike.filter({
          post_id: post.id,
          created_by: currentUserEmail
        });
        if (likes[0]) {
          await base44.entities.PostLike.delete(likes[0].id);
          setLikesCount(prev => prev - 1);
          setIsLiked(false);
          await base44.entities.Post.update(post.id, {
            likes_count: Math.max(0, likesCount - 1)
          });
        }
      } else {
        // Like
        await base44.entities.PostLike.create({
          post_id: post.id,
          user_email: currentUserEmail
        });
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
        await base44.entities.Post.update(post.id, {
          likes_count: likesCount + 1
        });
      }
      onUpdate?.();
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const fetchedComments = await base44.entities.PostComment.filter(
        { post_id: post.id },
        '-created_date'
      );
      setComments(fetchedComments);
    } catch (err) {
      console.error('Load comments error:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const profiles = await base44.entities.UserProfile.filter({ created_by: currentUserEmail });
      const profile = profiles[0];

      await base44.entities.PostComment.create({
        post_id: post.id,
        user_email: currentUserEmail,
        user_name: profile?.display_name || 'User',
        user_avatar: profile?.avatar_url,
        content: commentText.trim()
      });

      await base44.entities.Post.update(post.id, {
        comments_count: (post.comments_count || 0) + 1
      });

      setCommentText("");
      await loadComments();
      onUpdate?.();
      toast.success(t('comment_added'));
    } catch (err) {
      console.error('Comment error:', err);
      toast.error(t('error_adding_comment'));
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return t('just_now') || 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (blocked) return null;

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold overflow-hidden">
          {post.author_avatar ? (
            <img src={post.author_avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{post.author_name?.charAt(0) || '?'}</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-white font-semibold text-sm">{post.author_name}</p>
            {authorProfile?.is_featured && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                <Crown size={10} className="text-amber-300" />
                <span className="text-amber-300 text-[10px] font-bold">Athlete</span>
              </div>
            )}
          </div>
          <p className="text-white/50 text-xs">{timeAgo(post.created_date)}</p>
        </div>
        {featured && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-400/40">
            <Crown size={11} className="text-amber-400" />
            <span className="text-amber-300 text-[10px] font-bold">Athlete</span>
          </div>
        )}
        {post.post_type === 'achievement' && !featured && (
          <Award size={20} className="text-amber-400" />
        )}
        {post.author_email !== currentUserEmail && (
          <PostModerationMenu
            contentId={post.id}
            authorEmail={post.author_email}
            currentUserEmail={currentUserEmail}
            lang={lang}
            onBlocked={() => setBlocked(true)}
          />
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-white text-sm mb-3 leading-relaxed">{post.content}</p>
      )}

      {/* Image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt=""
          className="w-full rounded-2xl mb-3 max-h-96 object-cover"
        />
      )}

      {/* Meal Data */}
      {post.post_type === 'meal' && post.meal_data && (
        <div className="bg-white/5 rounded-2xl p-4 mb-3 border border-white/10">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-xs text-white/60">{t('calories')}</p>
              <p className="text-white font-bold">{post.meal_data.calories}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">{t('protein')}</p>
              <p className="text-teal-300 font-bold">{post.meal_data.protein}g</p>
            </div>
            <div>
              <p className="text-xs text-white/60">{t('carbs')}</p>
              <p className="text-amber-300 font-bold">{post.meal_data.carbs}g</p>
            </div>
            <div>
              <p className="text-xs text-white/60">{t('fats')}</p>
              <p className="text-pink-300 font-bold">{post.meal_data.fats}g</p>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Badge */}
      {post.post_type === 'achievement' && post.achievement_data && (
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl p-4 mb-3 border border-amber-400/30 flex items-center gap-3">
          <Flame size={32} className="text-amber-400" />
          <div>
            <p className="text-white font-bold">{post.achievement_data.type}</p>
            <p className="text-white/70 text-sm">{post.achievement_data.value} days</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-white/10">
        <button
          onClick={handleLike}
          className="flex items-center gap-2 text-white/70 hover:text-pink-400 transition-colors"
        >
          <Heart
            size={18}
            className={isLiked ? 'fill-pink-400 text-pink-400' : ''}
          />
          <span className="text-sm">{likesCount}</span>
        </button>
        <button
          onClick={() => {
            setShowComments(!showComments);
            if (!showComments && comments.length === 0) loadComments();
          }}
          className="flex items-center gap-2 text-white/70 hover:text-teal-400 transition-colors"
        >
          <MessageCircle size={18} />
          <span className="text-sm">{post.comments_count || 0}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-white/10">
          {loadingComments ? (
            <div className="text-center py-2">
              <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <>
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                    {comment.user_avatar ? (
                      <img src={comment.user_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{comment.user_name?.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <div className="flex-1 bg-white/5 rounded-xl p-2">
                    <p className="text-white text-xs font-semibold mb-1">{comment.user_name}</p>
                    <p className="text-white/80 text-xs">{comment.content}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  placeholder={t('add_comment') || 'Add a comment...'}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={handleComment}
                  disabled={submitting || !commentText.trim()}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                >
                  {t('post')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}