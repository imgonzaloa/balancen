import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import FoodRating from "@/components/ui/FoodRating";
import MovementToggle from "@/components/ui/MovementToggle";
import CheckInButton from "@/components/ui/CheckInButton";

export default function QuickCheckIn({ onComplete, todayCheckIn }) {
  const [step, setStep] = useState(todayCheckIn ? "done" : "main");
  const [foodRating, setFoodRating] = useState(todayCheckIn?.food_rating || null);
  const [movedToday, setMovedToday] = useState(todayCheckIn?.moved_today ?? null);
  const [photoUrl, setPhotoUrl] = useState(todayCheckIn?.food_photo_url || null);
  const [estimatedCal, setEstimatedCal] = useState(todayCheckIn?.estimated_calories || null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
      setUploading(false);
      
      setAnalyzing(true);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: "Analiza esta imagen de comida y estima las calorías totales aproximadas. Sé breve y da solo el número estimado de calorías. Si no puedes identificar comida, responde con 0.",
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            calories: { type: "number", description: "Estimated total calories" },
            food_items: { type: "string", description: "Brief description of food" }
          }
        }
      });
      setEstimatedCal(result.calories || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    
    const checkInData = {
      date: today,
      food_rating: foodRating,
      moved_today: movedToday,
      food_photo_url: photoUrl,
      estimated_calories: estimatedCal,
      completed: true
    };

    await onComplete(checkInData);
    setStep("done");
    setSaving(false);
  };

  const canSubmit = foodRating !== null || movedToday !== null;

  if (step === "done" || todayCheckIn) {
    return (
      <motion.div 
        className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-emerald-800">¡Check-in completado!</h3>
            <p className="text-emerald-600 text-sm">Sigue así mañana</p>
          </div>
        </div>
        
        {(todayCheckIn?.food_rating || foodRating) && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 mt-3">
            <span>Comida:</span>
            <span className="font-medium capitalize">
              {(todayCheckIn?.food_rating || foodRating) === "great" ? "Bien" : 
               (todayCheckIn?.food_rating || foodRating) === "ok" ? "Ok" : "Mal"}
            </span>
          </div>
        )}
        
        {(todayCheckIn?.estimated_calories || estimatedCal) && (
          <div className="text-sm text-emerald-700">
            Calorías estimadas: ~{todayCheckIn?.estimated_calories || estimatedCal} kcal
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="font-bold text-xl text-slate-800 mb-6">¿Cómo fue hoy?</h3>
      
      <div className="space-y-6">
        {/* Food Rating */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-3">
            ¿Cómo comiste?
          </label>
          <FoodRating value={foodRating} onChange={setFoodRating} />
        </div>

        {/* Photo Option */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-3">
            Foto de comida (opcional)
          </label>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
          />
          
          {photoUrl ? (
            <div className="relative">
              <img 
                src={photoUrl} 
                alt="Comida" 
                className="w-full h-40 object-cover rounded-2xl"
              />
              <button
                onClick={() => {
                  setPhotoUrl(null);
                  setEstimatedCal(null);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-white" />
              </button>
              {analyzing ? (
                <div className="absolute bottom-2 left-2 bg-white/90 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-teal-500" />
                  <span className="text-sm">Analizando...</span>
                </div>
              ) : estimatedCal !== null && (
                <div className="absolute bottom-2 left-2 bg-white/90 rounded-xl px-3 py-2">
                  <span className="text-sm font-medium">~{estimatedCal} kcal</span>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-300 hover:bg-teal-50/50"
            >
              {uploading ? (
                <Loader2 size={20} className="animate-spin mr-2" />
              ) : (
                <Camera size={20} className="mr-2 text-teal-500" />
              )}
              <span className="text-slate-600">
                {uploading ? "Subiendo..." : "Tomar foto"}
              </span>
            </Button>
          )}
        </div>

        {/* Movement */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-3">
            ¿Te moviste hoy?
          </label>
          <MovementToggle value={movedToday} onChange={setMovedToday} />
        </div>

        {/* Submit */}
        <CheckInButton 
          completed={false} 
          onClick={handleSubmit} 
          loading={saving}
        />
        
        {!canSubmit && (
          <p className="text-center text-sm text-slate-400">
            Selecciona al menos una opción
          </p>
        )}
      </div>
    </motion.div>
  );
}