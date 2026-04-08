import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Calculate time windows
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const nowStr = now.toISOString().split('T')[0];
    const in24HoursStr = in24Hours.toISOString().split('T')[0];

    console.log(`[TrialReminder] Checking for expiring trials between ${nowStr} and ${in24HoursStr}`);

    // Query all trial profiles expiring in the next 24 hours
    const trialProfiles = await base44.asServiceRole.entities.UserProfile.filter({
      subscription_status: 'trial',
      trial_end_date: {
        $gte: nowStr,
        $lte: in24HoursStr,
      },
    });

    console.log(`[TrialReminder] Found ${trialProfiles?.length || 0} expiring trials`);

    if (!trialProfiles || trialProfiles.length === 0) {
      return Response.json({ sent: 0, message: 'No expiring trials found' });
    }

    const sentEmails = [];
    const failedEmails = [];

    for (const profile of trialProfiles) {
      try {
        const userEmail = profile.created_by;
        if (!userEmail) {
          console.warn(`[TrialReminder] Profile ${profile.id} has no created_by email`);
          continue;
        }

        const lang = profile.language || 'en';

        // Localized content
        const subjects = {
          es: 'Tu trial de Balancen termina mañana',
          nl: 'Je Balancen proefperiode eindigt morgen',
          en: 'Your Balancen trial ends tomorrow',
        };

        const bodies = {
          es: `Hola ${profile.display_name || 'usuario'},

Tu período de prueba de Balancen vence mañana. No pierdas acceso a:

✓ Registro ilimitado de comidas con IA
✓ Análisis nutricional detallado
✓ Planes personalizados
✓ Estadísticas avanzadas
✓ Entrenamiento en vivo

Upgrade ahora y obtén acceso completo a todas las características premium.

${getUpgradeLink()}

Saludos,
El equipo de Balancen`,

          nl: `Hallo ${profile.display_name || 'gebruiker'},

Je Balancen proefperiode eindigt morgen. Verlies geen toegang tot:

✓ Onbeperkt voedingslogboek met AI
✓ Gedetailleerde voedingsanalyse
✓ Persoonlijke plannen
✓ Geavanceerde statistieken
✓ Live training

Upgrade nu en krijg volledige toegang tot alle premium functies.

${getUpgradeLink()}

Groeten,
Het Balancen-team`,

          en: `Hi ${profile.display_name || 'there'},

Your Balancen trial ends tomorrow. Don't lose access to:

✓ Unlimited AI-powered meal logging
✓ Detailed nutrition analysis
✓ Personalized plans
✓ Advanced analytics
✓ Live coaching

Upgrade now and unlock all premium features.

${getUpgradeLink()}

Best regards,
The Balancen Team`,
        };

        const subject = subjects[lang] || subjects.en;
        const body = bodies[lang] || bodies.en;

        // Send email via integration
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: userEmail,
          subject,
          body,
          from_name: 'Balancen',
        });

        sentEmails.push(userEmail);
        console.log(`[TrialReminder] Email sent to ${userEmail}`);
      } catch (emailError) {
        console.error(`[TrialReminder] Error sending email for profile ${profile.id}:`, emailError);
        failedEmails.push(profile.created_by);
      }
    }

    return Response.json({
      sent: sentEmails.length,
      failed: failedEmails.length,
      sentEmails,
      failedEmails,
    });
  } catch (error) {
    console.error('[TrialReminder] Function error:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
});

function getUpgradeLink(): string {
  // Replace with your actual upgrade URL
  return 'https://balancen.app/upgrade';
}