/**
 * Health API bridge — wraps navigator.health (Web Health API / Capacitor Health plugin).
 * On web without native bridge, all calls gracefully return null.
 */

export const isHealthAvailable = () => {
  return typeof window !== 'undefined' && !!(window.Capacitor?.isNativePlatform?.() && window.Plugins?.Health);
};

/**
 * Write nutritional data after a meal log.
 * @param {{ calories: number, protein: number, carbs: number, fats: number }} data
 */
export async function writeNutritionToHealth(data) {
  if (!isHealthAvailable()) return false;
  try {
    const { Health } = window.Plugins;
    const now = new Date().toISOString();
    await Promise.all([
      Health.store({ startDate: now, endDate: now, dataType: 'dietaryEnergyConsumed', value: data.calories, unit: 'kcal' }),
      Health.store({ startDate: now, endDate: now, dataType: 'dietaryProtein',         value: data.protein,  unit: 'g' }),
      Health.store({ startDate: now, endDate: now, dataType: 'dietaryCarbohydrates',   value: data.carbs,    unit: 'g' }),
      Health.store({ startDate: now, endDate: now, dataType: 'dietaryFatTotal',        value: data.fats,     unit: 'g' }),
    ]);
    return true;
  } catch (e) {
    console.warn('Health write error:', e);
    return false;
  }
}

/**
 * Read today's step count from Health.
 * Returns { steps: number, caloriesBurned: number } or null.
 */
export async function readStepsFromHealth() {
  if (!isHealthAvailable()) return null;
  try {
    const { Health } = window.Plugins;
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate   = new Date();

    const result = await Health.query({
      startDate: startDate.toISOString(),
      endDate:   endDate.toISOString(),
      dataType:  'steps',
      limit:     1,
      ascending: false,
    });

    const steps = result?.resultData?.reduce?.((sum, r) => sum + (r.value || 0), 0) ?? 0;
    // Rough estimate: 0.04 kcal per step
    const caloriesBurned = Math.round(steps * 0.04);
    return { steps, caloriesBurned };
  } catch (e) {
    console.warn('Health read error:', e);
    return null;
  }
}