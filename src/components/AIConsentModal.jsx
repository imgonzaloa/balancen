import React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CONSENT_KEY = "balancen_ai_consent_given";

const copy = {
  en: {
    title: "AI Food Analysis",
    body: "Your food photos are analyzed by AI to estimate nutritional content. Photos are processed by our AI provider and are not stored permanently.",
    points: [
      "✓ Photos are processed securely",
      "✓ No photos are stored after analysis",
      "✓ You can use manual entry instead",
    ],
    agree: "I Agree — Continue",
    manual: "Use Manual Entry Instead",
  },
  es: {
    title: "Análisis IA de Comidas",
    body: "Tus fotos de comida son analizadas por IA para estimar el contenido nutricional. Las fotos son procesadas por nuestro proveedor de IA y no se almacenan de forma permanente.",
    points: [
      "✓ Las fotos se procesan de forma segura",
      "✓ Ninguna foto se guarda tras el análisis",
      "✓ Puedes usar la entrada manual en su lugar",
    ],
    agree: "Acepto — Continuar",
    manual: "Usar Entrada Manual",
  },
  pt: {
    title: "Análise de Comida com IA",
    body: "Suas fotos de comida são analisadas por IA para estimar o conteúdo nutricional. As fotos são processadas pelo nosso provedor de IA e não são armazenadas permanentemente.",
    points: [
      "✓ Fotos são processadas com segurança",
      "✓ Nenhuma foto é armazenada após a análise",
      "✓ Você pode usar a entrada manual em vez disso",
    ],
    agree: "Concordo — Continuar",
    manual: "Usar Entrada Manual",
  },
};

export function hasAIConsent() {
  return !!localStorage.getItem(CONSENT_KEY);
}

export default function AIConsentModal({ lang = "en", onAgree, onDismiss }) {
  const navigate = useNavigate();
  const t = copy[lang] || copy.en;

  const handleAgree = () => {
    localStorage.setItem(CONSENT_KEY, "1");
    onAgree?.();
  };

  const handleManual = () => {
    onDismiss?.();
    navigate(createPageUrl("AddMeal"));
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 25000,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(4px)",
          pointerEvents: "auto",
        }}
      />
      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 25001,
          background: "#0f172a",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "24px 24px 0 0",
          padding: "28px 24px",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)",
          pointerEvents: "auto",
        }}
      >
        {/* Icon */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <span style={{ fontSize: 40 }}>🤖</span>
        </div>

        {/* Title */}
        <h2 style={{ color: "#fff", fontSize: "20px", fontWeight: 700, marginBottom: "10px", textAlign: "center" }}>
          {t.title}
        </h2>

        {/* Body */}
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.6", marginBottom: "18px", textAlign: "center" }}>
          {t.body}
        </p>

        {/* Points */}
        <div style={{ background: "rgba(20,184,166,0.08)", borderRadius: "14px", padding: "14px 16px", marginBottom: "24px", border: "1px solid rgba(20,184,166,0.2)" }}>
          {t.points.map((point, i) => (
            <p key={i} style={{ color: "#5eead4", fontSize: "13px", fontWeight: 600, marginBottom: i < t.points.length - 1 ? "8px" : 0 }}>
              {point}
            </p>
          ))}
        </div>

        {/* Agree button */}
        <button
          onClick={handleAgree}
          style={{
            width: "100%", padding: "16px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #14b8a6, #10b981)",
            border: "none",
            color: "#fff",
            fontWeight: 700, fontSize: "16px",
            cursor: "pointer",
            marginBottom: "12px",
            pointerEvents: "auto", touchAction: "manipulation",
          }}
        >
          {t.agree}
        </button>

        {/* Manual entry button */}
        <button
          onClick={handleManual}
          style={{
            width: "100%", padding: "14px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.6)",
            fontWeight: 600, fontSize: "15px",
            cursor: "pointer",
            pointerEvents: "auto", touchAction: "manipulation",
          }}
        >
          {t.manual}
        </button>
      </div>
    </>,
    document.body
  );
}