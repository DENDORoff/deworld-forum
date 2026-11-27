/**
 * Minecraft Server List Ping (SLPP) — получение MOTD/онлайна сервера.
 * Чистая реализация на node:net, без сторонних зависимостей.
 *
 * Протокол: handshake (0x00) с nextState=1 → request (0x00) →
 * response 0x00 с JSON-документом статуса.
 *
 * Важно: реальный порт сервера может задаваться SRV-записью
 * `_minecraft._tcp.<host>` (у mc.de-world.net это 30077, а не 25565),
 * поэтому порт из env считается «обычным» только если он не 25565/30077.
 */
import "server-only";

import { resolveSrv } from "node:dns/promises";
import net, { isIP } from "node:net";

/** Порт из публичных источников (SRV mc.de-world.net) и старый порт по умолчанию. */
const KNOWN_PORT = 30077;
const LEGACY_PORT = 25565;
const DEFAULT_TIMEOUT_MS = 2500;
const DEFAULT_ATTEMPTS = 2;
const MAX_RESPONSE_BYTES = 512 * 1024;

type FailureCode =
  | "dns"
  | "refused"
  | "timeout"
  | "unreachable"
  | "invalid_response"
  | "unknown";

/** Только безопасные для показа пользователю формулировки — без IP, кодов и стеков. */
const FAILURE_MESSAGES: Record<FailureCode, string> = {
  dns: "Не удалось найти адрес сервера",
  refused: "Сервер не принимает подключения",
  timeout: "Сервер не ответил вовремя",
  unreachable: "Сервер недоступен",
  invalid_response: "Сервер вернул некорректный ответ",
  unknown: "Не удалось получить статус сервера",
};

class PingError extends Error {
  constructor(readonly code: FailureCode) {
    super(FAILURE_MESSAGES[code]);
    this.name = "PingError";
  }
}

export interface MinecraftStatus {
  host: string;
  /** Порт, к которому реально обращались (после SRV). */
  port: number;
  online: boolean;
  latencyMs: number | null;
  version: string | null;
  protocol: number | null;
  playersOnline: number | null;
  playersMax: number | null;
  /** MOTD без форматирующих §кодов, переносы сохранены */
  motd: string | null;
  favicon: string | null;
  /** Порт получен из SRV-записи. */
  viaSrv: boolean;
  /** Читаемая причина офлайна; null, если сервер ответил. */
  error: string | null;
}

export interface PingOptions {
  timeoutMs?: number;
  attempts?: number;
}

interface Endpoint {
  host: string;
  port: number;
  viaSrv: boolean;
}

function writeVarInt(value: number): Buffer {
  const bytes: number[] = [];
  let v = value >>> 0;
  do {
    let temp = v & 0x7f;
    v >>>= 7;
    if (v !== 0) temp |= 0x80;
    bytes.push(temp);
  } while (v !== 0);
  return Buffer.from(bytes);
}

function writeString(value: string): Buffer {
  const str = Buffer.from(value, "utf8");
  return Buffer.concat([writeVarInt(str.length), str]);
}

function makePacket(id: number, payload: Buffer): Buffer {
  const body = Buffer.concat([writeVarInt(id), payload]);
  return Buffer.concat([writeVarInt(body.length), body]);
}

function tryReadVarInt(
  buffer: Buffer,
  offset: number,
): { value: number; size: number } | null {
  let result = 0;
  let size = 0;
  for (let i = 0; i < 5; i++) {
    if (offset + i >= buffer.length) return null;
    const byte = buffer[offset + i];
    result |= (byte & 0x7f) << (7 * i);
    size++;
    if ((byte & 0x80) === 0) return { value: result, size };
  }
  return null;
}

/** Плоское текстовое представление chat-компонента MOTD. */
function flattenChat(component: unknown, depth = 0): string {
  if (component == null || depth > 12) return "";
  if (typeof component === "string") return component;
  if (Array.isArray(component)) {
    return component.map((part) => flattenChat(part, depth + 1)).join("");
  }
  if (typeof component !== "object") return "";

  const obj = component as Record<string, unknown>;
  let result = typeof obj.text === "string" ? obj.text : "";

  if (typeof obj.translate === "string") {
    const args = Array.isArray(obj.with)
      ? obj.with.map((part) => flattenChat(part, depth + 1))
      : [];
    let next = 0;
    result += obj.translate.replace(/%(\d+\$)?[sd]/g, (_match, index: string | undefined) => {
      const i = index ? Number.parseInt(index, 10) - 1 : next++;
      return args[i] ?? "";
    });
  }
  if (Array.isArray(obj.extra)) {
    result += obj.extra.map((part) => flattenChat(part, depth + 1)).join("");
  }
  return result;
}

