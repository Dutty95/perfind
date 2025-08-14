// Currency formatting utility
const getCurrencySettings = () => {
  const savedCurrency = localStorage.getItem('currency') || 'NGN';
  const currencyMap = {
    'NGN': { locale: 'en-NG', currency: 'NGN' },
    'USD': { locale: 'en-US', currency: 'USD' },
    'EUR': { locale: 'en-EU', currency: 'EUR' },
    'GBP': { locale: 'en-GB', currency: 'GBP' },
    'JPY': { locale: 'ja-JP', currency: 'JPY' },
    'CAD': { locale: 'en-CA', currency: 'CAD' }
  };
  return currencyMap[savedCurrency] || currencyMap['NGN'];
};

export const formatCurrency = (amount) => {
  const { locale, currency } = getCurrencySettings();
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatCurrencyWithDecimals = (amount) => {
  const { locale, currency } = getCurrencySettings();
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const getCurrencySymbol = () => {
  const { currency } = getCurrencySettings();
  const symbols = {
    'NGN': '₦',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$'
  };
  return symbols[currency] || '₦';
};