import type { Metadata } from "next";
import { connection } from "next/server";
import { LogOut } from "lucide-react";
import { isLoggedIn, painelPassword } from "@/lib/painel-auth";
import { CHART_DAYS, getStats, statsConfigured, type Stats } from "@/lib/stats";
import { login, logout } from "./actions";
import { DailyChart } from "./daily-chart";

export const metadata: Metadata = {
  title: "Painel — Missão Permanência",
  robots: { index: false, follow: false },
};

const fmt = (n: number) => n.toLocaleString("pt-BR");
const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

export default async function PainelPage({ searchParams }: PageProps<"/painel">) {
  // Sempre por requisição: senha e números podem mudar sem novo build.
  await connection();

  if (!painelPassword()) {
    return (
      <Shell>
        <Notice title="Defina uma senha para o painel">
          Na Vercel, abra o projeto → <strong>Settings → Environment Variables</strong> e
          crie a variável <Code>PAINEL_SENHA</Code> com a senha que você quiser. Depois
          faça um novo deploy.
        </Notice>
      </Shell>
    );
  }

  if (!(await isLoggedIn())) {
    const { erro } = await searchParams;
    return (
      <Shell>
        <form
          action={login}
          className="mx-auto flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
        >
          <h1 className="text-lg font-bold">Painel do jogo</h1>
          <label className="text-sm text-zinc-400" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-50 outline-none focus:border-zinc-400"
          />
          {erro && <p className="text-sm text-red-400">Senha incorreta.</p>}
          <button className="mt-1 rounded-lg bg-white px-4 py-2.5 font-bold text-black transition hover:bg-zinc-200">
            Entrar
          </button>
        </form>
      </Shell>
    );
  }

  if (!statsConfigured()) {
    return (
      <Shell>
        <Notice title="Conecte o banco de contagem">
          Na Vercel, abra o projeto → <strong>Storage → Create Database → Upstash
          (Redis)</strong>, escolha o plano gratuito e conecte ao projeto. As variáveis{" "}
          <Code>KV_REST_API_URL</Code> e <Code>KV_REST_API_TOKEN</Code> são criadas
          sozinhas. Depois faça um novo deploy — a contagem começa a partir daí.
        </Notice>
      </Shell>
    );
  }

  let stats: Stats;
  try {
    stats = await getStats();
  } catch (error) {
    console.error("Falha ao ler estatísticas", error);
    return (
      <Shell>
        <Notice title="Não deu pra ler os números agora">
          O banco de contagem não respondeu. Tente recarregar a página em instantes.
        </Notice>
      </Shell>
    );
  }

  const { totals, days } = stats;
  const players = totals.start.people;
  const finishers = totals.finish.people;
  const completion = players ? Math.round((finishers / players) * 100) : 0;
  const today = days[days.length - 1];

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.25em] text-zinc-500 uppercase">
              Missão Permanência
            </p>
            <h1 className="text-2xl font-black">Painel do jogo</h1>
          </div>
          <form action={logout}>
            <button className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <p className="text-sm text-zinc-400">Pessoas que jogaram</p>
          <p className="mt-1 text-6xl font-black tabular-nums">{fmt(players)}</p>
          <p className="mt-2 text-sm text-zinc-400">
            <span className="font-semibold text-zinc-100">{fmt(today.players)}</span> hoje
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Tile label="Partidas iniciadas" value={fmt(totals.start.count)} hint="inclui quem jogou mais de uma vez" />
          <Tile
            label="Chegaram ao rebaixamento"
            value={fmt(finishers)}
            hint={`${completion}% de quem começou jogou até a 38ª rodada`}
          />
          <Tile label="Abriram o jogo" value={fmt(totals.visit.people)} hint="visitantes, jogando ou não" />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="font-bold">Pessoas que jogaram por dia</h2>
          <p className="mb-6 text-xs text-zinc-500">Últimos {CHART_DAYS} dias · horário de Brasília</p>
          <DailyChart days={days} />

          <details className="mt-5 text-sm">
            <summary className="cursor-pointer text-zinc-400 hover:text-zinc-200">Ver em tabela</summary>
            <table className="mt-3 w-full tabular-nums">
              <thead className="text-xs text-zinc-500">
                <tr className="border-b border-zinc-800">
                  <th className="py-1.5 text-left font-medium">Dia</th>
                  <th className="py-1.5 text-right font-medium">Pessoas</th>
                  <th className="py-1.5 text-right font-medium">Partidas</th>
                  <th className="py-1.5 text-right font-medium">Terminadas</th>
                </tr>
              </thead>
              <tbody>
                {[...days].reverse().map((d) => (
                  <tr key={d.day} className="border-b border-zinc-800/60">
                    <td className="py-1.5 text-zinc-400">{shortDay(d.day)}</td>
                    <td className="py-1.5 text-right">{fmt(d.players)}</td>
                    <td className="py-1.5 text-right">{fmt(d.starts)}</td>
                    <td className="py-1.5 text-right">{fmt(d.finishes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>

        <p className="text-xs text-zinc-500">
          Cada pessoa é contada uma vez por navegador. Quem joga em aba anônima ou
          em outro aparelho conta de novo. Contagens únicas têm margem de erro de
          cerca de 1%.
        </p>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-50">
      <div className="mx-auto max-w-3xl">{children}</div>
    </div>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 text-3xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{children}</p>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-100">{children}</code>;
}
