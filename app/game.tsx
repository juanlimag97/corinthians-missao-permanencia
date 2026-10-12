"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  FastForward,
  Play,
  RotateCcw,
  ShieldAlert,
  Star,
  TrendingUp,
} from "lucide-react";
import {
  COR_ID,
  FIRST_ROUND,
  INITIAL_STANDINGS,
  LAST_ROUND,
  RELEGATION_SPOTS,
  ROUNDS,
  SECTOR_LABEL,
  SLOTS,
  STANDINGS_DATE,
  STARTERS,
  TEAMS,
  TEAM_BY_ID,
  type Player,
  type Sector,
  type Standing,
} from "@/lib/data";
import {
  TOTAL_ROUNDS,
  buildLineup,
  corScore,
  lineupOverall,
  mathematicallyRelegated,
  newGame,
  playRound,
  points,
  positionOf,
  sortedTable,
  type CorMatch,
  type GameState,
  type MatchResult,
  type RoundOutcome,
  type Selection,
} from "@/lib/engine";

type Phase = "intro" | "escalacao" | "jogo" | "fim";

const EMPTY_SELECTION: Selection = { defesa: null, meio: null, ataque: null };
const SECTORS: Sector[] = ["defesa", "meio", "ataque"];
const BASE_OVERALL = lineupOverall(STARTERS);
const SAFE_LINE = TEAMS.length - RELEGATION_SPOTS;
const TICK_MS = 70;

const formatMinute = (m: number) => (m > 90 ? `90+${m - 90}'` : `${m}'`);

export function Game() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [game, setGame] = useState<GameState | null>(null);
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [pending, setPending] = useState<RoundOutcome | null>(null);
  const [minute, setMinute] = useState(0);

  const lineup = useMemo(() => buildLineup(selection), [selection]);
  const overall = lineupOverall(lineup);
  const finished = pending !== null && minute >= pending.match.finalMinute;

  useEffect(() => {
    if (phase !== "jogo" || finished) return;
    const id = setInterval(() => setMinute((m) => m + 1), TICK_MS);
    return () => clearInterval(id);
  }, [phase, finished]);

  function start() {
    setGame(newGame());
    setSelection(EMPTY_SELECTION);
    setPending(null);
    setPhase("escalacao");
  }

  function toggleLegend(sector: Sector, id: string) {
    setSelection((s) => ({ ...s, [sector]: s[sector] === id ? null : id }));
  }

  function kickOff() {
    if (!game) return;
    setPending(playRound(game, selection));
    setMinute(0);
    setPhase("jogo");
  }

  function nextRound() {
    if (!pending) return;
    setGame(pending.state);
    setPending(null);
    setSelection(EMPTY_SELECTION);
    setPhase(pending.state.roundIndex >= TOTAL_ROUNDS ? "fim" : "escalacao");
  }

  if (phase === "intro" || !game) return <Intro onStart={start} />;
  if (phase === "fim") return <FinalScreen game={game} onRestart={start} />;

  const standings = finished ? pending!.state.standings : game.standings;
  const roundNumber = FIRST_ROUND + game.roundIndex;
  const fixture = game.fixtures[game.roundIndex][0];
  const home = fixture.homeId === COR_ID;
  const opponent = TEAM_BY_ID[home ? fixture.awayId : fixture.homeId];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <Header
        round={roundNumber}
        standings={standings}
        roundsLeft={TOTAL_ROUNDS - game.roundIndex - (finished ? 1 : 0)}
      />

      <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:px-6">
        <section className="flex flex-col gap-4">
          <MatchCard
            round={roundNumber}
            date={ROUNDS[game.roundIndex].corDate}
            venue={ROUNDS[game.roundIndex].venue}
            home={home}
            opponentName={opponent.name}
            opponentOverall={opponent.overall}
            overall={overall}
          />
          <Pitch lineup={lineup} />
          <OverallMeter overall={overall} />
        </section>

        <section className="flex flex-col gap-4">
          {phase === "escalacao" && (
            <>
              <Market
                options={game.options}
                selection={selection}
                onToggle={toggleLegend}
              />
              <button
                onClick={kickOff}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-base font-bold text-black transition hover:bg-zinc-200"
              >
                <Play className="h-5 w-5 fill-black" />
                Jogar a {roundNumber}ª rodada
                <span className="rounded-md bg-black px-2 py-0.5 text-sm text-white">
                  OVR {overall}
                </span>
              </button>
            </>
          )}

          {phase === "jogo" && pending && (
            <LiveMatch
              match={pending.match}
              minute={minute}
              finished={finished}
              onSkip={() => setMinute(pending.match.finalMinute)}
              onContinue={nextRound}
              isLast={pending.state.roundIndex >= TOTAL_ROUNDS}
              roundResults={pending.state.lastRoundResults}
            />
          )}

          <Table standings={standings} />
        </section>
      </main>
    </div>
  );
}

