import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Search, Plus, X, Sparkles, Loader2, RefreshCw, Clock, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { useAppState } from "@/components/AppStateContext";
import { useMealsStore } from "@/components/MealsStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";

const FOOD_DATABASE = [
  // Basics & International
  { name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fats: 3.6, portion: "100g" },
  { name: "Rice (cooked)", calories: 206, protein: 4.3, carbs: 45, fats: 0.3, portion: "150g" },
  { name: "Broccoli", calories: 34, protein: 2.8, carbs: 7, fats: 0.4, portion: "100g" },
  { name: "Salmon", calories: 208, protein: 22, carbs: 0, fats: 13, portion: "100g" },
  { name: "Eggs", calories: 155, protein: 13, carbs: 1.1, fats: 11, portion: "100g" },
  { name: "Oats", calories: 389, protein: 17, carbs: 66, fats: 6.9, portion: "100g" },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fats: 0.3, portion: "100g" },
  { name: "Bread", calories: 265, protein: 9, carbs: 49, fats: 3.3, portion: "100g" },
  { name: "Peanut Butter", calories: 588, protein: 25, carbs: 20, fats: 50, portion: "32g" },
  { name: "Pasta", calories: 131, protein: 5, carbs: 25, fats: 1.1, portion: "100g" },
  { name: "Milk", calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3, portion: "100ml" },
  { name: "Yogurt", calories: 59, protein: 10, carbs: 3.3, fats: 0.4, portion: "100g" },
  { name: "Apple", calories: 52, protein: 0.3, carbs: 14, fats: 0.2, portion: "100g" },
  { name: "Almonds", calories: 579, protein: 21, carbs: 22, fats: 50, portion: "100g" },
  { name: "Beef", calories: 250, protein: 26, carbs: 0, fats: 17, portion: "100g" },
  { name: "Croissant", calories: 406, protein: 8, carbs: 45, fats: 21, portion: "100g" },
  { name: "Greek Yogurt", calories: 59, protein: 10, carbs: 3.6, fats: 0.4, portion: "100g" },
  { name: "Avocado", calories: 160, protein: 2, carbs: 9, fats: 15, portion: "100g" },
  { name: "Sweet Potato", calories: 86, protein: 1.6, carbs: 20, fats: 0.1, portion: "100g" },
  { name: "Quinoa", calories: 120, protein: 4.4, carbs: 22, fats: 1.9, portion: "100g" },
  { name: "Tuna (canned)", calories: 116, protein: 26, carbs: 0, fats: 1, portion: "100g" },
  { name: "Cottage Cheese", calories: 98, protein: 11, carbs: 3.4, fats: 4.3, portion: "100g" },
  { name: "Whey Protein", calories: 120, protein: 24, carbs: 3, fats: 1.5, portion: "30g" },
  { name: "Blueberries", calories: 57, protein: 0.7, carbs: 14, fats: 0.3, portion: "100g" },
  { name: "Spinach", calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, portion: "100g" },
  { name: "Olive Oil", calories: 884, protein: 0, carbs: 0, fats: 100, portion: "100ml" },
  { name: "Walnuts", calories: 654, protein: 15, carbs: 14, fats: 65, portion: "100g" },
  { name: "Lentils (cooked)", calories: 116, protein: 9, carbs: 20, fats: 0.4, portion: "100g" },
  { name: "Mozzarella", calories: 280, protein: 28, carbs: 3.1, fats: 17, portion: "100g" },
  { name: "Orange", calories: 47, protein: 0.9, carbs: 12, fats: 0.1, portion: "100g" },
  { name: "Dark Chocolate", calories: 546, protein: 5, carbs: 60, fats: 31, portion: "100g" },
  { name: "Hummus", calories: 166, protein: 8, carbs: 14, fats: 10, portion: "100g" },
  { name: "Cucumber", calories: 15, protein: 0.7, carbs: 3.6, fats: 0.1, portion: "100g" },
  { name: "Turkey Breast", calories: 135, protein: 30, carbs: 0, fats: 1, portion: "100g" },
  // Spanish & Latin foods
  { name: "Tortilla española", calories: 185, protein: 11, carbs: 8, fats: 13, portion: "100g" },
  { name: "Arroz con leche", calories: 158, protein: 3.5, carbs: 28, fats: 4, portion: "100g" },
  { name: "Empanada", calories: 297, protein: 10, carbs: 29, fats: 16, portion: "100g" },
  { name: "Milanesa", calories: 243, protein: 22, carbs: 12, fats: 12, portion: "100g" },
  { name: "Asado (costilla)", calories: 294, protein: 26, carbs: 0, fats: 21, portion: "100g" },
  { name: "Dulce de leche", calories: 326, protein: 7, carbs: 55, fats: 9, portion: "100g" },
  { name: "Medialunas", calories: 370, protein: 7, carbs: 45, fats: 18, portion: "100g" },
  { name: "Facturas", calories: 340, protein: 6, carbs: 42, fats: 17, portion: "100g" },
  { name: "Churros", calories: 357, protein: 6, carbs: 42, fats: 19, portion: "100g" },
  { name: "Gazpacho", calories: 35, protein: 1.2, carbs: 6, fats: 1, portion: "100ml" },
  { name: "Paella", calories: 180, protein: 10, carbs: 26, fats: 5, portion: "100g" },
  { name: "Croquetas", calories: 234, protein: 8, carbs: 20, fats: 13, portion: "100g" },
  { name: "Mate", calories: 2, protein: 0.1, carbs: 0.2, fats: 0, portion: "200ml" },
  // More common foods
  { name: "Pizza Margarita", calories: 250, protein: 11, carbs: 33, fats: 8, portion: "100g" },
  { name: "Hamburguesa", calories: 295, protein: 17, carbs: 24, fats: 14, portion: "100g" },
  { name: "Tomate", calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2, portion: "100g" },
  { name: "Zanahoria", calories: 41, protein: 0.9, carbs: 10, fats: 0.2, portion: "100g" },
  { name: "Lechuga", calories: 15, protein: 1.4, carbs: 2.9, fats: 0.2, portion: "100g" },
  { name: "Maíz (elote)", calories: 86, protein: 3.3, carbs: 19, fats: 1.4, portion: "100g" },
  { name: "Frijoles negros", calories: 132, protein: 8.9, carbs: 24, fats: 0.5, portion: "100g" },
  { name: "Aguacate", calories: 160, protein: 2, carbs: 9, fats: 15, portion: "100g" },
  { name: "Queso fresco", calories: 264, protein: 17, carbs: 2, fats: 21, portion: "100g" },
  { name: "Pechuga de pavo", calories: 135, protein: 30, carbs: 0, fats: 1, portion: "100g" },
  { name: "Naranja", calories: 47, protein: 0.9, carbs: 12, fats: 0.1, portion: "100g" },
  { name: "Manzana", calories: 52, protein: 0.3, carbs: 14, fats: 0.2, portion: "100g" },
  { name: "Pera", calories: 57, protein: 0.4, carbs: 15, fats: 0.1, portion: "100g" },
  { name: "Fresa", calories: 32, protein: 0.7, carbs: 7.7, fats: 0.3, portion: "100g" },
  { name: "Proteína en polvo", calories: 120, protein: 24, carbs: 3, fats: 1.5, portion: "30g" },
  { name: "Atún en lata", calories: 116, protein: 26, carbs: 0, fats: 1, portion: "100g" },
  { name: "Pan integral", calories: 247, protein: 13, carbs: 41, fats: 4.2, portion: "100g" },
  { name: "Leche entera", calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3, portion: "100ml" },
  { name: "Arroz blanco", calories: 130, protein: 2.7, carbs: 28, fats: 0.3, portion: "100g" },
  { name: "Pollo asado", calories: 190, protein: 27, carbs: 0, fats: 9, portion: "100g" },
];

