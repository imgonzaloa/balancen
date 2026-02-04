import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Current UI version - increment this when you make UI/layout changes
export const CURRENT_UI_VERSION = "v2.0";

export function UIVersionManager({ user, profile }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.email || !profile) return;

    const migrateUI = async () => {
      const userVersion = profile.ui_version || "v1.0";
      
      // Check if user needs UI migration
      if (userVersion !== CURRENT_UI_VERSION) {
        console.log(`Migrating UI from ${userVersion} to ${CURRENT_UI_VERSION}`);
        
        // Update user's UI version
        await base44.entities.UserProfile.update(profile.id, {
          ui_version: CURRENT_UI_VERSION
        });
        
        // Force complete cache invalidation and UI refresh
        queryClient.clear();
        await queryClient.invalidateQueries();
        
        // Force reload to apply new UI
        window.location.reload();
      }
    };

    migrateUI();
  }, [user?.email, profile?.id, profile?.ui_version, queryClient]);

  return null;
}