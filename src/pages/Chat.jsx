import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";
import { useTranslation } from "@/components/TranslationProvider";

const EMOJIS = ["💪", "🔥", "🥗", "💧", "⚡", "🏆", "👏", "✅"];

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(dateStr, lang) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) {
    return lang === "es" ? "Hoy" : lang === "pt" ? "Hoje" : "Today";
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return lang === "es" ? "Ayer" : lang === "pt" ? "Ontem" : "Yesterday";
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const dateKey = new Date(msg.created_date).toDateString();
    if (dateKey !== lastDate) {
      groups.push({ type: "date", key: dateKey, date: msg.created_date });
      lastDate = dateKey;
    }
    groups.push({ type: "msg", msg });
  });
  return groups;
}

export default function Chat() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [friendProfile, setFriendProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);

  const friendEmail = location.state?.friendEmail;
  const friendName = location.state?.friendName;
  const friendAvatar = location.state?.friendAvatar;

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.UserProfile.filter({ created_by: user.email })
      .then((profiles) => setProfile(profiles[0]));
  }, [user]);

  // Fetch friend's profile for avatar
  useEffect(() => {
    if (!friendEmail) return;
    base44.entities.UserProfile.filter({ created_by: friendEmail })
      .then((profiles) => setFriendProfile(profiles[0] || null))
      .catch(() => {});
  }, [friendEmail]);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", user?.email, friendEmail],
    queryFn: async () => {
      const [sent, received] = await Promise.all([
        base44.entities.Message.filter({ created_by: user.email, receiver_email: friendEmail }),
        base44.entities.Message.filter({ sender_email: friendEmail, receiver_email: user.email }),
      ]);
      received.forEach((msg) => {
        if (!msg.read) {
          base44.entities.Message.update(msg.id, { read: true }).catch(() => {});
        }
      });
      return [...sent, ...received].sort(
        (a, b) => new Date(a.created_date) - new Date(b.created_date)
      );
    },
    enabled: !!user?.email && !!friendEmail,
    refetchInterval: 3000,
  });

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.Message.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setMessage("");
    },
  });

  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({
      sender_email: user.email,
      sender_name: profile?.display_name || user.email,
      sender_avatar: profile?.avatar_url || profile?.profile_photo,
      receiver_email: friendEmail,
      content: message.trim(),
      read: false,
    });
    setShowEmojis(false);
  }, [message, user, profile, friendEmail, sendMessageMutation]);

  const insertEmoji = (emoji) => {
    setMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const friendAvatarSrc =
    friendProfile?.profile_photo ||
    friendProfile?.avatar_url ||
    friendAvatar ||
    null;

  const friendInitial = (friendName || "?").charAt(0).toUpperCase();

  const grouped = groupByDate(messages);

  if (!friendEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white">No friend selected</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col bg-gradient-to-b from-slate-900 to-slate-950"
      style={{ height: "100dvh" }}
    >
      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 flex-shrink-0">
        <button
          onClick={() => navigate(createPageUrl("Friends"))}
          className="p-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
          {friendAvatarSrc ? (
            <img src={friendAvatarSrc} alt={friendName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-bold text-base">{friendInitial}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-base truncate">{friendName}</h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pt-16">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mb-4">
              {friendAvatarSrc ? (
                <img src={friendAvatarSrc} alt={friendName} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-white text-3xl font-bold">{friendInitial}</span>
              )}
            </div>
            <p className="text-white/50 text-sm text-center px-8">
              {lang === "es"
                ? `Empieza a chatear con ${friendName}`
                : lang === "pt"
                ? `Comece a conversar com ${friendName}`
                : `Start a conversation with ${friendName}`}
            </p>
          </div>
        ) : (
          grouped.map((item, idx) => {
            if (item.type === "date") {
              return (
                <div key={`date-${idx}`} className="flex justify-center py-2">
                  <span className="text-[10px] text-white/30 bg-white/5 px-3 py-1 rounded-full font-medium">
                    {formatDateLabel(item.date, lang)}
                  </span>
                </div>
              );
            }

            const { msg } = item;
            const isMine = msg.sender_email === user?.email;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
              >
                {/* Friend avatar */}
                {!isMine && (
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mb-1">
                    {friendAvatarSrc ? (
                      <img src={friendAvatarSrc} alt={friendName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-[10px] font-bold">{friendInitial}</span>
                    )}
                  </div>
                )}

                <div className={`flex flex-col max-w-[72%] ${isMine ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                      isMine
                        ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-br-none"
                        : "bg-white/12 backdrop-blur border border-white/10 text-white rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>

                  {/* Timestamp + read status */}
                  <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="text-[10px] text-white/30">
                      {formatTime(msg.created_date)}
                    </span>
                    {isMine && (
                      <span
                        className={`text-[10px] font-bold ${msg.read ? "text-teal-400" : "text-white/30"}`}
                        title={msg.read ? (lang === "es" ? "Visto" : lang === "pt" ? "Visto" : "Seen") : ""}
                      >
                        {msg.read
                          ? (lang === "es" ? "Visto" : lang === "pt" ? "Visto" : "Seen")
                          : "✓"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Spacer for my messages (no avatar) */}
                {isMine && <div className="w-7 flex-shrink-0" />}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji picker */}
      {showEmojis && (
        <div className="flex-shrink-0 bg-slate-900/95 border-t border-white/10 px-4 py-2 flex gap-3 justify-center">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => insertEmoji(emoji)}
              className="text-2xl active:scale-75 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div
        className="flex-shrink-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-4 py-3"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0))" }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <button
            onClick={() => setShowEmojis((v) => !v)}
            className={`p-2 rounded-full transition-colors ${showEmojis ? "text-teal-400 bg-teal-400/10" : "text-white/40 hover:text-white/70"}`}
          >
            <Smile size={22} />
          </button>
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={
              lang === "es"
                ? `Mensaje a ${friendName}...`
                : lang === "pt"
                ? `Mensagem para ${friendName}...`
                : `Message ${friendName}...`
            }
            className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-full px-4 py-2.5 h-10 text-sm focus:border-teal-400/50"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="w-10 h-10 rounded-full bg-teal-500 hover:bg-teal-600 p-0 flex items-center justify-center flex-shrink-0"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}