// ---------- telas ----------

function situationText() {
  const standings = Object.fromEntries(INITIAL_STANDINGS.map((s) => [s.teamId, s]));
  const table = sortedTable(standings);
  const pos = positionOf(standings, COR_ID);
  const pts = points(standings[COR_ID]);
  if (pos > SAFE_LINE) {
    const gap = points(table[SAFE_LINE - 1]) - pts;
    return {
      highlight: `${pos}º, dentro do Z4`,
      rest: `, ${gap} ponto${gap === 1 ? "" : "s"} atrás do primeiro time fora da zona.`,
    };
  }
  const first = table[SAFE_LINE];
  const gap = pts - points(first);
  const name = TEAM_BY_ID[first.teamId].name;
  return {
    highlight: `${pos}º, com ${pts} pontos`,
    rest:
      gap === 0
        ? `, empatado com o ${name}, que abre o Z4 — e só fica fora pelo número de vitórias.`
        : `, só ${gap} ponto${gap === 1 ? "" : "s"} acima do Z4.`,
  };
}

function Intro({ onStart }: { onStart: () => void }) {
  const situation = situationText();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 py-16 text-zinc-50">
      <div className="flex max-w-xl flex-col items-center gap-6 text-center">
        <Crest className="h-20 w-20" />
        <p className="text-xs font-semibold tracking-[0.3em] text-zinc-400 uppercase">
          Brasileirão 2026 · Rodadas {FIRST_ROUND} a {LAST_ROUND}
        </p>
        <h1 className="text-4xl font-black tracking-tight text-balance sm:text-5xl">
          Missão Permanência
        </h1>
        <p className="text-lg text-zinc-300">
          Faltam {TOTAL_ROUNDS} rodadas. O Timão está em{" "}
          <strong className="text-red-400">{situation.highlight}</strong>
          {situation.rest} A diretoria liberou a máquina do tempo: convoque
          lendas para tentar salvar o Corinthians.
        </p>
        <ul className="w-full space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-left text-sm text-zinc-300">
          <li>
            <strong className="text-white">1.</strong> A cada rodada aparecem 3
            lendas novas para a defesa, o meio e o ataque.
          </li>
          <li>
            <strong className="text-white">2.</strong> Escolha até 3 jogadores —
            um por setor — para entrar no lugar dos titulares e subir o overall.
          </li>
          <li>
            <strong className="text-white">3.</strong> Os reforços jogam só uma
            partida. Na rodada seguinte, novas opções.
          </li>
          <li>
            <strong className="text-white">4.</strong> Simule jogo a jogo e
            termine fora dos {RELEGATION_SPOTS} últimos.
          </li>
        </ul>
        <button
          onClick={onStart}
          className="flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-black transition hover:bg-zinc-200"
        >
          Assumir o Timão
          <ArrowRight className="h-5 w-5" />
        </button>
        <p className="text-xs text-zinc-500">
          Tabela, jogos restantes e elenco reais do Brasileirão 2026 (até{" "}
          {STANDINGS_DATE}). Overalls e simulação são fictícios, feitos por
          diversão.
        </p>
      </div>
    </div>
  );
}

