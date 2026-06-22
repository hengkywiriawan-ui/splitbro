/** Format an IDR amount for display. Rounding happens ONLY here, never in calculation. */
export function formatIDR(amount: number): string {
  const rounded = Math.round(amount);
  return `Rp ${rounded.toLocaleString("id-ID")}`;
}
