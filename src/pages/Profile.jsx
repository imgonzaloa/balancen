import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ChevronLeft, User, Scale, Ruler, LogOut, Save, Camera, Settings, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import StreakFire from "@/components/ui/StreakFire";
import { useTranslation } from "@/components/TranslationProvider";

export default function Profile() {
  const { t, changeLanguage } = useTranslation();
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
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

  const languageMutation = useMutation({
    mutationFn: async (language) => {
      changeLanguage(language);
      await base44.entities.UserProfile.update(profile.id, { language });
      return language;
    },
    onSuccess: (language) => {
      queryClient.invalidateQueries(["profile"]);
      toast.success(language === "es" ? "Idioma actualizado" : "Language updated");
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
      
      <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to={createPageUrl("Home")}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={20} className="text-white" />
            </Link>
            <h1 className="text-2xl font-bold text-white">{t("my_profile")}</h1>
          </div>
          {!editMode && (
            <Button
              onClick={() => setEditMode(true)}
              className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
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
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {profile?.display_name?.charAt(0) || user?.full_name?.charAt(0) || "U"}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 border-slate-900" />
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
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-4 text-center border border-amber-400/20">
                <div className="flex items-center justify-center mb-2">
                  <StreakFire streak={profile?.current_streak || 0} size="small" />
                </div>
                <p className="text-xs text-white/80 font-medium">{t("current_streak")}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                <p className="text-2xl font-bold text-teal-300">{profile?.longest_streak || 0}</p>
                <p className="text-xs text-white/80 mt-1 font-medium">{t("best_streak")}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                <p className="text-2xl font-bold text-white">{profile?.total_checkins || 0}</p>
                <p className="text-xs text-white/80 mt-1 font-medium">{t("total_checkins")}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Language Selector */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-lg mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Globe size={20} className="text-indigo-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">
                {profile?.language === "es" ? "Idioma" : "Language"}
              </h3>
              <p className="text-xs text-teal-200">
                {profile?.language === "es" ? "Selecciona tu idioma" : "Select your language"}
              </p>
            </div>
          </div>
          <Select
            value={profile?.language || "en"}
            onValueChange={(value) => languageMutation.mutate(value)}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">🇬🇧 English</SelectItem>
              <SelectItem value="es">🇪🇸 Español</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Settings Button */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Link to={createPageUrl("Settings")}>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-lg flex items-center justify-between hover:bg-white/20 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Settings size={20} className="text-teal-300" />
                </div>
                <div>
                  <p className="font-semibold text-white">{t("settings") || "Settings"}</p>
                  <p className="text-xs text-teal-200">{t("settings_desc") || "Language, notifications, privacy"}</p>
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
    </div>
  );
}