function FinalScreen({ game, onRestart }: { game: GameState; onRestart: () => void }) {
  const pos = positionOf(game.standings, COR_ID);
  const cor = game.standings[COR_ID];
  const legendCounts = new Map<string, number>();
  game.history.forEach((m) =>
    m.legends.forEach((l) => legendCounts.set(l, (legendCounts.get(l) ?? 0) + 1))
  );
  const topLegends = [...legendCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);
  const bestOverall = Math.max(...game.history.map((m) => m.overall));

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <ShieldAlert className="h-14 w-14 text-red-500" />
          <p className="text-xs font-semibold tracking-[0.3em] text-zinc-400 uppercase">
            Fim do Brasileirão
          </p>
          <h1 className="text-5xl font-black tracking-tight text-red-500 sm:text-7xl">
            REBAIXADO
          </h1>
          <p className="text-lg text-zinc-300">
            O Corinthians terminou em <strong className="text-white">{pos}º</strong>{" "}
            com <strong className="text-white">{points(cor)} pontos</strong>.
            {topLegends.length > 0 ? (
              <>
                {" "}
                Nem {joinNames(topLegends)} conseguiram evitar a queda — mesmo com
                o time chegando a <strong className="text-white">{bestOverall}</strong>{" "}
                de overall.
              </>
            ) : (
              <> Sem nenhuma lenda em campo, o destino nem precisou se esforçar.</>
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wider text-zinc-400 uppercase">
            Campanha
          </h2>
          <ul className="divide-y divide-zinc-800">
            {game.history.map((m) => (
              <CampaignRow key={m.round} match={m} />
            ))}
          </ul>
        </div>

        <Table standings={game.standings} />

        <div className="flex flex-col items-center gap-3 text-center">
          <button
            onClick={onRestart}
            className="flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-black transition hover:bg-zinc-200"
          >
            <RotateCcw className="h-5 w-5" />
            Tentar de novo
          </button>
          <p className="text-xs text-zinc-500">
            Quem sabe com outras lendas… (spoiler: não.)
          </p>
        </div>
      </div>
    </div>
  );
}

function CampaignRow({ match }: { match: CorMatch }) {
  const { cor, opp } = corScore(match);
  const opponent = TEAM_BY_ID[match.opponentId];
  const tone =
    cor > opp ? "bg-emerald-500" : cor === opp ? "bg-zinc-500" : "bg-red-500";
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
      <span className={`h-2 w-2 shrink-0 rounded-full ${tone}`} />
      <span className="w-16 shrink-0 text-zinc-500">{FIRST_ROUND + match.round}ª rod.</span>
      <span className="font-medium">
        {match.home
          ? `Corinthians ${cor} x ${opp} ${opponent.name}`
          : `${opponent.name} ${opp} x ${cor} Corinthians`}
      </span>
      <span className="text-xs text-zinc-500 sm:ml-auto">
        {match.legends.length ? match.legends.join(", ") : "sem lendas"} · OVR {match.overall}
      </span>
    </li>
  );
}

// ---------- blocos da tela de jogo ----------

function Header({
  round,
  standings,
  roundsLeft,
}: {
  round: number;
  standings: Record<string, Standing>;
  roundsLeft: number;
}) {
  const pos = positionOf(standings, COR_ID);
  const inZone = pos > SAFE_LINE;
  const doomed = mathematicallyRelegated(standings, roundsLeft);
  return (
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 lg:px-6">
      <div className="flex items-center gap-3">
        <Crest className="h-10 w-10" />
        <div>
          <p className="text-[11px] font-semibold tracking-[0.25em] text-zinc-500 uppercase">
            Missão Permanência
          </p>
          <p className="text-lg font-bold">
            Rodada {round} <span className="text-zinc-500">de {LAST_ROUND}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="rounded-full border border-zinc-800 px-3 py-1 font-semibold">
          {pos}º · {points(standings[COR_ID])} pts
        </span>
        <span
          className={`rounded-full px-3 py-1 font-semibold ${
            doomed
              ? "bg-red-600 text-white"
              : inZone
                ? "bg-red-500/15 text-red-400"
                : "bg-emerald-500/15 text-emerald-400"
          }`}
        >
          {doomed ? "Rebaixado matematicamente" : inZone ? "Z4" : "Fora do Z4"}
        </span>
      </div>
    </header>
  );
}

