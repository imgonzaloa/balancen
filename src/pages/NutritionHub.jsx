import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Apple, Flame, Target, TrendingUp, ArrowLeft, Plus, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

export default function NutritionHub() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, todayMeals } = useAppState();
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const isPremium = profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator';

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-amber-900 flex flex-col items-center justify-center p-6 pb-24">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
          <Apple size={40} className="text-amber-400" />
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Centro Nutricional - Función Premium</h2>
        <p className="text-white/70 text-center mb-8">Análisis completo de macros, planes personalizados por IA y seguimiento nutricional avanzado</p>
        <Button
          onClick={() => navigate(createPageUrl('Premium'))}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-8 py-3"
        >
          Desbloquear Premium
        </Button>
      </div>
    );
  }

  const { data: nutritionPlan } = useQuery({
    queryKey: ["nutrition-plan", user?.email],
    queryFn: async () => {
      const plans = await base44.entities.NutritionPlan.filter(
        { user_email: user?.email, status: "active" },
        "-created_date"
      );
      return plans[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: meals = [] } = useQuery({
    queryKey: ["meals-week", user?.email],
    queryFn: async () => {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const allMeals = await base44.entities.MealLog.filter(
        { created_by: user?.email },
        "-date",
        50
      );
      return allMeals.filter(m => new Date(m.date) >= weekAgo);
    },
    enabled: !!user?.email,
  });

  const generatePlanMutation = useMutation({
    mutationFn: async (goal) => {
      const response = await base44.functions.invoke('aiMealPlanner', {
        profile: { ...profile, email: user.email },
        goal,
        current_meals: todayMeals || [],
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Plan nutricional generado");
      queryClient.invalidateQueries({ queryKey: ["nutrition-plan"] });
    },
    onError: () => toast.error("Error al generar plan"),
  });

  // Calculate macros distribution
  const todayCalories = (todayMeals || []).reduce((sum, m) => sum + (m.estimated_calories || 0), 0);
  const todayProtein = (todayMeals || []).reduce((sum, m) => sum + (m.estimated_protein || 0), 0);
  const todayCarbs = (todayMeals || []).reduce((sum, m) => sum + (m.estimated_carbs || 0), 0);
  const todayFats = (todayMeals || []).reduce((sum, m) => sum + (m.estimated_fats || 0), 0);

  const macrosData = [
    { name: "Proteína", value: todayProtein * 4, color: "#3b82f6" },
    { name: "Carbohidratos", value: todayCarbs * 4, color: "#f59e0b" },
    { name: "Grasas", value: todayFats * 9, color: "#ef4444" },
  ];

  const weeklyData = meals
    .filter(m => m.estimated_calories)
    .reduce((acc, meal) => {
      const date = new Date(meal.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
      const existing = acc.find(d => d.date === date);
      if (existing) {
        existing.calories += meal.estimated_calories;
      } else {
        acc.push({ date, calories: meal.estimated_calories });
      }
      return acc;
    }, [])
    .reverse();

  const caloriesGoal = nutritionPlan?.calories_target || profile?.calories_goal || 2000;
  const caloriesDiff = todayCalories - caloriesGoal;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-amber-900 pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Centro Nutricional IA</h1>
            <p className="text-white/60 text-sm">Seguimiento y planes inteligentes</p>
          </div>
        </div>

        {/* Today's Summary */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 mb-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Flame size={20} className="text-orange-400" />
            Hoy
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-4">
              <p className="text-white/60 text-xs mb-1">Calorías</p>
              <div className="flex items-baseline gap-2">
                <p className="text-white text-3xl font-bold">{Math.round(todayCalories)}</p>
                <span className="text-white/60 text-sm">/ {caloriesGoal}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                  style={{ width: `${Math.min((todayCalories / caloriesGoal) * 100, 100)}%` }}
                />
              </div>
              {caloriesDiff !== 0 && (
                <p className={`text-xs mt-2 ${caloriesDiff < 0 ? "text-red-300" : "text-green-300"}`}>
                  {caloriesDiff < 0 ? "Falta" : "Exceso"}: {Math.abs(caloriesDiff)} kcal
                </p>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-4">
              <p className="text-white/60 text-xs mb-1">Proteína</p>
              <p className="text-white text-3xl font-bold">{Math.round(todayProtein)}g</p>
              <p className="text-white/60 text-xs mt-2">{Math.round((todayProtein * 4 / todayCalories) * 100)}% del total</p>
            </div>
          </div>

          {/* Macros Distribution */}
          {todayCalories > 0 && (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={macrosData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                >
                  {macrosData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Weekly Progress */}
        {weeklyData.length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 mb-6">
            <h3 className="text-white font-bold mb-4">Esta Semana</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" style={{ fontSize: 12 }} />
                <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(255,255,255,0.2)" }} />
                <Bar dataKey="calories" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Active Plan */}
        {nutritionPlan && (
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-6 border border-amber-500/30 mb-6">
            <h3 className="text-white font-bold text-lg mb-2">{nutritionPlan.plan_name}</h3>
            <p className="text-amber-200 text-sm mb-4">
              {nutritionPlan.goal === "weight_loss" && "🎯 Objetivo: Bajar de peso"}
              {nutritionPlan.goal === "muscle_gain" && "💪 Objetivo: Ganancia muscular"}
              {nutritionPlan.goal === "maintenance" && "⚖️ Objetivo: Mantenimiento"}
              {nutritionPlan.goal === "performance" && "⚡ Objetivo: Rendimiento"}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div>
                <p className="text-white/60">Calorías</p>
                <p className="text-white font-bold">{nutritionPlan.calories_target}</p>
              </div>
              <div>
                <p className="text-white/60">Proteína</p>
                <p className="text-white font-bold">{nutritionPlan.macros?.protein_grams}g</p>
              </div>
            </div>
            <Button
              onClick={() => navigate(createPageUrl('MealPlanner'))}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold"
            >
              Ver Plan Completo
            </Button>
          </div>
        )}

        {/* Generate Plan */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 mb-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Target size={18} />
            Crear Plan Personalizado
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {["weight_loss", "muscle_gain", "maintenance", "performance"].map((goal) => (
              <Button
                key={goal}
                onClick={() => generatePlanMutation.mutate(goal)}
                disabled={generatePlanMutation.isPending}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 py-6"
              >
                {goal === "weight_loss" && "🔥 Pérdida"}
                {goal === "muscle_gain" && "💪 Ganancia"}
                {goal === "maintenance" && "⚖️ Manten."}
                {goal === "performance" && "⚡ Rendim."}
              </Button>
            ))}
          </div>
        </div>

        {/* Meal Quality Tips */}
        <div className="bg-blue-500/10 backdrop-blur-xl rounded-2xl p-4 border border-blue-500/30 flex gap-3">
          <AlertCircle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white/90 text-sm font-semibold mb-1">Consejo Nutricional</p>
            <p className="text-white/70 text-xs">
              {caloriesDiff > 200
                ? "Vas por encima de tu objetivo. Considera reducir porciones."
                : caloriesDiff < -200
                ? "Estás bajo tu objetivo. Añade snacks nutritivos."
                : "¡Vas en el camino correcto! Mantén la consistencia."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}