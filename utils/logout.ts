export function clearAllCookies(): void {
  if (typeof document === 'undefined') return;

  const cookies = document.cookie ? document.cookie.split(';') : [];
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf('=');
    const name = (eqPos > -1 ? cookie.slice(0, eqPos) : cookie).trim();
    if (!name) continue;

    // Expire cookie for current path and root path.
    document.cookie = `${name}=; Max-Age=0; path=/`;
    document.cookie = `${name}=; Max-Age=0; path=/; samesite=lax`;
  }
}

export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;

  // Zustand persist key
  window.localStorage.removeItem('auth_store');

  // Common fallbacks (in case other parts stored tokens directly)
  window.localStorage.removeItem('accessToken');
  window.localStorage.removeItem('refreshToken');
  window.sessionStorage?.removeItem?.('accessToken');
  window.sessionStorage?.removeItem?.('refreshToken');

  clearAllCookies();
}

