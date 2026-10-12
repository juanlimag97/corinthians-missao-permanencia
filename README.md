# Missão Permanência — Salve o Corinthians

Jogo em Next.js: o jogador escala até 3 lendas do Corinthians (uma por
setor: defesa, meio-campo e ataque) no lugar dos titulares de hoje e
simula, jogo a jogo, as rodadas 31 a 38 do Brasileirão tentando tirar o
Timão do Z4. A cada rodada aparecem lendas diferentes e os reforços jogam
só uma partida.

O detalhe: não importa a escalação, o Corinthians **sempre** termina
rebaixado. A regra fica em `lib/engine.ts` (função `fateAllows`): depois
de cada rodada, pelo menos 16 times precisam conseguir terminar acima do
Corinthians. Quando uma vitória do Timão quebraria isso, os rivais são
protegidos ou o resultado vira empate/derrota — com VAR, pênalti perdido e
acréscimos misteriosos na narração.

Os dados são reais: classificação do Brasileirão 2026 com os jogos até
11/10/2026, os jogos das rodadas 31 a 38 conforme a tabela da CBF (mais os
4 jogos atrasados: Chapecoense x Vasco, Chapecoense x Athletico-PR,
Coritiba x Botafogo e Bragantino x Cruzeiro) e o elenco atual do
Corinthians. Os overalls e a simulação são inventados, por diversão.

Para atualizar depois de uma rodada real, edite `INITIAL_STANDINGS`,
`ROUNDS` e `FIRST_ROUND` em `lib/data.ts`.

## Onde mexer

- `lib/data.ts` — titulares atuais, lendas, times, tabela inicial e
  rodadas restantes
- `lib/engine.ts` — simulação, narração e a regra do rebaixamento
- `app/game.tsx` — interface do jogo

## Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Deploy na Vercel

1. Na Vercel, clique em **Add New → Project**.
2. Importe este repositório. A Vercel detecta Next.js sozinha — não
   precisa de variáveis de ambiente.
3. Clique em **Deploy**.
