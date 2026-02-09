import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Send, Image as ImageIcon } from "lucide-react";
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
    <div className="min-h-screen flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(createPageUrl('Friends'))}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold">{friendName}</h1>
          <p className="text-white/50 text-xs">{t('active')}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3" style={{ paddingBottom: '100px' }}>
        {messages.map((msg) => {
          const isMine = msg.sender_email === user?.email;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                isMine 
                  ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white' 
                  : 'bg-white/10 text-white'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-white/70' : 'text-white/50'}`}>
                  {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 p-4 safe-area-inset-bottom">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('type_message') || 'Escribe un mensaje...'}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/50 rounded-2xl"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-2xl px-6"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}