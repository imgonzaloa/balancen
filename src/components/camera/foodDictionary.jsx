/**
 * Bilingual food dictionary for AI detection
 * Maps canonical food keys to localized names
 */

export const FOOD_DICTIONARY = {
  // Sweets & Desserts
  COOKIE: {
    en: "Cookie",
    es: "Galleta"
  },
  CHOC_CHIP_COOKIE: {
    en: "Chocolate chip cookie",
    es: "Galleta con chips de chocolate"
  },
  CAKE: {
    en: "Cake",
    es: "Pastel"
  },
  BROWNIE: {
    en: "Brownie",
    es: "Brownie"
  },
  
  // Vegetables & Salads
  SALAD: {
    en: "Salad",
    es: "Ensalada"
  },
  GREEN_SALAD: {
    en: "Green salad",
    es: "Ensalada verde"
  },
  CAESAR_SALAD: {
    en: "Caesar salad",
    es: "Ensalada César"
  },
  
  // Main dishes
  PIZZA: {
    en: "Pizza",
    es: "Pizza"
  },
  BURGER: {
    en: "Burger",
    es: "Hamburguesa"
  },
  SANDWICH: {
    en: "Sandwich",
    es: "Sándwich"
  },
  PASTA: {
    en: "Pasta",
    es: "Pasta"
  },
  RICE: {
    en: "Rice",
    es: "Arroz"
  },
  CHICKEN: {
    en: "Chicken",
    es: "Pollo"
  },
  BEEF: {
    en: "Beef",
    es: "Carne"
  },
  FISH: {
    en: "Fish",
    es: "Pescado"
  },
  
  // Fruits
  APPLE: {
    en: "Apple",
    es: "Manzana"
  },
  BANANA: {
    en: "Banana",
    es: "Banana"
  },
  ORANGE: {
    en: "Orange",
    es: "Naranja"
  },
  BERRIES: {
    en: "Berries",
    es: "Frutos rojos"
  },
  
  // Breakfast
  EGGS: {
    en: "Eggs",
    es: "Huevos"
  },
  TOAST: {
    en: "Toast",
    es: "Tostadas"
  },
  PANCAKES: {
    en: "Pancakes",
    es: "Panqueques"
  },
  YOGURT: {
    en: "Yogurt",
    es: "Yogur"
  },
  CEREAL: {
    en: "Cereal",
    es: "Cereal"
  },
  
  // Snacks
  CHIPS: {
    en: "Chips",
    es: "Papas fritas"
  },
  NUTS: {
    en: "Nuts",
    es: "Frutos secos"
  },
  POPCORN: {
    en: "Popcorn",
    es: "Pochoclo"
  },
  
  // Drinks
  COFFEE: {
    en: "Coffee",
    es: "Café"
  },
  SMOOTHIE: {
    en: "Smoothie",
    es: "Licuado"
  },
  JUICE: {
    en: "Juice",
    es: "Jugo"
  }
};

/**
 * Get localized food name
 * @param {string} foodKey - Canonical food key (e.g., "COOKIE")
 * @param {string} lang - Language code ("en" or "es")
 * @returns {string} Localized food name
 */
export function getLocalizedFoodName(foodKey, lang = "es") {
  const food = FOOD_DICTIONARY[foodKey];
  if (!food) return foodKey;
  return food[lang] || food.es;
}