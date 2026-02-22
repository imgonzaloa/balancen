import { createPortal } from "react-dom";

/**
 * Renders children into #overlay-root at z-index 20000, above all app chrome.
 * The root div itself has pointer-events:none so only explicit modal content is interactive.
 */
export default function OverlayPortal({ children }) {
  const root = document.getElementById("overlay-root");
  if (!root) return null;
  // Ensure overlay-root has correct styles
  root.style.cssText = 'position:fixed;inset:0;z-index:20000;pointer-events:none;';
  return createPortal(children, root);
}