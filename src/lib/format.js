const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatCurrency(value) {
  return currencyFormatter.format(value || 0);
}

export function formatPercent(value, digits = 1) {
  return `${(value || 0).toFixed(digits)}%`;
}
