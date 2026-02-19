import React, { useState, useEffect } from "react";
import { Camera, Settings, LogOut, Edit2, Target, Sparkles, X, User as UserIcon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ProfileGoalsEdit from "@/components/profile/ProfileGoalsEdit";
import PhotoPicker from "@/components/PhotoPicker";
import { withTimeout } from "@/components/utils/fetchWithTimeout";
import ErrorFallback, { LoadingTimeout } from "@/components/ErrorFallback";
import { debugLogger } from "@/components/DebugOverlay";

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
  const { user, profile: cachedProfile, isInitialized, refreshProfile, setProfile: setContextProfile } = useAppState();
  const { t, lang, changeLanguage } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(cachedProfile);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showGoalsEdit, setShowGoalsEdit] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [error, setError] = useState(null);

  // Sync local profile state whenever context profile updates (e.g. initial server fetch arrives)
  useEffect(() => {
    if (cachedProfile) {
      setProfile(cachedProfile);
    }
  }, [cachedProfile]);

  // Cached photo for instant display before server fetch completes
  const cachedPhoto = user?.email
    ? (localStorage.getItem(`balancen_photo_${user.email}`) || localStorage.getItem(`balancen_avatar_${user.email}`))
    : null;
  const displayPhoto = profile?.profile_photo || profile?.avatar_url || cachedPhoto;

  // If no context profile yet and user exists, fetch directly (first load / hard refresh)
  useEffect(() => {
    if (!user?.email || cachedProfile) return;

    const timer = setTimeout(() => setLoadingTimeout(true), 4000);

    const fetchProfile = async () => {
      try {
        const profiles = await withTimeout(
          base44.entities.UserProfile.filter({ created_by: user.email }),
          4000
        );
        const p = profiles[0] || null;
        setProfile(p);
        if (setContextProfile) setContextProfile(p);
        if (p?.profile_photo || p?.avatar_url) {
          const url = p.profile_photo || p.avatar_url;
          localStorage.setItem(`balancen_photo_${user.email}`, url);
          localStorage.setItem(`balancen_avatar_${user.email}`, url);
        }
      } catch (err) {
        debugLogger.log('PROFILE_ERROR', err.message);
        setError(err);
      } finally {
        clearTimeout(timer);
      }
    };

    fetchProfile();
    return () => clearTimeout(timer);
  }, [user?.email, cachedProfile]);

  const loading = !isInitialized || (!!user?.email && !profile && !cachedProfile && !error);

  const handlePhotoUpload = async (file, preview) => {
    if (!file || !profile?.id) return;

    setUploadingPhoto(true);
    const prevPhoto = profile.profile_photo;

    try {
      setProfile({ ...profile, profile_photo: preview });

      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (file_url) {
        await base44.entities.UserProfile.update(profile.id, {
          profile_photo: file_url,
          avatar_url: file_url
        });

        await base44.auth.updateMe({ avatar_url: file_url });

        const updated = { ...profile, profile_photo: file_url, avatar_url: file_url };
        setProfile(updated);
        // Update context so other pages see the new photo immediately
        if (setContextProfile) setContextProfile(updated);
        // Persist to all cache keys so photo never disappears
        localStorage.setItem(`balancen_avatar_${user.email}`, file_url);
        localStorage.setItem(`balancen_photo_${user.email}`, file_url);
        toast.success(t('photo_updated'));
      }
    } catch (err) {
      console.error("Photo upload failed:", err);
      setProfile({ ...profile, profile_photo: prevPhoto });
      toast.error(t('upload_failed'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear ALL state
      localStorage.clear();
      sessionStorage.clear();
      
      // Logout
      await base44.auth.logout();
      
      // Force hard reload
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
      window.location.href = '/';
    }
  };

  const goalLabel = (key) => t(key) || t('not_defined');
  const intensityLabel = (key) => t(key) || t('not_defined');

  const handleRetry = React.useCallback(() => {
    setLoadingTimeout(false);
    setError(null);
    if (refreshProfile) refreshProfile();
  }, [refreshProfile]);

  if (loadingTimeout && loading) {
    return <LoadingTimeout onRetry={handleRetry} />;
  }

  // Never show infinite spinner — after 3s we already have loadingTimeout; also if cachedProfile arrived, skip spinner
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorFallback
        title={t('profile_load_error') || "Could not load profile"}
        message={error.message || t('check_internet')}
        errorCode="PROFILE_ERROR"
        onRetry={handleRetry}
      />
    );
  }

  // Anonymous user - show sign in prompt
  if (!user?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <UserIcon size={40} className="text-white/30" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-3">
            {t('create_your_profile')}
          </h2>
          <p className="text-white/60 mb-8">
            {t('sign_in_to_access_profile')}
          </p>
          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold"
          >
            {t('sign_in')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ minHeight: '100%', paddingBottom: '8px' }}>
      {/* Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-lg mx-auto px-4 pt-2 pb-8 relative z-10">
        <h1 className="text-3xl font-black text-white mb-2">
          {t('profile')}
        </h1>
        <p className="text-white/60 text-sm mb-8">
          {user?.email}
        </p>

        {/* Profile Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 mb-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-teal-400/30 to-emerald-400/30 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              {/* Clickable Profile Photo - Instagram Style */}
              <div 
                onClick={() => setPhotoPreview(true)}
                className="relative cursor-pointer group"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden relative ring-2 ring-white/20 group-hover:ring-teal-400 transition-all">
                    {displayPhoto ? (
                      <img src={displayPhoto} alt={t('profile')} className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }} loading="lazy" />
                    ) : (profile?.display_name?.charAt(0) || user?.full_name?.charAt(0)) ? (
                      <span>{profile?.display_name?.charAt(0) || user?.full_name?.charAt(0)}</span>
                    ) : (
                      <UserIcon size={32} className="text-white/80" />
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                      <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
              </div>
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
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-4 text-center border border-amber-400/30 flex flex-col items-center justify-center gap-1">
                <div className="text-3xl">🔥</div>
                <p className="text-2xl font-black text-amber-300">{profile?.current_streak || 0}</p>
                <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wide">{t('current_streak')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20 flex flex-col items-center justify-center gap-1">
                <p className="text-3xl font-black text-teal-300">{profile?.longest_streak || 0}</p>
                <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wide">{t('best_streak')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20 flex flex-col items-center justify-center gap-1">
                <p className="text-3xl font-black text-white">{profile?.total_checkins || 0}</p>
                <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wide">{t('total_checkins')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Section - FREE USERS: READ-ONLY */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">{t('your_goals')}</h3>
            {(profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator') && (
              <button
                onClick={() => setShowGoalsEdit(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:bg-teal-500/30 transition-colors"
              >
                <Target size={14} />
                <span className="text-xs font-semibold">{t('edit_goals')}</span>
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5">
              <span className="text-white/70 text-sm">{t('main_goal')}</span>
              <span className="font-semibold text-white">
                {goalLabel(profile?.primary_goal)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5">
              <span className="text-white/70 text-sm">{t('intensity')}</span>
              <span className="font-semibold text-white">
                {intensityLabel(profile?.intensity_level)}
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

        {/* AI Goals Assistant */}
        <button
          onClick={() => navigate(createPageUrl('GoalsAssistant'))}
          className="w-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-400/30 rounded-3xl p-5 mb-6 flex items-center justify-between hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-white flex items-center gap-2">
                {t('ai_goals_assistant') || 'AI Goals Assistant'}
                {(profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator') && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300">
                    Premium
                  </span>
                )}
              </p>
              <p className="text-xs text-purple-200">
                {t('ai_goals_desc') || 'Get personalized goal recommendations'}
              </p>
            </div>
          </div>
        </button>

        {/* Language Toggle */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Globe size={20} className="text-teal-300" />
              </div>
              <div>
                <p className="font-semibold text-white">{t('language')}</p>
                <p className="text-xs text-white/50">{lang === 'es' ? 'Español' : 'English'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${lang === 'en' ? 'bg-teal-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('es')}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${lang === 'es' ? 'bg-teal-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
              >
                ES
              </button>
            </div>
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
        <button
          onClick={handleLogout}
          className="w-full rounded-2xl py-4 bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          {t('logout')}
        </button>
      </div>

      {/* Photo Picker Modal */}
      {photoPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
          <div className="w-full bg-slate-900 rounded-t-3xl p-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">{t('upload_photo')}</h3>
              <button
                onClick={() => setPhotoPreview(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            <PhotoPicker
              onPhotoSelected={(file, preview) => {
                handlePhotoUpload(file, preview);
                setPhotoPreview(false);
              }}
              onRemovePreview={() => setPhotoPreview(false)}
            />
          </div>
        </div>
      )}

      {/* Goals Edit Modal - PREMIUM ONLY */}
      {showGoalsEdit && (profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator') && (
        <ProfileGoalsEdit
          profile={profile}
          onClose={() => setShowGoalsEdit(false)}
          onUpdate={() => {
            refreshProfile?.();
            base44.entities.UserProfile.filter({ created_by: user.email })
              .then(profiles => setProfile(profiles[0] || null));
          }}
        />
      )}
      </div>
      );
      }