export function stripFormattingCodes(text: string): string {
  return text
    // «Старые» hex-коды: §x§a§b§c§d§e§f
    .replace(/§x(?:§[0-9a-fA-F]){6}/g, "")
    // Hex-коды в формате §#RRGGBB (используются, например, DEWORLD)
    .replace(/§#[0-9a-fA-F]{6}/g, "")
    // Цвет/стиль: §0-§f, §k-§o, §r
    .replace(/§[0-9a-fA-Fk-orK-OR]/g, "")
    // Всё прочее на всякий случай
    .replace(/§./g, "");
}

function cleanMotd(component: unknown): string | null {
  const raw = flattenChat(component).trim();
  if (!raw) return null;
  const lines = raw
    .split(/\r?\n/)
    .map((line) => stripFormattingCodes(line).trim())
    .filter(Boolean);
  return lines.length > 0 ? lines.join("\n") : null;
}

function mapSocketError(error: unknown): FailureCode {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "dns";
  if (code === "ECONNREFUSED") return "refused";
  if (code === "EHOSTUNREACH" || code === "ENETUNREACH" || code === "ETIMEDOUT") {
    return "unreachable";
  }
  return "unknown";
}

/**
 * SRV имеет приоритет, только если порт не задан явно. Порты 25565 и 30077
 * считаются значениями по умолчанию: у mc.de-world.net за SRV лежит 30077,
 * но запись может измениться — тогда подхватим новое значение автоматически.
 */
async function resolveEndpoint(host: string, port: number): Promise<Endpoint> {
  const autoPort = port === LEGACY_PORT || port === KNOWN_PORT;
  if (!autoPort || isIP(host)) return { host, port, viaSrv: false };

  try {
    const records = await resolveSrv(`_minecraft._tcp.${host}`);
    records.sort((a, b) => a.priority - b.priority || a.weight - b.weight);
    const record = records[0];
    if (record && record.port > 0 && record.port <= 65535) {
      return {
        host: record.name.replace(/\.$/, ""),
        port: record.port,
        viaSrv: true,
      };
    }
  } catch {
    // SRV нет или DNS недоступен — пробуем указанный хост/порт напрямую.
  }
  return { host, port, viaSrv: false };
}

function pingOnce(endpoint: Endpoint, timeoutMs: number): Promise<MinecraftStatus> {
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;
    let buffer = Buffer.alloc(0);

    const finish = (complete: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      complete();
    };
    const fail = (code: FailureCode) => finish(() => reject(new PingError(code)));
    const timer = setTimeout(() => fail("timeout"), timeoutMs);

    socket.setTimeout(timeoutMs);
    socket.once("timeout", () => fail("timeout"));
    socket.once("end", () => fail("invalid_response"));
    socket.once("error", (error) => fail(mapSocketError(error)));

    socket.connect(endpoint.port, endpoint.host, () => {
      //-nextState=1 → status
      const protocolVersion = 767; // 1.21.x; для status протокол не критичен
      const handshakePayload = Buffer.concat([
        writeVarInt(protocolVersion),
        writeString(endpoint.host),
        Buffer.from([(endpoint.port >> 8) & 0xff, endpoint.port & 0xff]),
        writeVarInt(1),
      ]);
      socket.write(makePacket(0x00, handshakePayload));
      socket.write(makePacket(0x00, Buffer.alloc(0)));
    });

    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.length > MAX_RESPONSE_BYTES) return fail("invalid_response");

      const length = tryReadVarInt(buffer, 0);
      if (!length || length.value <= 0 || length.value > MAX_RESPONSE_BYTES) return;
      const totalExpected = length.size + length.value;
      if (buffer.length < totalExpected) return;

      let offset = length.size;
      const packetId = tryReadVarInt(buffer, offset);
      if (!packetId || packetId.value !== 0) return fail("invalid_response");
      offset += packetId.size;

      const jsonLength = tryReadVarInt(buffer, offset);
      if (!jsonLength || jsonLength.value <= 0 || jsonLength.value > MAX_RESPONSE_BYTES) {
        return fail("invalid_response");
      }
      offset += jsonLength.size;
      const jsonBuf = buffer.subarray(offset, offset + jsonLength.value);

      let data: {
        version?: { name?: string; protocol?: number };
        players?: { max?: number; online?: number };
        description?: unknown;
        favicon?: string;
      };
      try {
        data = JSON.parse(jsonBuf.toString("utf8"));
      } catch {
        return fail("invalid_response");
      }
      if (!data || typeof data !== "object") return fail("invalid_response");

      finish(() =>
        resolve({
          host: endpoint.host,
          port: endpoint.port,
          online: true,
          latencyMs: Date.now() - started,
          version: typeof data.version?.name === "string" ? data.version.name : null,
          protocol: typeof data.version?.protocol === "number" ? data.version.protocol : null,
          playersOnline:
            typeof data.players?.online === "number" ? data.players.online : null,
          playersMax: typeof data.players?.max === "number" ? data.players.max : null,
          motd: cleanMotd(data.description),
          favicon: typeof data.favicon === "string" ? data.favicon : null,
          viaSrv: endpoint.viaSrv,
          error: null,
        }),
      );
    });
  });
}

function offlineStatus(host: string, endpoint: Endpoint, code: FailureCode): MinecraftStatus {
  return {
    host,
    port: endpoint.port,
    online: false,
    latencyMs: null,
    version: null,
    protocol: null,
    playersOnline: null,
    playersMax: null,
    motd: null,
    favicon: null,
    viaSrv: endpoint.viaSrv,
    error: FAILURE_MESSAGES[code],
  };
}

/** Пингует сервер с учётом SRV и несколькими попытками. Всегда возвращает статус. */
export async function pingMinecraftServer(
  host: string,
  port: number,
  options: PingOptions = {},
): Promise<MinecraftStatus> {
  const timeoutMs = Math.max(250, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const attempts = Math.max(1, options.attempts ?? DEFAULT_ATTEMPTS);
  const endpoint = await resolveEndpoint(host, port);

  let lastCode: FailureCode = "unknown";
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const status = await pingOnce(endpoint, timeoutMs);
      return { ...status, host, viaSrv: endpoint.viaSrv };
    } catch (error) {
      lastCode = error instanceof PingError ? error.code : "unknown";
    }
  }
  return offlineStatus(host, endpoint, lastCode);
}
