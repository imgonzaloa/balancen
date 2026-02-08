import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ChevronLeft, UserPlus, Mail, Copy, Check, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const OWNER_EMAIL = "imgonzaloa@gmail.com";

export default function InviteCollaborators() {
  // ALL HOOKS UNCONDITIONALLY AT TOP
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  const isOwner = useMemo(() => {
    return user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() && profile?.role === "owner";
  }, [user?.email, profile?.role]);

  const appUrl = useMemo(() => window.location.origin, []);

  const accessDenied = user && profile && !isOwner;
  
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center px-5">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/60 mb-6">This feature is only available to the application owner.</p>
          <Link to={createPageUrl("Settings")}>
            <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              Go Back
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleInvite = async () => {
    if (!isOwner) {
      toast.error("Access denied");
      return;
    }

    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }

    setLoading(true);
    try {
      await base44.entities.Collaborator.create({
        email: email.toLowerCase(),
        invited_by: user.email,
        has_registered: false
      });
      
      await base44.users.inviteUser(email, "user");
      toast.success(`Invitation sent to ${email} with FREE premium access`);
      setEmail("");
    } catch (error) {
      toast.error("Failed to send invitation");
    }
    setLoading(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute -bottom-8 right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to={createPageUrl("Settings")}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Invite Collaborators</h1>
        </div>

        <motion.div
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <UserPlus size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold">Free Access</h2>
              <p className="text-white/60 text-sm">Invite people to use Balancen for free</p>
            </div>
          </div>
          <p className="text-white/80 text-sm">
            Collaborators get full access to track their health, join groups, and compete with friends.
          </p>
        </motion.div>

        <motion.div
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Mail size={20} className="text-teal-300" />
            <h3 className="text-white font-bold">Send Email Invitation</h3>
          </div>
          
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="collaborator@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
            <Button
              onClick={handleInvite}
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={18} className="mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-white font-bold mb-3">Or Share Link</h3>
          <div className="flex gap-2">
            <div className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
              <p className="text-white/80 text-sm truncate">{appUrl}</p>
            </div>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="border-white/20 bg-white/10 hover:bg-white/20"
            >
              {copied ? (
                <Check size={18} className="text-green-400" />
              ) : (
                <Copy size={18} className="text-white" />
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}