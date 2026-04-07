import React, { useState, useEffect } from "react";
import { Camera, Settings, LogOut, Edit2, Target, User as UserIcon, Share2 } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";
import { useEntitlement } from "@/components/hooks/useEntitlement";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ProfileGoalsEdit from "@/components/profile/ProfileGoalsEdit";
import PhotoPickerModal from "@/components/profile/PhotoPickerModal";

export default function Profile() {
  const { user, profile: cachedProfile, isInitialized, refreshProfile, setProfile: setContextProfile } = useAppState();
  const { t, changeLanguage, lang } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(cachedProfile);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showGoalsEdit, setShowGoalsEdit] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [nameDraft, setNameDraft] = useState("");
  const [nameDraftSet, setNameDraftSet] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [featuredEmail, setFeaturedEmail] = useState("");

  useEffect(() => {
    if (cachedProfile) {
      setProfile(cachedProfile);
    }
  }, [cachedProfile]);

  useEffect(() => {
    if (!nameDraftSet && cachedProfile?.display_name) {
      setNameDraft(cachedProfile.display_name);
      setNameDraftSet(true);
    }
  }, [cachedProfile, nameDraftSet]);

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed.length < 2 || trimmed.length > 40) {
      toast.error(t('name_validation') || "Name must be 2–40 characters.");
      return;
    }
    if (!profile?.id) return;
    setSavingName(true);
    try {
      await base44.entities.UserProfile.update(profile.id, { display_name: trimmed });
      const updated = { ...profile, display_name: trimmed };
      setProfile(updated);
      if (setContextProfile) setContextProfile(updated);
      toast.success(t('name_updated') || "Name updated");
    } catch (err) {
      console.error("Failed to save name:", err);
      toast.error(t('update_failed') || "Update failed");
    } finally {
      setSavingName(false);
    }
  };

  const cachedPhoto = user?.email
    ? (localStorage.getItem(`balancen_photo_${user.email}`) || localStorage.getItem(`balancen_avatar_${user.email}`))
    : null;
  const displayPhoto = profile?.profile_photo || profile?.avatar_url || cachedPhoto;

  const loading = !isInitialized;

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
        if (setContextProfile) setContextProfile(updated);
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
      localStorage.clear();
      sessionStorage.clear();
      await base44.auth.logout();
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
      window.location.href = '/';
    }
  };

  const { isTrialActive, trialDaysLeft, isPremium } = useEntitlement(profile);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
    <PullToRefresh>
    <div className="relative" style={{ minHeight: '100%', paddingBottom: '8px' }}>
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
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white">{profile?.display_name || user?.full_name}</h2>
                <p className="text-teal-200 text-sm">{user?.email}</p>
              </div>
            </div>

            {/* Trial Badge */}
            {isTrialActive && (
              <div className="mb-4 px-3 py-2 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center gap-2">
                <span className="text-teal-300 text-xs font-bold">
                  Trial — {trialDaysLeft} {lang === 'es' ? 'días restantes' : lang === 'pt' ? 'dias restantes' : 'days left'}
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

        {/* Body Metrics Card */}
        {(profile?.height_cm || profile?.weight_kg) && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-sm">
                {{ es: "Métricas corporales", en: "Body metrics", pt: "Métricas corporais" }[lang] || "Body metrics"}
              </h3>
              <button
                onClick={() => navigate(createPageUrl('Settings'))}
                className="text-teal-300 text-xs font-semibold hover:text-teal-200 transition-colors"
              >
                {{ es: "Editar", en: "Edit", pt: "Editar" }[lang] || "Edit"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: { es: "Altura", en: "Height", pt: "Altura" }[lang],
                  value: profile?.height_cm ? `${profile.height_cm} cm` : "—",
                },
                {
                  label: { es: "Peso", en: "Weight", pt: "Peso" }[lang],
                  value: profile?.weight_kg ? `${profile.weight_kg} kg` : "—",
                },
                {
                  label: { es: "Edad", en: "Age", pt: "Idade" }[lang],
                  value: profile?.age ? `${profile.age} ${{ es: "años", en: "yrs", pt: "anos" }[lang]}` : "—",
                },
                {
                  label: { es: "Meta diaria", en: "Daily goal", pt: "Meta diária" }[lang],
                  value: profile?.calories_goal ? `${profile.calories_goal} kcal` : "—",
                },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/5 rounded-2xl px-4 py-3 border border-white/10">
                  <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-teal-200 font-bold text-base">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share Profile Button */}
        {profile?.display_name && (
          <button
            onClick={() => {
              const streakText = lang === 'es' ? 'días de racha' : lang === 'pt' ? 'dias de sequência' : 'day streak';
              const msg = lang === 'es' 
                ? `¡Mirá mi perfil en Balancen! 🍽️\n${profile.display_name} — ${profile.current_streak || 0} ${streakText} 🔥\n¡Únete gratis! https://balancen.app`
                : lang === 'pt'
                ? `Veja meu perfil no Balancen! 🍽️\n${profile.display_name} — ${profile.current_streak || 0} ${streakText} 🔥\nEntre grátis! https://balancen.app`
                : `Check out my Balancen profile! 🍽️\n${profile.display_name} — ${profile.current_streak || 0} ${streakText} 🔥\nJoin free! https://balancen.app`;
              if (navigator.share) {
                navigator.share({ text: msg }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(msg).catch(() => {});
                toast.success("Profile link copied!");
              }
            }}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white/70 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors mb-6"
          >
            <Share2 size={16} />
            {lang === 'es' ? 'Compartir perfil' : lang === 'pt' ? 'Compartilhar perfil' : 'Share profile'}
          </button>
        )}

        {/* Personal Info */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 mb-6">
          <h3 className="font-semibold text-white mb-4">{t('personal_info') || "Personal info"}</h3>
          <div className="space-y-2">
            <label className="text-white/60 text-xs font-semibold uppercase tracking-wide">{t('name') || "Name"}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={40}
                placeholder={t('enter_your_name') || "Enter your name"}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={handleSaveName}
                disabled={savingName || nameDraft.trim() === (profile?.display_name || "")}
                className="px-4 py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-40 rounded-xl text-white text-sm font-semibold transition-colors"
              >
                {savingName ? "..." : t('save') || "Save"}
              </button>
            </div>
          </div>
        </div>

        {/* Goals Section */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">{t('your_goals')}</h3>
            {isPremium && (
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
                {profile?.primary_goal ? t(profile.primary_goal) : t('not_defined')}
              </span>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 mb-6">
          <div className="grid grid-cols-3 gap-2">
            {[
              { code: 'es', flag: '🇪🇸', label: 'Español' },
              { code: 'en', flag: '🇺🇸', label: 'English' },
              { code: 'pt', flag: '🇧🇷', label: 'Português' },
            ].map(({ code, flag, label }) => (
              <button
                key={code}
                onClick={async () => {
                  if (lang === code) return;
                  await changeLanguage(code);
                }}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all ${
                  lang === code
                    ? 'bg-teal-500/20 border-teal-400/60 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <span className="text-2xl">{flag}</span>
                <span className="text-xs font-semibold leading-tight text-center">{label}</span>
              </button>
            ))}
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

        {/* Owner Controls */}
        {profile?.role === 'owner' && (
          <div className="border-t border-white/10 mt-6 pt-4">
            <h3 className="text-white/40 text-xs uppercase tracking-wider mb-3 font-semibold">Owner Controls</h3>
            <input
              type="email"
              value={featuredEmail}
              onChange={(e) => setFeaturedEmail(e.target.value)}
              placeholder="Enter user email..."
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none focus:border-teal-500"
            />
            <button
              onClick={async () => {
                try {
                  const profiles = await base44.entities.UserProfile.filter({ created_by: featuredEmail });
                  if (profiles?.[0]) {
                    await base44.entities.UserProfile.update(profiles[0].id, {
                      is_featured: !profiles[0].is_featured
                    });
                    toast.success(profiles[0].is_featured ? "Removed from Featured" : "Marked as Featured Athlete ⭐");
                    setFeaturedEmail("");
                  } else {
                    toast.error("User not found");
                  }
                } catch (_) {
                  toast.error("Error updating user");
                }
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl px-4 py-3 mt-2 hover:from-amber-600 hover:to-orange-600 transition-colors"
            >
              ⭐ Toggle Featured
            </button>
            <p className="text-white/30 text-xs mt-2">Featured users appear in the Discovery feed</p>
          </div>
        )}
      </div>

      {/* Photo Picker Modal */}
      <PhotoPickerModal
        isOpen={!!photoPreview}
        onClose={() => setPhotoPreview(false)}
        anchorRef={React.useRef(null)}
        onSelectFile={(file) => {
          const reader = new FileReader();
          reader.onload = (e) => handlePhotoUpload(file, e.target.result);
          reader.readAsDataURL(file);
          setPhotoPreview(false);
        }}
      />

      {/* Goals Edit Modal */}
      {showGoalsEdit && isPremium && (
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
    </PullToRefresh>
  );
}