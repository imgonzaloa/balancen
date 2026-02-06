import React, { createContext, useContext, useState } from "react";

const MealContext = createContext();

export function MealProvider({ children }) {
  const [capturedFile, setCapturedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const resetMeal = () => {
    setCapturedFile(null);
    setAnalysisResult(null);
  };

  return (
    <MealContext.Provider
      value={{
        capturedFile,
        setCapturedFile,
        analysisResult,
        setAnalysisResult,
        resetMeal
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