import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const STORAGE_KEY = "balancen_lang";

// Get initial language - DEFAULT TO ENGLISH
const getInitialLanguage = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "es") {
    return stored;
  }
  return "en"; // DEFAULT ENGLISH
};

const resources = {
  en: {
    translation: {
      // Navigation
      home: "Home",
      groups: "Groups",
      friends: "Friends",
      profile: "Profile",
      social: "Social",
      progress: "Progress",
      
      // Home
      welcome: "Welcome",
      current_streak: "Current streak",
      total_fire: "Total fire",
      days_in_a_row: "days in a row",
      today_progress: "Today's Progress",
      calories: "Calories",
      protein: "Protein",
      carbs: "Carbs",
      fats: "Fats",
      goal_text: "of",
      meals_logged_today: "Meals logged today",
      log_your_meal: "Log your meal",
      friends_active: "Friends active",
      friends: "friends",
      recent_activity: "Recent Activity",
      meal: "Meal",
      no_meals_yet: "No meals yet",
      tap_to_add_meal: "Tap to add your first meal",
      meal_logged: "Meal logged!",
      
      // Camera
      scan_food: "Scan Food",
      barcode: "Barcode",
      gallery: "Gallery",
      camera_permission_denied: "Camera permission denied",
      camera_not_ready: "Camera not ready",
      camera_not_available: "Camera Not Available",
      error_capturing: "Error capturing photo",
      upload_photo: "Upload Photo",
      cancel: "Cancel",
      
      // Profile
      my_profile: "My profile",
      edit: "Edit",
      save: "Save",
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
      settings: "Settings",
      settings_desc: "Language, notifications, privacy",
      optional: "Optional",
      add_status: "Add today's note",
      tap_to_edit: "Tap to edit",
      status_expires_24h: "Optional • Expires in 24h",
      total_checkins: "Total check-ins",
      best_streak: "Best streak",
      
      // Precision
      estimated_accuracy: "Estimated accuracy",
      
      // Social
      no_friends_yet: "You don't have friends yet",
      invite_to_start: "Invite friends to get started",
      
      // Misc
      analyzing: "Analyzing...",
      loading: "Loading",
      meal_saved: "Meal saved!",
      error_saving: "Error saving meal",
    }
  },
  es: {
    translation: {
      // Navigation
      home: "Inicio",
      groups: "Grupos",
      friends: "Amigos",
      profile: "Perfil",
      social: "Social",
      progress: "Progreso",
      
      // Home
      welcome: "Bienvenido",
      current_streak: "Racha actual",
      total_fire: "Total fuego",
      days_in_a_row: "días seguidos",
      today_progress: "Progreso de hoy",
      calories: "Calorías",
      protein: "Proteína",
      carbs: "Carbos",
      fats: "Grasas",
      goal_text: "de",
      meals_logged_today: "Comidas registradas hoy",
      log_your_meal: "Registrá tu comida",
      friends_active: "Amigos activos",
      friends: "amigos",
      recent_activity: "Actividad reciente",
      meal: "Comida",
      no_meals_yet: "Sin comidas registradas",
      tap_to_add_meal: "Toca para agregar tu primera comida",
      meal_logged: "¡Comida registrada!",
      
      // Camera
      scan_food: "Escanear comida",
      barcode: "Código de barras",
      gallery: "Galería",
      camera_permission_denied: "Permiso de cámara denegado",
      camera_not_ready: "Cámara no lista",
      camera_not_available: "Cámara No Disponible",
      error_capturing: "Error al capturar foto",
      upload_photo: "Subir foto",
      cancel: "Cancelar",
      
      // Profile
      my_profile: "Mi perfil",
      edit: "Editar",
      save: "Guardar",
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
      settings: "Configuración",
      settings_desc: "Idioma, notificaciones, privacidad",
      optional: "Opcional",
      add_status: "Agregá nota de hoy",
      tap_to_edit: "Toca para editar",
      status_expires_24h: "Opcional • Expira en 24h",
      total_checkins: "Total check-ins",
      best_streak: "Mejor racha",
      
      // Precision
      estimated_accuracy: "Precisión estimada",
      
      // Social
      no_friends_yet: "Todavía no tenés amigos",
      invite_to_start: "Invitá amigos para empezar",
      
      // Misc
      analyzing: "Analizando...",
      loading: "Cargando",
      meal_saved: "¡Comida guardada!",
      error_saving: "Error al guardar",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// Save to localStorage whenever language changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;