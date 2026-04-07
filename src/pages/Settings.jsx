import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from "@/components/TranslationProvider";
import { motion } from "framer-motion";
import { ChevronLeft, Sparkles, Crown, Bell, Shield, Globe, Zap, UserPlus, Users, Bug, Trash2, Scale, FileText, AlertTriangle, Mail, ExternalLink, Activity, Star, MessageSquare } from "lucide-react";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import MobileSelect from "@/components/MobileSelectWrapper";
import BodyGoalsFields from "@/components/settings/BodyGoalsFields";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAIDisclaimer, setShowAIDisclaimer] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState("suggestion");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
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
      toast.success(t('settings_updated'));
    },
  });

  const handleLanguageChange = async (newLang) => {
    if (newLang !== "en" && newLang !== "es" && newLang !== "pt") return;
    // changeLanguage handles i18n, single localStorage key, and DB sync
    await changeLanguage(newLang);
    queryClient.invalidateQueries(['profile']);
    toast.success(newLang === 'es' ? 'Idioma actualizado' : newLang === 'pt' ? 'Idioma atualizado' : 'Language updated');
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

      <div className="max-w-lg mx-auto px-4 pb-24 pt-4 relative z-10">
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
        ) : !profile?.is_premium && profile?.role !== "owner" && profile?.role !== "collaborator" ? (
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

        {/* Daily Reminders */}
        <motion.div
          className="relative overflow-hidden rounded-3xl p-5 mb-4 bg-white/10 backdrop-blur-xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <Bell size={20} className="text-teal-300" />
              </div>
              <div>
                <Label className="text-white font-semibold">{lang === 'es' ? 'Recordatorios diarios' : lang === 'pt' ? 'Lembretes diários' : 'Daily reminders'}</Label>
                  <p className="text-xs text-white/60">{t('gentle_reminders')}</p>
                </div>
              </div>
              <Switch
                checked={profile?.daily_reminders_enabled ?? true}
                onCheckedChange={(checked) => handleToggle('daily_reminders_enabled', checked)}
              />
            </div>

            {profile?.daily_reminders_enabled && (
              <div className="pl-13 pt-3 border-t border-white/10">
                <Label className="text-white/90 text-sm mb-2 block">
                  {lang === 'es' ? 'Hora' : lang === 'pt' ? 'Horário' : 'Time'}
                </Label>
                <input
                  type="time"
                  value={profile?.daily_reminders_time || '09:00'}
                  onChange={(e) => {
                    updateMutation.mutate({ daily_reminders_time: e.target.value });
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-teal-300 outline-none text-base"
                />
              </div>
            )}
          </div>
        </motion.div>



        {/* Body & Goals */}
        <motion.div
          className="relative overflow-hidden rounded-3xl p-5 mb-4 bg-white/10 backdrop-blur-xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.33 }}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-teal-400/20 to-emerald-400/20 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <Activity size={20} className="text-teal-300" />
              </div>
              <div className="flex-1">
                <Label className="text-white font-semibold">
                   {lang === 'es' ? 'Cuerpo y Objetivos' : lang === 'pt' ? 'Corpo e Objetivos' : 'Body & Goals'}
                </Label>
                <p className="text-xs text-white/60">
                   {lang === 'es' ? 'Personaliza tu plan calórico' : lang === 'pt' ? 'Personalize seu plano calórico' : 'Personalize your calorie plan'}
                </p>
              </div>
            </div>

            <BodyGoalsFields profile={profile} updateMutation={updateMutation} lang={lang} />
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

            <div className="space-y-1.5">
              <Label className="text-white/80 text-xs block">
                {t('daily_calories_limit')}
              </Label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="2000"
                defaultValue={profile?.calories_goal || ""}
                onBlur={(e) => updateMutation.mutate({ calories_goal: parseInt(e.target.value) || null })}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-teal-300 outline-none text-base"
              />
              <p className="text-white/40 text-xs leading-relaxed">
                {{ es: "Calculado automáticamente según tu perfil. Puedes ajustarlo.", en: "Auto-calculated from your profile. You can adjust it.", pt: "Calculado automaticamente. Você pode ajustá-lo." }[lang] || "Auto-calculated from your profile. You can adjust it."}
              </p>
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
            
            <MobileSelect
              value={lang}
              onValueChange={handleLanguageChange}
              placeholder={t('select_language')}
              label={t('language')}
              triggerClassName="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl"
              valueClassName="text-white font-semibold"
            >
              <SelectItem value="en">🇬🇧 English</SelectItem>
              <SelectItem value="es">🇪🇸 Español</SelectItem>
            </MobileSelect>
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
                   {lang === "es" ? "Compartir comidas" : lang === "pt" ? "Compartilhar refeições" : "Share meals"}
                </Label>
                <MobileSelect
                  value={profile?.share_meals || "private"}
                  onValueChange={(value) => handleToggle("share_meals", value)}
                  placeholder={t('privacy')}
                  label={lang === "es" ? "Privacidad de comidas" : lang === "pt" ? "Privacidade das refeições" : "Meal privacy"}
                  triggerClassName="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl"
                  valueClassName="text-white font-semibold"
                >
                  <SelectItem value="private">
                    🔒 {t('private_mode')}
                  </SelectItem>
                  <SelectItem value="friends">
                    👥 {t('friends_mode')}
                  </SelectItem>
                  <SelectItem value="groups">
                    🏢 {t('groups_mode')}
                  </SelectItem>
                </MobileSelect>
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-white/90 text-sm">
                   {lang === "es" ? "Mostrar macros" : lang === "pt" ? "Mostrar macros" : "Show macros"}
                </Label>
                <Switch
                  checked={profile?.share_macros ?? false}
                  onCheckedChange={(checked) => handleToggle("share_macros", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-white/90 text-sm">
                   {lang === "es" ? "Mostrar calorías" : lang === "pt" ? "Mostrar calorias" : "Show calories"}
                </Label>
                <Switch
                  checked={profile?.share_calories ?? false}
                  onCheckedChange={(checked) => handleToggle("share_calories", checked)}
                />
              </div>
            </div>
          </div>
        </motion.div>



        {/* ADMIN TOOLS - OWNER ONLY */}
        {(profile?.role === "owner" || user?.email?.toLowerCase() === "imgonzaloa@gmail.com") && (
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
                className="relative overflow-hidden rounded-3xl p-5 mb-4 bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                      <UserPlus size={20} className="text-teal-300" />
                    </div>
                    <div>
                      <Label className="text-white font-semibold">{t('invite_collaborators')}</Label>
                      <p className="text-xs text-white/60">{t('grant_free_premium')}</p>
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



        {/* Logout Button */}
         <Button
           onClick={async () => {
             try {
               localStorage.clear();
               sessionStorage.clear();
               queryClient.clear();
               await base44.auth.logout();
               window.location.href = '/';
             } catch (error) {
               console.error('Logout error:', error);
               window.location.href = '/';
             }
           }}
           className="w-full mt-6 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-200 font-semibold transition-all"
         >
           {t('logout')}
         </Button>

         {/* Privacy & Data Section */}
         <motion.div
           className="mt-8 mb-4"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.7 }}
         >
           <div className="flex items-center gap-2 mb-4">
             <Shield size={18} className="text-teal-300" />
             <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
               {lang === 'es' ? 'Privacidad y Datos' : lang === 'pt' ? 'Privacidade e Dados' : 'Privacy & Data'}
             </h2>
           </div>

           <div className="rounded-3xl overflow-hidden border border-white/10 divide-y divide-white/10 space-y-0">
             {/* Privacy Policy Link */}
             <Link to={createPageUrl("PrivacyPolicy")}>
               <div className="flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 transition-all">
                 <div className="flex items-center gap-3">
                   <Shield size={18} className="text-teal-300" />
                   <span className="text-white/80 text-sm font-medium">
                     {lang === 'es' ? 'Política de Privacidad' : lang === 'pt' ? 'Política de Privacidade' : 'Privacy Policy'}
                   </span>
                 </div>
                 <ExternalLink size={14} className="text-white/30" />
               </div>
             </Link>

             {/* Data Processing Info */}
             <div className="px-5 py-4 bg-white/5">
               <p className="text-white/60 text-xs leading-relaxed">
                 <span className="block font-semibold text-white/80 mb-1">
                   {lang === 'es' ? 'Datos procesados por:' : lang === 'pt' ? 'Dados processados por:' : 'Data processed by:'}
                 </span>
                 Base44, Anthropic AI
               </p>
             </div>

             {/* Data Deletion Info */}
             <div className="px-5 py-4 bg-white/5">
               <p className="text-white/60 text-xs leading-relaxed">
                 {lang === 'es'
                   ? 'Puedes eliminar todos tus datos desde la configuración de tu cuenta.'
                   : lang === 'pt'
                   ? 'Você pode deletar todos os seus dados nas configurações da sua conta.'
                   : 'You can delete all your data from your account settings.'}
               </p>
             </div>
           </div>
         </motion.div>

        {/* Feedback Section */}
        <motion.div
          className="mt-8 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.72 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={18} className="text-teal-300" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              {{ es: 'Tu opinión', en: 'Your feedback', pt: 'Sua opinião' }[lang] || 'Your feedback'}
            </h2>
          </div>

          <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-4">
            {/* Star rating */}
            <div>
              <p className="text-white/60 text-xs font-semibold mb-3">
                {{ es: '¿Cómo calificarías Balancen?', en: 'How would you rate Balancen?', pt: 'Como você avaliaria o Balancen?' }[lang]}
              </p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className="transition-transform active:scale-90"
                  >
                    <Star
                      size={32}
                      className={star <= feedbackRating ? "text-amber-400 fill-amber-400" : "text-white/20"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Category pills */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'bug', label: { es: 'Bug', en: 'Bug', pt: 'Bug' } },
                { value: 'suggestion', label: { es: 'Sugerencia', en: 'Suggestion', pt: 'Sugestão' } },
                { value: 'praise', label: { es: 'Elogio', en: 'Praise', pt: 'Elogio' } },
              ].map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setFeedbackCategory(cat.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                    feedbackCategory === cat.value
                      ? 'bg-teal-500 border-teal-400 text-white'
                      : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {cat.label[lang] || cat.label.en}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div>
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value.slice(0, 500))}
                placeholder={{ es: 'Contanos qué mejorarías o qué te encanta de Balancen...', en: 'Tell us what you\'d improve or love about Balancen...', pt: 'Conte-nos o que melhoraria ou ama no Balancen...' }[lang]}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm focus:border-teal-400 focus:outline-none resize-none"
              />
              <p className="text-white/30 text-xs text-right mt-1">{feedbackMessage.length}/500</p>
            </div>

            {/* Submit button */}
            <Button
              disabled={feedbackRating === 0 && feedbackMessage.trim() === "" || feedbackSubmitting}
              onClick={async () => {
                setFeedbackSubmitting(true);
                try {
                  await base44.entities.Feedback.create({
                    user_email: user?.email || "",
                    rating: feedbackRating,
                    category: feedbackCategory,
                    message: feedbackMessage.trim(),
                    lang,
                    app_version: "1.0.0",
                  });
                  toast.success({ es: '¡Gracias por tu feedback!', en: 'Thanks for your feedback!', pt: 'Obrigado pelo seu feedback!' }[lang]);
                  setFeedbackRating(0);
                  setFeedbackMessage("");
                  setFeedbackCategory("suggestion");
                } catch (err) {
                  toast.error(lang === 'es' ? 'Error al enviar' : lang === 'pt' ? 'Erro ao enviar' : 'Error sending feedback');
                } finally {
                  setFeedbackSubmitting(false);
                }
              }}
              className="w-full h-12 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-semibold disabled:opacity-40 transition-all"
            >
              {{ es: 'Enviar feedback', en: 'Send feedback', pt: 'Enviar feedback' }[lang]}
            </Button>
          </div>
        </motion.div>

         {/* Legal & Support Section */}
        <motion.div
          className="mt-8 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Scale size={18} className="text-white/40" />
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              {lang === 'es' ? 'Legal y Soporte' : lang === 'pt' ? 'Legal e Suporte' : 'Legal & Support'}
            </h2>
          </div>

          <div className="rounded-3xl overflow-hidden border border-white/10 divide-y divide-white/10">
            {/* Contact Support */}
            <button
              aria-label="Contact Support"
              onClick={() => {
                const body = encodeURIComponent(
                  "Hi Balancen team,\n\nI need help with: \n\nAccount email: \nDevice: \nApp version: "
                );
                const subject = encodeURIComponent("Balancen Support");
                const mailto = `mailto:hello@balancen.app?subject=${subject}&body=${body}`;
                window.location.href = mailto;
                // Show fallback modal after a short delay in case no mail app is available
                setTimeout(() => setShowSupportModal(true), 1500);
              }}
              className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-teal-300" />
                <div>
                  <span className="text-white/80 text-sm font-medium block">
                     {lang === 'es' ? 'Contactar Soporte' : lang === 'pt' ? 'Contatar Suporte' : 'Contact Support'}
                   </span>
                  <span className="text-white/40 text-xs">hello@balancen.app</span>
                </div>
              </div>
              <ChevronLeft size={16} className="text-white/30 rotate-180" />
            </button>

            {/* Terms of Service */}
            <a href="https://balancen.app/terms-of-service/" target="_blank" rel="noopener noreferrer">
              <div className="flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-teal-300" />
                  <span className="text-white/80 text-sm font-medium">
                     {lang === 'es' ? 'Términos de Servicio' : lang === 'pt' ? 'Termos de Serviço' : 'Terms of Service'}
                   </span>
                </div>
                <ExternalLink size={14} className="text-white/30" />
              </div>
            </a>

            {/* AI Disclaimer */}
            <button
              onClick={() => setShowAIDisclaimer(true)}
              className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-amber-300" />
                <span className="text-white/80 text-sm font-medium">
                   {lang === 'es' ? 'Aviso sobre IA' : lang === 'pt' ? 'Aviso de IA' : 'AI Disclaimer'}
                </span>
              </div>
              <ChevronLeft size={16} className="text-white/30 rotate-180" />
            </button>

            {/* Delete Account */}
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <Trash2 size={18} className="text-white/40" />
                <span className="text-white/60 text-sm font-medium">
                   {lang === 'es' ? 'Eliminar cuenta' : lang === 'pt' ? 'Excluir conta' : 'Delete Account'}
                </span>
              </div>
              <ChevronLeft size={16} className="text-white/30 rotate-180" />
            </button>
          </div>
        </motion.div>

        {/* AI Disclaimer Modal */}
        {showAIDisclaimer && (
          <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-white/20 rounded-3xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-amber-300" />
                </div>
                <h3 className="text-white font-bold text-lg">
                   {lang === 'es' ? 'Aviso sobre IA' : lang === 'pt' ? 'Aviso de IA' : 'AI Disclaimer'}
                </h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                 {lang === 'es'
                   ? 'Balancen proporciona sugerencias generadas por IA sobre fitness y nutrición con fines informativos y de estilo de vida únicamente. Esto no es consejo médico y no reemplaza la consulta con profesionales de la salud calificados.'
                   : lang === 'pt'
                   ? 'Balancen fornece sugestões geradas por IA sobre fitness e nutrição apenas para fins informativos e de estilo de vida. Isto não é aconselhamento médico e não substitui a consulta com profissionais de saúde qualificados.'
                   : 'Balancen provides AI-generated fitness and nutrition suggestions for informational and lifestyle purposes only. This is not medical advice and does not replace consultation with qualified healthcare professionals.'}
               </p>
              <p className="text-white/60 text-xs leading-relaxed mb-6 border-t border-white/10 pt-4">
                {lang === 'es'
                  ? 'Análisis de comidas impulsado por Anthropic Claude Vision AI.'
                  : lang === 'pt'
                  ? 'Análise de refeições alimentada por Anthropic Claude Vision AI.'
                  : 'Food analysis powered by Anthropic Claude Vision AI.'}
              </p>
              <Button
                onClick={() => setShowAIDisclaimer(false)}
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                {lang === 'es' ? 'Entendido' : lang === 'pt' ? 'Entendido' : 'Got it'}
              </Button>
            </motion.div>
          </div>
        )}

        <DeleteAccountDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          email={user?.email}
        />

        {/* Support Fallback Modal */}
        {showSupportModal && (
          <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-white/20 rounded-3xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                  <Mail size={20} className="text-teal-300" />
                </div>
                <h3 className="text-white font-bold text-lg">
                   {lang === 'es' ? 'Contactar Soporte' : lang === 'pt' ? 'Contatar Suporte' : 'Contact Support'}
                </h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                {lang === 'es' ? 'Escríbenos a ' : lang === 'pt' ? 'Envie um email para ' : 'Email us at '}
                <span className="text-teal-300 font-medium">hello@balancen.app</span>
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText('hello@balancen.app');
                    toast.success(lang === 'es' ? 'Copiado' : lang === 'pt' ? 'Copiado' : 'Copied');
                    setShowSupportModal(false);
                  }}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white"
                >
                  {lang === 'es' ? 'Copiar email' : lang === 'pt' ? 'Copiar email' : 'Copy email'}
                </Button>
                <Button
                  onClick={() => setShowSupportModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  {lang === 'es' ? 'Cerrar' : lang === 'pt' ? 'Fechar' : 'Close'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* About Section */}
        <motion.div
          className="relative overflow-hidden rounded-3xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 text-center mt-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center">
              <span className="text-3xl font-black text-white">B</span>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Balancen</p>
              <p className="text-white/40 text-xs mb-1">
                {lang === 'es' ? 'Versión' : lang === 'pt' ? 'Versão' : 'Version'} 1.0.0
              </p>
              <button
                onClick={() => {
                  const body = encodeURIComponent("Hi Balancen team,\n\nI need help with: \n\nAccount email: \nDevice: \nApp version: 1.0.0");
                  const subject = encodeURIComponent("Balancen Support");
                  window.location.href = `mailto:hello@balancen.app?subject=${subject}&body=${body}`;
                  setTimeout(() => setShowSupportModal(true), 1500);
                }}
                className="text-teal-400 text-xs underline underline-offset-2 mt-1"
              >
                hello@balancen.app
              </button>
            </div>
            <p className="text-white/25 text-[10px] mt-1">
              {lang === 'es'
                 ? 'Balancen ofrece sugerencias de fitness, nutrición y bienestar únicamente para fines informativos. No es consejo médico.'
                 : lang === 'pt'
                 ? 'Balancen oferece sugestões de fitness, nutrição e bem-estar apenas para fins informativos. Não é aconselhamento médico.'
                 : 'Balancen provides fitness, nutrition, and wellness suggestions for informational purposes only. Not medical advice.'}
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}