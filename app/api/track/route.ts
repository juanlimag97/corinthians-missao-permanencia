import { EVENTS, recordEvent, statsConfigured, type StatEvent } from "@/lib/stats";

const ID_PATTERN = /^[a-zA-Z0-9-]{8,64}$/;

export async function POST(request: Request) {
  if (!statsConfigured()) return new Response(null, { status: 204 });

  let body: { event?: unknown; id?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const { event, id } = body;
  if (
    typeof event !== "string" ||
    !EVENTS.includes(event as StatEvent) ||
    typeof id !== "string" ||
    !ID_PATTERN.test(id)
  ) {
    return new Response(null, { status: 400 });
  }

  try {
    await recordEvent(event as StatEvent, id);
  } catch (error) {
    console.error("Falha ao registrar evento", error);
    return new Response(null, { status: 502 });
  }
  return new Response(null, { status: 204 });
}
