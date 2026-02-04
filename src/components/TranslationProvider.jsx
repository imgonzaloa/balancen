import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const translations = {
  es: {
    good_morning: "Buenos días",
    good_afternoon: "Buenas tardes",
    good_evening: "Buenas noches",
    how_was_today: "¿Cómo fue hoy?",
    checkin_completed: "¡Check-in completado!",
    keep_it_up: "Sigue así mañana",
    calories_today: "Calorías Hoy",
    meals_logged: "comidas registradas",
    add_meal: "Agregar comida",
    analyzing: "Analizando...",
    protein: "Proteína",
    carbs: "Carbos",
    fats: "Grasas",
    total_checkins: "Total check-ins",
    best_streak: "Mejor racha",
    days: "días",
    how_did_you_eat: "¿Cómo comiste?",
    food_photo_optional: "Foto de comida (opcional)",
    did_you_move: "¿Te moviste hoy?",
    steps_optional: "Pasos (opcional)",
    weight_today_optional: "Peso hoy (opcional)",
    select_at_least_one: "Selecciona al menos una opción",
    steps_today: "Pasos hoy",
    goal: "Meta",
    goal_reached: "¡Meta alcanzada!",
    missing_steps: "Faltan",
    steps: "pasos",
    current_weight: "Peso actual",
    since_start: "desde inicio",
    not_logged: "No registrado",
    vs_yesterday: "vs ayer",
    this_week: "Esta semana",
    home: "Inicio",
    groups: "Grupos",
    badges: "Logros",
    profile: "Perfil",
    great: "Bien",
    ok: "Ok",
    poor: "Mal",
    breakfast: "Desayuno",
    lunch: "Almuerzo",
    dinner: "Cena",
    snack: "Snack",
    what_meal: "¿Qué comida es?",
    my_profile: "Mi perfil",
    edit: "Editar",
    current_streak: "Racha actual",
    save: "Guardar",
    cancel: "Cancelar",
    logout: "Cerrar sesión",
    your_goals: "Tus metas",
    main_goal: "Meta principal",
    intensity: "Intensidad",
    mode: "Modo",
    optional_data: "Datos opcionales",
    weight_kg: "Peso (kg)",
    height_cm: "Altura (cm)",
    not_defined: "No definido",
    with_friends: "Con amigos",
    alone: "Solo",
  },
  en: {
    good_morning: "Good morning",
    good_afternoon: "Good afternoon",
    good_evening: "Good evening",
    how_was_today: "How was today?",
    checkin_completed: "Check-in completed!",
    keep_it_up: "Keep it up tomorrow",
    calories_today: "Calories Today",
    meals_logged: "meals logged",
    add_meal: "Add meal",
    analyzing: "Analyzing...",
    protein: "Protein",
    carbs: "Carbs",
    fats: "Fats",
    total_checkins: "Total check-ins",
    best_streak: "Best streak",
    days: "days",
    how_did_you_eat: "How did you eat?",
    food_photo_optional: "Food photo (optional)",
    did_you_move: "Did you move today?",
    steps_optional: "Steps (optional)",
    weight_today_optional: "Weight today (optional)",
    select_at_least_one: "Select at least one option",
    steps_today: "Steps today",
    goal: "Goal",
    goal_reached: "Goal reached!",
    missing_steps: "Missing",
    steps: "steps",
    current_weight: "Current weight",
    since_start: "since start",
    not_logged: "Not logged",
    vs_yesterday: "vs yesterday",
    this_week: "This week",
    home: "Home",
    groups: "Groups",
    badges: "Badges",
    profile: "Profile",
    great: "Great",
    ok: "Ok",
    poor: "Poor",
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snack",
    what_meal: "What meal is it?",
    my_profile: "My profile",
    edit: "Edit",
    current_streak: "Current streak",
    save: "Save",
    cancel: "Cancel",
    logout: "Logout",
    your_goals: "Your goals",
    main_goal: "Main goal",
    intensity: "Intensity",
    mode: "Mode",
    optional_data: "Optional data",
    weight_kg: "Weight (kg)",
    height_cm: "Height (cm)",
    not_defined: "Not defined",
    with_friends: "With friends",
    alone: "Alone",
  },
  pt: {
    good_morning: "Bom dia",
    good_afternoon: "Boa tarde",
    good_evening: "Boa noite",
    how_was_today: "Como foi hoje?",
    checkin_completed: "Check-in completo!",
    keep_it_up: "Continue assim amanhã",
    calories_today: "Calorias Hoje",
    meals_logged: "refeições registradas",
    add_meal: "Adicionar refeição",
    analyzing: "Analisando...",
    protein: "Proteína",
    carbs: "Carboidratos",
    fats: "Gorduras",
    total_checkins: "Total check-ins",
    best_streak: "Melhor sequência",
    days: "dias",
    how_did_you_eat: "Como você comeu?",
    food_photo_optional: "Foto da comida (opcional)",
    did_you_move: "Você se moveu hoje?",
    steps_optional: "Passos (opcional)",
    weight_today_optional: "Peso hoje (opcional)",
    select_at_least_one: "Selecione pelo menos uma opção",
    steps_today: "Passos hoje",
    goal: "Meta",
    goal_reached: "Meta alcançada!",
    missing_steps: "Faltam",
    steps: "passos",
    current_weight: "Peso atual",
    since_start: "desde início",
    not_logged: "Não registrado",
    vs_yesterday: "vs ontem",
    this_week: "Esta semana",
    home: "Início",
    groups: "Grupos",
    badges: "Conquistas",
    profile: "Perfil",
    great: "Ótimo",
    ok: "Ok",
    poor: "Ruim",
    breakfast: "Café da manhã",
    lunch: "Almoço",
    dinner: "Jantar",
    snack: "Lanche",
    what_meal: "Que refeição é?",
    my_profile: "Meu perfil",
    edit: "Editar",
    current_streak: "Sequência atual",
    save: "Salvar",
    cancel: "Cancelar",
    logout: "Sair",
    your_goals: "Suas metas",
    main_goal: "Meta principal",
    intensity: "Intensidade",
    mode: "Modo",
    optional_data: "Dados opcionais",
    weight_kg: "Peso (kg)",
    height_cm: "Altura (cm)",
    not_defined: "Não definido",
    with_friends: "Com amigos",
    alone: "Sozinho",
  },
  fr: {
    good_morning: "Bonjour",
    good_afternoon: "Bon après-midi",
    good_evening: "Bonsoir",
    how_was_today: "Comment était aujourd'hui?",
    checkin_completed: "Check-in terminé!",
    keep_it_up: "Continue demain",
    calories_today: "Calories Aujourd'hui",
    meals_logged: "repas enregistrés",
    add_meal: "Ajouter repas",
    analyzing: "Analyse...",
    protein: "Protéine",
    carbs: "Glucides",
    fats: "Graisses",
    total_checkins: "Total check-ins",
    best_streak: "Meilleure série",
    days: "jours",
    how_did_you_eat: "Comment as-tu mangé?",
    food_photo_optional: "Photo de nourriture (facultatif)",
    did_you_move: "Tu as bougé aujourd'hui?",
    steps_optional: "Pas (facultatif)",
    weight_today_optional: "Poids aujourd'hui (facultatif)",
    select_at_least_one: "Sélectionne au moins une option",
    steps_today: "Pas aujourd'hui",
    goal: "Objectif",
    goal_reached: "Objectif atteint!",
    missing_steps: "Manquant",
    steps: "pas",
    current_weight: "Poids actuel",
    since_start: "depuis début",
    not_logged: "Non enregistré",
    vs_yesterday: "vs hier",
    this_week: "Cette semaine",
    home: "Accueil",
    groups: "Groupes",
    badges: "Badges",
    profile: "Profil",
    great: "Bien",
    ok: "Ok",
    poor: "Mauvais",
    breakfast: "Petit-déjeuner",
    lunch: "Déjeuner",
    dinner: "Dîner",
    snack: "Collation",
    what_meal: "Quel repas est-ce?",
    my_profile: "Mon profil",
    edit: "Modifier",
    current_streak: "Série actuelle",
    save: "Sauvegarder",
    cancel: "Annuler",
    logout: "Déconnexion",
    your_goals: "Vos objectifs",
    main_goal: "Objectif principal",
    intensity: "Intensité",
    mode: "Mode",
    optional_data: "Données optionnelles",
    weight_kg: "Poids (kg)",
    height_cm: "Taille (cm)",
    not_defined: "Non défini",
    with_friends: "Avec des amis",
    alone: "Seul",
  }
};

const TranslationContext = createContext();

export function TranslationProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currentLang, setCurrentLang] = useState("en");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      // Not logged in, use localStorage or default to English
      const stored = localStorage.getItem("app_language");
      setCurrentLang(stored || "en");
      setIsInitialized(true);
    });
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  // Initialize and sync language from profile
  useEffect(() => {
    if (profile) {
      const profileLang = profile.language || "en";
      setCurrentLang(profileLang);
      localStorage.setItem("app_language", profileLang);
      setIsInitialized(true);
    }
  }, [profile]);

  const lang = currentLang;
  
  const t = (key) => {
    return translations[lang]?.[key] || translations["en"][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ t, lang }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    // Fallback if not wrapped in provider
    return { 
      t: (key) => translations.en[key] || key, 
      lang: "en" 
    };
  }
  return context;
}