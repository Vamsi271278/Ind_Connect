// Pure input helpers for PhoneField / OtpInput. Presentation only: the server
// normalises and validates phone numbers (E.164) and codes authoritatively.

export const OTP_LENGTH = 6;

/** Keeps the first six digits; tolerates pasted "123 456" or "Code: 123456". */
export function sanitizeOtp(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

/** National digits only, capped at 15 (E.164 maximum). */
export function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 15);
}

/**
 * Display formatting for NANP (+1) national numbers: (214) 555-0123. Other
 * country codes are shown as plain digits until their formats are designed.
 */
export function formatNationalNumber(callingCode: string, raw: string): string {
  const digits = phoneDigits(raw);
  if (callingCode !== '1') return digits;
  const d = digits.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** International form expected by the API (`+` then digits); server normalises. */
export function toInternational(callingCode: string, raw: string): string {
  return `+${callingCode}${phoneDigits(raw)}`;
}
