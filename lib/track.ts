// Envia eventos anônimos para /api/track. Nunca quebra o jogo se falhar.

type ClientEvent = "visit" | "start" | "finish";

const STORAGE_KEY = "mp-visitor-id";

function visitorId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // Aba anônima ou storage bloqueado: conta como visitante novo.
    return crypto.randomUUID();
  }
}

export function track(event: ClientEvent) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, id: visitorId() }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignora
  }
}
