import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Drop-in fallback for AI/network failures.
 * Usage: <AIErrorFallback onRetry={fetchFn} message="Optional custom message" />
 */
export default function AIErrorFallback({ onRetry, message, lang = "en" }) {
  const text = message || (lang === "es"
    ? "No se pudo conectar. Revisa tu conexión e inténtalo de nuevo."
    : "Couldn't connect. Check your internet and try again.");

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
        <AlertCircle size={28} className="text-white/50" />
      </div>
      <p className="text-white/60 text-sm leading-relaxed max-w-xs">{text}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 text-sm font-semibold active:scale-95 transition-transform"
        >
          <RefreshCw size={15} />
          {lang === "es" ? "Reintentar" : "Retry"}
        </button>
      )}
    </div>
  );
}