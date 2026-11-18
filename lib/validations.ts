import { z } from "zod";

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/;

export const usernameSchema = z
  .string()
  .regex(
    USERNAME_REGEX,
    "Логин: 3–24 символа, латиница, цифры и подчёркивание",
  );

export const passwordSchema = z
  .string()
  .min(8, "Пароль должен быть не короче 8 символов")
  .max(128, "Пароль слишком длинный")
  .regex(/[a-zA-Zа-яА-ЯёЁ]/, "Пароль должен содержать хотя бы одну букву")
  .regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Укажите корректный email")
  .max(254);

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  consent: z.literal(true, {
    error: "Нужно согласие на обработку персональных данных",
  }),
  ageConsent: z.literal(true, {
    error: "Подтвердите, что вам есть 14 лет",
  }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const signinSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Введите пароль").max(128),
  totp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Код из приложения — 6 цифр")
    .optional()
    .or(z.literal("")),
});
export type SigninInput = z.infer<typeof signinSchema>;

export const topicCreateSchema = z.object({
  categoryId: z.cuid("Некорректный раздел"),
  title: z
    .string()
    .trim()
    .min(5, "Заголовок слишком короткий (мин. 5 символов)")
    .max(200, "Заголовок слишком длинный (макс. 200 символов)"),
  content: z
    .string()
    .trim()
    .min(20, "Опишите подробнее (мин. 20 символов)")
    .max(20000, "Слишком длинно (макс. 20 000 символов)"),
  premiumOnly: z.boolean().default(false),
});
export type TopicCreateInput = z.infer<typeof topicCreateSchema>;

export const postCreateSchema = z.object({
  content: z
    .string()
    .trim()
    .min(2, "Слишком коротко")
    .max(10000, "Слишком длинно (макс. 10 000 символов)"),
});
export type PostCreateInput = z.infer<typeof postCreateSchema>;

export const reportCreateSchema = z.object({
  targetType: z.enum(["TOPIC", "POST", "RESOURCE", "WIKI_ARTICLE", "USER"]),
  targetId: z.string().min(1).max(64),
  reason: z
    .string()
    .trim()
    .min(10, "Опишите проблему подробнее (мин. 10 символов)")
    .max(2000, "Слишком длинно (макс. 2000 символов)"),
});
export type ReportCreateInput = z.infer<typeof reportCreateSchema>;

export const ticketCreateSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(5, "Тема тикета слишком короткая")
    .max(200, "Тема тикета слишком длинная"),
  message: z
    .string()
    .trim()
    .min(10, "Опишите проблему подробнее (мин. 10 символов)")
    .max(5000, "Слишком длинно (макс. 5000 символов)"),
});

export const categoryFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Слаг: строчные латинские буквы, цифры и дефис"),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  icon: z.string().trim().max(48).default("MessagesSquare"),
  position: z.coerce.number().int().min(0).max(10000).default(0),
  premiumOnly: z.boolean().default(false),
});
export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
