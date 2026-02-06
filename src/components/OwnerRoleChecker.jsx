import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const OWNER_EMAIL = "imgonzaloa@gmail.com";

/**
 * Automatically assigns owner role to the designated owner email
 * Runs on every app load to ensure role is always correct
 */
export default function OwnerRoleChecker({ user, profile }) {
  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: async ({ profileId, newRole }) => {
      return base44.entities.UserProfile.update(profileId, { role: newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["profile"]);
    },
  });

  useEffect(() => {
    const checkAndUpdateRole = async () => {
      if (!user || !profile) return;

      const userEmail = user.email?.toLowerCase();
      const isOwnerEmail = userEmail === OWNER_EMAIL.toLowerCase();
      const currentRole = profile.role;

      // If user should be owner but isn't, upgrade them
      if (isOwnerEmail && currentRole !== "owner") {
        console.log("🔑 Upgrading to owner role:", userEmail);
        await updateRoleMutation.mutateAsync({
          profileId: profile.id,
          newRole: "owner"
        });
      }
      // If user shouldn't be owner but is (security check), downgrade them
      else if (!isOwnerEmail && currentRole === "owner") {
        console.log("⚠️ Downgrading from owner role:", userEmail);
        await updateRoleMutation.mutateAsync({
          profileId: profile.id,
          newRole: "user"
        });
      }
      // If role is null/undefined, set default
      else if (!currentRole) {
        await updateRoleMutation.mutateAsync({
          profileId: profile.id,
          newRole: isOwnerEmail ? "owner" : "user"
        });
      }
    };

    checkAndUpdateRole();
  }, [user?.email, profile?.id, profile?.role]);

  return null; // This is a utility component with no UI
}