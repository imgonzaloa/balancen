import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all user data
    const userEmail = user.email;

    // Delete profile
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ created_by: userEmail });
    for (const profile of profiles) {
      await base44.asServiceRole.entities.UserProfile.delete(profile.id);
    }

    // Delete check-ins
    const checkIns = await base44.asServiceRole.entities.DailyCheckIn.filter({ created_by: userEmail });
    for (const checkIn of checkIns) {
      await base44.asServiceRole.entities.DailyCheckIn.delete(checkIn.id);
    }

    // Delete meal logs
    const mealLogs = await base44.asServiceRole.entities.MealLog.filter({ created_by: userEmail });
    for (const mealLog of mealLogs) {
      await base44.asServiceRole.entities.MealLog.delete(mealLog.id);
    }

    // Delete badges
    const badges = await base44.asServiceRole.entities.Badge.filter({ user_email: userEmail });
    for (const badge of badges) {
      await base44.asServiceRole.entities.Badge.delete(badge.id);
    }

    // Delete group memberships
    const memberships = await base44.asServiceRole.entities.GroupMember.filter({ user_email: userEmail });
    for (const membership of memberships) {
      await base44.asServiceRole.entities.GroupMember.delete(membership.id);
    }

    // Delete friends
    const friends = await base44.asServiceRole.entities.Friend.filter({ created_by: userEmail });
    for (const friend of friends) {
      await base44.asServiceRole.entities.Friend.delete(friend.id);
    }

    // Delete AI recommendations
    const recommendations = await base44.asServiceRole.entities.AIRecommendation.filter({ user_email: userEmail });
    for (const recommendation of recommendations) {
      await base44.asServiceRole.entities.AIRecommendation.delete(recommendation.id);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});