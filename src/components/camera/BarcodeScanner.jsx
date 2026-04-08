import React, { useRef, useState, useEffect, useCallback } from "react";
import { X, Search, Loader2, AlertCircle, Camera } from "lucide-react";

const LABELS = {
  es: {
    title: "Escanear código de barras",
    scanning: "Buscando código...",
    searching: "Buscando producto...",
    not_found: "Producto no encontrado",
    not_found_sub: "Probá buscar manualmente o tomá una foto para análisis IA.",
    manual_placeholder: "Ingresá el código de barras...",
    search_btn: "Buscar",
    use_ai: "Usar análisis IA",
    found: "Producto encontrado",
    no_detector: "Tu dispositivo no soporta escaneo automático.",
    try_manual: "Podés ingresar el código manualmente.",
    cancel: "Cancelar",
    no_nutrition: "Sin datos nutricionales",
    no_nutrition_sub: "Este producto no tiene información nutricional. Tomá una foto para análisis IA.",
  },
  nl: {
    title: "Streepjescode scannen",
    scanning: "Code zoeken...",
    searching: "Product zoeken...",
    not_found: "Product niet gevonden",
    not_found_sub: "Probeer handmatig te zoeken of maak een foto voor AI-analyse.",
    manual_placeholder: "Voer streepjescode in...",
    search_btn: "Zoeken",
    use_ai: "AI-analyse gebruiken",
    found: "Product gevonden",
    no_detector: "Uw apparaat ondersteunt geen automatisch scannen.",
    try_manual: "U kunt de code handmatig invoeren.",
    cancel: "Annuleren",
    no_nutrition: "Geen voedingsgegevens",
    no_nutrition_sub: "Dit product heeft geen voedingsinformatie. Maak een foto voor AI-analyse.",
  },
  en: {
    title: "Scan barcode",
    scanning: "Scanning for barcode...",
    searching: "Looking up product...",
    not_found: "Product not found",
    not_found_sub: "Try searching manually or take a photo for AI analysis.",
    manual_placeholder: "Enter barcode...",
    search_btn: "Search",
    use_ai: "Use AI photo analysis",
    found: "Product found",
    no_detector: "Your device doesn't support automatic scanning.",
    try_manual: "You can enter the barcode manually.",
    cancel: "Cancel",
    no_nutrition: "No nutrition data",
    no_nutrition_sub: "This product has no nutrition info. Take a photo for AI analysis.",
  },
};

async function lookupBarcode(barcode) {
  const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return data.product;
}

function parseNutrition(product) {
  const n = product.nutriments || {};
  const serving = product.serving_size || "100g";
  // Prefer per-serving if available, else per 100g
  const calories = Math.round(n["energy-kcal_serving"] || n["energy-kcal_100g"] || (n["energy_serving"] || n["energy_100g"] || 0) / 4.184);
  const protein = Math.round(n["proteins_serving"] ?? n["proteins_100g"] ?? 0);
  const carbs = Math.round(n["carbohydrates_serving"] ?? n["carbohydrates_100g"] ?? 0);
  const fats = Math.round(n["fat_serving"] ?? n["fat_100g"] ?? 0);
  return { calories, protein, carbs, fats, serving };
}