function MatchCard({
  round,
  date,
  venue,
  home,
  opponentName,
  opponentOverall,
  overall,
}: {
  round: number;
  date: string;
  venue: string;
  home: boolean;
  opponentName: string;
  opponentOverall: number;
  overall: number;
}) {
  const left = home
    ? { name: "Corinthians", ovr: overall }
    : { name: opponentName, ovr: opponentOverall };
  const right = home
    ? { name: opponentName, ovr: opponentOverall }
    : { name: "Corinthians", ovr: overall };
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <p className="text-center text-xs font-medium tracking-wider text-zinc-500 uppercase">
        {round}ª rodada · {date} · {venue}
      </p>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamSide name={left.name} ovr={left.ovr} align="right" />
        <span className="text-sm font-bold text-zinc-600">VS</span>
        <TeamSide name={right.name} ovr={right.ovr} align="left" />
      </div>
    </div>
  );
}

function TeamSide({ name, ovr, align }: { name: string; ovr: number; align: "left" | "right" }) {
  const isCor = name === "Corinthians";
  return (
    <div className={`min-w-0 ${align === "right" ? "text-right" : "text-left"}`}>
      <p className={`truncate font-bold ${isCor ? "text-white" : "text-zinc-300"}`}>{name}</p>
      <p className="text-xs text-zinc-500">
        Overall <span className="font-semibold text-zinc-200">{ovr}</span>
      </p>
    </div>
  );
}

