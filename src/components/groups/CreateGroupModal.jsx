import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, Calendar, Globe } from "lucide-react";

const GROUP_TYPES = [
  { id: "campus", label: "Campus", desc: "Academic challenge group" },
  { id: "team", label: "Team", desc: "Work or sports team" },
  { id: "friends", label: "Friends", desc: "Personal friend group" },
];

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

export default function CreateGroupModal({ open, onClose, user, onCreated }) {
  const defaults = getDefaultDates();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    group_type: "campus",
    start_date: defaults.start,
    end_date: defaults.end,
    timezone: "America/Mexico_City",
    is_private: true,
    allow_join_by_code: false,
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("Group name is required"); return; }
    setLoading(true);
    const code = generateCode();
    const group = await base44.entities.Group.create({ ...form, invite_code: code, member_count: 1 });
    await base44.entities.GroupMember.create({
      group_id: group.id,
      user_email: user.email,
      display_name: user.full_name || user.email,
      role: "admin",
    });
    toast.success("Group created! 🎉");
    setLoading(false);
    setStep(1);
    setForm({ ...form, name: "", description: "" });
    onCreated(group);
  };

  const handleClose = () => { setStep(1); onClose(); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Create a Group</DialogTitle>
          <p className="text-white/50 text-sm">Step {step} of 2</p>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-5 mt-2">
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
            <div>
              <label className="text-white/70 text-sm mb-2 block">Group Type</label>
              <div className="grid grid-cols-3 gap-2">
                {GROUP_TYPES.map(t => (
                  <button key={t.id} onClick={() => update("group_type", t.id)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      form.group_type === t.id
                        ? "bg-teal-500/20 border-teal-500 text-teal-300"
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    }`}>
                    <div className="font-semibold text-sm">{t.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-2">
              <Shield size={16} className="text-teal-400 shrink-0" />
              <span className="text-white/60 text-xs">Private group — only invited emails can join</span>
            </div>
            <Button onClick={() => setStep(2)} disabled={!form.name.trim()}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-semibold">
              Next: Set Dates →
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/70 text-sm mb-1.5 block flex items-center gap-1">
                  <Calendar size={12} />Start Date
                </label>
                <Input type="date" value={form.start_date} onChange={e => update("start_date", e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-1.5 block flex items-center gap-1">
                  <Calendar size={12} />End Date
                </label>
                <Input type="date" value={form.end_date} onChange={e => update("end_date", e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            <div>
              <label className="text-white/70 text-sm mb-1.5 block flex items-center gap-1">
                <Globe size={12} />Timezone
              </label>
              <select value={form.timezone} onChange={e => update("timezone", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm">
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white text-sm font-semibold">Allow join by code</div>
                  <div className="text-white/40 text-xs">Members can join using the group code</div>
                </div>
                <button onClick={() => update("allow_join_by_code", !form.allow_join_by_code)}
                  className={`w-11 h-6 rounded-full transition-colors ${form.allow_join_by_code ? "bg-teal-500" : "bg-white/20"} relative`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.allow_join_by_code ? "translate-x-5" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}
                className="flex-1 border-slate-700 text-white/70 hover:bg-white/10 rounded-2xl">
                ← Back
              </Button>
              <Button onClick={handleCreate} disabled={loading}
                className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-semibold">
                {loading ? "Creating…" : "Create Group 🎉"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}