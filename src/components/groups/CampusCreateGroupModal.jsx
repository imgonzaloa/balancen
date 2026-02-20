import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, Calendar, Globe, GraduationCap } from "lucide-react";

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Mexico_City", "America/Bogota", "America/Lima", "America/Santiago",
  "America/Argentina/Buenos_Aires", "America/Caracas", "Europe/London", "Europe/Madrid",
  "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney"
];

function getDefaultDates() {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 30);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function generateCode() {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

export default function CampusCreateGroupModal({ open, onClose, user, onCreated }) {
  const defaults = getDefaultDates();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    start_date: defaults.start,
    end_date: defaults.end,
    timezone: "America/Mexico_City",
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("Group name is required"); return; }
    setLoading(true);
    const code = generateCode();
    const group = await base44.entities.Group.create({
      ...form,
      group_type: "campus",
      invite_code: code,
      member_count: 1,
      is_private: true,
      allow_join_by_code: false,
    });
    await base44.entities.GroupMember.create({
      group_id: group.id,
      user_email: user.email,
      display_name: user.full_name || user.email,
      role: "admin",
    });
    toast.success("Campus group created! 🎓");
    setLoading(false);
    onCreated(group);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <GraduationCap size={20} className="text-teal-400" />
            Create Campus Group
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Campus-only badge */}
          <div className="bg-teal-500/10 border border-teal-400/30 rounded-xl px-3 py-2 flex items-center gap-2">
            <GraduationCap size={14} className="text-teal-400" />
            <span className="text-teal-300 text-xs font-semibold">Campus group — invite-only, private</span>
          </div>

          <div>
            <label className="text-white/70 text-sm mb-1.5 block">Group Name *</label>
            <Input value={form.name} onChange={e => update("name", e.target.value)}
              placeholder="e.g. Spring Challenge 2025"
              className="bg-slate-800 border-slate-700 text-white placeholder-white/30" />
          </div>

          <div>
            <label className="text-white/70 text-sm mb-1.5 block">Description (optional)</label>
            <Input value={form.description} onChange={e => update("description", e.target.value)}
              placeholder="What's this group about?"
              className="bg-slate-800 border-slate-700 text-white placeholder-white/30" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/70 text-sm mb-1.5 block flex items-center gap-1">
                <Calendar size={12} /> Start Date
              </label>
              <Input type="date" value={form.start_date} onChange={e => update("start_date", e.target.value)}
                className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-1.5 block flex items-center gap-1">
                <Calendar size={12} /> End Date
              </label>
              <Input type="date" value={form.end_date} onChange={e => update("end_date", e.target.value)}
                className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>

          <div>
            <label className="text-white/70 text-sm mb-1.5 block flex items-center gap-1">
              <Globe size={12} /> Timezone
            </label>
            <select value={form.timezone} onChange={e => update("timezone", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm">
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-2">
            <Shield size={16} className="text-teal-400 shrink-0" />
            <span className="text-white/60 text-xs">Members join only via email invite from you</span>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}
              className="flex-1 border-slate-700 text-white/70 hover:bg-white/10 rounded-2xl">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading || !form.name.trim()}
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-semibold">
              {loading ? "Creating…" : "Create Group 🎓"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}