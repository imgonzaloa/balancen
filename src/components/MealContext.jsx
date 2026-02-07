import React, { createContext, useContext, useState, useEffect } from "react";

const MealContext = createContext(null);

export function MealProvider({ children }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Restore from localStorage on mount
  useEffect(() => {
    const storedDataUrl = localStorage.getItem("meal_last_capture_dataurl");
    if (storedDataUrl && !file) {
      try {
        // Convert dataUrl back to File
        fetch(storedDataUrl)
          .then(res => res.blob())
          .then(blob => {
            const restoredFile = new File([blob], "meal.jpg", { type: "image/jpeg" });
            setFile(restoredFile);
            setPreviewUrl(URL.createObjectURL(restoredFile));
            setStatus("captured");
          })
          .catch(() => {
            localStorage.removeItem("meal_last_capture_dataurl");
          });
      } catch (err) {
        localStorage.removeItem("meal_last_capture_dataurl");
      }
    }
  }, []);

  const setCapturedFile = (capturedFile, dataUrl) => {
    setFile(capturedFile);
    const url = URL.createObjectURL(capturedFile);
    setPreviewUrl(url);
    setStatus("captured");
    setError(null);
    setResult(null);
    
    // Store dataUrl in localStorage for persistence
    if (dataUrl) {
      localStorage.setItem("meal_last_capture_dataurl", dataUrl);
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
    localStorage.removeItem("meal_last_capture_dataurl");
  };

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
        previewUrl,
        status,
        result,
        error,
        setCapturedFile,
        clearCapture,
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