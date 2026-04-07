import React, { useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAppState } from "@/components/AppStateContext";
import { Bell } from "lucide-react";
import NotificationCenter, { useUnreadNotificationCount } from "@/components/NotificationCenter";
import { useTranslation } from "@/components/TranslationProvider";

// Global event so Layout can listen for debug panel open request
export function openDebugPanel() {
  window.dispatchEvent(new CustomEvent('balancen-open-debug'));
}

/**
 * Global app header bar — always rendered by Layout.
 * LEFT: "B" logo → navigates to Home
 * CENTER-RIGHT: Bell icon with unread badge → opens NotificationCenter
 * RIGHT: user avatar → navigates to Profile
 * Height: 56px (fixed, full-width, respects safe-area)
 */
export default function GlobalHeader() {
  const navigate = useNavigate();
  const { user, profile } = useAppState();
  const { lang } = useTranslation();
  const [notifOpen, setNotifOpen] = useState(false);

  const avatarSrc = profile?.profile_photo || profile?.avatar_url || null;
  const initial = (profile?.display_name || user?.full_name || "?")[0]?.toUpperCase();

  const unreadCount = useUnreadNotificationCount(user?.email);

  const handleLogoTap = useCallback(() => {
    navigate(createPageUrl("Home"), { replace: true });
  }, [navigate]);

  return (
    <div
      className="relative flex items-center justify-between px-4 bg-slate-900/80 backdrop-blur-xl border-b border-white/8"
      style={{ height: '56px', flexShrink: 0 }}
    >
      {/* Brand logo */}
      <button
        onClick={handleLogoTap}
        className="w-11 h-11 rounded-xl bg-black/60 flex items-center justify-center border border-white/20 shadow-md active:scale-90 transition-transform duration-75 focus:outline-none select-none"
        style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
        aria-label="Go to Home"
      >
        <span className="text-white font-black text-lg leading-none">B</span>
      </button>

      {/* Right side: bell + avatar */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          onClick={() => setNotifOpen(o => !o)}
          className="relative w-10 h-10 rounded-full bg-white/8 flex items-center justify-center active:scale-90 transition-transform duration-75 focus:outline-none"
          style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
          aria-label="Notifications"
        >
          <Bell size={19} className="text-white/70" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-slate-900" />
          )}
        </button>

        {/* User avatar */}
        <button
          onClick={() => navigate(createPageUrl("Profile"), { replace: false })}
          className="w-11 h-11 rounded-full overflow-hidden border-2 border-teal-400/60 shadow-md active:scale-90 transition-transform duration-75 focus:outline-none"
          style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
          aria-label="Go to profile"
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="avatar"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">{initial}</span>
            </div>
          )}
        </button>
      </div>

      {/* Notification panel */}
      <NotificationCenter
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        userEmail={user?.email}
        lang={lang}
      />
    </div>
  );
}