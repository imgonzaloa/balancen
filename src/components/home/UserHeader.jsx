import React, { useState } from "react";
import { Edit2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";

export default function UserHeader({ profile, onStatusUpdate }) {
  const { lang } = useTranslation();
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusText, setStatusText] = useState(profile?.status_text || "");

  const saveStatus = async () => {
    if (statusText.length > 32) {
      toast.error(lang === "es" ? "Máximo 32 caracteres" : "Max 32 characters");
      return;
    }

    try {
      await base44.entities.UserProfile.update(profile.id, {
        status_text: statusText,
        status_updated_at: new Date().toISOString()
      });
      onStatusUpdate(statusText);
      setIsEditingStatus(false);
      toast.success(lang === "es" ? "Estado actualizado" : "Status updated");
    } catch (err) {
      toast.error(lang === "es" ? "Error al actualizar" : "Failed to update");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (lang === "es") {
      if (hour < 12) return "Buenos días";
      if (hour < 20) return "Buenas tardes";
      return "Buenas noches";
    } else {
      if (hour < 12) return "Good morning";
      if (hour < 18) return "Good afternoon";
      return "Good evening";
    }
  };

  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/60 text-sm">{getGreeting()}</p>
          <h1 className="text-3xl font-black text-white">{profile?.display_name || "User"}</h1>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-xs">{formatDate()}</p>
        </div>
      </div>

      {/* Editable Status */}
      <div className="flex items-center gap-2">
        {isEditingStatus ? (
          <>
            <input
              type="text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              maxLength={32}
              placeholder={lang === "es" ? "¿Cómo te sientes?" : "How are you feeling?"}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-teal-400"
              autoFocus
            />
            <button
              onClick={saveStatus}
              className="w-8 h-8 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 flex items-center justify-center transition-colors"
            >
              <Check size={16} className="text-teal-300" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditingStatus(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-sm text-white/70">
              {statusText || (lang === "es" ? "Añade un estado..." : "Add a status...")}
            </span>
            <Edit2 size={14} className="text-white/40" />
          </button>
        )}
      </div>
    </div>
  );
}