import React, { useState } from "react";
import { Trophy, Download, Medal, Flame, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const FILTERS = [
  { id: "all", label: "All Members" },
  { id: "top", label: "≥80% Consistency" },
  { id: "inactive", label: "Inactive" },
];

export default function AdminLeaderboard({ members, group, loading, user }) {
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  const totalDays = (() => {
    if (!group?.start_date || !group?.end_date) return 1;
    const start = new Date(group.start_date);
    const end = new Date(group.end_date);
    const now = new Date();
    return Math.max(1, Math.ceil((Math.min(now, end) - start) / 86400000));
  })();

  const filtered = members.filter(m => {
    if (filter === "top") return (m.consistencyPercent || 0) >= 80;
    if (filter === "inactive") return !m.last_activity_date ||
      (new Date() - new Date(m.last_activity_date)) > 7 * 86400000;
    return true;
  });

  const handleRemoveMember = async (member) => {
    if (!confirm(`Remove ${member.display_name || member.user_email} from the group?`)) return;
    await base44.entities.GroupMember.delete(member.id);
    toast.success("Member removed");
    queryClient.invalidateQueries({ queryKey: ["campusMembers"] });
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Days Completed", "Total Days", "Consistency %", "Current Streak", "Longest Streak", "Last Activity"];
    const rows = members.map(m => [
      m.display_name || "",
      m.user_email,
      m.days_completed || 0,
      totalDays,
      m.consistencyPercent || 0,
      m.current_streak || 0,
      m.longest_streak || 0,
      m.last_activity_date || "",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${group.name}_leaderboard.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  if (loading) return <div className="text-center text-white/40 py-8">Loading…</div>;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f.id ? "bg-teal-500 text-white" : "text-white/50 hover:text-white/70"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <Button onClick={handleExportCSV} variant="outline" size="sm"
          className="border-slate-700 text-white/70 hover:bg-white/10 rounded-xl flex items-center gap-1.5 text-xs">
          <Download size={12} />Export CSV
        </Button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-3 text-white/40 text-xs uppercase tracking-wide">
        <span>#</span>
        <span>Member</span>
        <span className="text-right">Days</span>
        <span className="text-right">Score</span>
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center text-white/30 py-6 text-sm">No members match this filter</div>
        )}
        {filtered.map((m, idx) => {
          const rank = members.findIndex(x => x.id === m.id) + 1;
          const isTop = m.consistencyPercent >= 80;
          const RankIcon = rank === 1 ? Trophy : rank === 2 ? Medal : null;
          const rankColors = ["", "text-amber-400", "text-slate-300", "text-amber-700"];

          return (
            <div key={m.id}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center">
                <span className={`text-sm font-bold w-5 ${rankColors[rank] || "text-white/40"}`}>
                  {RankIcon ? <RankIcon size={16} /> : rank}
                </span>
                <div>
                  <div className="text-white text-sm font-semibold leading-tight">{m.display_name || "—"}</div>
                  <div className="text-white/40 text-xs">{m.user_email}</div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-white/40">
                    <span className="flex items-center gap-0.5"><Flame size={10} className="text-orange-400" />{m.current_streak || 0}d</span>
                    {m.last_activity_date && <span>Last: {m.last_activity_date}</span>}
                  </div>
                </div>
                <div className="text-right text-white/60 text-sm">
                  <div className="font-semibold text-white">{m.days_completed || 0}/{totalDays}</div>
                  <div className="text-xs text-white/40">days</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-lg ${isTop ? "text-emerald-400" : "text-white/60"}`}>
                    {m.consistencyPercent || 0}%
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${isTop ? "bg-gradient-to-r from-emerald-400 to-teal-400" : "bg-white/20"}`}
                  style={{ width: `${m.consistencyPercent || 0}%` }} />
              </div>
              {/* Remove button */}
              <div className="mt-2 flex justify-end">
                {m.user_email !== user?.email && (
                  <button onClick={() => handleRemoveMember(m)}
                    className="text-red-400/50 hover:text-red-400 text-xs flex items-center gap-1 transition-colors">
                    <UserX size={11} />Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}