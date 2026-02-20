import React from "react";
import { Trophy, Medal, Flame } from "lucide-react";

export default function MemberLeaderboard({ members, group, loading, currentUserEmail }) {
  const totalDays = (() => {
    if (!group?.start_date || !group?.end_date) return 1;
    const start = new Date(group.start_date);
    const end = new Date(group.end_date);
    const now = new Date();
    return Math.max(1, Math.ceil((Math.min(now, end) - start) / 86400000));
  })();

  if (loading) return <div className="text-center text-white/40 py-8">Loading…</div>;

  return (
    <div className="space-y-3">
      <p className="text-white/40 text-xs text-center">Ranked by Consistency Score • Emails hidden for privacy</p>
      {members.map((m, idx) => {
        const rank = idx + 1;
        const isMe = m.user_email === currentUserEmail;
        const isTop = m.consistencyPercent >= 80;
        const rankColors = ["", "text-amber-400", "text-slate-300", "text-amber-700"];
        const RankIcon = rank === 1 ? Trophy : rank === 2 ? Medal : null;

        return (
          <div key={m.id}
            className={`border rounded-2xl px-4 py-3 transition-all ${
              isMe ? "bg-teal-500/10 border-teal-500/40" : "bg-white/5 border-white/10"
            }`}>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold w-5 shrink-0 ${rankColors[rank] || "text-white/40"}`}>
                {RankIcon ? <RankIcon size={16} /> : rank}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-semibold truncate">
                    {m.display_name || "Member"}
                  </span>
                  {isMe && <span className="text-teal-400 text-xs">(you)</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-white/40">
                  <span className="flex items-center gap-0.5"><Flame size={10} className="text-orange-400" />{m.current_streak || 0}d streak</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`font-bold text-xl ${isTop ? "text-emerald-400" : "text-white/60"}`}>
                  {m.consistencyPercent || 0}%
                </div>
                <div className="text-xs text-white/40">{m.days_completed || 0}/{totalDays} days</div>
              </div>
            </div>
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${isTop ? "bg-gradient-to-r from-emerald-400 to-teal-400" : "bg-white/20"}`}
                style={{ width: `${m.consistencyPercent || 0}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}