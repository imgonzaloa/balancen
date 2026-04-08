/**
 * Detect user region and return appropriate pricing
 * Region detection based on IP geolocation (automatic)
 */

export default async function getPricingForRegion(input, { secrets }) {
  // Detect region from request headers (Cloudflare, Vercel, etc. provide this)
  const country = input.country || 'US'; // Fallback to US if not detected
  
  // Define region mapping
  const europeanCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'NO', 'CH', 'IS'];
  
  const latinAmericaCountries = ['AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'UY', 'VE'];
  
  let region, currency, prices, priceIds;
  
  if (europeanCountries.includes(country)) {
    region = 'EU';
    currency = '€';
    prices = {
      monthly: 8.99,
      yearly: 39.99,
      power_monthly: 12.99,
      power_yearly: 89.99
    };
    priceIds = {
      monthly: secrets.STRIPE_MONTHLY_PRICE_ID_EUR,
      yearly: secrets.STRIPE_YEARLY_PRICE_ID_EUR,
      power_monthly: secrets.STRIPE_POWER_MONTHLY_PRICE_ID_EUR,
      power_yearly: secrets.STRIPE_POWER_YEARLY_PRICE_ID_EUR
    };
  } else if (latinAmericaCountries.includes(country)) {
    region = 'LATAM';
    currency = '$';
    prices = {
      monthly: 4.99,
      yearly: 29.99,
      power_monthly: 7.99,
      power_yearly: 59.99
    };
    priceIds = {
      monthly: secrets.STRIPE_MONTHLY_PRICE_ID_USD_LATAM,
      yearly: secrets.STRIPE_YEARLY_PRICE_ID_USD_LATAM,
      power_monthly: secrets.STRIPE_POWER_MONTHLY_PRICE_ID_USD_LATAM,
      power_yearly: secrets.STRIPE_POWER_YEARLY_PRICE_ID_USD_LATAM
    };
  } else {
    // Default to US pricing
    region = 'US';
    currency = '$';
    prices = {
      monthly: 8.99,
      yearly: 39.99,
      power_monthly: 12.99,
      power_yearly: 89.99
    };
    priceIds = {
      monthly: secrets.STRIPE_MONTHLY_PRICE_ID_USD_US,
      yearly: secrets.STRIPE_YEARLY_PRICE_ID_USD_US,
      power_monthly: secrets.STRIPE_POWER_MONTHLY_PRICE_ID_USD_US,
      power_yearly: secrets.STRIPE_POWER_YEARLY_PRICE_ID_USD_US
    };
  }
  
  return {
    region,
    currency,
    prices,
    priceIds,
    detectedCountry: country
  };
}