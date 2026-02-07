import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ChevronLeft, Scale, Ruler, LogOut, Save, Settings, Crown, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import StreakFire from "@/components/ui/StreakFire";
import { useTranslation } from "@/components/TranslationProvider";
import SetStatusModal from "@/components/groups/SetStatusModal";
import ReferralProgress from "@/components/profile/ReferralProgress";
import { useAppState } from "@/components/AppStateContext";
import PhotoPickerModal from "@/components/profile/PhotoPickerModal";
import { uploadProfilePhoto } from "@/components/profile/PhotoUploadHandler";
import { logger } from "@/components/logger";

// Note: Avatar upload now uses base44.integrations.Core.UploadFile directly (no RobustUploader needed)

export default function Profile() {
  const { t, lang } = useTranslation();
  const { user: cachedUser, profile: cachedProfile, isInitialized } = useAppState();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const queryClient = useQueryClient();

  const user = cachedUser;

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email && !cachedProfile,
    initialData: cachedProfile,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        weight: profile.weight || "",
        height: profile.height || "",
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.UserProfile.update(profile.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["profile"]);
      setEditMode(false);
      toast.success("Profile updated");
    },
  });

  const handleSave = () => {
    const updateData = {
      display_name: formData.display_name,
    };
    if (formData.weight) updateData.weight = parseFloat(formData.weight);
    if (formData.height) updateData.height = parseFloat(formData.height);
    
    updateMutation.mutate(updateData);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;

    setUploadingAvatar(true);
    const previousAvatar = profile?.profile_photo || profile?.avatar_url;
    
    try {
      // Optimistic UI: show temp preview
      const tempUrl = URL.createObjectURL(file);
      queryClient.setQueryData(["profile"], {
        ...profile,
        profile_photo: tempUrl,
        avatar_url: tempUrl
      });
      
      const loadingToast = toast.loading(lang === "es" ? "Subiendo..." : "Uploading...");
      
      // Upload with client-side processing
      const result = await uploadProfilePhoto(file);
      toast.dismiss(loadingToast);

      if (result.success && result.fileUrl) {
        // Update with real URL
        const finalUrl = result.fileUrl + `?v=${Date.now()}`;
        queryClient.setQueryData(["profile"], {
          ...profile,
          profile_photo: finalUrl,
          avatar_url: finalUrl
        });
        
        // Persist to backend
        base44.entities.UserProfile.update(profile.id, {
          profile_photo: finalUrl,
          avatar_url: finalUrl
        }).catch(err => logger.error('AVATAR_PERSIST_FAILED', err));
        
        // Cache locally
        try {
          localStorage.setItem(`avatar_cache_${user?.email}`, finalUrl);
        } catch (e) {
          logger.log('AVATAR_CACHE_FAILED', e);
        }
        
        URL.revokeObjectURL(tempUrl);
        toast.success(lang === "es" ? "✨ Foto actualizada" : "✨ Photo updated");
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      logger.error('AVATAR_UPLOAD_ERROR', error);
      toast.error(error.message || (lang === 'es' ? 'Error al subir foto' : 'Upload failed'), {
        duration: 4000,
        action: {
          label: lang === "es" ? "Reintentar" : "Retry",
          onClick: () => setShowPhotoPicker(true)
        }
      });
      
      // Rollback
      queryClient.setQueryData(["profile"], {
        ...profile,
        profile_photo: previousAvatar,
        avatar_url: previousAvatar
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Preload cached avatar on mount
  useEffect(() => {
    if (user?.email && profile?.id) {
      const cachedUrl = localStorage.getItem(`avatar_cache_${user.email}`);
      if (cachedUrl && !profile?.profile_photo && !profile?.avatar_url) {
        queryClient.setQueryData(["profile"], {
          ...profile,
          profile_photo: cachedUrl,
          avatar_url: cachedUrl
        });
      }
    }
  }, [user?.email, profile?.id]);

  const handleAvatarClick = () => {
    setShowPhotoPicker(true);
  };
  
  const handlePhotoSelected = (file) => {
    handleAvatarUpload(file);
  };

  const goalLabels = {
    en: {
      consistency: "Be more consistent",
      eat_better: "Eat better",
      move_more: "Move more",
      train_regularly: "Train regularly",
    },
    es: {
      consistency: "Ser más consistente",
      eat_better: "Comer mejor",
      move_more: "Moverme más",
      train_regularly: "Entrenar regularmente",
    }
  };

  const intensityLabels = {
    en: {
      easy: "Easy",
      normal: "Normal",
      challenging: "Challenging",
    },
    es: {
      easy: "Fácil",
      normal: "Normal",
      challenging: "Desafiante",
    }
  };

  const currentLang = profile?.language || "en";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="max-w-lg mx-auto px-4 pb-24 pt-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to={createPageUrl("Home")}
              className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0"
            >
              <ChevronLeft size={20} className="text-white" />
            </Link>
            <h1 className="text-2xl font-bold text-white">{t("my_profile")}</h1>
          </div>
          {!editMode && (
            <Button
              onClick={() => setEditMode(true)}
              className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 h-10 px-4"
            >
              {t("edit")}
            </Button>
          )}
        </div>

        {/* Profile Header */}
        <motion.div
          className="relative overflow-hidden rounded-3xl p-6 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-teal-400/30 to-emerald-400/30 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <motion.button
                  whileHover={{ scale: uploadingAvatar ? 1 : 1.05 }}
                  whileTap={{ scale: uploadingAvatar ? 1 : 0.95 }}
                  onClick={() => !uploadingAvatar && handleAvatarClick()}
                  disabled={uploadingAvatar}
                  className="relative w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden"
                >
                  {profile?.profile_photo || profile?.avatar_url ? (
                    <img 
                      src={profile.profile_photo || profile.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<span>${profile?.display_name?.charAt(0) || user?.full_name?.charAt(0) || "U"}</span>`;
                      }}
                    />
                  ) : (
                    <span>{profile?.display_name?.charAt(0) || user?.full_name?.charAt(0) || "U"}</span>
                  )}
                  {uploadingAvatar ? (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={20} className="text-white" />
                    </div>
                  )}
                </motion.button>
              </div>
              <div className="flex-1">
                {editMode ? (
                  <Input
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="text-xl font-bold rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-white">
                    {profile?.display_name || user?.full_name}
                  </h2>
                )}
                <p className="text-teal-200 text-sm">{user?.email}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-5 text-center border border-amber-400/30 flex flex-col items-center justify-center min-h-[140px]">
                <div className="flex items-center justify-center mb-3">
                  <StreakFire streak={profile?.current_streak || 0} size="small" />
                </div>
                <p className="text-xs text-white/70 font-semibold">{t("current_streak")}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 flex flex-col items-center justify-center min-h-[140px]">
                <p className="text-4xl font-bold text-teal-300 leading-none mb-2">{profile?.longest_streak || 0}</p>
                <p className="text-xs text-white/70 font-semibold">{t("best_streak")}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 flex flex-col items-center justify-center min-h-[140px]">
                <p className="text-4xl font-bold text-white leading-none mb-2">{profile?.total_checkins || 0}</p>
                <p className="text-xs text-white/70 font-semibold">{t("total_checkins")}</p>
              </div>
            </div>
          </div>
        </motion.div>



        {/* Referral Progress */}
        <ReferralProgress profile={profile} />

        {/* Status Note - Single instance */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <button
            onClick={() => setStatusModalOpen(true)}
            className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-lg flex items-center justify-between hover:bg-white/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">💭</div>
              <div className="text-left">
                <p className="font-semibold text-white">
                  {profile?.status_text || t("add_status")}
                </p>
                <p className="text-xs text-teal-200">
                  {profile?.status_text 
                    ? t("tap_to_edit")
                    : t("status_expires_24h")}
                </p>
              </div>
            </div>
            <ChevronLeft size={20} className="text-white/60 rotate-180" />
          </button>
        </motion.div>

        {/* Settings Button */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Link to={createPageUrl("Settings")}>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-lg flex items-center justify-between hover:bg-white/20 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Settings size={20} className="text-teal-300" />
                </div>
                <div>
                  <p className="font-semibold text-white">{t("settings")}</p>
                  <p className="text-xs text-teal-200">{t("settings_desc")}</p>
                </div>
              </div>
              <ChevronLeft size={20} className="text-white/60 rotate-180" />
            </div>
          </Link>
        </motion.div>

        {/* Goals */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-lg mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="font-semibold text-white mb-4">{t("your_goals")}</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5">
              <span className="text-teal-200 text-sm">{t("main_goal")}</span>
              <span className="font-medium text-white">
                {goalLabels[currentLang]?.[profile?.main_goal] || t("not_defined")}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5">
              <span className="text-teal-200 text-sm">{t("intensity")}</span>
              <span className="font-medium text-white">
                {intensityLabels[currentLang]?.[profile?.intensity_level] || t("not_defined")}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5">
              <span className="text-teal-200 text-sm">{t("mode")}</span>
              <span className="font-medium text-white">
                {profile?.usage_mode === "with_friends" ? t("with_friends") : t("alone")}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Optional Data */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-lg mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-semibold text-white mb-4">
            {t("optional_data")}
          </h3>
          
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4">
              <Label className="text-teal-200 flex items-center gap-2 mb-2">
                <Scale size={16} />
                {t("weight_kg")}
              </Label>
              {editMode ? (
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder={t("optional") || "Optional"}
                  className="rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              ) : (
                <p className="text-white font-medium">
                  {profile?.weight ? `${profile.weight} kg` : t("not_defined")}
                </p>
              )}
            </div>
            
            <div className="bg-white/5 rounded-xl p-4">
              <Label className="text-teal-200 flex items-center gap-2 mb-2">
                <Ruler size={16} />
                {t("height_cm")}
              </Label>
              {editMode ? (
                <Input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder={t("optional") || "Optional"}
                  className="rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              ) : (
                <p className="text-white font-medium">
                  {profile?.height ? `${profile.height} cm` : t("not_defined")}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        {editMode ? (
          <motion.div 
            className="flex gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              onClick={() => setEditMode(false)}
              className="flex-1 rounded-2xl py-6 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1 rounded-2xl py-6 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white border-0 shadow-lg shadow-teal-500/50"
            >
              <Save size={18} className="mr-2" />
              {t("save")}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              onClick={handleLogout}
              className="w-full rounded-2xl py-6 bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-300 hover:bg-red-500/30 shadow-lg"
            >
              <LogOut size={18} className="mr-2" />
              {t("logout")}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Status Modal */}
      <SetStatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        currentStatus={profile?.status_text}
        profile={profile}
        onUpdate={() => queryClient.invalidateQueries(["profile"])}
      />
      
      {/* Photo Picker Modal - Gallery first, Camera secondary */}
      <PhotoPickerModal
        isOpen={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onSelectFile={handleAvatarUpload}
      />
    </div>
  );
}