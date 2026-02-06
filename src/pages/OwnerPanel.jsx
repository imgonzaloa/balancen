import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ChevronLeft, Shield, UserPlus, Users, Crown, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function OwnerPanel() {
  const [user, setUser] = useState(null);

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
  if (user && profile && profile.role !== "owner") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center px-5">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-4">
            <Shield size={40} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">403 Forbidden</h1>
          <p className="text-white/60 mb-6">This panel is only accessible to the application owner.</p>
          <Link to={createPageUrl("Profile")}>
            <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              Go Back
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { data: collaborators = [] } = useQuery({
    queryKey: ["collaborators"],
    queryFn: () => base44.entities.Collaborator.list(),
    enabled: profile?.role === "owner",
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["allProfiles"],
    queryFn: () => base44.entities.UserProfile.list(),
    enabled: profile?.role === "owner",
  });

  const registeredCollaborators = collaborators.filter(c => c.has_registered);
  const pendingInvites = collaborators.filter(c => !c.has_registered);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute -bottom-8 right-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to={createPageUrl("Profile")}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Crown size={28} className="text-amber-400" />
              Owner Panel
            </h1>
            <p className="text-purple-200 text-sm">Admin controls & tools</p>
          </div>
        </div>

        {/* Stats Overview */}
        <motion.div
          className="grid grid-cols-2 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users size={20} className="text-teal-300" />
              <p className="text-white/70 text-sm">Total Users</p>
            </div>
            <p className="text-3xl font-bold text-white">{allProfiles.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus size={20} className="text-emerald-300" />
              <p className="text-white/70 text-sm">Collaborators</p>
            </div>
            <p className="text-3xl font-bold text-white">{registeredCollaborators.length}</p>
          </div>
        </motion.div>

        {/* Admin Actions */}
        <motion.div
          className="space-y-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold text-white mb-4">Admin Actions</h2>
          
          {/* Invite Collaborators */}
          <Link to={createPageUrl("InviteCollaborators")}>
            <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 backdrop-blur-xl border border-teal-400/30 rounded-3xl p-5 hover:from-teal-500/30 hover:to-emerald-500/30 transition-all shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                    <UserPlus size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Invite Collaborators</p>
                    <p className="text-teal-200 text-sm">Grant free premium access</p>
                  </div>
                </div>
                <ChevronLeft size={20} className="text-white rotate-180" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Mail size={18} className="text-orange-400" />
              Pending Invitations ({pendingInvites.length})
            </h3>
            <div className="space-y-2">
              {pendingInvites.map((collab) => (
                <div
                  key={collab.id}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4"
                >
                  <p className="text-white font-medium">{collab.email}</p>
                  <p className="text-white/60 text-xs mt-1">
                    Invited {new Date(collab.created_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Active Collaborators */}
        {registeredCollaborators.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Users size={18} className="text-emerald-400" />
              Active Collaborators ({registeredCollaborators.length})
            </h3>
            <div className="space-y-2">
              {registeredCollaborators.map((collab) => {
                const collabProfile = allProfiles.find(p => p.created_by === collab.email);
                return (
                  <div
                    key={collab.id}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                      {collabProfile?.display_name?.charAt(0) || collab.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {collabProfile?.display_name || collab.email}
                      </p>
                      <p className="text-white/60 text-xs">{collab.email}</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30">
                      <p className="text-emerald-300 text-xs font-medium">Premium</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}