export function formatRupee(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatRupeeCompact(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)} K`;
  }
  return `₹${amount.toFixed(0)}`;
}

export function formatNumberCompact(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  }).format(amount);
}
