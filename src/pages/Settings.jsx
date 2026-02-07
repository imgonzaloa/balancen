import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from "@/components/TranslationProvider";
import { motion } from "framer-motion";
import { ChevronLeft, Sparkles, Crown, Bell, Shield, Globe, Zap, UserPlus, Users, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();
  const { changeLanguage, lang, t } = useTranslation();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.UserProfile.update(profile.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["profile", user?.email]);
      toast.success("Settings updated");
    },
  });

  const handleLanguageChange = async (newLang) => {
    if (newLang !== "en" && newLang !== "es") return;
    
    // 1. Change language immediately
    await changeLanguage(newLang);
    
    // 2. Save to user profile
    if (profile?.id) {
      await base44.entities.UserProfile.update(profile.id, { language: newLang });
    }
    
    // 3. Show success message
    toast.success(t('language_updated'));
  };

  const handleToggle = (field, value) => {
    updateMutation.mutate({ [field]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute -bottom-8 right-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24 pt-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to={createPageUrl("Profile")}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('settings')}</h1>
          </div>
        </div>

        {/* Premium Status */}
        {profile?.is_premium && profile?.role !== "owner" ? (
          <motion.div
            className="relative overflow-hidden rounded-3xl p-5 mb-6 bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 relative z-10">
              <Crown size={32} className="text-white" />
              <div>
                <p className="text-white font-bold text-lg">{t('premium_active')}</p>
                <p className="text-amber-100 text-sm">{t('all_features_unlocked')}</p>
              </div>
            </div>
          </motion.div>
        ) : profile?.role !== "owner" && !profile?.is_premium ? (
          <Link to={createPageUrl("Premium")}>
            <motion.div
              className="relative overflow-hidden rounded-3xl p-5 mb-6 bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Crown size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold">{t('upgrade_to_premium_title')}</p>
                    <p className="text-teal-200 text-sm">{t('unlock_all_features')}</p>
                  </div>
                </div>
                <ChevronLeft size={20} className="text-white rotate-180" />
              </div>
            </motion.div>
          </Link>
        ) : null}

        {/* AI Recommendations */}
        <motion.div
          className="relative overflow-hidden rounded-3xl p-5 mb-4 bg-white/10 backdrop-blur-xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Sparkles size={20} className="text-purple-300" />
              </div>
              <div>
                <Label className="text-white font-semibold">{t('ai_recommendations')}</Label>
                <p className="text-xs text-white/60">{t('personalized_tips')}</p>
              </div>
            </div>
            <Switch
              checked={profile?.ai_recommendations_enabled ?? true}
              onCheckedChange={(checked) => handleToggle("ai_recommendations_enabled", checked)}
            />
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          className="relative overflow-hidden rounded-3xl p-5 mb-4 bg-white/10 backdrop-blur-xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <Bell size={20} className="text-teal-300" />
              </div>
              <div>
                <Label className="text-white font-semibold">{t('notifications')}</Label>
                <p className="text-xs text-white/60">{t('gentle_reminders')}</p>
              </div>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </motion.div>



        {/* Goals & Targets */}
        <motion.div
          className="relative overflow-hidden rounded-3xl p-5 mb-4 bg-white/10 backdrop-blur-xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-orange-400/30 to-red-400/30 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Zap size={20} className="text-orange-300" />
              </div>
              <div className="flex-1">
                <Label className="text-white font-semibold">{t('goals_targets')}</Label>
                <p className="text-xs text-white/60">{t('set_daily_goals')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-white text-sm mb-2 block">{t('daily_calories_limit')}</Label>
                <input
                  type="number"
                  value={profile?.calories_goal || ""}
                  onChange={(e) => updateMutation.mutate({ calories_goal: parseInt(e.target.value) || null })}
                  className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white focus:border-orange-300 outline-none"
                  placeholder={lang === "es" ? "Opcional (ej.: 2000)" : "Optional - e.g., 2000"}
                />
                <p className="text-xs text-white/40 mt-1">{t('optional_leave_empty')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Language */}
        <motion.div
          className="relative overflow-hidden rounded-3xl p-5 mb-4 bg-white/10 backdrop-blur-xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-indigo-400/30 to-blue-400/30 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Globe size={20} className="text-indigo-300" />
              </div>
              <div className="flex-1">
                <Label className="text-white font-semibold">{t('language')}</Label>
                <p className="text-xs text-white/60">{t('select_language')}</p>
              </div>
            </div>
            
            <Select
              value={lang}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue>
                  {lang === "es" ? "🇪🇸 Español" : "🇬🇧 English"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="es">🇪🇸 Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Privacy & Social Sharing */}
        <motion.div
          className="relative overflow-hidden rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Shield size={20} className="text-emerald-300" />
              </div>
              <div>
                <Label className="text-white font-semibold">{t('privacy')}</Label>
                <p className="text-xs text-white/60">{t('data_encrypted')}</p>
              </div>
            </div>
            
            {/* Social sharing controls */}
            <div className="pl-13 space-y-3 pt-3 border-t border-white/10">
              <div>
                <Label className="text-white text-sm mb-2 block">
                  {lang === "es" ? "Compartir comidas" : "Share meals"}
                </Label>
                <Select
                  value={profile?.share_meals || "private"}
                  onValueChange={(value) => handleToggle("share_meals", value)}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      {lang === "es" ? "🔒 Privado" : "🔒 Private"}
                    </SelectItem>
                    <SelectItem value="friends">
                      {lang === "es" ? "👥 Amigos" : "👥 Friends"}
                    </SelectItem>
                    <SelectItem value="groups">
                      {lang === "es" ? "👥 Grupos" : "👥 Groups"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-white text-sm">
                  {lang === "es" ? "Compartir macros" : "Share macros"}
                </Label>
                <Switch
                  checked={profile?.share_macros ?? false}
                  onCheckedChange={(checked) => handleToggle("share_macros", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-white text-sm">
                  {lang === "es" ? "Compartir calorías" : "Share calories"}
                </Label>
                <Switch
                  checked={profile?.share_calories ?? false}
                  onCheckedChange={(checked) => handleToggle("share_calories", checked)}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Delete Account */}
        <motion.button
          onClick={() => setShowDeleteDialog(true)}
          className="w-full relative overflow-hidden rounded-3xl p-5 mb-6 bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-xl border border-red-500/30 hover:from-red-500/30 hover:to-red-600/30 transition-all active:scale-95"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Trash2 size={20} className="text-red-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">{lang === 'es' ? 'Eliminar Cuenta' : 'Delete Account'}</p>
              <p className="text-xs text-red-300">{lang === 'es' ? 'Esta acción es irreversible' : 'This action is permanent'}</p>
            </div>
          </div>
        </motion.button>

        {/* ADMIN TOOLS - OWNER ONLY */}
        {profile?.role === "owner" && user?.email?.toLowerCase() === "imgonzaloa@gmail.com" && (
          <>
            <motion.div
              className="mt-8 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Crown size={20} className="text-amber-400" />
                <h2 className="text-lg font-bold text-white">{t('admin_tools')}</h2>
              </div>
            </motion.div>

            {/* Invite Collaborators */}
            <Link to={createPageUrl("InviteCollaborators")}>
              <motion.div
                className="relative overflow-hidden rounded-3xl p-5 mb-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl border border-amber-400/30 hover:from-amber-500/30 hover:to-orange-500/30 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <UserPlus size={20} className="text-white" />
                    </div>
                    <div>
                      <Label className="text-white font-semibold">{t('invite_collaborators')}</Label>
                      <p className="text-xs text-amber-200">{t('grant_free_premium')}</p>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-white rotate-180" />
                </div>
              </motion.div>
            </Link>

            {/* User Management */}
            <Link to={createPageUrl("UserManagement")}>
              <motion.div
                className="relative overflow-hidden rounded-3xl p-5 mb-4 bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Users size={20} className="text-purple-300" />
                    </div>
                    <div>
                      <Label className="text-white font-semibold">{t('user_management')}</Label>
                      <p className="text-xs text-white/60">{t('view_manage_users')}</p>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-white rotate-180" />
                </div>
              </motion.div>
            </Link>
          </>
        )}

        {/* Delete Account Dialog */}
        <DeleteAccountDialog 
          isOpen={showDeleteDialog} 
          onClose={() => setShowDeleteDialog(false)}
          email={user?.email}
        />
      </div>
    </div>
  );
}