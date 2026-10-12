import {
  COR_ID,
  INITIAL_STANDINGS,
  LEGENDS,
  RELEGATION_SPOTS,
  ROUNDS,
  SLOTS,
  STARTERS,
  TEAMS,
  TEAM_BY_ID,
  type Player,
  type Sector,
  type Standing,
} from "./data";
import { narrate, type MatchEvent } from "./narration";

export type Outcome = "W" | "D" | "L";

// late = jogo adiado de uma rodada anterior.
export type Fixture = { homeId: string; awayId: string; late?: boolean };
export type MatchResult = Fixture & { hg: number; ag: number };

export type { EventKind, MatchEvent } from "./narration";

export type CorMatch = {
  round: number;
  result: MatchResult;
  home: boolean;
  opponentId: string;
  overall: number;
  legends: string[];
  events: MatchEvent[];
  finalMinute: number;
};

export type Selection = Record<Sector, string | null>;

export type GameState = {
  roundIndex: number; // 0 = 31ª rodada
  standings: Record<string, Standing>;
  fixtures: Fixture[][];
  options: Record<Sector, Player[]>;
  history: CorMatch[];
  lastRoundResults: MatchResult[];
  // Frases de narração já usadas na campanha, para não repetir.
  usedLines: string[];
};

export const TOTAL_ROUNDS = ROUNDS.length;
// Quantos times precisam terminar acima do Corinthians para ele cair.
const TEAMS_ABOVE_NEEDED = TEAMS.length - RELEGATION_SPOTS;

// ---------- utilidades ----------

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function weighted<T>(items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [item, w] of items) {
    r -= w;
    if (r <= 0) return item;
  }
  return items[items.length - 1][0];
}

export const points = (s: Standing) => s.w * 3 + s.d;

// ---------- escalação ----------

export function findLegend(id: string): Player | undefined {
  for (const list of Object.values(LEGENDS)) {
    const found = list.find((p) => p.id === id);
    if (found) return found;
  }
}

/** Onde cada lenda entra: mesma posição na defesa, o mais fraco no meio e no ataque. */
export function buildLineup(selection: Selection): Record<string, Player> {
  const lineup: Record<string, Player> = { ...STARTERS };
  for (const sector of Object.keys(selection) as Sector[]) {
    const legendId = selection[sector];
    if (!legendId) continue;
    const legend = findLegend(legendId);
    if (!legend) continue;

    let candidates = SLOTS.filter((s) => s.sector === sector);
    if (sector === "defesa") {
      candidates = candidates.filter((s) => s.pos === legend.pos);
    }
    const target = candidates.reduce((weakest, slot) =>
      lineup[slot.id].rating < lineup[weakest.id].rating ? slot : weakest
    );
    lineup[target.id] = legend;
  }
  return lineup;
}

export function lineupOverall(lineup: Record<string, Player>): number {
  const ratings = SLOTS.map((s) => lineup[s.id].rating);
  return Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
}

// ---------- tabela ----------

export function sortedTable(standings: Record<string, Standing>): Standing[] {
  return Object.values(standings).sort(
    (a, b) =>
      points(b) - points(a) ||
      b.w - a.w ||
      b.gf - b.ga - (a.gf - a.ga) ||
      b.gf - a.gf ||
      TEAM_BY_ID[a.teamId].name.localeCompare(TEAM_BY_ID[b.teamId].name)
  );
}

export function positionOf(standings: Record<string, Standing>, teamId: string) {
  return sortedTable(standings).findIndex((s) => s.teamId === teamId) + 1;
}

function applyResult(standings: Record<string, Standing>, m: MatchResult) {
  const home = { ...standings[m.homeId] };
  const away = { ...standings[m.awayId] };
  home.gf += m.hg;
  home.ga += m.ag;
  away.gf += m.ag;
  away.ga += m.hg;
  if (m.hg > m.ag) {
    home.w++;
    away.l++;
  } else if (m.hg < m.ag) {
    away.w++;
    home.l++;
  } else {
    home.d++;
    away.d++;
  }
  standings[m.homeId] = home;
  standings[m.awayId] = away;
}

