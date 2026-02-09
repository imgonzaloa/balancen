import React, { useState } from "react";
import { Edit2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function UserStatusHeader({ profile, onStatusUpdate, lang }) {
  const [isEditing, setIsEditing] = useState(false);
  const [statusText, setStatusText] = useState(profile?.status_text || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile?.id) return;
    
    setSaving(true);
    try {
      await base44.entities.UserProfile.update(profile.id, {
        status_text: statusText.slice(0, 32),
        status_updated_at: new Date().toISOString(),
      });
      
      toast.success(lang === "es" ? "Estado actualizado" : "Status updated");
      onStatusUpdate?.();
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error(lang === "es" ? "Error al actualizar" : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const currentDate = new Date().toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  return (
    <div className="mb-6">
      <p className="text-white/50 text-sm mb-2">{currentDate}</p>
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-black text-white">
          {lang === "es" ? "Hola" : "Hello"}, {profile?.display_name || "User"}
        </h1>
      </div>
      
      {isEditing ? (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            maxLength={32}
            placeholder={lang === "es" ? "Tu estado..." : "Your status..."}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 text-sm focus:outline-none focus:border-teal-500"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "..." : (lang === "es" ? "Guardar" : "Save")}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm"
          >
            {lang === "es" ? "Cancelar" : "Cancel"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="mt-2 flex items-center gap-2 text-white/60 hover:text-white text-sm group"
        >
          {profile?.status_text ? (
            <span className="italic">"{profile.status_text}"</span>
          ) : (
            <span>{lang === "es" ? "Agregar estado..." : "Add status..."}</span>
          )}
          <Edit2 size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}
    </div>
  );
}