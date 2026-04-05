import React, { createContext, useContext, useState, useEffect } from "react";

// Module-level stable store — same reference as CameraScreen's _captureStore
// Exported so CameraScreen can import it if needed (they share the same module instance)
export const _mealCaptureStore = { file: null, dataUrl: null };

const MealContext = createContext(null);

export function MealProvider({ children }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Restore from module-level store first (fastest, survives navigation within same session)
  // then fall back to sessionStorage
  useEffect(() => {
    if (_mealCaptureStore.file && !file) {
      console.log("Restoring file from module store");
      setFile(_mealCaptureStore.file);
      const url = _mealCaptureStore.dataUrl || URL.createObjectURL(_mealCaptureStore.file);
      setPreviewUrl(url);
      setStatus("captured");
      return;
    }
    let storedDataUrl = null;
    try {
      storedDataUrl = sessionStorage.getItem("balancen_last_capture") || localStorage.getItem("meal_last_capture_dataurl");
    } catch (_) {}
    if (storedDataUrl && !file) {
      fetch(storedDataUrl)
        .then(res => res.blob())
        .then(blob => {
          if (blob.size === 0) throw new Error("zero size");
          const restoredFile = new File([blob], "meal.jpg", { type: "image/jpeg" });
          _mealCaptureStore.file = restoredFile;
          _mealCaptureStore.dataUrl = storedDataUrl;
          setFile(restoredFile);
          setPreviewUrl(storedDataUrl);
          setStatus("captured");
        })
        .catch(() => {
          try { sessionStorage.removeItem("balancen_last_capture"); } catch (_) {}
          try { localStorage.removeItem("meal_last_capture_dataurl"); } catch (_) {}
        });
    }
  }, []);

  const setCapturedFile = (capturedFile, dataUrl) => {
    // Also update module-level store for cross-render stability
    _mealCaptureStore.file = capturedFile;
    _mealCaptureStore.dataUrl = dataUrl || null;
    console.log("📦 CONTEXT_STORE_FILE", {
      fileSize: capturedFile?.size,
      hasDataUrl: !!dataUrl,
      dataUrlLength: dataUrl?.length
    });
    
    setFile(capturedFile);
    const url = URL.createObjectURL(capturedFile);
    setPreviewUrl(url);
    setStatus("captured");
    setError(null);
    setResult(null);
    
    // Store dataUrl in sessionStorage only — localStorage quota on iOS is ~5MB and
    // a single JPEG dataUrl can be 1–3MB, causing QuotaExceededError which crashes the app.
    if (dataUrl) {
      try {
        sessionStorage.setItem("balancen_last_capture", dataUrl);
        console.log("✅ STORAGE_SUCCESS - photo saved to sessionStorage");
      } catch (err) {
        console.warn("⚠️ STORAGE_FAILED (sessionStorage):", err.message);
      }
      // Only attempt localStorage as fallback if dataUrl is small enough (<500KB)
      if (dataUrl.length < 500_000) {
        try {
          localStorage.setItem("meal_last_capture_dataurl", dataUrl);
        } catch (_) {}
      } else {
        try { localStorage.removeItem("meal_last_capture_dataurl"); } catch (_) {}
      }
    } else {
      console.warn("⚠️ NO_DATAURL_PROVIDED");
    }
  };

  const clearCapture = () => {
    _mealCaptureStore.file = null;
    _mealCaptureStore.dataUrl = null;
    setFile(null);
    setPreviewUrl(null);
    setStatus("idle");
    setResult(null);
    setError(null);
    sessionStorage.removeItem("balancen_last_capture");
    localStorage.removeItem("meal_last_capture_dataurl");
  };

  const resetMeal = clearCapture;

  const updateStatus = (newStatus) => {
    setStatus(newStatus);
  };

  const setAnalysisResult = (analysisResult) => {
    setResult(analysisResult);
    setStatus("done");
  };

  const setAnalysisError = (errorMsg) => {
    setError(errorMsg);
    setStatus("error");
  };

  return (
    <MealContext.Provider
      value={{
        file,
        capturedFile: file,
        previewUrl,
        status,
        result,
        error,
        setCapturedFile,
        clearCapture,
        resetMeal,
        updateStatus,
        setAnalysisResult,
        setAnalysisError,
      }}
    >
      {children}
    </MealContext.Provider>
  );
}

export function useMeal() {
  const context = useContext(MealContext);
  if (!context) {
    throw new Error("useMeal must be used within MealProvider");
  }
  return context;
}