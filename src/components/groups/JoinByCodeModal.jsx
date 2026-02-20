import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function JoinByCodeModal({ open, onClose, user, onJoined }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);

    const groups = await base44.entities.Group.filter({ invite_code: code.trim().toUpperCase() });
    if (!groups.length) { toast.error("Group not found"); setLoading(false); return; }
    const group = groups[0];

    if (!group.allow_join_by_code) {
      toast.error("This group doesn't allow joining by code. Ask the admin to invite you by email.");
      setLoading(false);
      return;
    }

    const existing = await base44.entities.GroupMember.filter({ group_id: group.id, user_email: user.email });
    if (existing.length) {
      toast.info("You're already in this group");
      setLoading(false);
      onJoined();
      onClose();
      return;
    }

    // Create group membership
    await base44.entities.GroupMember.create({
      group_id: group.id,
      user_email: user.email,
      display_name: user.full_name || user.email,
      role: "member",
    });
    await base44.entities.Group.update(group.id, { member_count: (group.member_count || 1) + 1 });

    // Campus group → grant campus_access
    if (group.group_type === "campus") {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      const profile = profiles[0];
      if (profile) {
        await base44.entities.UserProfile.update(profile.id, {
          access_type: "campus_access",
          access_start_date: new Date().toISOString(),
          access_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          campus_group_id: group.id,
          is_premium: true,
        });
        toast.success(`Joined "${group.name}"! Campus Access activated for 30 days 🎓`);
      }
    } else {
      toast.success(`Joined "${group.name}"!`);
    }

    setCode("");
    setLoading(false);
    onJoined();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Join by Code</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="XXXXXXX"
            className="bg-slate-800 border-slate-700 text-white text-center text-2xl tracking-widest font-mono placeholder-white/20"
          />
          <p className="text-white/40 text-xs text-center">Ask the group admin for their group code</p>
          <Button
            onClick={handleJoin}
            disabled={!code.trim() || loading}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl"
          >
            {loading ? "Joining…" : "Join Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}