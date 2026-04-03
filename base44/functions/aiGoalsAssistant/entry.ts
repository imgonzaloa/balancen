import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, lang } = await req.json();
    const langInstruction = lang === 'es' ? 'Respond entirely in Spanish.' : lang === 'pt' ? 'Respond entirely in Portuguese.' : 'Respond in English.';

    // Fetch user profile
    const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
    const profile = profiles[0];

    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch recent check-ins (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCheckins = await base44.entities.DailyCheckIn.filter(
      { created_by: user.email },
      '-date',
      30
    );

    // Fetch recent meals (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const recentMeals = await base44.entities.MealLog.filter(
      { created_by: user.email },
      '-date',
      50
    );

    if (action === 'analyze') {
      // Generate AI analysis and recommendations
      const prompt = `You are a professional nutritionist and fitness coach. Analyze this user's data and provide personalized, achievable daily goals.

USER PROFILE:
- Current weight: ${profile.weight || 'not set'} kg
- Height: ${profile.height || 'not set'} cm
- Starting weight: ${profile.starting_weight || 'not set'} kg
- Current calorie goal: ${profile.calories_goal || 'not set'} kcal
- Primary goal: ${profile.primary_goal}
- Intensity level: ${profile.intensity_level}
- Current streak: ${profile.current_streak} days
- Total check-ins: ${profile.total_checkins}

RECENT ACTIVITY (last 30 days):
- Total check-ins: ${recentCheckins.length}
- Average calories consumed: ${recentMeals.length > 0 ? Math.round(recentMeals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0) / Math.max(recentMeals.length, 1)) : 'no data'} kcal
- Days with movement: ${recentCheckins.filter(c => c.moved_today).length}

RECENT MEALS (last 14 days):
${recentMeals.slice(0, 10).map(m => `- ${m.meal_type}: ${m.estimated_calories || 0} kcal (protein: ${m.estimated_protein || 0}g, carbs: ${m.estimated_carbs || 0}g, fats: ${m.estimated_fats || 0}g)`).join('\n')}

Based on this data, provide:
1. A recommended daily calorie goal (be specific and realistic)
2. Recommended macro split (protein/carbs/fats in grams)
3. Activity recommendations (how many days per week to move)
4. A personalized motivation message explaining WHY these goals fit their profile

Be encouraging, realistic, and science-based. Consider their goal (${profile.primary_goal}) and intensity preference (${profile.intensity_level}).

${langInstruction}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_calories: { type: "number" },
            recommended_protein: { type: "number" },
            recommended_carbs: { type: "number" },
            recommended_fats: { type: "number" },
            activity_days_per_week: { type: "number" },
            explanation: { type: "string" },
            motivation_message: { type: "string" }
          }
        }
      });

      return Response.json({
        success: true,
        recommendations: response
      });
    }

    if (action === 'apply') {
      const { recommended_calories, recommended_protein, recommended_carbs, recommended_fats } = await req.json();

      // Apply recommendations to user profile
      await base44.entities.UserProfile.update(profile.id, {
        calories_goal: recommended_calories
      });

      return Response.json({
        success: true,
        message: 'Goals updated successfully'
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('AI Goals Assistant Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});