// Static currency conversion rates (in a real app, you'd fetch from an API)
const EXCHANGE_RATES = {
  EGP: 1,      // Egyptian Pound (base currency)
  USD: 0.032,  // US Dollar
  RUB: 3.2     // Russian Ruble
} as const

export type Currency = keyof typeof EXCHANGE_RATES

export function convertCurrency(
  amount: number, 
  from: Currency, 
  to: Currency
): number {
  if (from === to) return amount
  
  // Convert to base currency (EGP) first, then to target currency
  const baseAmount = amount / EXCHANGE_RATES[from]
  const convertedAmount = baseAmount * EXCHANGE_RATES[to]
  
  return Math.round(convertedAmount * 100) / 100 // Round to 2 decimal places
}

export function formatCurrency(amount: number, currency: Currency): string {
  const symbols = {
    EGP: 'ج.م',
    USD: '$',
    RUB: '₽'
  }
  
  return `${symbols[currency]} ${amount.toLocaleString()}`
}

export function getCurrencySymbol(currency: Currency): string {
  const symbols = {
    EGP: 'ج.م',
    USD: '$',
    RUB: '₽'
  }
  
  return symbols[currency]
}

export const SUPPORTED_CURRENCIES: Currency[] = ['EGP', 'USD', 'RUB']
