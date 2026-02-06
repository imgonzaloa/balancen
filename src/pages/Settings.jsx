import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTranslation } from "@/components/TranslationProvider";
import { motion } from "framer-motion";
import { ChevronLeft, Watch, Sparkles, Crown, Bell, Shield, Globe, Zap, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Settings() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const { changeLanguage, lang } = useTranslation();

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

  const handleLanguageChange = (language) => {
    changeLanguage(language);
    if (profile?.id) {
      updateMutation.mutate({ language });
    }
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

      <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to={createPageUrl("Profile")}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>

        {/* Premium Status */}
        {profile?.is_premium ? (
          <motion.div
            className="relative overflow-hidden rounded-3xl p-5 mb-6 bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 relative z-10">
              <Crown size={32} className="text-white" />
              <div>
                <p className="text-white font-bold text-lg">Premium Active</p>
                <p className="text-amber-100 text-sm">All features unlocked</p>
              </div>
            </div>
          </motion.div>
        ) : (
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
                    <p className="text-white font-bold">Upgrade to Premium</p>
                    <p className="text-teal-200 text-sm">Unlock all features</p>
                  </div>
                </div>
                <ChevronLeft size={20} className="text-white rotate-180" />
              </div>
            </motion.div>
          </Link>
        )}

        {/* Wearable Integration */}
        <motion.div
          className="relative overflow-hidden rounded-3xl p-5 mb-4 bg-white/10 backdrop-blur-xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Watch size={20} className="text-blue-300" />
              </div>
              <div className="flex-1">
                <Label className="text-white font-semibold">Connect device</Label>
                <p className="text-xs text-white/60">Automatic data sync</p>
              </div>
              <Switch
                checked={profile?.wearable_connected || false}
                onCheckedChange={(checked) => handleToggle("wearable_connected", checked)}
              />
            </div>

            {profile?.wearable_connected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4"
              >
                <Label className="text-white text-sm mb-2 block">Device type</Label>
                <Select
                  value={profile?.wearable_type || ""}
                  onValueChange={(value) => updateMutation.mutate({ wearable_type: value })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apple_health">Apple Health</SelectItem>
                    <SelectItem value="google_fit">Google Fit</SelectItem>
                    <SelectItem value="garmin">Garmin</SelectItem>
                    <SelectItem value="whoop">Whoop</SelectItem>
                    <SelectItem value="fitbit">Fitbit</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-white/40 mt-2">
                  * Manual entry available. Native integration coming soon.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

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
                <Label className="text-white font-semibold">AI Recommendations</Label>
                <p className="text-xs text-white/60">Personalized tips</p>
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
                <Label className="text-white font-semibold">Notifications</Label>
                <p className="text-xs text-white/60">Gentle reminders</p>
              </div>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </motion.div>

        {/* Invite Collaborators */}
        <Link to={createPageUrl("InviteCollaborators")}>
          <motion.div
            className="relative overflow-hidden rounded-3xl p-5 mb-4 bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.33 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                  <UserPlus size={20} className="text-teal-300" />
                </div>
                <div>
                  <Label className="text-white font-semibold">Invite Collaborators</Label>
                  <p className="text-xs text-white/60">Give free access to others</p>
                </div>
              </div>
              <ChevronLeft size={20} className="text-white rotate-180" />
            </div>
          </motion.div>
        </Link>

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
                <Label className="text-white font-semibold">Goals & Targets</Label>
                <p className="text-xs text-white/60">Set your daily goals</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-white text-sm mb-2 block">Daily Steps Target</Label>
                <input
                  type="number"
                  value={profile?.steps_goal || 8000}
                  onChange={(e) => updateMutation.mutate({ steps_goal: parseInt(e.target.value) || 8000 })}
                  className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white focus:border-orange-300 outline-none"
                  placeholder="8000"
                />
              </div>

              <div>
                <Label className="text-white text-sm mb-2 block">Daily Calories Limit</Label>
                <input
                  type="number"
                  value={profile?.calories_goal || ""}
                  onChange={(e) => updateMutation.mutate({ calories_goal: parseInt(e.target.value) || null })}
                  className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white focus:border-orange-300 outline-none"
                  placeholder="Optional - e.g., 2000"
                />
                <p className="text-xs text-white/40 mt-1">Optional - leave empty if not tracking</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label className="text-white text-sm">Auto-adjust calories goal</Label>
                  <p className="text-xs text-white/60">Reduce by 50 kcal when goal met</p>
                </div>
                <Switch
                  checked={profile?.auto_adjust_calories_goal || false}
                  onCheckedChange={(checked) => handleToggle("auto_adjust_calories_goal", checked)}
                />
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
                <Label className="text-white font-semibold">Language</Label>
                <p className="text-xs text-white/60">Select your language</p>
              </div>
            </div>
            
            <Select
              value={lang || "en"}
              onValueChange={(value) => {
                handleLanguageChange(value);
              }}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select language">
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

        {/* Privacy */}
        <motion.div
          className="relative overflow-hidden rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Shield size={20} className="text-emerald-300" />
            </div>
            <div>
              <Label className="text-white font-semibold">Privacy</Label>
              <p className="text-xs text-white/60">
                Your data is encrypted and secure
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}