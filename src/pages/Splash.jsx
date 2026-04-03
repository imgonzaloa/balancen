import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { getLocalLanguage } from "@/lib/language";

const SPLASH_SHOWN_KEY = "balancen_splash_shown";

export default function Splash() {
  const navigate = useNavigate();
  const [logoVisible, setLogoVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    // Animate logo in
    const t1 = setTimeout(() => setLogoVisible(true), 50);
    // Animate text in slightly after logo
    const t2 = setTimeout(() => setTextVisible(true), 300);

    // After splash duration, check auth and navigate
    const t3 = setTimeout(async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          navigate(createPageUrl("Home"), { replace: true });
        } else {
          base44.auth.redirectToLogin();
        }
      } catch {
        navigate(createPageUrl("Home"), { replace: true });
      }
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [navigate]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #065f46 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
      }}
    >
      {/* Logo */}
      <div
        style={{
          transition: "opacity 350ms ease, transform 350ms ease",
          opacity: logoVisible ? 1 : 0,
          transform: logoVisible ? "scale(1)" : "scale(0.95)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {/* Icon mark */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, #14b8a6, #10b981)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 20px 60px rgba(20,184,166,0.4)",
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: "48px",
              fontWeight: 900,
              lineHeight: 1,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            B
          </span>
        </div>

        {/* Brand name */}
        <span
          style={{
            color: "#ffffff",
            fontSize: "32px",
            fontWeight: 800,
            letterSpacing: "-0.5px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          Balancen
        </span>
      </div>

      {/* Tagline */}
      <p
        style={{
          transition: "opacity 300ms ease",
          opacity: textVisible ? 0.85 : 0,
          color: "#ffffff",
          fontSize: "15px",
          fontWeight: 500,
          marginTop: "24px",
          letterSpacing: "0.02em",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {(() => {
          const lang = getLocalLanguage() || '';
          if (lang.startsWith('es')) return 'Sé constante.';
          if (lang.startsWith('pt')) return 'Seja consistente.';
          return 'Stay consistent.';
        })()}
      </p>
    </div>
  );
}