import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAppState } from "@/components/AppStateContext";

/**
 * Reusable top header for Home, Social, Progress, Profile tabs.
 * Left: "B" brand icon. Right: circular user avatar (photo or initial).
 * Tapping avatar navigates to Profile.
 */
export default function GlobalHeader() {
  const navigate = useNavigate();
  const { user, profile } = useAppState();

  const avatarSrc = profile?.profile_photo || profile?.avatar_url || null;
  const initial = (profile?.display_name || user?.full_name || "?")[0]?.toUpperCase();

  const goToProfile = () => {
    navigate(createPageUrl("Profile"), { replace: false });
  };

  return (
    <div className="flex items-center justify-between px-6 py-2">
      {/* Brand mark */}
      <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center border border-white/20 shadow-lg select-none">
        <span className="text-white font-black text-lg leading-none">B</span>
      </div>

      {/* Avatar */}
      <button
        onPointerUp={goToProfile}
        onClick={goToProfile}
        className="w-9 h-9 rounded-full overflow-hidden border-2 border-teal-400/60 shadow-lg active:scale-90 transition-transform duration-75 focus:outline-none"
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
  );
}