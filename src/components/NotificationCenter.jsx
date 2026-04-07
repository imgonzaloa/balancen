import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, UserPlus, Heart, Trophy, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatDistanceToNow } from "date-fns";
import { es, enUS, ptBR } from "date-fns/locale";

const localeMap = { es, en: enUS, pt: ptBR };

const labels = {
  es: {
    title: "Notificaciones",
    empty: "Sin notificaciones",
    emptySubtitle: "Cuando alguien interactúe contigo, lo verás aquí.",
    follow: (name) => `${name} comenzó a seguirte`,
    meal_reaction: (name) => `${name} reaccionó a tu comida`,
    challenge_join: (name) => `${name} se unió a tu reto`,
  },
  en: {
    title: "Notifications",
    empty: "No notifications",
    emptySubtitle: "When someone interacts with you, you'll see it here.",
    follow: (name) => `${name} started following you`,
    meal_reaction: (name) => `${name} reacted to your meal`,
    challenge_join: (name) => `${name} joined your challenge`,
  },
  pt: {
    title: "Notificações",
    empty: "Sem notificações",
    emptySubtitle: "Quando alguém interagir com você, você verá aqui.",
    follow: (name) => `${name} começou a te seguir`,
    meal_reaction: (name) => `${name} reagiu à sua refeição`,
    challenge_join: (name) => `${name} entrou no seu desafio`,
  },
};

const typeIcon = {
  follow: <UserPlus size={16} className="text-teal-400" />,
  meal_reaction: <Heart size={16} className="text-pink-400" />,
  challenge_join: <Trophy size={16} className="text-amber-400" />,
};

const typeBg = {
  follow: "bg-teal-500/15",
  meal_reaction: "bg-pink-500/15",
  challenge_join: "bg-amber-500/15",
};

// Hook: just get unread count (for badge in header)
export function useUnreadNotificationCount(userEmail) {
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail }, "-created_date", 30),
    enabled: !!userEmail,
    staleTime: 30000,
    refetchInterval: 60000,
  });
  return notifications.filter(n => !n.read).length;
}

export default function NotificationCenter({ open, onClose, userEmail, lang = "es" }) {
  const l = labels[lang] || labels.es;
  const panelRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail }, "-created_date", 30),
    enabled: !!userEmail,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Mark all as read when panel opens
  useEffect(() => {
    if (!open || !userEmail) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { read: true }))).then(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userEmail] });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    const t = setTimeout(() => document.addEventListener("pointerdown", handler), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("pointerdown", handler);
    };
  }, [open, onClose]);

  const getText = (n) => {
    const fn = l[n.type];
    return fn ? fn(n.actor_name) : n.actor_name;
  };

  const getTimeAgo = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: localeMap[lang] || localeMap.es });
    } catch {
      return "";
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute top-[60px] right-4 w-80 max-w-[calc(100vw-2rem)] z-[9999] bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-black text-sm">{l.title}</h3>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors active:scale-90">
              <X size={16} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <Bell size={32} className="text-white/20 mx-auto mb-3" />
                <p className="text-white/70 font-semibold text-sm">{l.empty}</p>
                <p className="text-white/40 text-xs mt-1">{l.emptySubtitle}</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 last:border-0 ${!n.read ? "bg-white/5" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${typeBg[n.type] || "bg-white/10"}`}>
                    {typeIcon[n.type] || <Bell size={16} className="text-white/50" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs leading-snug">{getText(n)}</p>
                    <p className="text-white/40 text-[10px] mt-0.5">{getTimeAgo(n.created_date)}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 mt-1.5" />}
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}