export default function AddMeal() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAppState();
  const { addMeal, formatLocalDateKey } = useMealsStore();

  const [activeTab, setActiveTab] = useState("search"); // "search" | "recent"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [saving, setSaving] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [recentMeals, setRecentMeals] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const debounceRef = useRef(null);

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const msg = lang === 'es' ? 'Tu navegador no soporta reconocimiento de voz' : lang === 'nl' ? 'Je browser ondersteunt geen spraakherkenning' : 'Your browser does not support speech recognition';
      toast.error(msg);
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'es' ? 'es-ES' : lang === 'nl' ? 'nl-NL' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setSearchQuery(transcript);
      setActiveTab("search");
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  // Load recent meals when tab switches
  useEffect(() => {
    if (activeTab !== "recent" || !user?.email) return;
    setRecentLoading(true);
    base44.entities.MealLog.filter({ created_by: user.email }, '-created_date', 40)
      .then((meals) => {
        // Deduplicate by calorie fingerprint, keep most recent
        const seen = new Set();
        const unique = [];
        for (const m of (meals || [])) {
          const key = `${m.estimated_calories}-${m.estimated_protein}-${m.estimated_carbs}-${m.estimated_fats}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(m);
          }
          if (unique.length >= 10) break;
        }
        setRecentMeals(unique);
      })
      .catch(() => setRecentMeals([]))
      .finally(() => setRecentLoading(false));
  }, [activeTab, user?.email]);

  const handleRelogRecent = async (meal) => {
    const now = new Date();
    const dateKey = formatLocalDateKey(now);
    const meal_time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    const cal = meal.estimated_calories || 0;
    const prot = meal.estimated_protein || 0;
    const carbs = meal.estimated_carbs || 0;
    const fats = meal.estimated_fats || 0;
    try {
      addMeal({
        id: crypto.randomUUID(),
        dateKey,
        createdAt: now.toISOString(),
        photoUri: meal.photo_url || "",
        mealType: meal.meal_type || "snack",
        totals: { calories: cal, protein: prot, carbs, fats },
        items: [],
        confidence: 100,
      });
      base44.entities.MealLog.create({
        date: dateKey,
        meal_time,
        photo_url: meal.photo_url || null,
        estimated_calories: cal,
        estimated_protein: prot,
        estimated_carbs: carbs,
        estimated_fats: fats,
        meal_type: meal.meal_type || null,
      }).catch(() => {});
      const msg = lang === 'es' ? 'Comida registrada de nuevo' : lang === 'nl' ? 'Maaltijd opnieuw geregistreerd' : 'Meal relogged';
      toast.success(`${msg} • +${cal} kcal`);
      navigate(createPageUrl("Home"));
    } catch {
      toast.error(lang === 'es' ? 'Error al registrar' : lang === 'nl' ? 'Fout bij opnieuw registreren' : 'Error relogging');
    }
  };

  const filteredFoods = FOOD_DATABASE.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // AI search: debounce 800ms, fires when no local results
  useEffect(() => {
    setAiResult(null);
    if (!searchQuery.trim() || filteredFoods.length > 0) {
      setAiLoading(false);
      clearTimeout(debounceRef.current);
      return;
    }

    setAiLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Return nutrition facts for "${searchQuery}" per 100g as JSON with these exact keys: name, calories, protein, carbs, fats. Only return the JSON object, nothing else.`,
          response_json_schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              calories: { type: "number" },
              protein: { type: "number" },
              carbs: { type: "number" },
              fats: { type: "number" },
            },
          },
        });
        if (result?.calories) {
          setAiResult({ ...result, portion: "100g", _ai: true });
        }
      } catch {
        // silently fail
      } finally {
        setAiLoading(false);
      }
    }, 800);

    return () => clearTimeout(debounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const addFood = (food) => {
    setSelectedFoods([...selectedFoods, { ...food, id: Date.now() }]);
    setSearchQuery("");
    setAiResult(null);
    setAiLoading(false);
  };

  const removeFood = (id) => {
    setSelectedFoods(selectedFoods.filter((f) => f.id !== id));
  };

  const totalCalories = selectedFoods.reduce((sum, f) => sum + (f.calories || 0), 0);
  const totalProtein = selectedFoods.reduce((sum, f) => sum + (f.protein || 0), 0);
  const totalCarbs = selectedFoods.reduce((sum, f) => sum + (f.carbs || 0), 0);
  const totalFats = selectedFoods.reduce((sum, f) => sum + (f.fats || 0), 0);

  const handleSave = async () => {
    if (selectedFoods.length === 0) {
      toast.error(t("add_at_least_one_food") || "Add at least one food");
      return;
    }
    setSaving(true);
    try {
      const now = new Date();
      const dateKey = formatLocalDateKey(now);
      const meal_time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
      const totals = {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fats: Math.round(totalFats),
      };
      addMeal({
        id: crypto.randomUUID(),
        dateKey,
        createdAt: now.toISOString(),
        photoUri: "",
        mealType: "snack",
        totals,
        items: selectedFoods.map((f) => ({ name: f.name, calories: f.calories, protein: f.protein, carbs: f.carbs, fats: f.fats })),
        confidence: 100,
      });
      base44.entities.MealLog.create({
        date: dateKey,
        meal_time,
        photo_url: null,
        estimated_calories: totals.calories,
        estimated_protein: totals.protein,
        estimated_carbs: totals.carbs,
        estimated_fats: totals.fats,
      }).catch(() => {});
      toast.success(`${t("meal_saved")} • +${totals.calories} kcal`);
      navigate(createPageUrl("Home"));
    } catch {
      toast.error(t("save_failed") || "Error saving meal");
    } finally {
      setSaving(false);
    }
  };

  const showDropdown = searchQuery.trim().length > 0;
  const dropdownLabel = {
    es: "Buscando...",
    pt: "Buscando...",
    en: "Searching...",
  }[lang] || "Searching...";

  return (
    <div className="min-h-screen pb-24" style={{ minHeight: "100dvh", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      <div className="max-w-2xl mx-auto px-6 pt-2 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white">
              {t("log_meal_manually") || t("add_manually")}
            </h1>
            <p className="text-white/60 text-sm">{t("search_and_add") || "Search & add foods"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white/5 rounded-2xl p-1">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "search" ? "bg-teal-500 text-white shadow" : "text-white/50 hover:text-white/70"
            }`}
          >
            <Search size={14} />
            {lang === 'es' ? 'Buscar' : lang === 'nl' ? 'Zoeken' : 'Search'}
          </button>
          <button
            onClick={() => setActiveTab("recent")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "recent" ? "bg-teal-500 text-white shadow" : "text-white/50 hover:text-white/70"
            }`}
          >
            <Clock size={14} />
            {lang === 'es' ? 'Recientes' : lang === 'nl' ? 'Recent' : 'Recent'}
          </button>
        </div>

        {/* Recent tab content */}
        {activeTab === "recent" && (
          <div className="space-y-3">
            {recentLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-white/50">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">{lang === 'es' ? 'Cargando...' : lang === 'nl' ? 'Laden...' : 'Loading...'}</span>
              </div>
            ) : recentMeals.length === 0 ? (
              <div className="bg-white/5 rounded-2xl p-8 text-center border border-white/10">
                <Clock size={36} className="text-white/30 mx-auto mb-3" />
                <p className="text-white/60 text-sm font-semibold">
                  {lang === 'es' ? 'Sin comidas recientes' : lang === 'nl' ? 'Geen recente maaltijden' : 'No recent meals'}
                </p>
              </div>
            ) : (
              recentMeals.map((meal) => (
                <div key={meal.id} className="bg-white/8 border border-white/10 rounded-2xl flex overflow-hidden">
                  {meal.photo_url ? (
                    <img src={meal.photo_url} alt="meal" className="w-16 h-16 object-cover flex-shrink-0" onError={e => e.target.style.display='none'} />
                  ) : (
                    <div className="w-16 h-16 flex-shrink-0 bg-white/5 flex items-center justify-center">
                      <span className="text-2xl">🍽️</span>
                    </div>
                  )}
                  <div className="flex-1 px-3 py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">
                        {meal.estimated_calories} kcal
                      </p>
                      <p className="text-white/50 text-xs mt-0.5">
                        P {meal.estimated_protein}g · C {meal.estimated_carbs}g · F {meal.estimated_fats}g
                      </p>
                      {meal.date && <p className="text-white/30 text-[10px] mt-0.5">{meal.date}</p>}
                    </div>
                    <button
                      onClick={() => handleRelogRecent(meal)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold hover:bg-teal-500/40 active:scale-90 transition-all flex-shrink-0"
                    >
                      <RefreshCw size={12} />
                      {lang === 'es' ? 'Relog' : lang === 'nl' ? 'Opnieuw' : 'Relog'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Search */}
        {activeTab === "search" && <div className="mb-6 relative">
          <div className="relative flex gap-2 items-center">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <Input
                type="text"
                placeholder={isListening
                  ? (lang === 'es' ? 'Escuchando...' : lang === 'nl' ? 'Luisteren...' : 'Listening...')
                  : (t("search_foods") || "Search foods...")}
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 bg-white/10 border-white/20 text-white placeholder-white/40 ${isListening ? 'border-red-400/60 placeholder-red-300/60' : ''}`}
              />
            </div>
            <button
              onClick={startVoiceSearch}
              className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all active:scale-90 ${
                isListening
                  ? 'bg-red-500/30 border-red-400/60 animate-pulse'
                  : 'bg-white/10 border-white/20 hover:bg-white/20'
              }`}
              title={lang === 'es' ? 'Buscar por voz' : lang === 'nl' ? 'Zoeken op stem' : 'Voice search'}
            >
              {isListening ? <MicOff size={16} className="text-red-300" /> : <Mic size={16} className="text-white/70" />}
            </button>
          </div>

          {/* Recording indicator */}
          {isListening && (
            <div className="flex items-center gap-2 mt-2 px-1">
              <div className="flex gap-0.5">
                {[0,1,2,3].map(i => (
                  <div key={i} className="w-1 bg-red-400 rounded-full animate-bounce" style={{ height: '12px', animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <span className="text-red-300 text-xs font-semibold">
                {lang === 'es' ? 'Escuchando... hablá ahora' : lang === 'nl' ? 'Luisteren... spreek nu' : 'Listening... speak now'}
              </span>
            </div>
          )}

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-white/20 rounded-2xl overflow-hidden z-10 max-h-72 overflow-y-auto shadow-xl">
              {filteredFoods.length > 0 ? (
                filteredFoods.slice(0, 10).map((food) => (
                  <button
                    key={food.name}
                    onClick={() => addFood(food)}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 border-b border-white/10 last:border-b-0 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-white font-semibold text-sm">{food.name}</p>
                      <p className="text-white/60 text-xs">{food.calories} cal • {food.portion}</p>
                    </div>
                    <Plus size={16} className="text-white/40 group-hover:text-teal-300 transition-colors" />
                  </button>
                ))
              ) : aiLoading ? (
                <div className="flex items-center gap-2 px-4 py-4 text-white/50 text-sm">
                  <Loader2 size={15} className="animate-spin text-purple-400" />
                  <span>{dropdownLabel}</span>
                </div>
              ) : aiResult ? (
                <button
                  onClick={() => addFood(aiResult)}
                  className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Sparkles size={11} className="text-purple-400" />
                      <span className="text-purple-400 text-[10px] font-bold uppercase tracking-wide">IA</span>
                    </div>
                    <p className="text-white font-semibold text-sm">{aiResult.name}</p>
                    <p className="text-white/60 text-xs">{Math.round(aiResult.calories)} cal • {aiResult.portion}</p>
                  </div>
                  <Plus size={16} className="text-white/40 group-hover:text-purple-300 transition-colors" />
                </button>
              ) : (
                <div className="px-4 py-3 text-center text-white/50 text-sm">
                  {lang === "es" ? `Sin resultados para "${searchQuery}"` : lang === "pt" ? `Sem resultados para "${searchQuery}"` : `No results for "${searchQuery}"`}
                </div>
              )}
            </div>
          )}
        </div>}

        {/* Selected Foods */}
        {activeTab === "search" && selectedFoods.length > 0 && (
          <div className="space-y-3 mb-8">
            <h3 className="text-white font-bold text-sm uppercase tracking-wide">{t("selected_foods") || "Selected"}</h3>
            {selectedFoods.map((food) => (
              <div key={food.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white font-semibold text-sm">{food.name}</p>
                    {food._ai && <Sparkles size={10} className="text-purple-400" />}
                  </div>
                  <p className="text-white/60 text-xs mt-1">{food.portion}</p>
                  <div className="flex gap-3 mt-2 text-xs text-white/50">
                    <span>{Math.round(food.calories)} cal</span>
                    <span>{Math.round(food.protein)}g protein</span>
                  </div>
                </div>
                <button
                  onClick={() => removeFood(food.id)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-red-400"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        {activeTab === "search" && selectedFoods.length > 0 && (
          <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 backdrop-blur-xl rounded-3xl p-6 border border-teal-500/30 mb-6">
            <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-4">{t("total_nutrition") || t("daily_intake")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-xs mb-1">{t("calories")}</p>
                <p className="text-3xl font-black text-white">{Math.round(totalCalories)}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-1">{t("protein")}</p>
                <p className="text-2xl font-black text-teal-300">{Math.round(totalProtein)}g</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-1">{t("carbs")}</p>
                <p className="text-2xl font-black text-amber-300">{Math.round(totalCarbs)}g</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-1">{t("fats")}</p>
                <p className="text-2xl font-black text-pink-300">{Math.round(totalFats)}g</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {activeTab === "search" && selectedFoods.length > 0 && (
          <div className="flex gap-3">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-2xl h-12"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-2xl h-12 font-bold"
            >
              {saving ? t("saving") : t("save_meal")}
            </Button>
          </div>
        )}

        {activeTab === "search" && selectedFoods.length === 0 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
            <Search size={40} className="text-white/40 mx-auto mb-3" />
            <p className="text-white/70 font-semibold mb-1">{t("search_foods")}</p>
            <p className="text-white/50 text-sm">{t("type_food_name")}</p>
          </div>
        )}
      </div>
    </div>
  );
}