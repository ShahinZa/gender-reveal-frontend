const grants = new Map();
export function getRevealAccess(code) {
  const key = code.toUpperCase();
  try { return sessionStorage.getItem(`reveal-access:${key}`) || grants.get(key); } catch { return grants.get(key); }
}
export function setRevealAccess(code, token) {
  if (!token) return;
  const key = code.toUpperCase();
  grants.set(key, token);
  try { sessionStorage.setItem(`reveal-access:${key}`, token); } catch { /* Keep an in-memory grant. */ }
}
export function revealHeaders(code) {
  const token = getRevealAccess(code);
  return token ? { 'X-Reveal-Token': token } : {};
}
