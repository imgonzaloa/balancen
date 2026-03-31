import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ChevronLeft, Crown, Users, Search, CheckCircle, XCircle, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";

const OWNER_EMAIL = "imgonzaloa@gmail.com";

export default function UserManagement() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

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

  // OWNER-ONLY ACCESS CHECK
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() && profile?.role === "owner";
  
  if (user && profile && !isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center px-5">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('forbidden')}</h1>
          <p className="text-white/60 mb-6">{t('access_denied_owner')}</p>
          <Link to={createPageUrl("Settings")}>
            <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              {t('go_back')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["allProfiles"],
    queryFn: () => base44.entities.UserProfile.list(),
    enabled: profile?.role === "owner",
  });

  const { data: collaborators = [] } = useQuery({
    queryKey: ["collaborators"],
    queryFn: () => base44.entities.Collaborator.list(),
    enabled: profile?.role === "owner",
  });

  const togglePremiumMutation = useMutation({
    mutationFn: async ({ profileId, newStatus }) => {
      return base44.entities.UserProfile.update(profileId, {
        is_premium: newStatus,
        premium_status: newStatus ? "active" : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["allProfiles"]);
      toast.success(t('premium_status_updated'));
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ profileId, newStatus }) => {
      return base44.entities.UserProfile.update(profileId, { is_featured: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["allProfiles"]);
      toast.success("Featured status updated");
    },
  });

  const filteredProfiles = allProfiles.filter(p => 
    p.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.created_by?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isCollaborator = (email) => {
    return collaborators.some(c => c.email === email && c.has_registered);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute -bottom-8 right-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to={createPageUrl("Settings")}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users size={28} className="text-purple-400" />
              {t('user_management')}
            </h1>
            <p className="text-purple-200 text-sm">{t('view_manage_users')}</p>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-3 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{allProfiles.length}</p>
            <p className="text-xs text-white/60">{t('total_users')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-300">
              {allProfiles.filter(p => p.is_premium).length}
            </p>
            <p className="text-xs text-white/60">{t('premium_users')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-teal-300">
              {collaborators.filter(c => c.has_registered).length}
            </p>
            <p className="text-xs text-white/60">{t('collaborators_count')}</p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <Input
              placeholder={t('search_users')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
        </motion.div>

        {/* Users List */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {filteredProfiles.map((userProfile, index) => {
            const isOwner = userProfile.role === "owner";
            const isCollab = isCollaborator(userProfile.created_by);
            
            return (
              <motion.div
                key={userProfile.id}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                    {userProfile.display_name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold">{userProfile.display_name}</p>
                      {isOwner && <Crown size={14} className="text-amber-400" />}
                    </div>
                    <p className="text-white/60 text-xs">{userProfile.created_by}</p>
                  </div>
                  {isCollab && (
                    <div className="px-2 py-1 rounded-full bg-teal-500/20 border border-teal-400/30">
                      <p className="text-teal-300 text-xs">{t('collaborator')}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      {userProfile.is_premium ? (
                        <CheckCircle size={16} className="text-emerald-400" />
                      ) : (
                        <XCircle size={16} className="text-white/40" />
                      )}
                      <span className="text-white text-sm">{t('premium_access')}</span>
                    </div>
                    {!isOwner && (
                      <Switch
                        checked={!!userProfile.is_premium}
                        onCheckedChange={(checked) =>
                          togglePremiumMutation.mutate({ profileId: userProfile.id, newStatus: checked })
                        }
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-amber-500/10 border border-amber-400/20 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Star size={16} className={userProfile.is_featured ? "text-amber-400 fill-amber-400" : "text-white/40"} />
                      <span className="text-white text-sm">Featured Athlete</span>
                    </div>
                    <Switch
                      checked={!!userProfile.is_featured}
                      onCheckedChange={(checked) =>
                        toggleFeaturedMutation.mutate({ profileId: userProfile.id, newStatus: checked })
                      }
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}