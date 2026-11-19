/**
 * Cloudflare Turnstile — серверная проверка токена.
 * Если TURNSTILE_SECRET_KEY не задан, используется публичный тестовый секрет
 * Cloudflare (всегда «пропускает») — для локальной разработки это нормально,
 * В PRODUCTION ОБЯЗАТЕЛЬНО задайте настоящие ключи (см. .env.example).
 */
import "server-only";

const TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

interface SiteVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

export async function verifyTurnstileToken(
  token: string | null | undefined,
  ip: string | null,
): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.TURNSTILE_SECRET_KEY || TEST_SECRET_KEY;

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (ip) body.set("remoteip", ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error("[turnstile] siteverify HTTP", res.status);
      return false;
    }
    const data = (await res.json()) as SiteVerifyResponse;
    return Boolean(data.success);
  } catch (error) {
    console.error("[turnstile] siteverify error", error);
    return false;
  }
}
