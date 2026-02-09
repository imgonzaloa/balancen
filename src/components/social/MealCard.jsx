import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Heart, MessageCircle, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/components/TranslationProvider";
import { motion, AnimatePresence } from "framer-motion";

export default function MealCard({ meal, currentUser, currentProfile }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const { data: comments = [] } = useQuery({
    queryKey: ["mealComments", meal.id],
    queryFn: () => base44.entities.MealComment.filter({ meal_id: meal.id }, "-created_date"),
    enabled: showComments,
  });

  const addCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.MealComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealComments", meal.id] });
      setCommentText("");
    },
  });

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate({
      meal_id: meal.id,
      commenter_email: currentUser.email,
      commenter_name: currentProfile?.display_name || currentUser.email,
      commenter_avatar: currentProfile?.avatar_url,
      comment_text: commentText.trim(),
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold">
          {meal.created_by?.charAt(0).toUpperCase() || "?"}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{meal.created_by}</p>
          <p className="text-white/50 text-xs">
            {new Date(meal.created_date).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Image */}
      {meal.photo_url && (
        <img src={meal.photo_url} alt="Meal" className="w-full aspect-square object-cover" />
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <button className="flex items-center gap-1.5 text-white/70 hover:text-pink-400 transition-colors">
            <Heart size={20} />
            <span className="text-sm font-semibold">0</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-white/70 hover:text-teal-400 transition-colors"
          >
            <MessageCircle size={20} />
            <span className="text-sm font-semibold">{comments.length}</span>
          </button>
        </div>

        {meal.estimated_calories && (
          <p className="text-white text-sm">
            <span className="font-bold text-teal-300">{meal.estimated_calories}</span> {t('kcal_short')}
          </p>
        )}

        {meal.notes && (
          <p className="text-white/80 text-sm mt-2">{meal.notes}</p>
        )}
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10"
          >
            <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {comment.commenter_name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-xs font-semibold">{comment.commenter_name}</p>
                    <p className="text-white/80 text-sm">{comment.comment_text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="p-4 border-t border-white/10 flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder={t('add_comment') || 'Añadir comentario...'}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/50 text-sm h-9"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim() || addCommentMutation.isPending}
                className="p-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 disabled:opacity-50 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}