import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { equipment, fitness_level, goals, duration_minutes, lang } = await req.json();
    const langInstruction = lang === 'es' ? 'Respond entirely in Spanish.' : lang === 'pt' ? 'Respond entirely in Portuguese.' : 'Respond in English.';

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

    // Fetch recent check-ins for activity data
    const recentCheckins = await base44.entities.DailyCheckIn.filter(
      { created_by: user.email },
      '-date',
      14
    );

    const activeDays = recentCheckins.filter(c => c.moved_today).length;

    const prompt = `You are a certified personal trainer. Create a personalized workout plan.

USER PROFILE:
- Primary goal: ${profile.primary_goal}
- Intensity level: ${profile.intensity_level}
- Current streak: ${profile.current_streak} days
- Active days (last 2 weeks): ${activeDays}

WORKOUT PREFERENCES:
- Available equipment: ${equipment || 'bodyweight only'}
- Fitness level: ${fitness_level || 'beginner'}
- Specific goals: ${goals || 'general fitness'}
- Session duration: ${duration_minutes || 30} minutes

Create a complete workout plan with:
- Warm-up routine (5-10 min)
- Main workout with 6-8 exercises
- Cool-down/stretch (5 min)
- For each exercise: name, sets, reps/duration, rest time, form tips
- Progressive overload recommendations
- Modifications for different fitness levels

Make it safe, effective, and engaging. Consider their goal: ${profile.primary_goal}.

${langInstruction}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          warmup: {
            type: "array",
            items: {
              type: "object",
              properties: {
                exercise: { type: "string" },
                duration: { type: "string" },
                description: { type: "string" }
              }
            }
          },
          main_workout: {
            type: "array",
            items: {
              type: "object",
              properties: {
                exercise: { type: "string" },
                sets: { type: "number" },
                reps: { type: "string" },
                rest: { type: "string" },
                tips: { type: "string" },
                equipment_needed: { type: "string" }
              }
            }
          },
          cooldown: {
            type: "array",
            items: {
              type: "object",
              properties: {
                exercise: { type: "string" },
                duration: { type: "string" },
                description: { type: "string" }
              }
            }
          },
          total_duration: { type: "string" },
          calories_burned_estimate: { type: "number" },
          progressive_overload: {
            type: "object",
            properties: {
              week_1_2: { type: "string" },
              week_3_4: { type: "string" },
              week_5_plus: { type: "string" }
            }
          },
          modifications: {
            type: "object",
            properties: {
              easier: { type: "array", items: { type: "string" } },
              harder: { type: "array", items: { type: "string" } }
            }
          },
          motivation: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      workout: response
    });
  } catch (error) {
    console.error('AI Workout Generator Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});