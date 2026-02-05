import { createClientFromRequest } from 'npm:@base44/sdk';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const secrets = await base44.secrets.get([
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_MONTHLY_PRICE_ID_EUR',
      'STRIPE_YEARLY_PRICE_ID_EUR',
      'STRIPE_MONTHLY_PRICE_ID_USD_US',
      'STRIPE_YEARLY_PRICE_ID_USD_US',
      'STRIPE_MONTHLY_PRICE_ID_USD_LATAM',
      'STRIPE_YEARLY_PRICE_ID_USD_LATAM',
    ]);

    // Get user's country from IP geolocation
    const country = req.headers.get('cf-ipcountry') || 'US';
    
    const europeanCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'NO', 'CH', 'IS'];
    const latinAmericaCountries = ['AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'UY', 'VE'];
    
    let region, currency, prices, priceIds;
    
    if (europeanCountries.includes(country)) {
      region = 'EU';
      currency = '€';
      prices = { monthly: 6.99, yearly: 49.99 };
      priceIds = {
        monthly: secrets.STRIPE_MONTHLY_PRICE_ID_EUR,
        yearly: secrets.STRIPE_YEARLY_PRICE_ID_EUR
      };
    } else if (latinAmericaCountries.includes(country)) {
      region = 'LATAM';
      currency = '$';
      prices = { monthly: 3.99, yearly: 25.99 };
      priceIds = {
        monthly: secrets.STRIPE_MONTHLY_PRICE_ID_USD_LATAM,
        yearly: secrets.STRIPE_YEARLY_PRICE_ID_USD_LATAM
      };
    } else {
      region = 'US';
      currency = '$';
      prices = { monthly: 7.99, yearly: 59.99 };
      priceIds = {
        monthly: secrets.STRIPE_MONTHLY_PRICE_ID_USD_US,
        yearly: secrets.STRIPE_YEARLY_PRICE_ID_USD_US
      };
    }
    
    return Response.json({
      publishableKey: secrets.STRIPE_PUBLISHABLE_KEY,
      region,
      currency,
      prices,
      priceIds
    });
  } catch (error) {
    console.error('Error getting Stripe config:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});