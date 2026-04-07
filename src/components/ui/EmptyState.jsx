import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * Reusable illustrated empty state block.
 * Props:
 *   emoji        – large emoji (e.g. "🍽️")
 *   headline     – { es, en, pt } or plain string
 *   subtitle     – { es, en, pt } or plain string  (optional)
 *   buttonLabel  – { es, en, pt } or plain string  (optional)
 *   buttonPage   – page name for navigate (optional)
 *   onButton     – custom click handler (overrides buttonPage)
 *   lang         – current language (defaults to 'es')
 */
export default function EmptyState({ emoji, headline, subtitle, buttonLabel, buttonPage, onButton, lang = "es" }) {
  const navigate = useNavigate();

  const resolve = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[lang] || val.en || "";
  };

  const handleClick = () => {
    if (onButton) return onButton();
    if (buttonPage) navigate(createPageUrl(buttonPage));
  };

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {/* Illustrated placeholder */}
      <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/10 flex items-center justify-center mb-6 text-5xl shadow-inner">
        {emoji}
      </div>

      <h3 className="text-white font-black text-xl mb-2">{resolve(headline)}</h3>

      {subtitle && (
        <p className="text-white/50 text-sm max-w-xs mb-6">{resolve(subtitle)}</p>
      )}

      {buttonLabel && (buttonPage || onButton) && (
        <button
          onClick={handleClick}
          className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl text-white font-semibold text-sm transition-all"
        >
          {resolve(buttonLabel)}
        </button>
      )}
    </div>
  );
}