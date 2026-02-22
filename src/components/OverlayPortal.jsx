import { createPortal } from "react-dom";

/**
 * Renders children into #overlay-root which sits above the entire app layout.
 * The overlay-root container has pointer-events:none; each modal inside must set pointer-events:auto.
 */
export default function OverlayPortal({ children }) {
  const root = document.getElementById("overlay-root");
  if (!root) return null;
  return createPortal(children, root);
}