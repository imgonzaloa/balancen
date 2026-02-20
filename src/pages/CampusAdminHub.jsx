import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { GraduationCap, Plus, Users, Calendar, ArrowLeft, Lock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/components/AppStateContext";
import CampusCreateGroupModal from "@/components/groups/CampusCreateGroupModal";
import { toast } from "sonner";

export default function CampusAdminHub() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAppState();
  const [showCreate, setShowCreate] = useState(false);

  const isCampusAdmin = profile?.role === "campus_admin" || profile?.role === "owner";

  const { data: myGroups = [], isLoading } = useQuery({
    queryKey: ["campusAdminGroups", user?.email],
    queryFn: async () => {
      // Only campus groups where user is admin
      const members = await base44.entities.GroupMember.filter({
        user_email: user?.email,
        role: "admin",
      });
      const groupIds = members.map(m => m.group_id);
      if (!groupIds.length) return [];
      const groups = await Promise.all(
        groupIds.map(id => base44.entities.Group.filter({ id }).then(r => r[0]).catch(() => null))
      );
      return groups.filter(g => g && g.group_type === "campus");
    },
    enabled: !!user?.email && isCampusAdmin,
    staleTime: 5 * 60 * 1000,
  });

  if (!isCampusAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <Lock size={48} className="text-white/30 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Access Restricted</h2>
          <p className="text-white/60 text-sm mb-6">Campus Admin access required.</p>
          <Button onClick={() => navigate(createPageUrl("Social"))} variant="outline"
            className="border-white/20 text-white hover:bg-white/10">
            Back to Social
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%", paddingBottom: "8px" }}>
      <div className="max-w-2xl mx-auto px-6 pt-6 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(createPageUrl("Social"))}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <GraduationCap size={22} className="text-teal-400" />
              Campus Admin Hub
            </h1>
            <p className="text-white/60 text-sm">Manage your campus groups</p>
          </div>
        </div>

        {/* Create new group */}
        <button
          onClick={() => setShowCreate(true)}
          className="w-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-400/30 rounded-2xl p-5 hover:from-teal-500/30 transition-all flex items-center gap-4 mb-6"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
            <Plus size={22} className="text-white" />
          </div>
          <div className="text-left flex-1">
            <h3 className="text-white font-bold text-lg">Create Campus Group</h3>
            <p className="text-teal-200 text-sm">Private invite-only challenge group</p>
          </div>
        </button>

        {/* My campus groups */}
        <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
          <Users size={18} />
          My Campus Groups
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white/5 rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        ) : myGroups.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <GraduationCap size={40} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/60 text-sm">No campus groups yet. Create one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myGroups.map(group => (
              <div
                key={group.id}
                onClick={() => navigate(`${createPageUrl("GroupDashboard")}?id=${group.id}`)}
                className="bg-gradient-to-br from-teal-500/15 to-emerald-500/10 border border-teal-400/20 rounded-2xl p-5 cursor-pointer hover:border-teal-400/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold">{group.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-white/50 mt-1">
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {group.member_count || 0} members
                      </span>
                      {group.end_date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> ends {group.end_date}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
                      Admin
                    </div>
                    <Settings size={16} className="text-white/30" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CampusCreateGroupModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          user={user}
          onCreated={(group) => {
            setShowCreate(false);
            queryClient.invalidateQueries({ queryKey: ["campusAdminGroups"] });
            navigate(`${createPageUrl("GroupDashboard")}?id=${group.id}`);
          }}
        />
      )}
    </div>
  );
}