import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";

/**
 * Renders children directly into document.body via a dedicated portal div.
 * z-index 50000 — above all app chrome including bottom nav (z-index 1000).
 */
export default function OverlayPortal({ children }) {
  const elRef = useRef(null);

  if (!elRef.current) {
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;inset:0;z-index:50000;pointer-events:none;";
    elRef.current = el;
  }

  useEffect(() => {
    document.body.appendChild(elRef.current);
    return () => {
      if (document.body.contains(elRef.current)) {
        document.body.removeChild(elRef.current);
      }
    };
  }, []);

  return createPortal(children, elRef.current);
}