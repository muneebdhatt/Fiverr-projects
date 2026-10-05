/**
 * A short fingerprint of a password, so the exact text is never kept in browser storage.
 * This is only enough to tell a right password from a wrong one on this device; it is not real security.
 */
export function hashPw(password: string) {
  let h = 5381;
  for (let i = 0; i < password.length; i++) h = ((h << 5) + h + password.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

/** 0 to 4: how strong a password looks, for the sign-up meter. */
export function passwordStrength(p: string) {
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) score++;
  return Math.min(score, 4);
}
