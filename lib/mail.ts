/**
 * Отправка почты через любой SMTP-провайдер (nodemailer).
 * Пока SMTP не настроен — письма не отправляются (в dev — пишем в логи,
 * в production — тихо пропускаем с логом об ошибке).
 *
 * Вариант А (одной строкой):  SMTP_URL="smtps://user:pass@smtp.yandex.ru:465"
 * Вариант Б (по полям):       SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_USER / SMTP_PASS
 * Общее:                      MAIL_FROM="DEWORLD <noreply@de-world.net>"
 *
 * Проверено с: Yandex 360 (smtp.yandex.ru:465), Mail.ru (smtp.mail.ru:465),
 * Resend SMTP (smtp.resend.com:465, user "resend"), Mailgun (smtp.mailgun.org),
 * SMTP2GO (mail.smtp2go.com:2525).
 */
import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: Transporter | null | undefined;

function buildTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const url = process.env.SMTP_URL?.trim();
  if (url) {
    transporter = nodemailer.createTransport(url, {
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
    });
    return transporter;
  }

  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  if (host && user && pass) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE !== "false",
      auth: { user, pass },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
    });
    return transporter;
  }

  transporter = null;
  return transporter;
}

export function mailEnabled(): boolean {
  return Boolean(process.env.SMTP_URL || process.env.SMTP_HOST);
}

export function mailFrom(): string {
  return process.env.MAIL_FROM?.trim() || "DEWORLD <noreply@de-world.net>";
}

export async function sendMail(message: MailMessage): Promise<boolean> {
  const transport = buildTransporter();
  if (!transport) {
    console.log(
      `[mail] SMTP не настроен — письмо пропущено: "${message.subject}" → ${message.to}`,
    );
    return false;
  }
  try {
    await transport.sendMail({ from: mailFrom(), ...message });
    return true;
  } catch (error) {
    console.error("[mail] не удалось отправить письмо", error);
    return false;
  }
}

/** Сброс пароля: ссылка живёт 1 час. */
export async function sendPasswordResetMail(
  to: string,
  resetUrl: string,
  username: string | null,
): Promise<boolean> {
  const displayName = username ?? "игрок";
  return sendMail({
    to,
    subject: "Сброс пароля — DEWORLD",
    text: `Привет, ${displayName}! Чтобы сбросить пароль, перейдите по ссылке (действует 1 час): ${resetUrl}\n\nЕсли вы не запрашивали сброс — просто проигнорируйте это письмо.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fffaf2;border-radius:16px">
      <p style="font-size:18px;font-weight:700;color:#201405;margin:0 0 8px">Сброс пароля</p>
      <p style="color:#5a4632;line-height:1.5;margin:0 0 16px">Привет, ${displayName}! Вы запросили сброс пароля на форуме DEWORLD.</p>
      <p style="margin:0 0 16px"><a href="${resetUrl}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600">Сбросить пароль</a></p>
      <p style="color:#8a735c;font-size:12px;line-height:1.5;margin:0">Ссылка действует 1 час. Если вы не запрашивали сброс — просто удалите это письмо.</p>
    </div>`,
  });
}

/** Уведомление на почту о событии на форуме. */
export async function sendNotificationMail(
  to: string,
  username: string | null,
  title: string,
  body: string | null,
  url: string,
): Promise<boolean> {
  const displayName = username ?? "игрок";
  const text = `${title}\n\n${body ?? ""}\n\nОткрыть: ${url}\n\nВы получили это письмо, потому что включены уведомления DEWORLD. Отписка: настройки профиля.`;
  return sendMail({
    to,
    subject: `${title} — DEWORLD`,
    text,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fffaf2;border-radius:16px">
      <p style="font-size:18px;font-weight:700;color:#201405;margin:0 0 8px">${escapeHtml(title)}</p>
      <p style="color:#5a4632;line-height:1.5;margin:0 0 16px">Привет, ${escapeHtml(displayName)}!${body ? `<br>${escapeHtml(body)}` : ""}</p>
      <p style="margin:0 0 16px"><a href="${url}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600">Открыть на форуме</a></p>
      <p style="color:#8a735c;font-size:12px;line-height:1.5;margin:0">Управлять уведомлениями: настройки профиля · <a href="https://de-world.net/settings" style="color:#f97316">de-world.net/settings</a></p>
    </div>`,
  });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
