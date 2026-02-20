import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Megaphone, Send, AlertTriangle, Clock, Flame, ThumbsUp } from "lucide-react";

const EMOJI_REACTIONS = [
  { key: "thumbsup", emoji: "👍" },
  { key: "fire", emoji: "🔥" },
  { key: "muscle", emoji: "💪" },
];

const MAX_CHARS = 500;

// Suggestion: >=5 members between 70–79% consistency
function useSuggestion(members) {
  if (!members?.length) return false;
  const nearThreshold = members.filter(m => {
    const c = m.consistencyPercent || 0;
    return c >= 70 && c < 80;
  });
  return nearThreshold.length >= 5;
}

function MessageBubble({ msg, currentUserEmail, onReact }) {
  const createdAt = new Date(msg.created_date);
  const timeAgo = (() => {
    const diff = (Date.now() - createdAt) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  })();

  const reactions = msg.reactions || { thumbsup: [], fire: [], muscle: [] };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
      {/* Author + time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-white">
            {msg.author_name?.charAt(0) || "A"}
          </div>
          <div>
            <span className="text-white text-xs font-semibold">{msg.author_name || "Admin"}</span>
            <span className="text-amber-400 text-[10px] ml-1.5 bg-amber-400/10 px-1.5 py-0.5 rounded-full">Admin</span>
          </div>
        </div>
        <span className="text-white/30 text-[10px] flex items-center gap-1">
          <Clock size={9} />{timeAgo}
        </span>
      </div>

      {/* Message */}
      <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

      {/* Reactions */}
      <div className="flex items-center gap-2 pt-1">
        {EMOJI_REACTIONS.map(({ key, emoji }) => {
          const reactors = reactions[key] || [];
          const hasReacted = reactors.includes(currentUserEmail);
          return (
            <button
              key={key}
              onClick={() => onReact(msg, key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-sm transition-all ${
                hasReacted
                  ? "bg-teal-500/30 border border-teal-400/50"
                  : "bg-white/5 border border-white/10 hover:bg-white/10"
              }`}
            >
              <span>{emoji}</span>
              {reactors.length > 0 && (
                <span className="text-white/70 text-xs font-semibold">{reactors.length}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BroadcastPanel({ group, user, members = [], isAdmin }) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  const showSuggestion = useSuggestion(members);

  const { data: messages = [], refetch } = useQuery({
    queryKey: ["groupMessages", group.id],
    queryFn: () => base44.entities.GroupMessage.filter({ group_id: group.id }, "-created_date", 50),
    refetchInterval: 30000,
  });

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_CHARS) { toast.error(`Max ${MAX_CHARS} characters`); return; }
    setSending(true);
    await base44.entities.GroupMessage.create({
      group_id: group.id,
      author_email: user.email,
      author_name: user.full_name || "Admin",
      content: trimmed,
      reactions: { thumbsup: [], fire: [], muscle: [] },
    });
    setContent("");
    toast.success("Message sent to all members!");
    refetch();
    queryClient.invalidateQueries({ queryKey: ["groupMessages", group.id] });
    setSending(false);
  };

  const handleReact = async (msg, reactionKey) => {
    const reactions = msg.reactions || { thumbsup: [], fire: [], muscle: [] };
    const reactors = [...(reactions[reactionKey] || [])];
    const alreadyIdx = reactors.indexOf(user.email);
    if (alreadyIdx >= 0) {
      reactors.splice(alreadyIdx, 1);
    } else {
      reactors.push(user.email);
    }
    const updated = { ...reactions, [reactionKey]: reactors };
    await base44.entities.GroupMessage.update(msg.id, { reactions: updated });
    refetch();
  };

  return (
    <div className="space-y-5">
      {/* Admin: suggestion hint */}
      {isAdmin && showSuggestion && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex gap-3">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 text-xs font-semibold mb-0.5">Tip</p>
            <p className="text-amber-200/80 text-xs leading-relaxed">
              Several members are close to 80% consistency. Consider sending a motivational reminder!
            </p>
          </div>
        </div>
      )}

      {/* Admin: compose box */}
      {isAdmin && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone size={15} className="text-teal-400" />
            <span className="text-white text-sm font-semibold">Send Group Message</span>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Write a message visible to all group members…"
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl p-3 resize-none placeholder-white/20 focus:outline-none focus:border-teal-500"
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${content.length > MAX_CHARS * 0.9 ? "text-amber-400" : "text-white/30"}`}>
              {content.length}/{MAX_CHARS}
            </span>
            <Button
              onClick={handleSend}
              disabled={!content.trim() || sending}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 px-4 py-2"
            >
              <Send size={12} />
              {sending ? "Sending…" : "Send to All"}
            </Button>
          </div>
        </div>
      )}

      {/* Messages feed */}
      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-white/30 py-8 text-sm">
            <Megaphone size={28} className="mx-auto mb-2 opacity-30" />
            No messages yet
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              currentUserEmail={user?.email}
              onReact={handleReact}
            />
          ))
        )}
      </div>
    </div>
  );
}