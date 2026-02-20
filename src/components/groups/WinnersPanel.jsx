import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy, Award, Users, CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function WinnersPanel({ group, members, user }) {
  const [confirming, setConfirming] = useState(false);
  const queryClient = useQueryClient();

  const { data: existingWinners = [], refetch } = useQuery({
    queryKey: ["groupWinners", group.id],
    queryFn: () => base44.entities.GroupWinner.filter({ group_id: group.id }),
  });

  const eligible = members.filter(m => (m.consistencyPercent || 0) >= 80);

  const mostConsistent = members.reduce((best, m) => {
    if (!best) return m;
    if ((m.consistencyPercent || 0) > (best.consistencyPercent || 0)) return m;
    if ((m.consistencyPercent || 0) === (best.consistencyPercent || 0) &&
      (m.longest_streak || 0) > (best.longest_streak || 0)) return m;
    return best;
  }, null);

  const handleConfirmWinners = async () => {
    setConfirming(true);
    const now = new Date().toISOString();

    // Delete old winners
    for (const w of existingWinners) {
      await base44.entities.GroupWinner.delete(w.id);
    }

    // Save Most Consistent
    if (mostConsistent) {
      await base44.entities.GroupWinner.create({
        group_id: group.id,
        user_email: mostConsistent.user_email,
        display_name: mostConsistent.display_name || mostConsistent.user_email,
        category: "most_consistent",
        consistency_percent: mostConsistent.consistencyPercent || 0,
        days_completed: mostConsistent.days_completed || 0,
        total_days: mostConsistent.totalDays || 0,
        longest_streak: mostConsistent.longest_streak || 0,
        confirmed_at: now,
        confirmed_by: user.email,
      });
    }

    // Save Raffle Eligible
    for (const m of eligible) {
      if (m.user_email === mostConsistent?.user_email) continue;
      await base44.entities.GroupWinner.create({
        group_id: group.id,
        user_email: m.user_email,
        display_name: m.display_name || m.user_email,
        category: "raffle_eligible",
        consistency_percent: m.consistencyPercent || 0,
        days_completed: m.days_completed || 0,
        total_days: m.totalDays || 0,
        longest_streak: m.longest_streak || 0,
        confirmed_at: now,
        confirmed_by: user.email,
      });
    }

    toast.success("Winners confirmed! 🏆");
    setConfirming(false);
    refetch();
  };

  const confirmed = existingWinners.length > 0;
  const confirmedMostConsistent = existingWinners.find(w => w.category === "most_consistent");
  const confirmedRaffle = existingWinners.filter(w => w.category === "raffle_eligible");

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center">
          <Trophy size={24} className="text-amber-400 mx-auto mb-2" />
          <div className="text-white font-bold text-lg">{mostConsistent?.consistencyPercent || 0}%</div>
          <div className="text-white/50 text-xs">Top Consistency</div>
          <div className="text-amber-300 text-sm font-semibold mt-1 truncate">{mostConsistent?.display_name || "—"}</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
          <Users size={24} className="text-emerald-400 mx-auto mb-2" />
          <div className="text-white font-bold text-lg">{eligible.length}</div>
          <div className="text-white/50 text-xs">Raffle Eligible</div>
          <div className="text-emerald-300 text-sm mt-1">(≥80% consistency)</div>
        </div>
      </div>

      {/* Most Consistent */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <Trophy size={16} className="text-amber-400" />Most Consistent
        </h3>
        {mostConsistent ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              {(mostConsistent.display_name || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-white font-semibold">{mostConsistent.display_name}</div>
              <div className="text-white/50 text-xs">{mostConsistent.consistencyPercent}% · {mostConsistent.days_completed}/{mostConsistent.totalDays} days · {mostConsistent.longest_streak}d best streak</div>
            </div>
          </div>
        ) : <p className="text-white/30 text-sm">No data yet</p>}
      </div>

      {/* Raffle Eligible */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <Award size={16} className="text-emerald-400" />Raffle Pool ({eligible.length} members)
        </h3>
        {eligible.length === 0 ? (
          <p className="text-white/30 text-sm">No members at ≥80% consistency yet</p>
        ) : (
          <div className="space-y-2">
            {eligible.map(m => (
              <div key={m.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={12} className="text-emerald-400" />
                  <span className="text-white text-sm">{m.display_name}</span>
                </div>
                <span className="text-emerald-400 text-sm font-semibold">{m.consistencyPercent}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm button */}
      <Button onClick={handleConfirmWinners} disabled={confirming || !members.length}
        className={`w-full rounded-2xl font-semibold flex items-center justify-center gap-2 ${
          confirmed
            ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30"
            : "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
        }`}>
        {confirmed ? <><CheckCircle size={16} />Winners Confirmed — Update</> : <><Trophy size={16} />Confirm Winners</>}
        {confirming && " …"}
      </Button>

      {/* Confirmed Winners */}
      {confirmed && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-4">
          <h3 className="text-emerald-400 font-bold flex items-center gap-2"><CheckCircle size={16} />Confirmed Winners</h3>
          {confirmedMostConsistent && (
            <div>
              <div className="text-white/50 text-xs uppercase tracking-wide mb-1">Most Consistent</div>
              <div className="text-white font-semibold">{confirmedMostConsistent.display_name} — {confirmedMostConsistent.consistency_percent}%</div>
            </div>
          )}
          {confirmedRaffle.length > 0 && (
            <div>
              <div className="text-white/50 text-xs uppercase tracking-wide mb-1">Raffle Pool ({confirmedRaffle.length})</div>
              {confirmedRaffle.map(w => (
                <div key={w.id} className="text-white text-sm">{w.display_name} — {w.consistency_percent}%</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}