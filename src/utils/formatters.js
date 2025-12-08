// src/utils/formatters.js

export const formatPrice = (price) => {
  if (typeof price !== 'number') {
    return ['', '']; // Return empty strings for invalid input
  }
  const parts = price.toFixed(2).split('.');
  return [parts[0], parts[1]];
};

export const formatCurrency = (price, symbol = '$') => {
  if (typeof price !== 'number') {
    return `${symbol}0.00`; // Return default for invalid input
  }
  return `${symbol}${price.toFixed(2)}`;
};
