import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Flag, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { createPortal } from "react-dom";

const copy = {
  en: {
    report: "Report post",
    block: "Block user",
    report_title: "Why are you reporting this?",
    reasons: [
      { key: "inappropriate_content", label: "Inappropriate content" },
      { key: "spam", label: "Spam" },
      { key: "harassment", label: "Harassment" },
      { key: "other", label: "Other" },
    ],
    cancel: "Cancel",
    submit: "Submit Report",
    report_success: "Reported. We'll review this.",
    block_success: "User blocked.",
  },
  es: {
    report: "Reportar publicación",
    block: "Bloquear usuario",
    report_title: "¿Por qué reportas esto?",
    reasons: [
      { key: "inappropriate_content", label: "Contenido inapropiado" },
      { key: "spam", label: "Spam" },
      { key: "harassment", label: "Acoso" },
      { key: "other", label: "Otro" },
    ],
    cancel: "Cancelar",
    submit: "Enviar reporte",
    report_success: "Reportado. Lo revisaremos.",
    block_success: "Usuario bloqueado.",
  },
  pt: {
    report: "Denunciar publicação",
    block: "Bloquear usuário",
    report_title: "Por que você está denunciando isso?",
    reasons: [
      { key: "inappropriate_content", label: "Conteúdo inapropriado" },
      { key: "spam", label: "Spam" },
      { key: "harassment", label: "Assédio" },
      { key: "other", label: "Outro" },
    ],
    cancel: "Cancelar",
    submit: "Enviar denúncia",
    report_success: "Denunciado. Vamos revisar.",
    block_success: "Usuário bloqueado.",
  },
};

export default function PostModerationMenu({ contentId, authorEmail, currentUserEmail, lang = "en", onBlocked }) {
  const [open, setOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const menuRef = useRef(null);
  const t = copy[lang] || copy.en;

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  if (authorEmail === currentUserEmail) return null;

  const handleReport = async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    try {
      await base44.entities.Report.create({
        reported_content_id: contentId,
        reported_user_email: authorEmail,
        reason: selectedReason,
        reporter_email: currentUserEmail,
      });
      toast.success(t.report_success);
      setShowReportModal(false);
      setSelectedReason(null);
    } catch (err) {
      console.error("Report error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlock = async () => {
    setOpen(false);
    try {
      await base44.entities.Block.create({
        blocked_user_email: authorEmail,
        blocker_email: currentUserEmail,
      });
      toast.success(t.block_success);
      onBlocked?.();
    } catch (err) {
      console.error("Block error:", err);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
        style={{ touchAction: "manipulation" }}
      >
        <MoreHorizontal size={18} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-8 z-50 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[180px]"
          style={{ pointerEvents: "auto" }}
        >
          <button
            onClick={() => { setOpen(false); setShowReportModal(true); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 text-sm transition-colors"
          >
            <Flag size={15} className="text-amber-400 flex-shrink-0" />
            {t.report}
          </button>
          <div className="border-t border-white/10" />
          <button
            onClick={handleBlock}
            className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 text-sm transition-colors"
          >
            <X size={15} className="text-red-400 flex-shrink-0" />
            {t.block}
          </button>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && createPortal(
        <>
          <div
            onClick={() => setShowReportModal(false)}
            style={{ position: "fixed", inset: 0, zIndex: 30000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          />
          <div
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30001,
              background: "#1e293b",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px 20px 0 0",
              padding: "24px",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)",
            }}
          >
            <h3 style={{ color: "#fff", fontSize: "17px", fontWeight: 700, marginBottom: "16px" }}>
              {t.report_title}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
              {t.reasons.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setSelectedReason(r.key)}
                  style={{
                    padding: "13px 16px",
                    borderRadius: "12px",
                    border: selectedReason === r.key ? "1.5px solid #14b8a6" : "1px solid rgba(255,255,255,0.1)",
                    background: selectedReason === r.key ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.05)",
                    color: selectedReason === r.key ? "#5eead4" : "rgba(255,255,255,0.75)",
                    fontSize: "14px",
                    fontWeight: 500,
                    textAlign: "left",
                    cursor: "pointer",
                    touchAction: "manipulation",
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleReport}
              disabled={!selectedReason || submitting}
              style={{
                width: "100%", padding: "14px",
                borderRadius: "12px",
                background: selectedReason ? "linear-gradient(135deg,#14b8a6,#10b981)" : "rgba(255,255,255,0.1)",
                border: "none",
                color: "#fff", fontWeight: 700, fontSize: "15px",
                cursor: selectedReason ? "pointer" : "not-allowed",
                marginBottom: "10px",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {t.submit}
            </button>
            <button
              onClick={() => { setShowReportModal(false); setSelectedReason(null); }}
              style={{
                width: "100%", padding: "13px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.55)", fontWeight: 600, fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {t.cancel}
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}