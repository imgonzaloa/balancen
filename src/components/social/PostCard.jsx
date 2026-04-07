import React, { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Award, Flame, Crown } from "lucide-react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import PostModerationMenu from "@/components/social/PostModerationMenu";

const likesLabel = {
  es: (names, extra) => {
    if (names.length === 0) return null;
    const base = names.join(" y ");
    return extra > 0 ? `${base} y ${extra} más les gustó esto` : `A ${base} les gustó esto`;
  },
  en: (names, extra) => {
    if (names.length === 0) return null;
    const base = names.join(" and ");
    return extra > 0 ? `${base} and ${extra} others liked this` : `${base} liked this`;
  },
  pt: (names, extra) => {
    if (names.length === 0) return null;
    const base = names.join(" e ");
    return extra > 0 ? `${base} e mais ${extra} curtiram isso` : `${base} curtiu isso`;
  },
};

export default function PostCard({ post, currentUserEmail, onUpdate, featured }) {
  const { t, lang } = useTranslation();
  const [blocked, setBlocked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [likerNames, setLikerNames] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [topComment, setTopComment] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [heartAnim, setHeartAnim] = useState(false);

  // Load author profile + top comment + liker names on mount
  useEffect(() => {
    if (post.author_email) {
      base44.entities.UserProfile.filter({ created_by: post.author_email })
        .then(p => { if (p[0]) setAuthorProfile(p[0]); })
        .catch(() => {});
    }
    // Load top comment preview
    if (post.comments_count > 0) {
      base44.entities.PostComment.filter({ created_by: post.author_email }, '-created_date', 10)
        .then(c => {
          const match = c.find(x => x.post_id === post.id);
          if (match) setTopComment(match);
        })
        .catch(() => {});
    }
    // Load up to 3 liker names for the "X and Y liked this" line
    if (post.likes_count > 0) {
      base44.entities.PostLike.list('-created_date', 50)
        .then(async (allLikes) => {
          const likes = allLikes.filter(l => l.post_id === post.id).slice(0, 3);
          const names = await Promise.all(
            likes.map(async (l) => {
              try {
                const profiles = await base44.entities.UserProfile.filter({ created_by: l.user_email });
                return profiles[0]?.display_name || l.user_email?.split('@')[0] || '?';
              } catch { return '?'; }
            })
          );
          setLikerNames(names);
        })
        .catch(() => {});
    }
    // Check if current user already liked
    base44.entities.PostLike.filter({ created_by: currentUserEmail })
      .then(likes => { if (likes.some(l => l.post_id === post.id)) setIsLiked(true); })
      .catch(() => {});
  }, [post.id, post.author_email, post.comments_count, post.likes_count, currentUserEmail]);

  const handleLike = async () => {
    // Trigger heart animation
    setHeartAnim(false);
    requestAnimationFrame(() => setHeartAnim(true));

    try {
      if (isLiked) {
        const likes = await base44.entities.PostLike.filter({ created_by: currentUserEmail });
        if (likes[0]) {
          const match = likes.find(l => l.post_id === post.id);
          if (!match) { setIsLiked(false); return; }
          await base44.entities.PostLike.delete(match.id);
          const newCount = Math.max(0, likesCount - 1);
          setLikesCount(newCount);
          setIsLiked(false);
          await base44.entities.Post.update(post.id, { likes_count: newCount });
        }
      } else {
        await base44.entities.PostLike.create({ post_id: post.id, user_email: currentUserEmail });
        const newCount = likesCount + 1;
        setLikesCount(newCount);
        setIsLiked(true);
        await base44.entities.Post.update(post.id, { likes_count: newCount });
      }
      onUpdate?.();
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const all = await base44.entities.PostComment.list('-created_date', 100);
      const fetched = all.filter(c => c.post_id === post.id);
      setComments(fetched);
      if (fetched[0]) setTopComment(fetched[0]);
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
      const newComment = await base44.entities.PostComment.create({
        post_id: post.id,
        user_email: currentUserEmail,
        user_name: profile?.display_name || 'User',
        user_avatar: profile?.avatar_url,
        content: commentText.trim()
      });
      await base44.entities.Post.update(post.id, { comments_count: (post.comments_count || 0) + 1 });
      setCommentText("");
      setTopComment(newComment);
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
    return `${Math.floor(hours / 24)}d`;
  };

  // Build "X and Y liked this" text
  const likesText = (() => {
    if (likesCount === 0 || likerNames.length === 0) return null;
    const fn = likesLabel[lang] || likesLabel.es;
    const shown = likerNames.slice(0, 2);
    const extra = Math.max(0, likesCount - shown.length);
    return fn(shown, extra);
  })();

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

      {/* Top comment preview (when comments section is closed) */}
      {topComment && !showComments && (
        <button
          onClick={() => { setShowComments(true); loadComments(); }}
          className="w-full text-left flex gap-2 items-start mb-3 bg-white/5 rounded-2xl px-3 py-2 border border-white/8 hover:bg-white/10 transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden flex-shrink-0 mt-0.5">
            {topComment.user_avatar ? (
              <img src={topComment.user_avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{topComment.user_name?.charAt(0) || '?'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-white/80 text-xs font-semibold mr-1.5">{topComment.user_name}</span>
            <span className="text-white/60 text-xs truncate">{topComment.content}</span>
          </div>
        </button>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 pt-3 border-t border-white/10">
        {/* Like button */}
        <button
          onClick={handleLike}
          className="flex items-center gap-2 group"
        >
          <motion.div
            key={heartAnim ? "anim" : "idle"}
            initial={heartAnim ? { scale: 1 } : false}
            animate={heartAnim ? { scale: [1, 1.55, 0.9, 1.1, 1] } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 12, duration: 0.5 }}
          >
            <Heart
              size={22}
              className={isLiked ? 'fill-pink-400 text-pink-400' : 'text-white/60 group-hover:text-pink-400 transition-colors'}
            />
          </motion.div>
          <span className={`text-base font-black ${isLiked ? 'text-pink-400' : 'text-white/70'}`}>
            {likesCount}
          </span>
        </button>

        {/* Comment button */}
        <button
          onClick={() => {
            setShowComments(!showComments);
            if (!showComments && comments.length === 0) loadComments();
          }}
          className="flex items-center gap-2 group"
        >
          <MessageCircle size={22} className="text-white/60 group-hover:text-teal-400 transition-colors" />
          <span className="text-base font-black text-white/70">
            {post.comments_count || 0}
          </span>
        </button>
      </div>

      {/* Likes text: "María and 3 others liked this" */}
      {likesText && (
        <p className="text-white/50 text-xs mt-2 leading-snug">{likesText}</p>
      )}

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}