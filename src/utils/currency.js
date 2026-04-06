// Currency conversion utility
// All supplier prices are in BDT. We convert to buyer's local currency.

export const COUNTRY_CURRENCY = {
  'United States': { code: 'USD', symbol: '$', rate: 0.0091 },
  'United Kingdom': { code: 'GBP', symbol: '£', rate: 0.0072 },
  'Germany': { code: 'EUR', symbol: '€', rate: 0.0084 },
  'France': { code: 'EUR', symbol: '€', rate: 0.0084 },
  'Italy': { code: 'EUR', symbol: '€', rate: 0.0084 },
  'Spain': { code: 'EUR', symbol: '€', rate: 0.0084 },
  'Netherlands': { code: 'EUR', symbol: '€', rate: 0.0084 },
  'Belgium': { code: 'EUR', symbol: '€', rate: 0.0084 },
  'Sweden': { code: 'SEK', symbol: 'kr', rate: 0.097 },
  'Denmark': { code: 'DKK', symbol: 'kr', rate: 0.063 },
  'Norway': { code: 'NOK', symbol: 'kr', rate: 0.099 },
  'Finland': { code: 'EUR', symbol: '€', rate: 0.0084 },
  'Australia': { code: 'AUD', symbol: 'A$', rate: 0.014 },
  'Canada': { code: 'CAD', symbol: 'C$', rate: 0.012 },
  'Japan': { code: 'JPY', symbol: '¥', rate: 1.38 },
  'South Korea': { code: 'KRW', symbol: '₩', rate: 12.4 },
  'China': { code: 'CNY', symbol: '¥', rate: 0.066 },
  'India': { code: 'INR', symbol: '₹', rate: 0.76 },
  'UAE': { code: 'AED', symbol: 'د.إ', rate: 0.033 },
  'Saudi Arabia': { code: 'SAR', symbol: '﷼', rate: 0.034 },
  'Turkey': { code: 'TRY', symbol: '₺', rate: 0.29 },
  'Brazil': { code: 'BRL', symbol: 'R$', rate: 0.046 },
  'Mexico': { code: 'MXN', symbol: 'MX$', rate: 0.16 },
  'South Africa': { code: 'ZAR', symbol: 'R', rate: 0.17 },
  'Bangladesh': { code: 'BDT', symbol: '৳', rate: 1 },
  'Pakistan': { code: 'PKR', symbol: '₨', rate: 2.52 },
  'Sri Lanka': { code: 'LKR', symbol: '₨', rate: 2.74 },
  'Vietnam': { code: 'VND', symbol: '₫', rate: 228 },
  'Thailand': { code: 'THB', symbol: '฿', rate: 0.32 },
  'Indonesia': { code: 'IDR', symbol: 'Rp', rate: 145 },
  'Malaysia': { code: 'MYR', symbol: 'RM', rate: 0.042 },
  'Singapore': { code: 'SGD', symbol: 'S$', rate: 0.012 },
  'Philippines': { code: 'PHP', symbol: '₱', rate: 0.52 },
  'Egypt': { code: 'EGP', symbol: 'E£', rate: 0.44 },
  'Nigeria': { code: 'NGN', symbol: '₦', rate: 14.2 },
  'Kenya': { code: 'KES', symbol: 'KSh', rate: 1.18 },
  'Worldwide': { code: 'USD', symbol: '$', rate: 0.0091 },
  'Other': { code: 'USD', symbol: '$', rate: 0.0091 },
}

export function getCurrencyForCountry(country) {
  return COUNTRY_CURRENCY[country] || COUNTRY_CURRENCY['Worldwide']
}

export function convertFromBDT(bdtAmount, country) {
  const curr = getCurrencyForCountry(country)
  const converted = bdtAmount * curr.rate
  // Format nicely
  if (converted >= 1000) return `${curr.symbol}${converted.toLocaleString('en', { maximumFractionDigits: 0 })}`
  if (converted >= 1) return `${curr.symbol}${converted.toFixed(2)}`
  return `${curr.symbol}${converted.toFixed(4)}`
}

export function convertFromBDTRaw(bdtAmount, country) {
  const curr = getCurrencyForCountry(country)
  return bdtAmount * curr.rate
}

export function getCurrencySymbol(country) {
  return getCurrencyForCountry(country).symbol
}
