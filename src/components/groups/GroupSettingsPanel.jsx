import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, Shield, Key, Trash2, UserX } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function GroupSettingsPanel({ group, user, members, onUpdated }) {
  const [allowCode, setAllowCode] = useState(group.allow_join_by_code || false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.invite_code);
    toast.success("Code copied!");
  };

  const handleToggleCode = async (val) => {
    setAllowCode(val);
    setSaving(true);
    await base44.entities.Group.update(group.id, { allow_join_by_code: val });
    setSaving(false);
    onUpdated?.();
    toast.success(val ? "Join-by-code enabled" : "Join-by-code disabled");
  };

  const handleRemoveMember = async (member) => {
    if (!confirm(`Remove ${member.display_name || member.user_email}?`)) return;
    await base44.entities.GroupMember.delete(member.id);
    await base44.entities.Group.update(group.id, { member_count: Math.max(1, (group.member_count || 2) - 1) });
    toast.success("Member removed");
    queryClient.invalidateQueries({ queryKey: ["campusMembers"] });
    queryClient.invalidateQueries({ queryKey: ["campusGroup"] });
  };

  const handleDeleteGroup = async () => {
    if (!confirm(`Delete group "${group.name}"? This cannot be undone.`)) return;
    // Delete members, invites, then group
    for (const m of members) await base44.entities.GroupMember.delete(m.id).catch(() => {});
    await base44.entities.Group.delete(group.id).catch(() => {});
    toast.success("Group deleted");
    navigate(createPageUrl("Groups"));
  };

  return (
    <div className="space-y-5">
      {/* Group Code */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-bold mb-1 flex items-center gap-2"><Key size={16} className="text-teal-400" />Group Code</h3>
        <p className="text-white/40 text-xs mb-3">Only visible to admins. Share only if join-by-code is enabled.</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 font-mono text-2xl tracking-widest text-teal-300 text-center">
            {group.invite_code}
          </div>
          <button onClick={handleCopyCode}
            className="bg-teal-500/20 border border-teal-500/30 text-teal-400 rounded-xl p-3 hover:bg-teal-500/30 transition-colors">
            <Copy size={18} />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-white text-sm font-semibold">Allow join by code</div>
            <div className="text-white/40 text-xs">Let anyone with the code join (not just email invites)</div>
          </div>
          <button onClick={() => handleToggleCode(!allowCode)} disabled={saving}
            className={`w-11 h-6 rounded-full transition-colors ${allowCode ? "bg-teal-500" : "bg-white/20"} relative`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${allowCode ? "translate-x-5" : "translate-x-1"}`} />
          </button>
        </div>
        {!allowCode && (
          <div className="mt-3 flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-xl p-3">
            <Shield size={14} className="text-teal-400 shrink-0" />
            <span className="text-white/50 text-xs">Only invited emails can join (more secure)</span>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2"><UserX size={16} className="text-red-400" />Remove Members</h3>
        <div className="space-y-2">
          {members.filter(m => m.user_email !== user?.email).map(m => (
            <div key={m.id} className="flex items-center justify-between">
              <div>
                <div className="text-white text-sm">{m.display_name || "—"}</div>
                <div className="text-white/40 text-xs">{m.user_email}</div>
              </div>
              <button onClick={() => handleRemoveMember(m)}
                className="text-red-400/60 hover:text-red-400 text-xs flex items-center gap-1 transition-colors">
                <UserX size={14} />Remove
              </button>
            </div>
          ))}
          {members.filter(m => m.user_email !== user?.email).length === 0 && (
            <p className="text-white/30 text-sm">No other members yet</p>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
        <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2"><Trash2 size={16} />Danger Zone</h3>
        <p className="text-white/40 text-xs mb-3">Deleting the group is permanent and removes all members and data.</p>
        <Button onClick={handleDeleteGroup}
          className="bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 rounded-xl w-full">
          Delete Group
        </Button>
      </div>
    </div>
  );
}