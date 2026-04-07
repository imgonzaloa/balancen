import React from "react";
import { Camera, Image } from "lucide-react";

/**
 * Shown before requesting camera/gallery permission.
 * Displays the purpose string so the OS prompt is contextualised.
 * onConfirm → proceed to request permission
 * onGallery → go straight to gallery (no camera permission needed)
 * onDismiss → cancel
 */
export default function CameraPermissionPrompt({ mode = "camera", onConfirm, onGallery, onDismiss, lang = "en" }) {
  const isCam = mode === "camera";
  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm px-4 pb-8">
      <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center">
            {isCam ? <Camera size={22} className="text-teal-300" /> : <Image size={22} className="text-teal-300" />}
          </div>
          <h3 className="text-white font-bold text-lg">
            {isCam
              ? (lang === "es" ? "Acceso a la cámara" : lang === "nl" ? "Cameratoegang" : "Camera Access")
              : (lang === "es" ? "Acceso a fotos" : lang === "nl" ? "Fototoegang" : "Photo Library Access")}
          </h3>
        </div>

        <p className="text-white/70 text-sm leading-relaxed mb-6">
          {isCam
            ? (lang === "es" ? "Usamos la cámara para escanear y registrar tus comidas." : lang === "nl" ? "We gebruiken de camera om voedsel te scannen en in te loggen." : "Used to scan and log meals.")
            : (lang === "es" ? "Usamos tu biblioteca de fotos para seleccionar fotos de comidas." : lang === "nl" ? "We gebruiken je galerij om voedingsfoto's te selecteren." : "Used to select meal photos.")}
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold transition-colors"
          >
            {isCam
              ? (lang === "es" ? "Permitir cámara" : lang === "nl" ? "Camera toestaan" : "Allow Camera")
              : (lang === "es" ? "Permitir fotos" : lang === "nl" ? "Foto's toestaan" : "Allow Photos")}
          </button>
          {isCam && onGallery && (
            <button
              onClick={onGallery}
              className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white/80 font-semibold"
            >
              {lang === "es" ? "Usar galería en su lugar" : lang === "nl" ? "Galerij gebruiken" : "Use Gallery Instead"}
            </button>
          )}
          <button
            onClick={onDismiss}
            className="w-full py-3 rounded-xl text-white/50 text-sm"
          >
            {lang === "es" ? "Cancelar" : lang === "nl" ? "Annuleren" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}