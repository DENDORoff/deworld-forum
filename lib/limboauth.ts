/**
 * Подключение к БД LimboAuth для входа по «ник + пароль» и привязки аккаунта.
 * Отключено, если LIMBOAUTH_DATABASE_URL не задан (например, на этапе MVP).
 *
 * Безопасность:
 *  - идентификаторы таблицы/колонок валидируются белым списком символов;
 *  - все запросы параметризованы ($1, $2);
 *  - пароли сверяются только bcrypt-хэшем (алгоритм LimboAuth по умолчанию).
 */
import "server-only";

import { Pool } from "pg";
import bcrypt from "bcryptjs";

const IDENT_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/;

let pool: Pool | null = null;

export function limboAuthEnabled(): boolean {
  return Boolean(process.env.LIMBOAUTH_DATABASE_URL);
}

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.LIMBOAUTH_DATABASE_URL;
    if (!connectionString) {
      throw new Error("LIMBOAUTH_DATABASE_URL не задан");
    }
    pool = new Pool({
      connectionString,
      max: 2,
      connectionTimeoutMillis: 4000,
      idleTimeoutMillis: 10_000,
      // LimboAuth обычно на удалённой машине с самоподписанным/валидным сертификатом;
      // при необходимости задайте PGSSLMODE=require в строке подключения
    });
  }
  return pool;
}

function getIdentifier(envValue: string | undefined, fallback: string): string {
  const value = (envValue ?? fallback).trim();
  if (!IDENT_REGEX.test(value)) {
    throw new Error(`Недопустимый идентификатор в настройках LimboAuth: ${value}`);
  }
  return `"${value}"`;
}

export interface LimboAuthVerifyResult {
  ok: boolean;
  limboId: number | null;
  realname: string | null;
}

export async function verifyLimboCredentials(
  nickname: string,
  password: string,
): Promise<LimboAuthVerifyResult> {
  const nick = nickname.trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(nick)) {
    return { ok: false, limboId: null, realname: null };
  }

  const table = getIdentifier(process.env.LIMBOAUTH_TABLE, "limboauth");
  const nameCol = getIdentifier(process.env.LIMBOAUTH_USERNAME_COLUMN, "name");
  const passwordCol = getIdentifier(
    process.env.LIMBOAUTH_PASSWORD_COLUMN,
    "password",
  );
  const idCol = getIdentifier(process.env.LIMBOAUTH_ID_COLUMN, "id");

  const result = await getPool().query<{
    id: number;
    name: string;
    password: string;
  }>(
    `SELECT ${idCol} AS id, ${nameCol} AS name, ${passwordCol} AS password
       FROM ${table}
      WHERE lower(${nameCol}) = lower($1)
      LIMIT 1`,
    [nick],
  );

  const row = result.rows[0];
  if (!row) {
    return { ok: false, limboId: null, realname: null };
  }

  let ok = false;
  try {
    ok = await bcrypt.compare(password, row.password);
  } catch {
    ok = false;
  }

  return {
    ok,
    limboId: ok ? row.id : null,
    realname: ok ? row.name : null,
  };
}
