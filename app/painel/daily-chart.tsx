"use client";

import { useState } from "react";
import type { DayStats } from "@/lib/stats";

const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

function niceMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude * 4 >= value)! * magnitude;
  return step * 4;
}

/** Pessoas que começaram a jogar, por dia. Uma série só: sem legenda. */
export function DailyChart({ days }: { days: DayStats[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...days.map((d) => d.players)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  return (
    <div className="relative">
      <div className="flex gap-3">
        {/* eixo y */}
        <div className="relative h-48 w-6 shrink-0 text-right text-[11px] text-zinc-500 tabular-nums">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${100 - (t / max) * 100}%` }}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* grade */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48">
            {ticks.map((t) => (
              <div
                key={t}
                className={`absolute inset-x-0 border-t ${t === 0 ? "border-zinc-600" : "border-zinc-800"}`}
                style={{ top: `${100 - (t / max) * 100}%` }}
              />
            ))}
          </div>

          <div className="relative flex h-48 items-end gap-0.5 sm:gap-1">
            {days.map((d, i) => (
              <button
                key={d.day}
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${shortDay(d.day)}: ${d.players} pessoas`}
                className="group flex h-full min-w-0 flex-1 items-end justify-center outline-none"
              >
                <span
                  className={`block w-full max-w-7 rounded-t-[4px] transition-colors ${
                    active === i ? "bg-white" : "bg-zinc-300 group-focus-visible:bg-white"
                  }`}
                  style={{ height: d.players ? `${Math.max(2, (d.players / max) * 100)}%` : 0 }}
                />
              </button>
            ))}
          </div>

          <div className="mt-2 flex gap-0.5 text-center text-[10px] text-zinc-500 sm:gap-1 sm:text-[11px]">
            {days.map((d, i) => {
              // Conta a partir de hoje: um rótulo a cada 2 dias (4 no celular).
              const fromEnd = days.length - 1 - i;
              return (
                <span
                  key={d.day}
                  className={`min-w-0 flex-1 whitespace-nowrap ${fromEnd % 4 === 0 ? "" : "invisible sm:visible"}`}
                >
                  {fromEnd % 2 === 0 ? shortDay(d.day) : ""}
                </span>
              );
            })}
          </div>

          {active !== null && (
            <div
              className="pointer-events-none absolute -top-2 z-10 w-40 -translate-x-1/2 -translate-y-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs shadow-xl"
              style={{
                left: `clamp(5rem, ${((active + 0.5) / days.length) * 100}%, calc(100% - 5rem))`,
              }}
            >
              <p className="font-semibold text-zinc-100">{shortDay(days[active].day)}</p>
              <p className="mt-1 flex justify-between text-zinc-400">
                Pessoas <span className="font-semibold text-zinc-100">{days[active].players}</span>
              </p>
              <p className="flex justify-between text-zinc-400">
                Partidas <span className="font-semibold text-zinc-100">{days[active].starts}</span>
              </p>
              <p className="flex justify-between text-zinc-400">
                Terminadas <span className="font-semibold text-zinc-100">{days[active].finishes}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
