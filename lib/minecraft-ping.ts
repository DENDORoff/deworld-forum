/**
 * Minecraft Server List Ping (SLPP) — получение MOTD/онлайна сервера.
 * Чистая реализация на node:net, без сторонних зависимостей.
 *
 * Протокол: handshake (0x00) с nextState=1 → request (0x00) →
 * response 0x00 с JSON-документом статуса.
 */
import "server-only";

import net from "node:net";

export interface MinecraftStatus {
  host: string;
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
function flattenChat(component: unknown): string {
  if (component == null) return "";
  if (typeof component === "string") return component;
  if (Array.isArray(component)) return component.map(flattenChat).join("");
  if (typeof component === "object") {
    const obj = component as Record<string, unknown>;
    const own = typeof obj.text === "string" ? obj.text : "";
    const extra = Array.isArray(obj.extra)
      ? obj.extra.map(flattenChat).join("")
      : "";
    return own + extra;
  }
  return "";
}

export function stripFormattingCodes(text: string): string {
  // §x — коды форматирования Minecraft; убираем их, оставляя текст
  return text.replace(/§./g, "");
}

export async function pingMinecraftServer(
  host: string,
  port: number,
  timeoutMs = 4000,
): Promise<MinecraftStatus> {
  const started = Date.now();
  const offline: MinecraftStatus = {
    host,
    port,
    online: false,
    latencyMs: null,
    version: null,
    protocol: null,
    playersOnline: null,
    playersMax: null,
    motd: null,
    favicon: null,
  };

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    let buffer = Buffer.alloc(0);

    const done = (status: MinecraftStatus) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(status);
    };

    socket.setTimeout(timeoutMs);
    socket.once("timeout", () => done(offline));
    socket.once("error", () => done(offline));

    socket.connect(port, host, () => {
      // Handshake
      const protocolVersion = 767; // 1.21.x — значение не критично для статуса
      const handshakePayload = Buffer.concat([
        writeVarInt(protocolVersion),
        writeString(host),
        Buffer.from([(port >> 8) & 0xff, port & 0xff]),
        writeVarInt(1), // next state: 1 = status
      ]);
      socket.write(makePacket(0x00, handshakePayload));
      // Status request
      socket.write(makePacket(0x00, Buffer.alloc(0)));
    });

    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      const length = tryReadVarInt(buffer, 0);
      if (!length) return;
      const totalExpected = length.size + length.value;
      if (buffer.length < totalExpected) return;

      const latency = Date.now() - started;
      let offset = length.size;

      const packetId = tryReadVarInt(buffer, offset);
      if (!packetId) return done(offline);
      offset += packetId.size;

      const jsonLength = tryReadVarInt(buffer, offset);
      if (!jsonLength) return done(offline);
      offset += jsonLength.size;

      const jsonBuf = buffer.subarray(offset, offset + jsonLength.value);
      try {
        const data = JSON.parse(jsonBuf.toString("utf8")) as {
          version?: { name?: string; protocol?: number };
          players?: { max?: number; online?: number };
          description?: unknown;
          favicon?: string;
        };

        const motdRaw = flattenChat(data.description).trim();
        done({
          host,
          port,
          online: true,
          latencyMs: latency,
          version: data.version?.name ?? null,
          protocol: data.version?.protocol ?? null,
          playersOnline: data.players?.online ?? null,
          playersMax: data.players?.max ?? null,
          motd: motdRaw ? stripFormattingCodes(motdRaw) : null,
          favicon: data.favicon ?? null,
        });
      } catch {
        done(offline);
      }
    });
  });
}
