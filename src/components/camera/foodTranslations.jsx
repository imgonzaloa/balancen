/**
 * Food name translations
 * Maps food keys to localized names
 */

export const foodNames = {
  en: {
    COOKIE: "Chocolate chip cookie",
    SALAD: "Fresh salad",
    PIZZA: "Pizza slice",
    BURGER: "Burger",
    APPLE: "Apple",
    SANDWICH: "Sandwich",
    PASTA: "Pasta",
    RICE: "Rice bowl",
    CHICKEN: "Chicken",
    FISH: "Fish",
    FOOD_DETECTED: "Food detected",
  },
  es: {
    COOKIE: "Galleta con chips de chocolate",
    SALAD: "Ensalada fresca",
    PIZZA: "Porción de pizza",
    BURGER: "Hamburguesa",
    APPLE: "Manzana",
    SANDWICH: "Sándwich",
    PASTA: "Pasta",
    RICE: "Bowl de arroz",
    CHICKEN: "Pollo",
    FISH: "Pescado",
    FOOD_DETECTED: "Comida detectada",
  }
};

export const guidanceMessages = {
  en: {
    CENTER_FOOD: "Center your food",
    MOVE_CLOSER: "Move closer",
    BETTER_LIGHTING: "Better lighting needed",
    TOO_BRIGHT: "Too bright",
    SCANNING: "Scanning...",
    LOCKED: "Locked",
  },
  es: {
    CENTER_FOOD: "Centra tu comida",
    MOVE_CLOSER: "Acércate más",
    BETTER_LIGHTING: "Mejora la iluminación",
    TOO_BRIGHT: "Demasiado brillante",
    SCANNING: "Escaneando...",
    LOCKED: "Detectado",
  }
};

export function getFoodName(key, lang) {
  const langNames = foodNames[lang] || foodNames.en;
  return langNames[key] || langNames.FOOD_DETECTED;
}

export function getGuidance(key, lang) {
  const langGuidance = guidanceMessages[lang] || guidanceMessages.en;
  return langGuidance[key] || "";
}