/** Já não dá mais pra escapar nem vencendo tudo. */
export function mathematicallyRelegated(
  standings: Record<string, Standing>,
  roundsLeft: number
) {
  const best = points(standings[COR_ID]) + roundsLeft * 3;
  const above = Object.values(standings).filter(
    (s) => s.teamId !== COR_ID && points(s) > best
  ).length;
  return above >= TEAMS_ABOVE_NEEDED;
}

// ---------- novo jogo ----------

function drawOptions(previous?: Record<Sector, Player[]>): Record<Sector, Player[]> {
  const result = {} as Record<Sector, Player[]>;
  for (const sector of Object.keys(LEGENDS) as Sector[]) {
    const prevIds = new Set(previous?.[sector].map((p) => p.id));
    const fresh = shuffle(LEGENDS[sector].filter((p) => !prevIds.has(p.id)));
    result[sector] = fresh.slice(0, 3);
  }
  return result;
}

/** Calendário real. O jogo do Corinthians vem sempre primeiro na rodada. */
function buildFixtures(): Fixture[][] {
  return ROUNDS.map((round) => {
    const fixtures: Fixture[] = [
      ...round.matches.map(([homeId, awayId]) => ({ homeId, awayId })),
      ...(round.late ?? []).map(([homeId, awayId]) => ({ homeId, awayId, late: true })),
    ];
    const isCor = (f: Fixture) => f.homeId === COR_ID || f.awayId === COR_ID;
    return [...fixtures.filter(isCor), ...fixtures.filter((f) => !isCor(f))];
  });
}

export function newGame(): GameState {
  return {
    roundIndex: 0,
    standings: Object.fromEntries(INITIAL_STANDINGS.map((s) => [s.teamId, { ...s }])),
    fixtures: buildFixtures(),
    options: drawOptions(),
    history: [],
    lastRoundResults: [],
    usedLines: [],
  };
}

// ---------- simulação ----------

function outcomeProbs(strength: number, oppStrength: number, home: boolean) {
  const diff = strength - oppStrength + (home ? 3 : -3);
  const win = clamp(0.36 + diff * 0.03, 0.06, 0.82);
  const draw = clamp(0.28 - Math.abs(diff) * 0.006, 0.12, 0.3);
  return { win, draw, loss: Math.max(0.03, 1 - win - draw) };
}

function rollOutcome(strength: number, oppStrength: number, home: boolean): Outcome {
  const p = outcomeProbs(strength, oppStrength, home);
  return weighted<Outcome>([
    ["W", p.win],
    ["D", p.draw],
    ["L", p.loss],
  ]);
}

/** Placar [gols do time, gols do adversário] coerente com o resultado. */
function scoreFor(outcome: Outcome): [number, number] {
  if (outcome === "D") {
    const g = weighted<number>([[0, 3], [1, 4.5], [2, 2], [3, 0.5]]);
    return [g, g];
  }
  const loser = weighted<number>([[0, 5], [1, 3.5], [2, 1.5]]);
  const winner = loser + weighted<number>([[1, 5.5], [2, 3], [3, 1.5]]);
  return outcome === "W" ? [winner, loser] : [loser, winner];
}

function simulateOther(f: Fixture): MatchResult {
  const outcome = rollOutcome(
    TEAM_BY_ID[f.homeId].overall,
    TEAM_BY_ID[f.awayId].overall,
    true
  );
  const [hg, ag] = scoreFor(outcome);
  return { ...f, hg, ag };
}

/**
 * O "destino". A regra que nunca deixa o Timão escapar:
 * depois de cada rodada, pelo menos 16 times precisam conseguir terminar
 * acima do Corinthians mesmo ganhando só 1 ponto por rodada daqui pra frente.
 * Enquanto isso valer, dá pra garantir a queda forçando no máximo empates.
 */
function fateAllows(
  standings: Record<string, Standing>,
  roundsLeftAfter: number
): boolean {
  const cor = points(standings[COR_ID]);
  const canStayAbove = Object.values(standings).filter(
    (s) => s.teamId !== COR_ID && points(s) + roundsLeftAfter > cor
  ).length;
  return canStayAbove >= TEAMS_ABOVE_NEEDED;
}

