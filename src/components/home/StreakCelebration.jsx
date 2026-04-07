import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

const CONFETTI = ["🎉", "🔥", "⭐", "🏆", "✨", "💪", "🎊", "🥇"];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  emoji: CONFETTI[i % CONFETTI.length],
  x: randomBetween(5, 95),
  delay: randomBetween(0, 0.6),
  duration: randomBetween(1.2, 2.2),
  size: randomBetween(20, 38),
}));

const copy = {
  es: {
    7:  { title: "¡7 días seguidos! 🔥", sub: "¡Eres imparable!" },
    14: { title: "¡14 días! 🏆", sub: "¡Dos semanas de racha!" },
    30: { title: "¡30 días! 🌟", sub: "¡Un mes entero. Increíble!" },
  },
  en: {
    7:  { title: "7-day streak! 🔥", sub: "You're on fire!" },
    14: { title: "14 days! 🏆", sub: "Two whole weeks!" },
    30: { title: "30 days! 🌟", sub: "A full month. Incredible!" },
  },
  pt: {
    7:  { title: "7 dias seguidos! 🔥", sub: "Você é imparável!" },
    14: { title: "14 dias! 🏆", sub: "Duas semanas de sequência!" },
    30: { title: "30 dias! 🌟", sub: "Um mês inteiro. Incrível!" },
  },
};

export default function StreakCelebration({ streak, lang, onDone }) {
  const [visible, setVisible] = useState(true);
  const l = (copy[lang] || copy.es)[streak];

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 350);
    }, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed", inset: 0, zIndex: 99999,
            background: "rgba(0,0,0,0.82)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 12,
            pointerEvents: "none",
          }}
        >
          {/* Confetti particles */}
          {PARTICLES.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 0, y: -40, x: `${p.x}vw` }}
              animate={{ opacity: [0, 1, 1, 0], y: "110vh", x: `${p.x}vw` }}
              transition={{ delay: p.delay, duration: p.duration, ease: "easeIn" }}
              style={{
                position: "absolute", top: 0, fontSize: p.size,
                left: 0, lineHeight: 1,
              }}
            >
              {p.emoji}
            </motion.span>
          ))}

          {/* Central message */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
            style={{ textAlign: "center", zIndex: 2 }}
          >
            <p style={{ fontSize: 42, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
              {l?.title}
            </p>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", marginTop: 8, fontWeight: 600 }}>
              {l?.sub}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}