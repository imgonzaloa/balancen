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

  // Restore from sessionStorage on mount (better for camera flow)
  useEffect(() => {
    const storedDataUrl = sessionStorage.getItem("balancen_last_capture") || localStorage.getItem("meal_last_capture_dataurl");
    if (storedDataUrl && !file) {
      console.log("Restoring file from storage");
      try {
        fetch(storedDataUrl)
          .then(res => res.blob())
          .then(blob => {
            if (blob.size === 0) {
              console.error("Restored blob has 0 size");
              sessionStorage.removeItem("balancen_last_capture");
              localStorage.removeItem("meal_last_capture_dataurl");
              return;
            }
            const restoredFile = new File([blob], "meal.jpg", { type: "image/jpeg" });
            console.log("Restored file size:", restoredFile.size);
            setFile(restoredFile);
            setPreviewUrl(URL.createObjectURL(restoredFile));
            setStatus("captured");
          })
          .catch(err => {
            console.error("Failed to restore file:", err);
            sessionStorage.removeItem("balancen_last_capture");
            localStorage.removeItem("meal_last_capture_dataurl");
          });
      } catch (err) {
        console.error("Failed to restore file:", err);
        sessionStorage.removeItem("balancen_last_capture");
        localStorage.removeItem("meal_last_capture_dataurl");
      }
    }
  }, []);

  const setCapturedFile = (capturedFile, dataUrl) => {
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
    
    // Store dataUrl in BOTH sessionStorage (priority) and localStorage (fallback)
    if (dataUrl) {
      try {
        sessionStorage.setItem("balancen_last_capture", dataUrl);
        localStorage.setItem("meal_last_capture_dataurl", dataUrl);
        console.log("✅ STORAGE_SUCCESS - photo saved to storage");
      } catch (err) {
        console.error("❌ STORAGE_FAILED:", err);
      }
    } else {
      console.warn("⚠️ NO_DATAURL_PROVIDED");
    }
  };

  const clearCapture = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
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