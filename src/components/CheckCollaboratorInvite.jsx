import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useCollaboratorInviteCheck(user) {
  useEffect(() => {
    if (!user?.email) return;

    const checkAndAcceptInvite = async () => {
      try {
        // Check for pending invites
        const pendingInvites = await base44.entities.CollaboratorInvite.filter({
          invitee_email: user.email.toLowerCase(),
          status: "pending"
        });

        if (pendingInvites.length === 0) return;

        // Get user profile
        const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
        const profile = profiles[0];
        
        if (!profile) return;

        // Auto-accept and grant Premium
        await Promise.all([
          base44.entities.UserProfile.update(profile.id, {
            role: "collaborator",
            is_premium: true,
            premium_source: "collaborator_invite"
          }),
          ...pendingInvites.map(inv => 
            base44.entities.CollaboratorInvite.update(inv.id, { status: "accepted" })
          ),
        ]);

        console.log("Collaborator invite accepted, Premium granted");
      } catch (err) {
        console.error("Failed to check/accept collaborator invite:", err);
      }
    };

    checkAndAcceptInvite();
  }, [user?.email]);
}