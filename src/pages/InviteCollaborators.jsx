import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useTranslation } from "@/components/TranslationProvider";
import { ChevronLeft, UserPlus, Loader2, Check, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function InviteCollaborators() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    const init = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      if (!currentUser) {
        navigate(createPageUrl("Home"));
        return;
      }

      const profiles = await base44.entities.UserProfile.filter({ created_by: currentUser.email });
      const userProfile = profiles[0];
      setProfile(userProfile);

      // Check if owner
      if (userProfile?.role !== "owner" && currentUser.email.toLowerCase() !== "imgonzaloa@gmail.com") {
        toast.error(t('only_owner_can_invite'));
        navigate(createPageUrl("Settings"));
        return;
      }

      // Load existing invites
      const existingInvites = await base44.entities.CollaboratorInvite.filter({ inviter_email: currentUser.email });
      setInvites(existingInvites);
    };
    init();
  }, [navigate, t]);

  const handleInvite = async () => {
    if (!email || !email.includes("@")) {
      toast.error(t('invalid_email'));
      return;
    }

    if (email.toLowerCase() === user.email.toLowerCase()) {
      toast.error(t('cannot_invite_yourself'));
      return;
    }

    // Check if already invited
    const existing = invites.find(inv => inv.invitee_email.toLowerCase() === email.toLowerCase());
    if (existing) {
      toast.error(t('already_invited_email'));
      return;
    }

    setLoading(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 15);
      
      await base44.entities.CollaboratorInvite.create({
        inviter_email: user.email,
        invitee_email: email.toLowerCase(),
        status: "pending",
        invite_code: inviteCode
      });

      // Send email notification
      try {
        await base44.integrations.Core.SendEmail({
          to: email.toLowerCase(),
          subject: t('premium_invitation_subject'),
          body: (t('premium_invitation_body') || "").replace('{{email}}', email.toLowerCase())
        });
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
      }

      toast.success(t('invitation_sent'));
      setEmail("");
      
      // Refresh invites
      const updatedInvites = await base44.entities.CollaboratorInvite.filter({ inviter_email: user.email });
      setInvites(updatedInvites);
    } catch (err) {
      console.error("Invite error:", err);
      toast.error(t('invitation_error'));
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to={createPageUrl("Settings")}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {t('invite_collaborators_title')}
            </h1>
            <p className="text-white/60 text-sm">
              {t('grant_free_premium')}
            </p>
          </div>
        </div>

        {/* Invite Form */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <UserPlus size={20} className="text-teal-300" />
            <h3 className="text-white font-semibold">
              {t('new_invitation')}
            </h3>
          </div>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('email_placeholder_collab')}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-teal-500 mb-4"
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          />

          <Button
            onClick={handleInvite}
            disabled={loading || !email}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold rounded-xl disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                {t('sending')}
              </>
            ) : (
              <>
                <UserPlus size={16} className="mr-2" />
                {t('send_invitation')}
              </>
            )}
          </Button>
        </div>

        {/* Existing Invites */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide opacity-60">
            {t('sent_invitations')}
          </h3>

          {invites.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
              <p className="text-white/60 text-sm">
                {t('no_invitations_yet')}
              </p>
            </div>
          ) : (
            invites.map((invite) => (
              <div
                key={invite.id}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-semibold">{invite.invitee_email}</p>
                  <p className="text-white/60 text-xs mt-1">
                    {invite.status === "pending" && t('pending_status')}
                    {invite.status === "accepted" && t('accepted_status')}
                    {invite.status === "rejected" && t('rejected_status')}
                  </p>
                </div>
                <div>
                  {invite.status === "pending" && (
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Loader2 size={16} className="text-yellow-400 animate-spin" />
                    </div>
                  )}
                  {invite.status === "accepted" && (
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check size={16} className="text-green-400" />
                    </div>
                  )}
                  {invite.status === "rejected" && (
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <X size={16} className="text-red-400" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}