export default function BarcodeScanner({ lang = "en", videoStream, onResult, onUseAI, onClose }) {
  const l = LABELS[lang] || LABELS.en;
  const scanVideoRef = useRef(null);
  const detectorRef = useRef(null);
  const animFrameRef = useRef(null);
  const mountedRef = useRef(true);

  const [mode, setMode] = useState("init"); // init | scanning | manual | searching | found | not_found | no_nutrition | error
  const [manualInput, setManualInput] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [foundProduct, setFoundProduct] = useState(null);
  const [foundNutrition, setFoundNutrition] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleProductFound = useCallback(async (barcode) => {
    if (!mountedRef.current) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setMode("searching");
    setStatusMsg(l.searching);

    const product = await lookupBarcode(barcode);
    if (!mountedRef.current) return;

    if (!product) {
      setMode("not_found");
      return;
    }

    const nutrition = parseNutrition(product);
    if (nutrition.calories === 0 && nutrition.protein === 0 && nutrition.carbs === 0 && nutrition.fats === 0) {
      setMode("no_nutrition");
      setFoundProduct(product);
      return;
    }

    setFoundProduct(product);
    setFoundNutrition(nutrition);
    setMode("found");
  }, [l]);

  // Start BarcodeDetector scanning against the live stream
  useEffect(() => {
    if (!videoStream) return;
    const hasBD = "BarcodeDetector" in window;
    if (!hasBD) {
      setMode("manual");
      return;
    }

    detectorRef.current = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf", "qr_code"] });
    setMode("scanning");
    setStatusMsg(l.scanning);

    // Attach stream to hidden video element for frame capture
    const scanVid = document.createElement("video");
    scanVid.srcObject = videoStream;
    scanVid.playsInline = true;
    scanVid.muted = true;
    scanVid.play().catch(() => {});
    scanVideoRef.current = scanVid;

    let found = false;
    const tick = async () => {
      if (!mountedRef.current || found) return;
      if (scanVid.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }
      try {
        const barcodes = await detectorRef.current.detect(scanVid);
        if (barcodes.length > 0 && !found) {
          found = true;
          if (navigator.vibrate) navigator.vibrate(50);
          await handleProductFound(barcodes[0].rawValue);
          return;
        }
      } catch (_) {}
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      scanVid.srcObject = null;
    };
  }, [videoStream, l.scanning, handleProductFound]);

  const handleManualSearch = useCallback(async () => {
    const code = manualInput.trim();
    if (!code) return;
    setMode("searching");
    await handleProductFound(code);
  }, [manualInput, handleProductFound]);

  const handleConfirm = useCallback(() => {
    if (!foundNutrition || !foundProduct) return;
    onResult({
      productName: foundProduct.product_name || foundProduct.abbreviated_product_name || "Product",
      imageUrl: foundProduct.image_url || foundProduct.image_small_url || null,
      nutrition: foundNutrition,
    });
  }, [foundNutrition, foundProduct, onResult]);

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        zIndex: 20001,
        background: "#0f172a",
        borderTop: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "24px 24px 0 0",
        padding: "24px",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)",
        pointerEvents: "auto",
        touchAction: "pan-y",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h3 style={{ color: "#fff", fontSize: "20px", fontWeight: 700, margin: 0 }}>{l.title}</h3>
        <button
          onClick={onClose}
          style={{
            padding: "8px", borderRadius: "8px",
            background: "rgba(255,255,255,0.08)", border: "none",
            cursor: "pointer", pointerEvents: "auto", touchAction: "manipulation",
            color: "rgba(255,255,255,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* SCANNING state */}
      {mode === "scanning" && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", border: "4px solid rgba(16,185,129,0.3)", borderTopColor: "#10b981", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: 600 }}>{l.scanning}</p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 8 }}>
            {lang === "es" ? "Apuntá la cámara al código de barras" : lang === "nl" ? "Richt de camera op de streepjescode" : "Point camera at the barcode"}
          </p>
          <button onClick={() => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); setMode("manual"); }}
            style={{ marginTop: 20, color: "rgba(16,185,129,0.8)", fontSize: 14, fontWeight: 600, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            {lang === "es" ? "Ingresar código manualmente" : lang === "nl" ? "Code handmatig invoeren" : "Enter code manually"}
          </button>
        </div>
      )}

      {/* MANUAL state */}
      {(mode === "manual" || mode === "not_found") && (
        <div>
          {mode === "not_found" && (
            <div style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <AlertCircle size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ color: "#fbbf24", fontSize: 13, fontWeight: 600, margin: 0 }}>{l.not_found}</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "4px 0 0" }}>{l.not_found_sub}</p>
              </div>
            </div>
          )}
          {mode === "manual" && !("BarcodeDetector" in window) && (
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16 }}>{l.no_detector} {l.try_manual}</p>
          )}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleManualSearch(); }}
              placeholder={l.manual_placeholder}
              autoFocus
              style={{
                flex: 1, padding: "13px 14px", borderRadius: 12,
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff", fontSize: 15, outline: "none",
              }}
            />
            <button
              onClick={handleManualSearch}
              style={{
                padding: "13px 16px", borderRadius: 12,
                background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)",
                color: "#6ee7b7", fontWeight: 700, fontSize: 15,
                cursor: "pointer", pointerEvents: "auto", touchAction: "manipulation",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Search size={16} />
            </button>
          </div>
          <button
            onClick={onUseAI}
            style={{
              width: "100%", padding: "13px", borderRadius: 12,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 14,
              cursor: "pointer", pointerEvents: "auto", touchAction: "manipulation",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Camera size={15} />
            {l.use_ai}
          </button>
        </div>
      )}

      {/* SEARCHING state */}
      {mode === "searching" && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "rgba(255,255,255,0.7)" }}>
            <Loader2 size={20} className="animate-spin" />
            <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{l.searching}</p>
          </div>
        </div>
      )}

      {/* NO_NUTRITION state */}
      {mode === "no_nutrition" && (
        <div>
          {foundProduct && (
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
              {foundProduct.image_small_url && (
                <img src={foundProduct.image_small_url} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
              )}
              <div>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: 0 }}>{foundProduct.product_name || "Product"}</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{foundProduct.brands || ""}</p>
              </div>
            </div>
          )}
          <div style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
            <p style={{ color: "#fbbf24", fontSize: 13, fontWeight: 600, margin: 0 }}>{l.no_nutrition}</p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "4px 0 0" }}>{l.no_nutrition_sub}</p>
          </div>
          <button
            onClick={onUseAI}
            style={{
              width: "100%", padding: "14px", borderRadius: 12,
              background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)",
              color: "#6ee7b7", fontWeight: 600, fontSize: 15,
              cursor: "pointer", pointerEvents: "auto", touchAction: "manipulation",
            }}
          >
            {l.use_ai}
          </button>
        </div>
      )}

      {/* FOUND state */}
      {mode === "found" && foundProduct && foundNutrition && (
        <div>
          {/* Product card */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
            {foundProduct.image_small_url && (
              <img src={foundProduct.image_small_url} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {foundProduct.product_name || "Product"}
              </p>
              {foundProduct.brands && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{foundProduct.brands}</p>}
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>
                {lang === "es" ? `Por porción: ${foundNutrition.serving}` : lang === "nl" ? `Per portie: ${foundNutrition.serving}` : `Per serving: ${foundNutrition.serving}`}
              </p>
            </div>
          </div>

          {/* Nutrition grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
            {[
              { label: lang === "es" ? "Calorías" : lang === "nl" ? "Calorieën" : "Calories", value: foundNutrition.calories, unit: "kcal", color: "#34d399" },
              { label: lang === "es" ? "Proteína" : lang === "nl" ? "Eiwit" : "Protein", value: foundNutrition.protein, unit: "g", color: "#60a5fa" },
              { label: lang === "es" ? "Carbs" : "Carbs", value: foundNutrition.carbs, unit: "g", color: "#fbbf24" },
              { label: lang === "es" ? "Grasa" : lang === "nl" ? "Vet" : "Fat", value: foundNutrition.fats, unit: "g", color: "#f472b6" },
            ].map(({ label, value, unit, color }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
                <p style={{ color, fontWeight: 800, fontSize: 18, margin: 0 }}>{value}</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleConfirm}
            style={{
              width: "100%", padding: "15px",
              borderRadius: 14,
              background: "linear-gradient(135deg, #14b8a6, #10b981)",
              border: "none",
              color: "#fff", fontWeight: 800, fontSize: 16,
              cursor: "pointer", pointerEvents: "auto", touchAction: "manipulation",
              marginBottom: 10,
            }}
          >
            {lang === "es" ? "Guardar esta comida" : lang === "nl" ? "Maaltijd opslaan" : "Save this meal"}
          </button>
          <button
            onClick={onUseAI}
            style={{
              width: "100%", padding: "13px", borderRadius: 12,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 14,
              cursor: "pointer", pointerEvents: "auto", touchAction: "manipulation",
            }}
          >
            {l.use_ai}
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}