/**
 * Vietnamese mobile numbers: 10 digits starting with 0 (or +84 and 9 digits), stored as digits and
 * shown as "0901 234 567". Same rule as the redeem API.
 */
const VN_MOBILE = /^(0\d{9}|\+84\d{9})$/;

/** What the user typed, reduced to what the form keeps: digits, with a leading "+" allowed for +84. */
export function phoneDigits(value: string): string {
  const plus = value.trim().startsWith("+");
  const digits = value.replace(/\D/g, "");
  return plus ? `+${digits.slice(0, 11)}` : digits.slice(0, 10);
}

export const isVnMobile = (digits: string): boolean => VN_MOBILE.test(digits);

/** "0901234567" → "0901 234 567"; "+84901234567" → "+84 901 234 567"; partial input is grouped as typed. */
export function formatVnPhone(digits: string): string {
  if (digits.startsWith("+84")) {
    const rest = digits.slice(3);
    return ["+84", rest.slice(0, 3), rest.slice(3, 6), rest.slice(6)].filter(Boolean).join(" ");
  }
  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7)].filter(Boolean).join(" ");
}

/** Stored number for display: grouped when it is a Vietnamese mobile, as stored otherwise (older orders). */
export function displayPhone(raw: string): string {
  const digits = phoneDigits(raw);
  return isVnMobile(digits) && digits.length === raw.replace(/[\s.\-()]/g, "").length ? formatVnPhone(digits) : raw;
}
