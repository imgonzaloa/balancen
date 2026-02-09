import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dietary_restrictions, preferences, days } = await req.json();

    // Fetch user profile
    const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
    const profile = profiles[0];

    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check premium
    if (!profile.is_premium && profile.role !== 'owner' && profile.role !== 'collaborator') {
      return Response.json({ error: 'Premium required' }, { status: 403 });
    }

    // Fetch recent meals for context
    const recentMeals = await base44.entities.MealLog.filter(
      { created_by: user.email },
      '-date',
      20
    );

    const prompt = `You are an expert nutritionist. Create a personalized ${days}-day meal plan.

USER PROFILE:
- Daily calorie goal: ${profile.calories_goal || 2000} kcal
- Primary goal: ${profile.primary_goal}
- Weight: ${profile.weight || 'not set'} kg
- Height: ${profile.height || 'not set'} cm

PREFERENCES:
- Dietary restrictions: ${dietary_restrictions || 'none'}
- Food preferences: ${preferences || 'varied diet'}

RECENT MEAL PATTERNS:
${recentMeals.slice(0, 5).map(m => `- ${m.meal_type}: ${m.estimated_calories || 0} kcal`).join('\n')}

Create a ${days}-day meal plan with:
- Breakfast, lunch, dinner, and 1-2 snacks per day
- Specific meal names and descriptions
- Estimated calories and macros per meal
- Shopping list organized by category
- Preparation tips

Make it practical, delicious, and aligned with their goals.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          meal_plan: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "number" },
                meals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      meal_type: { type: "string" },
                      name: { type: "string" },
                      description: { type: "string" },
                      calories: { type: "number" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fats: { type: "number" }
                    }
                  }
                },
                total_calories: { type: "number" }
              }
            }
          },
          shopping_list: {
            type: "object",
            properties: {
              proteins: { type: "array", items: { type: "string" } },
              vegetables: { type: "array", items: { type: "string" } },
              carbs: { type: "array", items: { type: "string" } },
              fats: { type: "array", items: { type: "string" } },
              other: { type: "array", items: { type: "string" } }
            }
          },
          tips: { type: "array", items: { type: "string" } },
          motivation: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      plan: response
    });
  } catch (error) {
    console.error('AI Meal Planner Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});