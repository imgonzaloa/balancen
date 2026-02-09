import React, { useState, useEffect } from "react";
import { Camera, Settings, LogOut, Edit2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ProfileGoalsEdit from "@/components/profile/ProfileGoalsEdit";

function StatusEditor({ profile, lang, onUpdate }) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [statusText, setStatusText] = useState(profile?.status_text || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile?.id) return;
    
    setSaving(true);
    try {
      await base44.entities.UserProfile.update(profile.id, {
        status_text: statusText.slice(0, 32),
        status_updated_at: new Date().toISOString(),
      });
      
      toast.success(t('status_updated'));
      onUpdate?.();
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error(t('update_failed'));
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <input
          type="text"
          value={statusText}
          onChange={(e) => setStatusText(e.target.value)}
          maxLength={32}
          placeholder={t('status_placeholder')}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-teal-500"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "..." : t('save')}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
    >
      <span className={`text-sm ${profile?.status_text ? 'text-white italic' : 'text-white/60'}`}>
        {profile?.status_text ? `"${profile.status_text}"` : t('status_placeholder')}
      </span>
      <Edit2 size={16} className="text-white/40 group-hover:text-white transition-colors" />
    </button>
  );
}

export default function Profile() {
  // ALL HOOKS AT TOP
  const { user, profile: cachedProfile, isInitialized, refreshProfile } = useAppState();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(cachedProfile);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showGoalsEdit, setShowGoalsEdit] = useState(false);

  useEffect(() => {
    if (!user?.email || cachedProfile) return;

    const fetchProfile = async () => {
      try {
        const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
        setProfile(profiles[0] || null);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, [user?.email, cachedProfile]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    setUploadingPhoto(true);
    const prevPhoto = profile.profile_photo;

    try {
      // Optimistic update
      const tempUrl = URL.createObjectURL(file);
      setProfile({ ...profile, profile_photo: tempUrl });

      // Upload with compression
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await base44.integrations.Core.UploadFile({ file });
      
      if (data?.file_url) {
        const finalUrl = data.file_url + `?v=${Date.now()}`;
        await base44.entities.UserProfile.update(profile.id, {
          profile_photo: finalUrl,
          avatar_url: finalUrl
        });

        setProfile({ ...profile, profile_photo: finalUrl, avatar_url: finalUrl });
        localStorage.setItem(`avatar_cache_${user.email}`, finalUrl);
        URL.revokeObjectURL(tempUrl);
        toast.success(t('photo_updated'));
        
        if (refreshProfile) refreshProfile();
      }
    } catch (err) {
      console.error("Photo upload failed:", err);
      setProfile({ ...profile, profile_photo: prevPhoto });
      toast.error(t('error_uploading_photo'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const goalLabels = {
    en: {
      consistency: "Be more consistent",
      weight_loss: "Lose weight",
      healthy_habits: "Build healthy habits",
      stay_active: "Stay active"
    },
    es: {
      consistency: "Ser más consistente",
      weight_loss: "Bajar de peso",
      healthy_habits: "Hábitos saludables",
      stay_active: "Mantenerse activo"
    }
  };

  const intensityLabels = {
    en: {
      easy: "Easy",
      normal: "Normal",
      challenging: "Challenging"
    },
    es: {
      easy: "Fácil",
      normal: "Normal",
      challenging: "Desafiante"
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden" style={{ minHeight: '100dvh', overflowY: 'auto' }}>
      {/* Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-lg mx-auto px-4 pt-2 pb-8 relative z-10">
        <h1 className="text-2xl font-bold text-white mb-8">
          {t('my_profile')}
        </h1>

        {/* Profile Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 mb-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-teal-400/30 to-emerald-400/30 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden relative">
                  {profile?.profile_photo || profile?.avatar_url ? (
                    <img src={profile.profile_photo || profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{profile?.display_name?.charAt(0) || user?.full_name?.charAt(0) || "U"}</span>
                  )}
                  {uploadingPhoto ? (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={20} className="text-white" />
                    </div>
                  )}
                </div>
              </label>
              <div>
                <h2 className="text-xl font-bold text-white">{profile?.display_name || user?.full_name}</h2>
                <p className="text-teal-200 text-sm">{user?.email}</p>
              </div>
            </div>

            {/* Premium Badge */}
            {(profile?.role === "collaborator" || profile?.premium_source === "collaborator_invite") && (
              <div className="mb-4 px-3 py-2 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center gap-2">
                <span className="text-purple-300 text-xs font-bold">
                  👑 {t('premium_active')} ({t('collaborator')})
                </span>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-5 text-center border border-amber-400/30 min-h-[140px] flex flex-col items-center justify-center">
                <div className="text-5xl mb-3">🔥</div>
                <p className="text-xs text-white/70 font-semibold">{t('current_streak')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 min-h-[140px] flex flex-col items-center justify-center">
                <p className="text-4xl font-bold text-teal-300 mb-2">{profile?.longest_streak || 0}</p>
                <p className="text-xs text-white/70 font-semibold">{t('best_streak')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 min-h-[140px] flex flex-col items-center justify-center">
                <p className="text-4xl font-bold text-white mb-2">{profile?.total_checkins || 0}</p>
                <p className="text-xs text-white/70 font-semibold">{t('total_checkins')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Section - Editable */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">{t('your_goals')}</h3>
            <button
              onClick={() => setShowGoalsEdit(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:bg-teal-500/30 transition-colors"
            >
              <Target size={14} />
              <span className="text-xs font-semibold">{t('edit_goals')}</span>
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5">
              <span className="text-white/70 text-sm">{t('main_goal')}</span>
              <span className="font-semibold text-white">
                {goalLabels[lang]?.[profile?.primary_goal] || t('not_defined')}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5">
              <span className="text-white/70 text-sm">{t('intensity')}</span>
              <span className="font-semibold text-white">
                {intensityLabels[lang]?.[profile?.intensity_level] || t('not_defined')}
              </span>
            </div>
            {profile?.calories_goal && (
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5">
                <span className="text-white/70 text-sm">{t('daily_goal')}</span>
                <span className="font-semibold text-white">{profile.calories_goal} kcal</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Section - Editable */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-6">
          <h3 className="text-white font-bold text-lg mb-4">{t('status')}</h3>
          <StatusEditor profile={profile} lang={lang} onUpdate={refreshProfile} />
        </div>

        {/* Goals Section */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-6">
          <h3 className="text-white font-bold text-lg mb-4">{t('your_goal')}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">{t('primary_goal')}</span>
              <span className="text-teal-300 font-semibold text-sm">{t(profile?.primary_goal || 'consistency')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">{t('intensity')}</span>
              <span className="text-teal-300 font-semibold text-sm">{t(profile?.intensity_level || 'normal')}</span>
            </div>
            {profile?.calories_goal && (
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">{t('daily_goal')}</span>
                <span className="text-teal-300 font-semibold text-sm">{profile.calories_goal} kcal</span>
              </div>
            )}
          </div>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => navigate(createPageUrl('Settings'))}
          className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 mb-6 flex items-center justify-between hover:bg-white/20 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Settings size={20} className="text-teal-300" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">{t('settings')}</p>
              <p className="text-xs text-teal-200">{t('settings_desc')}</p>
            </div>
          </div>
        </button>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          className="w-full rounded-2xl py-6 bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30"
        >
          <LogOut size={18} className="mr-2" />
          {t('logout')}
        </Button>
      </div>

      {/* Goals Edit Modal */}
      {showGoalsEdit && (
        <ProfileGoalsEdit
          profile={profile}
          onClose={() => setShowGoalsEdit(false)}
          onUpdate={() => {
            refreshProfile?.();
            // Re-fetch profile
            base44.entities.UserProfile.filter({ created_by: user.email })
              .then(profiles => setProfile(profiles[0] || null));
          }}
        />
      )}
    </div>
  );
}