function Pitch({ lineup }: { lineup: Record<string, Player> }) {
  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-emerald-900"
      style={{
        background:
          "repeating-linear-gradient(180deg, #166534 0 10%, #15803d 10% 20%)",
      }}
    >
      {/* marcações */}
      <div className="absolute inset-3 rounded-md border-2 border-white/25" />
      <div className="absolute top-1/2 right-3 left-3 border-t-2 border-white/25" />
      <div className="absolute top-1/2 left-1/2 h-[22%] w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/25" />
      <div className="absolute top-3 left-1/2 h-[14%] w-[50%] -translate-x-1/2 border-2 border-t-0 border-white/25" />
      <div className="absolute bottom-3 left-1/2 h-[14%] w-[50%] -translate-x-1/2 border-2 border-b-0 border-white/25" />

      {SLOTS.map((slot) => {
        const p = lineup[slot.id];
        return (
          <div
            key={slot.id}
            className="absolute flex w-[4.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center sm:w-24"
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          >
            <div
              className={`relative grid h-10 w-10 place-items-center rounded-full text-sm font-black shadow-lg sm:h-12 sm:w-12 sm:text-base ${
                p.legend
                  ? "bg-amber-400 text-black ring-2 ring-amber-200"
                  : "bg-white text-black"
              }`}
            >
              {p.rating}
              {p.legend && (
                <Star className="absolute -top-1 -right-1 h-4 w-4 fill-amber-200 text-amber-600" />
              )}
            </div>
            <span
              className={`mt-1 max-w-full truncate rounded px-1.5 py-0.5 text-[10px] font-semibold sm:text-xs ${
                p.legend ? "bg-amber-400/90 text-black" : "bg-black/60 text-white"
              }`}
            >
              {p.short ?? p.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function OverallMeter({ overall }: { overall: number }) {
  const gain = overall - BASE_OVERALL;
  const pct = Math.min(100, Math.max(0, ((overall - 60) / 40) * 100));
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-end justify-between">
        <p className="text-sm font-medium text-zinc-400">Overall do time</p>
        <p className="flex items-baseline gap-2">
          {gain > 0 && (
            <span className="flex items-center gap-0.5 text-sm font-semibold text-emerald-400">
              <TrendingUp className="h-4 w-4" />+{gain}
            </span>
          )}
          <span className="text-3xl font-black">{overall}</span>
        </p>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            gain > 0 ? "bg-amber-400" : "bg-white"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Market({
  options,
  selection,
  onToggle,
}: {
  options: Record<Sector, Player[]>;
  selection: Selection;
  onToggle: (sector: Sector, id: string) => void;
}) {
  const picked = Object.values(selection).filter(Boolean).length;
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">Lendas disponíveis nesta rodada</h2>
        <span className="text-xs font-semibold text-zinc-400">{picked}/3 escolhidas</span>
      </div>
      <div className="flex flex-col gap-4">
        {SECTORS.map((sector) => (
          <div key={sector}>
            <p className="mb-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
              {SECTOR_LABEL[sector]}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {options[sector].map((p) => (
                <LegendCard
                  key={p.id}
                  player={p}
                  selected={selection[sector] === p.id}
                  replaces={replacedPlayer(selection, sector, p.id)}
                  onClick={() => onToggle(sector, p.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function replacedPlayer(selection: Selection, sector: Sector, id: string): string {
  const lineup = buildLineup({ ...selection, [sector]: id });
  const slot = SLOTS.find((s) => s.sector === sector && lineup[s.id].id === id);
  return slot ? STARTERS[slot.id].name : "";
}

function LegendCard({
  player,
  selected,
  replaces,
  onClick,
}: {
  player: Player;
  selected: boolean;
  replaces: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`flex flex-col gap-1 rounded-xl border p-3 text-left transition ${
        selected
          ? "border-amber-400 bg-amber-400/10"
          : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-bold">{player.name}</span>
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-sm font-black ${
            selected ? "bg-amber-400 text-black" : "bg-white text-black"
          }`}
        >
          {player.rating}
        </span>
      </div>
      <span className="text-xs text-zinc-400">
        {player.pos} · {player.tagline}
      </span>
      <span className="text-[11px] text-zinc-500">
        {selected ? "Escalado no lugar de" : "Entra no lugar de"} {replaces}
      </span>
    </button>
  );
}

function LiveMatch({
  match,
  minute,
  finished,
  onSkip,
  onContinue,
  isLast,
  roundResults,
}: {
  match: CorMatch;
  minute: number;
  finished: boolean;
  onSkip: () => void;
  onContinue: () => void;
  isLast: boolean;
  roundResults: MatchResult[];
}) {
  const visible = match.events.filter((e) => e.minute <= minute);
  const cor = visible.filter((e) => e.kind === "goal-cor").length;
  const opp = visible.filter((e) => e.kind === "goal-opp").length;
  const opponent = TEAM_BY_ID[match.opponentId].name;
  const [homeName, awayName, homeGoals, awayGoals] = match.home
    ? ["Corinthians", opponent, cor, opp]
    : [opponent, "Corinthians", opp, cor];
  const clock = Math.min(minute, match.finalMinute);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
          <span className={finished ? "" : "flex items-center gap-1.5 text-red-400"}>
            {!finished && <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />}
            {finished ? "Encerrado" : "Ao vivo"}
          </span>
          <span className="font-mono">{formatMinute(clock)}</span>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <p className="truncate text-right font-bold">{homeName}</p>
          <p className="font-mono text-4xl font-black tabular-nums">
            {homeGoals}
            <span className="mx-2 text-zinc-600">x</span>
            {awayGoals}
          </p>
          <p className="truncate font-bold">{awayName}</p>
        </div>

        <ul className="mt-4 flex max-h-72 flex-col gap-1.5 overflow-y-auto">
          {visible.map((e, i) => ({ e, key: `${e.minute}-${i}` })).reverse().map(({ e, key }) => (
            <li
              key={key}
              className={`flex gap-3 rounded-lg px-3 py-2 text-sm ${
                e.kind === "goal-cor"
                  ? "bg-white font-bold text-black"
                  : e.kind === "goal-opp"
                    ? "bg-red-500/15 font-semibold text-red-300"
                    : e.kind === "drama"
                      ? "bg-amber-400/15 font-semibold text-amber-300"
                      : "text-zinc-400"
              }`}
            >
              <span className="w-12 shrink-0 font-mono text-xs leading-5 opacity-70">
                {formatMinute(e.minute)}
              </span>
              <span>{e.text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          {finished ? (
            <button
              onClick={onContinue}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:bg-zinc-200"
            >
              {isLast ? "Ver o desfecho" : "Próxima rodada"}
              <ArrowRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={onSkip}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500"
            >
              <FastForward className="h-4 w-4" />
              Pular para o fim
            </button>
          )}
        </div>
      </div>

      {finished && <RoundResults results={roundResults.slice(1)} />}
    </div>
  );
}

function RoundResults({ results }: { results: MatchResult[] }) {
  const regular = results.filter((m) => !m.late);
  const late = results.filter((m) => m.late);
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <ResultList title="Outros jogos da rodada" results={regular} />
      {late.length > 0 && <ResultList title="Jogo atrasado" results={late} />}
    </div>
  );
}

function ResultList({ title, results }: { title: string; results: MatchResult[] }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
        {title}
      </h3>
      <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {results.map((m) => (
          <li key={`${m.homeId}-${m.awayId}`} className="grid grid-cols-[1fr_auto_1fr] gap-2">
            <span className="truncate text-right text-zinc-300">{TEAM_BY_ID[m.homeId].name}</span>
            <span className="font-mono font-semibold tabular-nums">
              {m.hg} x {m.ag}
            </span>
            <span className="truncate text-zinc-300">{TEAM_BY_ID[m.awayId].name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Table({ standings }: { standings: Record<string, Standing> }) {
  const rows = sortedTable(standings);
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
      <table className="w-full text-sm">
        <thead className="text-xs text-zinc-500">
          <tr className="border-b border-zinc-800">
            <th className="py-2 pl-3 text-left font-medium">#</th>
            <th className="py-2 text-left font-medium">Time</th>
            <th className="py-2 text-right font-medium">P</th>
            <th className="py-2 text-right font-medium">J</th>
            <th className="py-2 text-right font-medium">V</th>
            <th className="py-2 pr-3 text-right font-medium">SG</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => {
            const team = TEAM_BY_ID[s.teamId];
            const isCor = s.teamId === COR_ID;
            const zone = i + 1 > SAFE_LINE;
            return (
              <tr
                key={s.teamId}
                className={`${isCor ? "bg-white font-bold text-black" : zone ? "bg-red-500/5" : ""} ${
                  i + 1 === SAFE_LINE ? "border-b-2 border-red-500/60" : "border-b border-zinc-800/60"
                }`}
              >
                <td className="py-1.5 pl-3">
                  <span
                    className={`inline-block w-6 text-center text-xs font-semibold ${
                      zone ? "text-red-500" : isCor ? "text-black" : "text-zinc-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="py-1.5">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/20"
                      style={{ background: isCor ? "#000" : team.color }}
                    />
                    <span className="truncate">{team.name}</span>
                  </span>
                </td>
                <td className="py-1.5 text-right font-semibold tabular-nums">{points(s)}</td>
                <td className="py-1.5 text-right tabular-nums opacity-70">{s.w + s.d + s.l}</td>
                <td className="py-1.5 text-right tabular-nums opacity-70">{s.w}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums opacity-70">{s.gf - s.ga}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Escudo estilizado (não é o oficial).
function Crest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#000" stroke="#fff" strokeWidth="3" />
      <circle cx="32" cy="32" r="21" fill="none" stroke="#fff" strokeWidth="1.5" />
      <path d="M32 14 L36 28 L50 32 L36 36 L32 50 L28 36 L14 32 L28 28 Z" fill="#fff" />
    </svg>
  );
}

function joinNames(names: string[]) {
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}
