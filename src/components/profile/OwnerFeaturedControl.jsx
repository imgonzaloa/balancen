import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function OwnerFeaturedControl() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setLoading(true);
    try {
      const profiles = await base44.entities.UserProfile.filter({ created_by: trimmed });
      if (!profiles?.length) {
        toast.error("No profile found for that email");
        setLoading(false);
        return;
      }
      const p = profiles[0];
      const newValue = !p.is_featured;
      await base44.entities.UserProfile.update(p.id, { is_featured: newValue });
      toast.success(newValue ? "User marked as Featured Athlete ⭐" : "User removed from Featured");
      setEmail("");
    } catch (err) {
      toast.error("Error: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="border-t border-white/10 pt-4 mt-4">
      <p className="text-white/40 text-xs uppercase tracking-wider mb-4">Owner Controls</p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter user email..."
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/40"
        />
        <button
          onClick={handleToggle}
          disabled={loading || !email.trim()}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl px-4 py-3 text-sm disabled:opacity-50 whitespace-nowrap"
        >
          ⭐ Toggle Featured
        </button>
      </div>
      <p className="text-white/30 text-xs mt-2">Featured users appear highlighted in the Discovery feed</p>
    </div>
  );
}