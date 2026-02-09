import React, { useState } from "react";
import { X, Image as ImageIcon, Award } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";

export default function CreatePost({ userProfile, onClose, onPostCreated }) {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("status");
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data } = await base44.integrations.Core.UploadFile({ file });
      if (data?.file_url) {
        setImageUrl(data.file_url);
        toast.success(t('image_uploaded'));
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(t('upload_failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageUrl) {
      toast.error(t('add_content_or_image'));
      return;
    }

    try {
      await base44.entities.Post.create({
        author_email: userProfile.created_by,
        author_name: userProfile.display_name,
        author_avatar: userProfile.avatar_url || userProfile.profile_photo,
        content: content.trim(),
        post_type: postType,
        image_url: imageUrl || null,
        likes_count: 0,
        comments_count: 0
      });

      toast.success(t('post_created'));
      onPostCreated?.();
      onClose();
    } catch (err) {
      console.error('Create post error:', err);
      toast.error(t('post_failed'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-3xl sm:rounded-3xl border border-white/20 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">{t('create_post') || 'Create Post'}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="p-4">
          {/* Post Type */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setPostType('status')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-colors ${
                postType === 'status'
                  ? 'bg-teal-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {t('status')}
            </button>
            <button
              onClick={() => setPostType('achievement')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                postType === 'achievement'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <Award size={16} />
              {t('achievement')}
            </button>
          </div>

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('whats_on_your_mind') || "What's on your mind?"}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/40 resize-none focus:outline-none focus:border-teal-500 min-h-[120px]"
            maxLength={500}
          />
          <p className="text-white/40 text-xs text-right mt-1">
            {content.length}/500
          </p>

          {/* Image Preview */}
          {imageUrl && (
            <div className="relative mt-4">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full rounded-2xl max-h-64 object-cover"
              />
              <button
                onClick={() => setImageUrl("")}
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-4">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                <ImageIcon size={18} className="text-white" />
                <span className="text-white text-sm">
                  {uploading ? t('uploading') : t('add_image')}
                </span>
              </div>
            </label>

            <button
              onClick={handleSubmit}
              disabled={(!content.trim() && !imageUrl) || uploading}
              className="px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('post')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}