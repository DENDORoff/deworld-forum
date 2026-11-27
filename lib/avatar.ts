/**
 * Аватары на основе головы Minecraft-скина.
 *
 * Используем mc-heads.net: публичный CDN без API-ключей, отдаёт голову скина
 * по нику: URL стабилен и может храниться в user.image.
 * Картинка загружается браузером напрямую; при ошибке UserAvatar показывает инициалы.
 */

export const SKIN_AVATAR_SIZE = 256;

const SKIN_AVATAR_HOST = "mc-heads.net";
const MINECRAFT_NICKNAME = /^[A-Za-z0-9_]{3,16}$/;

/** Ник Minecraft: 3–16 символов, латиница, цифры и «_». */
export function isValidMinecraftNickname(nickname: string): boolean {
  return MINECRAFT_NICKNAME.test(nickname);
}

/** URL головы скина. Возвращает null для некорректного ника. */
export function minecraftSkinAvatarUrl(
  nickname: string,
  size: number = SKIN_AVATAR_SIZE,
): string | null {
  const clean = nickname.trim();
  if (!isValidMinecraftNickname(clean)) return null;

  const safeSize = Number.isInteger(size) && size > 0 && size <= 1024 ? size : SKIN_AVATAR_SIZE;
  return `https://${SKIN_AVATAR_HOST}/avatar/${clean}/${safeSize}.png`;
}

/**
 * Проверка, что ссылка — именно сгенерированный нами аватар-скин.
 * Используется при отвязке/обновлении, чтобы не затирать аватар пользователя.
 */
export function isSkinAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== SKIN_AVATAR_HOST) return false;
  if (parsed.search || parsed.hash || parsed.port) return false;

  // Поддерживаем как /avatar/Nick/256.png, так и /avatar/Nick.png.
  return /^\/avatar\/[A-Za-z0-9_]{3,16}(?:\/(?:16|32|64|128|256|512|1024))?\.png$/.test(
    parsed.pathname,
  );
}
