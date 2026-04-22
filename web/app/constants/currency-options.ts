export const currencyOptions = [
  { label: 'US Dollar', value: 'USD' },
  { label: 'Euro', value: 'EUR' },
  { label: 'Turkish Lira', value: 'TRY' },
  { label: 'British Pound', value: 'GBP' },
] as const

export type SupportedCurrency = (typeof currencyOptions)[number]['value']

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return currencyOptions.some((currency) => currency.value === value)
}
