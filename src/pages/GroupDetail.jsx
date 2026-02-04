import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ChevronLeft, Copy, Check, Crown, Flame, Circle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function GroupDetail() {
  const [user, setUser] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get("id");

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: group } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const groups = await base44.entities.Group.filter({ id: groupId });
      return groups[0] || null;
    },
    enabled: !!groupId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["groupMembers", groupId],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: groupId }),
    enabled: !!groupId,
  });

  const sortedMembers = [...members].sort((a, b) => b.current_streak - a.current_streak);

  const copyCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.invite_code);
    setCopiedCode(true);
    toast.success("Código copiado");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!group) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-indigo-50 to-indigo-50/80 backdrop-blur-sm pt-6 pb-4 z-10">
          <div className="flex items-center gap-4">
            <Link
              to={createPageUrl("Groups")}
              className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"
            >
              <ChevronLeft size={20} className="text-slate-600" />
            </Link>
            <h1 className="text-xl font-bold text-slate-800 flex-1">{group.name}</h1>
          </div>
        </div>

        {/* Group Header Card */}
        <motion.div
          className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-indigo-200 text-sm">Miembros</p>
              <p className="text-3xl font-bold">{members.length}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold">
              {group.name.charAt(0)}
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/20 rounded-xl p-3">
            <div className="flex-1">
              <p className="text-xs text-indigo-200">Código de invitación</p>
              <p className="text-lg font-bold tracking-widest">{group.invite_code}</p>
            </div>
            <button
              onClick={copyCode}
              className="p-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
            >
              {copiedCode ? (
                <Check size={20} />
              ) : (
                <Copy size={20} />
              )}
            </button>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            Ranking de consistencia
          </h2>
          
          <div className="space-y-3">
            {sortedMembers.map((member, index) => {
              const isCurrentUser = member.user_email === user?.email;
              const isTop3 = index < 3;
              
              return (
                <motion.div
                  key={member.id}
                  className={`bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border ${
                    isCurrentUser ? "border-indigo-200 bg-indigo-50/50" : "border-slate-100"
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    index === 0 ? "bg-amber-100 text-amber-600" :
                    index === 1 ? "bg-slate-200 text-slate-600" :
                    index === 2 ? "bg-orange-100 text-orange-600" :
                    "bg-slate-100 text-slate-500"
                  }`}>
                    {index + 1}
                  </div>
                  
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {member.display_name?.charAt(0) || "?"}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isCurrentUser ? "text-indigo-700" : "text-slate-700"}`}>
                        {member.display_name}
                        {isCurrentUser && " (tú)"}
                      </span>
                      {member.role === "admin" && (
                        <Crown size={14} className="text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      {member.checked_in_today ? (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <Circle size={8} className="fill-emerald-500" />
                          Hoy ✓
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Circle size={8} />
                          Sin check-in
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Streak */}
                  <div className="flex items-center gap-1 bg-orange-50 px-3 py-2 rounded-xl">
                    <Flame size={18} className={member.current_streak > 0 ? "text-orange-500" : "text-slate-300"} />
                    <span className={`font-bold ${member.current_streak > 0 ? "text-orange-600" : "text-slate-400"}`}>
                      {member.current_streak}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}