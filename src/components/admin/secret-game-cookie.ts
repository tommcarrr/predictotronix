export const SECRET_GAME_COOKIE = 'predictotronix_secret_game_started';
export const SECRET_GAME_COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

export function hasStartedSecretGame(cookie = document.cookie) {
  return cookie
    .split(';')
    .some((part) => part.trim().startsWith(`${SECRET_GAME_COOKIE}=`));
}

export function rememberSecretGameStarted() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${SECRET_GAME_COOKIE}=1; Path=/; Max-Age=${SECRET_GAME_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}