/** Times que o destino protege não perdem: a derrota vira empate. */
function protectRivals(results: MatchResult[], protectedIds: Set<string>): MatchResult[] {
  return results.map((m) => {
    const homeLost = m.hg < m.ag && protectedIds.has(m.homeId);
    const awayLost = m.ag < m.hg && protectedIds.has(m.awayId);
    if (!homeLost && !awayLost) return m;
    const g = Math.max(m.hg, m.ag);
    return { ...m, hg: g, ag: g };
  });
}

function corResult(fixture: Fixture, outcome: Outcome): MatchResult {
  const [cg, og] = scoreFor(outcome);
  return fixture.homeId === COR_ID
    ? { ...fixture, hg: cg, ag: og }
    : { ...fixture, hg: og, ag: cg };
}

const OUTCOME_RANK: Record<Outcome, number> = { W: 2, D: 1, L: 0 };

export type RoundOutcome = {
  state: GameState;
  match: CorMatch;
};

export function playRound(state: GameState, selection: Selection): RoundOutcome {
  const lineup = buildLineup(selection);
  const overall = lineupOverall(lineup);
  const fixtures = state.fixtures[state.roundIndex];
  const corFixture = fixtures.find((f) => f.homeId === COR_ID || f.awayId === COR_ID)!;
  const home = corFixture.homeId === COR_ID;
  const opponentId = home ? corFixture.awayId : corFixture.homeId;
  const roundsLeftAfter = TOTAL_ROUNDS - state.roundIndex - 1;

  const randomOthers = fixtures.filter((f) => f !== corFixture).map(simulateOther);

  const corPtsBefore = points(state.standings[COR_ID]);
  const protectedIds = new Set(
    Object.values(state.standings)
      .filter((s) => s.teamId !== COR_ID && points(s) + roundsLeftAfter + 1 > corPtsBefore)
      .map((s) => s.teamId)
  );
  const forcedOthers = protectRivals(randomOthers, protectedIds);

  const wanted = rollOutcome(overall, TEAM_BY_ID[opponentId].overall, home);
  const fallbacks = (["W", "D", "L"] as Outcome[]).filter(
    (o) => OUTCOME_RANK[o] <= OUTCOME_RANK[wanted]
  );

  const attempts: [MatchResult[], Outcome][] = [
    [randomOthers, wanted],
    ...fallbacks.map((o): [MatchResult[], Outcome] => [forcedOthers, o]),
  ];

  let chosen: { others: MatchResult[]; cor: MatchResult; outcome: Outcome } | null = null;
  for (const [others, outcome] of attempts) {
    const cor = corResult(corFixture, outcome);
    const next = { ...state.standings };
    [cor, ...others].forEach((m) => applyResult(next, m));
    if (fateAllows(next, roundsLeftAfter)) {
      chosen = { others, cor, outcome };
      break;
    }
  }
  // A derrota com rivais protegidos sempre satisfaz a regra; isto é só um cinto de segurança.
  if (!chosen) {
    chosen = { others: forcedOthers, cor: corResult(corFixture, "L"), outcome: "L" };
  }

  const standings = { ...state.standings };
  [chosen.cor, ...chosen.others].forEach((m) => applyResult(standings, m));

  const legends = (Object.values(selection).filter(Boolean) as string[]).map(
    (id) => findLegend(id)!.name
  );
  const used = new Set(state.usedLines);
  const { events, finalMinute } = narrate({
    corGoals: home ? chosen.cor.hg : chosen.cor.ag,
    oppGoals: home ? chosen.cor.ag : chosen.cor.hg,
    home,
    opponentId,
    venueIn: ROUNDS[state.roundIndex].venueIn,
    lineup,
    fate: wanted !== chosen.outcome,
    used,
  });

  const match: CorMatch = {
    round: state.roundIndex,
    result: chosen.cor,
    home,
    opponentId,
    overall,
    legends,
    events,
    finalMinute,
  };

  return {
    match,
    state: {
      ...state,
      roundIndex: state.roundIndex + 1,
      standings,
      options: drawOptions(state.options),
      history: [...state.history, match],
      lastRoundResults: [chosen.cor, ...chosen.others],
      usedLines: [...used],
    },
  };
}

export function corScore(m: CorMatch) {
  return m.home
    ? { cor: m.result.hg, opp: m.result.ag }
    : { cor: m.result.ag, opp: m.result.hg };
}
