/**
 * Validates an IMEI using the Luhn algorithm.
 * Returns true if the 15-digit number is valid.
 */
export function validateImei(imei: string): boolean {
  if (!/^\d{15}$/.test(imei)) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(imei[i], 10);
    if (i % 2 !== 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}
