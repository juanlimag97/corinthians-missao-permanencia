import "server-only";

// Contadores do jogo, guardados no Upstash Redis (Vercel → Storage).
// Usa a API REST direto, sem dependência extra.

export const EVENTS = ["visit", "start", "finish"] as const;
export type StatEvent = (typeof EVENTS)[number];

const PREFIX = "mp";
const DAILY_TTL_SECONDS = 60 * 60 * 24 * 120;
export const CHART_DAYS = 14;

function redisConfig() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export const statsConfigured = () => redisConfig() !== null;

type Command = (string | number)[];

async function pipeline(commands: Command[]): Promise<unknown[]> {
  const config = redisConfig();
  if (!config) throw new Error("Redis não configurado");
  const res = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}` },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis respondeu ${res.status}`);
  const replies = (await res.json()) as { result?: unknown; error?: string }[];
  return replies.map((r) => {
    if (r.error) throw new Error(r.error);
    return r.result;
  });
}

/** Dia no fuso de Brasília, no formato AAAA-MM-DD. */
export function dayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function recordEvent(event: StatEvent, visitorId: string) {
  const day = dayKey();
  const total = `${PREFIX}:count:${event}`;
  const daily = `${total}:${day}`;
  const uniq = `${PREFIX}:uniq:${event}`;
  const uniqDaily = `${uniq}:${day}`;
  await pipeline([
    ["INCR", total],
    ["INCR", daily],
    ["EXPIRE", daily, DAILY_TTL_SECONDS],
    ["PFADD", uniq, visitorId],
    ["PFADD", uniqDaily, visitorId],
    ["EXPIRE", uniqDaily, DAILY_TTL_SECONDS],
  ]);
}

export type EventTotals = { count: number; people: number };
export type DayStats = { day: string; players: number; starts: number; finishes: number };

export type Stats = {
  totals: Record<StatEvent, EventTotals>;
  days: DayStats[];
};

const toNumber = (v: unknown) => Number(v ?? 0) || 0;

export async function getStats(): Promise<Stats> {
  const days = Array.from({ length: CHART_DAYS }, (_, i) =>
    dayKey(new Date(Date.now() - (CHART_DAYS - 1 - i) * 86_400_000))
  );

  const commands: Command[] = [];
  for (const event of EVENTS) {
    commands.push(["GET", `${PREFIX}:count:${event}`], ["PFCOUNT", `${PREFIX}:uniq:${event}`]);
  }
  for (const day of days) {
    commands.push(
      ["PFCOUNT", `${PREFIX}:uniq:start:${day}`],
      ["GET", `${PREFIX}:count:start:${day}`],
      ["GET", `${PREFIX}:count:finish:${day}`]
    );
  }

  const replies = (await pipeline(commands)).map(toNumber);
  const totals = {} as Record<StatEvent, EventTotals>;
  EVENTS.forEach((event, i) => {
    totals[event] = { count: replies[i * 2], people: replies[i * 2 + 1] };
  });
  const offset = EVENTS.length * 2;
  return {
    totals,
    days: days.map((day, i) => ({
      day,
      players: replies[offset + i * 3],
      starts: replies[offset + i * 3 + 1],
      finishes: replies[offset + i * 3 + 2],
    })),
  };
}
