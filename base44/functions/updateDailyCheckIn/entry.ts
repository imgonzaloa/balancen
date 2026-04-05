import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const today = new Date().toISOString().split("T")[0];
    
    // Get today's check-in
    const checkIns = await base44.entities.DailyCheckIn.filter({
      created_by: user.email,
      date: today
    });

    const isNewCheckIn = !checkIns[0];
    let checkIn = checkIns[0];
    
    // Create or update check-in
    if (!checkIn) {
      checkIn = await base44.entities.DailyCheckIn.create({
        date: today,
        completed: true,
        ...body
      });
    } else {
      await base44.entities.DailyCheckIn.update(checkIn.id, body);
    }

    // Get user profile
    const profiles = await base44.entities.UserProfile.filter({
      created_by: user.email
    });
    const profile = profiles[0];

    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Award fire based on actions
    let fireAwarded = 0;
    let fireBreakdown = {};

    // App open fire (+1) - award once per day
    if (!body.app_open_fire_awarded && !checkIn.app_open_fire_awarded) {
      fireAwarded += 1;
      fireBreakdown.app_open = 1;
      await base44.entities.DailyCheckIn.update(checkIn.id, {
        app_open_fire_awarded: true
      });
    }

    // Meal photo fire (+2) - award for each photo
    if (body.food_photo_url && !body.meal_photo_fire_awarded && !checkIn.meal_photo_fire_awarded) {
      fireAwarded += 2;
      fireBreakdown.meal_photo = 2;
      await base44.entities.DailyCheckIn.update(checkIn.id, {
        meal_photo_fire_awarded: true
      });
    }

    // Check calorie goal achievement
    if (body.calories_goal_met && !body.calories_fire_awarded && !checkIn.calories_fire_awarded) {
      fireAwarded += 3;
      fireBreakdown.calories_goal = 3;
      await base44.entities.DailyCheckIn.update(checkIn.id, {
        calories_fire_awarded: true
      });
    }

    // Build profile update payload
    const profileUpdate = {};

    if (isNewCheckIn) {
      // Streak calculation — only on first check-in of the day
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const yesterdayCheckIns = await base44.entities.DailyCheckIn.filter({
        created_by: user.email,
        date: yesterdayStr,
        completed: true
      });

      const hadYesterdayCheckIn = yesterdayCheckIns.length > 0;
      const newStreak = hadYesterdayCheckIn ? (profile.current_streak || 0) + 1 : 1;
      const newLongestStreak = Math.max(newStreak, profile.longest_streak || 0);

      profileUpdate.current_streak = newStreak;
      profileUpdate.longest_streak = newLongestStreak;
    }

    // Update total fire count
    if (fireAwarded > 0) {
      profileUpdate.fire_total = (profile.fire_total || 0) + fireAwarded;
    }

    // Auto-set 24h status (meal logged = status update)
    if (body.food_photo_url) {
      profileUpdate.status_updated_at = new Date().toISOString();
    }

    await base44.entities.UserProfile.update(profile.id, profileUpdate);

    return Response.json({
      success: true,
      checkIn,
      fireAwarded,
      fireBreakdown
    });
  } catch (error) {
    console.error('Error updating check-in:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});