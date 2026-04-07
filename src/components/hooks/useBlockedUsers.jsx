import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useBlockedUsers(userEmail) {
  const { data: blockedUsers = [] } = useQuery({
    queryKey: ["blockedUsers", userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const blocks = await base44.entities.Block.filter({ created_by: userEmail });
      return blocks.map(b => b.blocked_user_email);
    },
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000,
  });

  return blockedUsers;
}