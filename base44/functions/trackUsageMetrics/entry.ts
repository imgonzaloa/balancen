import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Fetch all users
    const allProfiles = await base44.asServiceRole.entities.UserProfile.list('-created_date', 10000);
    const totalUsers = allProfiles.length;
    const premiumUsers = allProfiles.filter(p => p.is_premium).length;

    // Power users: 10+ scans in past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const recentMeals = await base44.asServiceRole.entities.MealLog.list('-created_date', 10000);
    const mealsByUser = {};
    recentMeals.forEach(meal => {
      if (meal.date >= sevenDaysAgoStr && meal.photo_url) {
        const email = meal.created_by;
        mealsByUser[email] = (mealsByUser[email] || 0) + 1;
      }
    });
    const powerUsers = Object.values(mealsByUser).filter(count => count >= 10).length;

    // Today's scans
    const todayMeals = recentMeals.filter(m => m.date === today && m.photo_url);
    const totalScansToday = todayMeals.length;

    // Average scans per user (only count users with at least 1 scan)
    const usersWithScans = new Set(todayMeals.map(m => m.created_by)).size;
    const avgScansPerUser = usersWithScans > 0 ? (totalScansToday / usersWithScans).toFixed(2) : 0;

    // Costs
    const estimatedDailyCost = (totalScansToday * 0.003).toFixed(4);
    const estimatedMonthlyCost = (totalScansToday * 0.003 * 30).toFixed(2);

    // Threshold status
    let thresholdStatus = 'safe';
    if (estimatedMonthlyCost > 800) {
      thresholdStatus = 'critical';
    } else if (estimatedMonthlyCost > 500) {
      thresholdStatus = 'warning';
    }

    // Create snapshot
    const snapshot = await base44.asServiceRole.entities.UsageSnapshot.create({
      date: today,
      total_users: totalUsers,
      premium_users: premiumUsers,
      power_users: powerUsers,
      total_scans_today: totalScansToday,
      avg_scans_per_user: parseFloat(avgScansPerUser),
      estimated_daily_cost_eur: parseFloat(estimatedDailyCost),
      estimated_monthly_cost_eur: parseFloat(estimatedMonthlyCost),
      threshold_status: thresholdStatus,
    });

    return Response.json({
      success: true,
      snapshot,
      message: `Snapshot created: ${totalScansToday} scans today, €${estimatedMonthlyCost} projected monthly cost (${thresholdStatus})`,
    });
  } catch (error) {
    console.error('trackUsageMetrics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});