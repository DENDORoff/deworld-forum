/**
 * TOTP (RFC 6238) для двухфакторной аутентификации — Google Authenticator,
 * Aegis, 1Password и др.
 */
import * as OTPAuth from "otpauth";

const ISSUER = "DEWORLD Forum";

export function generateTotpSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

export function buildTotp(secretBase32: string, accountName: string) {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: accountName,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

export function verifyTotpToken(
  secretBase32: string,
  token: string,
  accountName: string,
): boolean {
  const totp = buildTotp(secretBase32, accountName);
  // window=1: допускаем ±30 секунд рассинхрона часов
  const delta = totp.validate({ token: token.replace(/\s/g, ""), window: 1 });
  return delta !== null;
}

export function totpKeyUri(secretBase32: string, accountName: string): string {
  return buildTotp(secretBase32, accountName).toString();
}
