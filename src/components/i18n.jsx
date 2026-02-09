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
      days_in_a_row: "Keep going!",
      total_fire: "Total Fire",
      today_progress: "Keep your momentum going",
      carbs: "Carbs",
      fats: "Fats",
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
      logged_meals: "Logged Meals",
      social_feed: "Social Feed",
      active_friends: "active friends",
      ai_coach: "AI Coach",
      ai_coach_goal_reached: "Amazing work! You hit your calorie goal. Continue this consistency to maximize results.",
      ai_coach_halfway: "Good progress. You're halfway there. Log your next meal to reach your goal.",
      ai_coach_start: "Start by logging your meals. Each photo brings you closer to understanding your nutrition.",
      
      // Camera
      camera_access_denied: "Camera access denied",
      camera_permission_denied: "Camera permission denied",
      camera_not_available: "Camera not available",
      camera_not_ready: "Camera not ready",
      error_capturing: "Error capturing photo",
      upload_photo: "Upload Photo",
      upload_photo_instead: "Upload a photo instead",
      cancel: "Cancel",
      choose_from_gallery: "Choose from Gallery",
      take_photo: "Take Photo",
      scan_food: "Scan Food",
      barcode: "Barcode",
      gallery: "Gallery",
      
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
      status: "Status",
      status_placeholder: "What's on your mind?",
      your_goal: "Your Goal",
      primary_goal: "Primary goal",
      daily_goal: "Daily goal",
      
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
      no_friends_yet: "No activity yet today",
      invite_friends_to_join: "Invite friends to join you",
      meal_logged: "Logged a meal",
      train_with_friends: "Train with friends and boost consistency",
      
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
      
      // Progress
      your_progress: "Your Progress",
      complete_analysis: "Complete analysis of your evolution",
      momentum_score: "Momentum Score",
      never_resets: "Never resets",
      consistency_label: "Consistency",
      adherence_label: "Adherence",
      good_progress_today: "Good progress today. Keep it up.",
      
      // Premium
      upgrade_to_premium: "Upgrade to Premium",
      premium_title: "Go Premium",
      build_consistency: "Build lasting consistency with premium features",
      monthly: "Monthly",
      yearly: "Yearly",
      year: "year",
      month: "month",
      best_value: "Best Value",
      features_premium: "Premium Features",
      fire_system: "Advanced Fire tracking & rewards",
      advanced_ai: "AI-powered nutrition insights",
      progressive_overload: "Progressive overload tracking",
      exclusive_challenges: "Exclusive team challenges",
      analytics: "Advanced analytics dashboard",
      priority_sync: "Priority data sync & backup",
      start_free_trial: "Start Free Trial",
      processing: "Processing...",
      card_required_billing: "Card required, billing starts after trial",
      cancel_anytime: "Cancel anytime, no commitments",
      payment_system_unavailable: "Payment system unavailable",
      please_login_continue: "Please login to continue",
      payment_not_configured: "Payment not configured",
      price_not_available: "Price not available",
      checkout_failed: "Checkout failed",
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
      days_in_a_row: "¡Sigue así!",
      total_fire: "Fuego Total",
      today_progress: "Mantén tu ritmo",
      carbs: "Carbohidratos",
      fats: "Grasas",
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
      logged_meals: "Comidas Registradas",
      social_feed: "Feed Social",
      active_friends: "amigos activos",
      ai_coach: "IA Coach",
      ai_coach_goal_reached: "¡Increíble trabajo! Alcanzaste tu meta de calorías. Continúa con esta consistencia para maximizar resultados.",
      ai_coach_halfway: "Buen progreso. Estás a mitad de camino. Registra tu siguiente comida para llegar a la meta.",
      ai_coach_start: "Comienza registrando tus comidas. Cada foto te acerca a entender mejor tu nutrición.",
      
      // Camera
      camera_access_denied: "Acceso a cámara denegado",
      camera_permission_denied: "Permiso de cámara denegado",
      camera_not_available: "Cámara no disponible",
      camera_not_ready: "Cámara no lista",
      error_capturing: "Error al capturar foto",
      upload_photo: "Subir Foto",
      upload_photo_instead: "Subir una foto",
      cancel: "Cancelar",
      choose_from_gallery: "Elegir de la Galería",
      take_photo: "Sacar una Foto",
      scan_food: "Escanear Comida",
      barcode: "Código de Barras",
      gallery: "Galería",
      
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
      status: "Estado",
      status_placeholder: "¿Qué estás pensando?",
      your_goal: "Tu Meta",
      primary_goal: "Objetivo principal",
      daily_goal: "Meta diaria",
      
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
      no_friends_yet: "Aún sin actividad hoy",
      invite_friends_to_join: "Invitá amigos a unirse",
      meal_logged: "Registró una comida",
      train_with_friends: "Entrena con amigos y aumenta tu constancia",
      
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
      
      // Progress
      your_progress: "Tu Progreso",
      complete_analysis: "Análisis completo de tu evolución",
      momentum_score: "Momentum Score",
      never_resets: "Nunca vuelve a cero",
      consistency_label: "Consistencia",
      adherence_label: "Adherencia",
      good_progress_today: "Buen progreso hoy. Mantén el ritmo.",
      
      // Premium
      upgrade_to_premium: "Actualizar a Premium",
      premium_title: "Pasa a Premium",
      build_consistency: "Construye consistencia duradera con funciones premium",
      monthly: "Mensual",
      yearly: "Anual",
      year: "año",
      month: "mes",
      best_value: "Mejor Valor",
      features_premium: "Funciones Premium",
      fire_system: "Sistema avanzado de Fire y recompensas",
      advanced_ai: "Insights nutricionales con IA",
      progressive_overload: "Seguimiento de sobrecarga progresiva",
      exclusive_challenges: "Desafíos exclusivos en equipo",
      analytics: "Dashboard de analíticas avanzado",
      priority_sync: "Sincronización y backup prioritarios",
      start_free_trial: "Comenzar Prueba Gratis",
      processing: "Procesando...",
      card_required_billing: "Tarjeta requerida, facturación inicia después del trial",
      cancel_anytime: "Cancelar en cualquier momento, sin compromisos",
      payment_system_unavailable: "Sistema de pago no disponible",
      please_login_continue: "Por favor inicia sesión para continuar",
      payment_not_configured: "Pago no configurado",
      price_not_available: "Precio no disponible",
      checkout_failed: "Checkout falló",
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