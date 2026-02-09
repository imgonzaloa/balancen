import React, { useState } from "react";
import { motion } from "framer-motion";
import { Flame, MessageCircle, Image, FileText, Lock } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";

export default function GroupFeed({ posts, onPostMeal, onPostStatus, userProfile }) {
  const { t, lang } = useTranslation();
  const locale = lang === "es" ? es : enUS;

  const canShare = userProfile?.share_meals !== 'private';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={20} className="text-teal-400" />
        <h3 className="text-white font-bold text-lg">{t('feed')}</h3>
      </div>

      {/* Post Actions */}
      {canShare && (
        <div className="flex gap-3">
          <Button
            onClick={onPostMeal}
            className="flex-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-xl"
          >
            <Image size={16} className="mr-2" />
            {t('post_meal')}
          </Button>
          <Button
            onClick={onPostStatus}
            className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl"
          >
            <FileText size={16} className="mr-2" />
            {t('post_status')}
          </Button>
        </div>
      )}

      {!canShare && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 text-center">
          <Lock size={24} className="text-white/40 mx-auto mb-2" />
          <p className="text-white/60 text-sm">{t('meal_sharing_disabled')}</p>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
          <FileText size={40} className="text-white/40 mx-auto mb-3" />
          <p className="text-white/70 font-semibold mb-1">{t('no_posts_yet')}</p>
          <p className="text-white/50 text-sm">{t('share_something')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10"
            >
              {/* Author */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                  {post.author_name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{post.author_name}</p>
                  <p className="text-white/50 text-xs">
                    {formatDistanceToNow(new Date(post.created_date), { addSuffix: true, locale })}
                  </p>
                </div>
              </div>

              {/* Content */}
              {post.type === 'meal' && post.photo_url && (
                <div className="mb-3">
                  <img src={post.photo_url} alt="Meal" className="w-full h-48 object-cover rounded-xl" />
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="text-teal-300 font-bold">{post.calories} {t('kcal_short')}</span>
                    {post.protein && <span className="text-blue-400">{post.protein}{t('gram_short')} {t('protein')}</span>}
                    {post.carbs && <span className="text-amber-400">{post.carbs}{t('gram_short')} {t('carbs')}</span>}
                    {post.fats && <span className="text-pink-400">{post.fats}{t('gram_short')} {t('fats')}</span>}
                  </div>
                </div>
              )}

              {post.type === 'status' && (
                <p className="text-white/90 mb-3">{post.content}</p>
              )}

              {/* Reactions */}
              <div className="flex items-center gap-4 pt-3 border-t border-white/10">
                <button className="flex items-center gap-1.5 text-white/60 hover:text-orange-400 transition-colors">
                  <Flame size={16} />
                  <span className="text-xs font-semibold">{post.reactions || 0}</span>
                </button>
                <button className="flex items-center gap-1.5 text-white/60 hover:text-teal-400 transition-colors">
                  <MessageCircle size={16} />
                  <span className="text-xs font-semibold">{post.comments || 0}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}