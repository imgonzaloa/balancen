import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAppState } from "@/components/AppStateContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAppState } from "@/components/AppStateContext";

export default function WorkoutTracker() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAppState();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("planId");

  const isPremium = profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator';

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex flex-col items-center justify-center p-6 pb-24">
        <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center mb-6">
          <Lock size={40} className="text-indigo-400" />
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Registro de Entrenamientos - Premium</h2>
        <p className="text-white/70 text-center mb-8">Seguimiento detallado de tus entrenamientos y progresión</p>
        <Button
          onClick={() => navigate(createPageUrl('Premium'))}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-8 py-3"
        >
          Desbloquear Premium
        </Button>
      </div>
    );
  }

  const [exercises, setExercises] = useState([
    { exercise_name: "", sets: 1, weights: [""], reps: [""], rpe: 5, notes: "" },
  ]);
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState("moderate");
  const [energy, setEnergy] = useState(7);
  const [mood, setMood] = useState("");

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData) => {
      const volume = exercises.reduce((sum, ex) => {
        const weight = Math.max(...(ex.weights.map(w => parseFloat(w) || 0)));
        const reps = Math.max(...(ex.reps.map(r => parseFloat(r) || 0)));
        return sum + (weight * reps * ex.sets);
      }, 0);

      return base44.entities.WorkoutSession.create({
        workout_plan_id: planId,
        date: new Date().toISOString().split("T")[0],
        duration_minutes: parseInt(duration) || 0,
        exercises_completed: exercises.map(ex => ({
          exercise_name: ex.exercise_name,
          sets_completed: ex.sets,
          actual_reps: ex.reps.map(r => parseInt(r) || 0),
          weights_used: ex.weights.map(w => parseFloat(w) || 0),
          rpe: ex.rpe,
          notes: ex.notes,
        })),
        intensity_level: intensity,
        energy_level: energy,
        mood: mood,
        volume: volume,
      });
    },
    onSuccess: () => {
      toast.success("¡Entrenamiento registrado!");
      queryClient.invalidateQueries({ queryKey: ["workout-sessions"] });
      navigate(createPageUrl('TrainerDashboard'));
    },
    onError: () => toast.error("Error al guardar"),
  });

  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      { exercise_name: "", sets: 1, weights: [""], reps: [""], rpe: 5, notes: "" },
    ]);
  };

  const handleRemoveExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (exercises.some(ex => !ex.exercise_name)) {
      toast.error("Completa el nombre de todos los ejercicios");
      return;
    }
    createSessionMutation.mutate({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(createPageUrl('TrainerDashboard'))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-2xl font-black text-white">Registrar Entrenamiento</h1>
        </div>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
            <label className="text-white/70 text-sm mb-2 block">Duración (minutos)</label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="45"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
            <label className="text-white/70 text-sm mb-2 block">Intensidad</label>
            <select
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2"
            >
              <option value="light">Ligera</option>
              <option value="moderate">Moderada</option>
              <option value="intense">Intensa</option>
              <option value="very_intense">Muy Intensa</option>
            </select>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
            <label className="text-white/70 text-sm mb-2 block">Nivel de Energía: {energy}/10</label>
            <input
              type="range"
              min="1"
              max="10"
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Exercises */}
          <div>
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              Ejercicios
            </h3>
            <div className="space-y-3">
              {exercises.map((ex, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Input
                      placeholder="Nombre ejercicio"
                      value={ex.exercise_name}
                      onChange={(e) => {
                        const newExercises = [...exercises];
                        newExercises[idx].exercise_name = e.target.value;
                        setExercises(newExercises);
                      }}
                      className="bg-white/10 border-white/20 text-white col-span-2"
                    />
                    <div>
                      <label className="text-white/60 text-xs">Series</label>
                      <Input
                        type="number"
                        value={ex.sets}
                        onChange={(e) => {
                          const newExercises = [...exercises];
                          newExercises[idx].sets = parseInt(e.target.value) || 1;
                          setExercises(newExercises);
                        }}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs">RPE (1-10)</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={ex.rpe}
                        onChange={(e) => {
                          const newExercises = [...exercises];
                          newExercises[idx].rpe = parseInt(e.target.value) || 5;
                          setExercises(newExercises);
                        }}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  {/* Reps and Weights per set */}
                  <div className="text-white/60 text-xs mb-2">Detalles por serie:</div>
                  <div className="grid gap-2 mb-3">
                    {Array(ex.sets)
                      .fill(0)
                      .map((_, setIdx) => (
                        <div key={setIdx} className="flex gap-2">
                          <Input
                            type="number"
                            placeholder={`Kg S${setIdx + 1}`}
                            value={ex.weights[setIdx] || ""}
                            onChange={(e) => {
                              const newExercises = [...exercises];
                              newExercises[idx].weights[setIdx] = e.target.value;
                              setExercises(newExercises);
                            }}
                            className="bg-white/10 border-white/20 text-white flex-1"
                          />
                          <Input
                            type="number"
                            placeholder={`Reps S${setIdx + 1}`}
                            value={ex.reps[setIdx] || ""}
                            onChange={(e) => {
                              const newExercises = [...exercises];
                              newExercises[idx].reps[setIdx] = e.target.value;
                              setExercises(newExercises);
                            }}
                            className="bg-white/10 border-white/20 text-white flex-1"
                          />
                        </div>
                      ))}
                  </div>

                  <Input
                    placeholder="Notas"
                    value={ex.notes}
                    onChange={(e) => {
                      const newExercises = [...exercises];
                      newExercises[idx].notes = e.target.value;
                      setExercises(newExercises);
                    }}
                    className="bg-white/10 border-white/20 text-white mb-2"
                  />

                  {exercises.length > 1 && (
                    <Button
                      onClick={() => handleRemoveExercise(idx)}
                      variant="outline"
                      className="w-full text-red-300 border-red-300/30 hover:bg-red-500/10"
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={handleAddExercise}
              className="w-full mt-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white"
            >
              <Plus size={18} className="mr-2" />
              Añadir Ejercicio
            </Button>
          </div>

          {/* Submit */}
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(createPageUrl('TrainerDashboard'))}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createSessionMutation.isPending}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold"
            >
              <Check size={18} className="mr-2" />
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}