import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      // Navigation
      home: "Home",
      social: "Social", 
      progress: "Progress",
      profile: "Profile",
      
      // Home
      current_streak: "Current Streak",
      days_in_a_row: "days in a row",
      total_fire: "Total Fire",
      today_progress: "Today's Progress",
      calories: "Calories",
      protein: "Protein",
      meals_logged_today: "Meals logged today",
      log_your_meal: "Log Your Meal",
      friends_active: "Friends active today",
      friends: "friends",
      recent_activity: "Recent Activity",
      meal: "Meal",
      meal_logged: "Meal logged!",
      meal_saved: "Meal Saved!",
      great_job: "Great job tracking",
      
      // Camera
      camera_access_denied: "Camera access denied",
      upload_photo_instead: "Upload a photo instead",
      cancel: "Cancel",
      choose_from_gallery: "Choose from Gallery",
      take_photo: "Take Photo",
      
      // Profile
      my_profile: "My Profile",
      edit: "Edit",
      save: "Save",
      best_streak: "Best Streak",
      total_checkins: "Total Check-ins",
      add_status: "Add a status",
      tap_to_edit: "Tap to edit",
      status_expires_24h: "Expires in 24h",
      settings: "Settings",
      settings_desc: "Language, privacy & more",
      your_goals: "Your Goals",
      main_goal: "Main Goal",
      intensity: "Intensity",
      mode: "Mode",
      with_friends: "With Friends",
      alone: "Solo",
      optional_data: "Optional Data",
      weight_kg: "Weight (kg)",
      height_cm: "Height (cm)",
      optional: "Optional",
      not_defined: "Not set",
      logout: "Logout",
      
      // Goals
      consistency: "Be more consistent",
      weight_loss: "Lose weight",
      healthy_habits: "Build healthy habits",
      stay_active: "Stay active",
      
      // Intensity
      easy: "Easy",
      easy_desc: "Gentle pace",
      normal: "Normal",
      normal_desc: "Balanced approach",
      challenging: "Challenging",
      challenging_desc: "Push yourself",
      
      // Settings
      language: "Language",
      select_language: "Select Language",
      privacy: "Privacy",
      data_encrypted: "Your data is encrypted",
      admin_tools: "Admin Tools",
      invite_collaborators: "Invite Collaborators",
      grant_free_premium: "Grant free premium access",
      user_management: "User Management",
      view_manage_users: "View & manage users",
      daily_calories_limit: "Daily calorie limit",
      optional_leave_empty: "Optional - leave empty if unsure",
      goals_targets: "Goals & Targets",
      set_daily_goals: "Set your daily goals",
      session_expired: "Session expired",
      please_login_again: "Please login again",
      connection_error: "Connection error",
      check_internet: "Check your internet connection",
      
      // Referral
      invite_friends: "Invite Friends",
      your_referrals: "Your referrals",
      free_month_progress: "for your next free month",
      invited_friends: "Invited Friends",
      registered: "Registered",
      premium_active: "Premium Active",
      pending: "Pending",
      share_invite: "Share Invite",
      copy_link: "Copy Link",
      
      // Social
      add_friends: "Add Friends",
      no_friends_yet: "No friends yet",
      invite_friends_to_join: "Invite friends to join you",
      
      // Precision
      estimated_accuracy: "Estimated Accuracy",
      what_is_precision: "What is 'Estimated Accuracy'?",
      precision_explanation: "It's an estimate of how complete and reliable your data is today. It increases when you log more meals and confirm portions.",
      improve_precision: "Improve Precision",
      precision_factors: "To improve your accuracy:",
      factor_more_meals: "Log 2 more meals",
      factor_confirm_ingredients: "Confirm ingredients",
      factor_clear_photo: "Upload clear photos",
      
      // Errors
      error_uploading_photo: "Couldn't upload photo. Try again",
      error_network: "Network error. Check connection",
      retry: "Retry",
      processing_image: "Processing image...",
      uploading_photo: "Uploading photo...",
      photo_updated: "Photo updated",
      
      // Onboarding
      select_language: "Choose your language",
      whats_your_goal: "What's your goal?",
      select_primary_goal: "Select your primary focus",
      choose_pace: "Choose your pace",
      how_challenging: "How challenging should it be?",
      how_use_app: "How do you prefer to use the app?",
      can_change_later: "You can change this later",
      easy_desc: "Gentle pace",
      normal_desc: "Balanced approach",
      challenging_desc: "Push yourself",
      just_me: "Solo",
      just_me_desc: "Private journey",
      with_friends: "With Friends",
      with_friends_desc: "Share progress",
      with_team: "Team",
      with_team_desc: "Join groups",
      safe_mode_active: "Safe Mode: Simplified",

      // Missing translations
      ai_recommendations: "AI Recommendations",
      personalized_tips: "Personalized tips for you",
      notifications: "Notifications",
      gentle_reminders: "Gentle reminders",
      premium_active: "Premium Active",
      all_features_unlocked: "All features unlocked",
      upgrade_to_premium_title: "Upgrade to Premium",
      unlock_all_features: "Unlock all features",
      language_updated: "Language updated",
    }
  },
  es: {
    translation: {
      // Navigation
      home: "Inicio",
      social: "Social",
      progress: "Progreso",
      profile: "Perfil",
      
      // Home
      current_streak: "Racha Actual",
      days_in_a_row: "días seguidos",
      total_fire: "Fuego Total",
      today_progress: "Progreso de Hoy",
      calories: "Calorías",
      protein: "Proteína",
      meals_logged_today: "Comidas registradas hoy",
      log_your_meal: "Registrar Comida",
      friends_active: "Amigos activos hoy",
      friends: "amigos",
      recent_activity: "Actividad Reciente",
      meal: "Comida",
      meal_logged: "¡Comida registrada!",
      meal_saved: "¡Comida Guardada!",
      great_job: "¡Excelente trabajo!",
      
      // Camera
      camera_access_denied: "Acceso a cámara denegado",
      upload_photo_instead: "Subir una foto",
      cancel: "Cancelar",
      choose_from_gallery: "Elegir de la Galería",
      take_photo: "Sacar una Foto",
      
      // Profile
      my_profile: "Mi Perfil",
      edit: "Editar",
      save: "Guardar",
      best_streak: "Mejor Racha",
      total_checkins: "Check-ins Totales",
      add_status: "Agregar estado",
      tap_to_edit: "Toca para editar",
      status_expires_24h: "Expira en 24h",
      settings: "Configuración",
      settings_desc: "Idioma, privacidad y más",
      your_goals: "Tus Objetivos",
      main_goal: "Objetivo Principal",
      intensity: "Intensidad",
      mode: "Modo",
      with_friends: "Con Amigos",
      alone: "Solo",
      optional_data: "Datos Opcionales",
      weight_kg: "Peso (kg)",
      height_cm: "Altura (cm)",
      optional: "Opcional",
      not_defined: "No definido",
      logout: "Cerrar Sesión",
      
      // Goals
      consistency: "Ser más consistente",
      weight_loss: "Bajar de peso",
      healthy_habits: "Hábitos saludables",
      stay_active: "Mantenerse activo",
      
      // Intensity
      easy: "Fácil",
      easy_desc: "Ritmo suave",
      normal: "Normal",
      normal_desc: "Enfoque balanceado",
      challenging: "Desafiante",
      challenging_desc: "Desafíate a vos mismo",
      
      // Settings
      language: "Idioma",
      select_language: "Seleccionar Idioma",
      privacy: "Privacidad",
      data_encrypted: "Tus datos están protegidos",
      admin_tools: "Herramientas de Admin",
      invite_collaborators: "Invitar Colaboradores",
      grant_free_premium: "Dar Acceso Premium Gratis",
      user_management: "Gestión de Usuarios",
      view_manage_users: "Ver y administrar usuarios",
      daily_calories_limit: "Límite diario de calorías",
      optional_leave_empty: "Opcional - dejalo vacío si no estás seguro",
      goals_targets: "Objetivos y Metas",
      set_daily_goals: "Configurar objetivos diarios",
      session_expired: "Sesión expirada",
      please_login_again: "Por favor ingresá de nuevo",
      connection_error: "Error de conexión",
      check_internet: "Revisá tu conexión a internet",
      
      // Referral
      invite_friends: "Invitar Amigos",
      your_referrals: "Tus referidos",
      free_month_progress: "para tu próximo mes gratis",
      invited_friends: "Amigos Invitados",
      registered: "Registrado",
      premium_active: "Premium Activo",
      pending: "Pendiente",
      share_invite: "Compartir Invitación",
      copy_link: "Copiar Link",
      
      // Social
      add_friends: "Agregar Amigos",
      no_friends_yet: "Todavía no tenés amigos",
      invite_friends_to_join: "Invitá amigos a unirse",
      
      // Precision
      estimated_accuracy: "Precisión Estimada",
      what_is_precision: "¿Qué significa 'Precisión Estimada'?",
      precision_explanation: "Es una estimación de cuán completos y confiables son tus datos de hoy. Sube cuando registrás más comidas y confirmás porciones.",
      improve_precision: "Mejorar Precisión",
      precision_factors: "Para mejorar tu precisión:",
      factor_more_meals: "Registrá 2 comidas más",
      factor_confirm_ingredients: "Confirmá ingredientes",
      factor_clear_photo: "Subí fotos nítidas",
      
      // Errors
      error_uploading_photo: "No pudimos subir la foto. Intentá otra vez",
      error_network: "Error de red. Revisá tu conexión",
      retry: "Reintentar",
      processing_image: "Procesando imagen...",
      uploading_photo: "Subiendo foto...",
      photo_updated: "Foto actualizada",
      
      // Onboarding
      select_language: "Elige tu idioma",
      whats_your_goal: "¿Cuál es tu objetivo?",
      select_primary_goal: "Selecciona tu enfoque principal",
      choose_pace: "Elige tu ritmo",
      how_challenging: "¿Qué tan desafiante debe ser?",
      how_use_app: "¿Cómo prefieres usar la app?",
      can_change_later: "Podés cambiar esto después",
      easy_desc: "Ritmo suave",
      normal_desc: "Enfoque balanceado",
      challenging_desc: "Desafíate a vos mismo",
      just_me: "Solo",
      just_me_desc: "Viaje privado",
      with_friends: "Con Amigos",
      with_friends_desc: "Compartir progreso",
      with_team: "Equipo",
      with_team_desc: "Únete a grupos",
      safe_mode_active: "Modo Seguro: Simplificado",

      // Missing translations
      ai_recommendations: "Recomendaciones IA",
      personalized_tips: "Tips personalizados para vos",
      notifications: "Notificaciones",
      gentle_reminders: "Recordatorios suaves",
      premium_active: "Premium Activo",
      all_features_unlocked: "Todas las funciones desbloqueadas",
      upgrade_to_premium_title: "Actualizar a Premium",
      unlock_all_features: "Desbloquear todas las funciones",
      language_updated: "Idioma actualizado",
    }
  }
};

// Get initial language from localStorage or default to ENGLISH
const getInitialLanguage = () => {
  try {
    const stored = localStorage.getItem("app_language");
    return stored || "en"; // Default ENGLISH
  } catch {
    return "en";
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: "en",
    defaultNS: "translation",
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// Save language changes to localStorage
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem("app_language", lng);
  } catch (e) {
    console.warn("Failed to save language preference", e);
  }
});

export default i18n;