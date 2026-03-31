import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";
import { useTranslation } from "@/components/TranslationProvider";
import { toast } from "sonner";

export default function Chat() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  
  const friendEmail = location.state?.friendEmail;
  const friendName = location.state?.friendName;

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.UserProfile.filter({ created_by: user.email })
      .then(profiles => setProfile(profiles[0]));
  }, [user]);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", user?.email, friendEmail],
    queryFn: async () => {
      const [sent, received] = await Promise.all([
        base44.entities.Message.filter({ created_by: user.email, receiver_email: friendEmail }),
        base44.entities.Message.filter({ sender_email: friendEmail, receiver_email: user.email })
      ]);
      // Mark received messages as read
      received.forEach(msg => {
        if (!msg.read) {
          base44.entities.Message.update(msg.id, { read: true }).catch(() => {});
        }
      });
      return [...sent, ...received].sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      );
    },
    enabled: !!user?.email && !!friendEmail,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.Message.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setMessage("");
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({
      sender_email: user.email,
      sender_name: profile?.display_name || user.email,
      sender_avatar: profile?.avatar_url,
      receiver_email: friendEmail,
      content: message.trim(),
      read: false,
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!friendEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white">No friend selected</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(createPageUrl('Friends'))}
          className="p-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-lg">{friendName}</h1>
          <p className="text-white/50 text-xs">{t('active')}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4" style={{ paddingBottom: '100px' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mb-6">
              <span className="text-white text-4xl font-bold">{friendName?.charAt(0)?.toUpperCase() || '👤'}</span>
            </div>
            <p className="text-white/60 text-sm text-center">
              {t('start_conversation') || `Start a conversation with ${friendName}`}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_email === user?.email;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className="flex flex-col max-w-[75%]">
                  <div className={`rounded-2xl px-4 py-2.5 ${
                    isMine 
                      ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-br-sm' 
                      : 'bg-white/10 backdrop-blur border border-white/10 text-white rounded-bl-sm'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-2">
                    <p className="text-[10px] text-white/30">
                      {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {isMine && (
                      <span className={`text-xs font-bold ${msg.read ? 'text-teal-400' : 'text-white/40'}`}>
                        {msg.read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 p-4 safe-area-inset-bottom">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={friendName ? `Message ${friendName}...` : 'Type a message...'}
            className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-full px-4 py-3"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="w-10 h-10 rounded-full bg-teal-500 hover:bg-teal-600 p-0 flex items-center justify-center"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}