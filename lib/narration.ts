// Narração das partidas do Corinthians. Cada categoria tem várias frases e o
// Picker evita repetir a mesma frase na campanha até esgotar a categoria.

import { TEAM_BY_ID, type Player } from "./data";

export type EventKind = "goal-cor" | "goal-opp" | "drama" | "card" | "info";
export type MatchEvent = { minute: number; text: string; kind: EventKind };

type Ctx = {
  home: boolean;
  venueIn: string;
  /** "o Flamengo" / "a Chapecoense" */
  oOpp: string;
  /** "O Flamengo" / "A Chapecoense" */
  OOpp: string;
  /** "do Flamengo" / "da Chapecoense" */
  doOpp: string;
  /** "pro Flamengo" / "pra Chapecoense" */
  proOpp: string;
  star: string;
  gk: string;
  def: string;
  /** Outro defensor, para lances que tiram alguém de campo. */
  def2: string;
  mid: string;
};

type Line = (c: Ctx) => string;
type Situation = "abre" | "empata" | "vira" | "desempata" | "amplia" | "desconta";

const rand = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));
const pickOne = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

class Picker {
  constructor(private used: Set<string>) {}

  /** Sorteia uma frase ainda não usada; se a categoria esgotou, recomeça. */
  pick(category: string, pool: Line[], ctx: Ctx): string {
    let fresh = pool.map((_, i) => i).filter((i) => !this.used.has(`${category}:${i}`));
    if (fresh.length === 0) {
      pool.forEach((_, i) => this.used.delete(`${category}:${i}`));
      fresh = pool.map((_, i) => i);
    }
    const i = pickOne(fresh);
    this.used.add(`${category}:${i}`);
    return pool[i](ctx);
  }

  text(category: string, pool: string[]): string {
    return this.pick(category, pool.map((t) => () => t), {} as Ctx);
  }
}

// ---------- frases ----------

const KICKOFF_HOME: Line[] = [
  (c) => `Rola a bola ${c.venueIn}!`,
  () => "Começa o jogo! A Fiel lota a Neo Química Arena e empurra o Timão.",
  () => "Apita o árbitro e a bola rola em Itaquera!",
  (c) => `Bola rolando! Mosaico em preto e branco ${c.venueIn}.`,
  (c) => `Começa o jogo contra ${c.oOpp}. Itaquera canta: “Vai, Corinthians!”`,
  () => "Saída de bola do Timão. Agora é decisão.",
];

const KICKOFF_AWAY: Line[] = [
  (c) => `Bola rolando ${c.venueIn}!`,
  (c) => `Começa o jogo. Clima hostil para o Timão ${c.venueIn}.`,
  (c) => `Apita o árbitro ${c.venueIn}. A Fiel faz barulho no setor visitante.`,
  (c) => `${c.OOpp} dá a saída. O Corinthians precisa pontuar fora de casa.`,
  () => "Começa o jogo! Pouca torcida do Timão, mas muito barulho.",
  (c) => `Bola rolando ${c.venueIn}. Vaias da torcida da casa a cada toque corinthiano.`,
];

const COR_GOAL: ((n: string) => string)[] = [
  (n) => `GOOOL DO TIMÃO! ${n} estufa a rede!`,
  (n) => `É GOL! ${n} bate cruzado, sem chance pro goleiro!`,
  (n) => `${n} de cabeça! A Fiel explode!`,
  (n) => `Golaço de ${n}! Pintura!`,
  (n) => `${n} recebe na entrada da área, ajeita e solta a bomba. Gol!`,
  (n) => `Contra-ataque mortal! ${n} sai cara a cara e toca na saída do goleiro.`,
  (n) => `${n} aproveita o rebote e empurra pro fundo da rede!`,
  (n) => `Tabela pelo meio e ${n} finaliza de primeira. Gol do Corinthians!`,
  (n) => `${n} cobra falta no ângulo! Indefensável!`,
  (n) => `Pênalti para o Timão! ${n} bate firme, no canto. Gol!`,
  (n) => `${n} dribla dois marcadores e toca por cobertura. Que categoria!`,
  (n) => `Escanteio, confusão na área e ${n} completa. Gol do Corinthians!`,
  (n) => `${n} chuta de longe, a bola quica na frente do goleiro e entra!`,
  (n) => `Lançamento longo, ${n} domina no peito e bate de voleio. GOLAÇO!`,
  (n) => `${n} rouba a bola na saída de jogo e finaliza sozinho. Presente aceito!`,
  (n) => `Cruzamento rasteiro e ${n} só desvia. Gol do Timão!`,
  (n) => `${n} gira em cima do zagueiro e bate no canto. Gol!`,
  (n) => `De letra! ${n} marca um gol pra entrar na história.`,
  (n) => `${n} invade a área, corta pra dentro e finaliza. É do Timão!`,
  (n) => `Bola espirrada na área e ${n}, de bico, manda pra dentro. Vale igual!`,
];

const DEFENDER_GOAL: ((n: string) => string)[] = [
  (n) => `Gol de zagueiro! ${n} sobe mais que todo mundo no escanteio.`,
  (n) => `${n} aparece de surpresa na área e marca! Quem diria.`,
  (n) => `${n} se mandou pro ataque e foi premiado. Gol do Timão!`,
];

// Comemorações próprias de cada lenda.
const LEGEND_GOAL: Record<string, string[]> = {
  socrates: [
    "De calcanhar! Sócrates deixa o goleiro sentado. O Doutor está em campo!",
    "Sócrates bate de primeira, sem olhar pro gol. E ergue o punho fechado.",
  ],
  rivellino: [
    "Elástico de Rivellino e bomba de canhota! A Fiel não acredita.",
    "Rivellino solta a patada atômica de fora da área. Gol do Reizinho!",
  ],
  marcelinho: [
    "Falta para o Timão... Marcelinho Carioca na bola. No ângulo! Pé de Anjo!",
    "Marcelinho bate o escanteio fechado e a bola entra direto. Gol olímpico!",
  ],
  neto: [
    "Neto cobra falta com efeito e a bola morre na rede. O Xodó voltou!",
    "Neto acerta um chutaço de 30 metros. Igualzinho a 1990!",
  ],
  ronaldo: [
    "Ronaldo arranca do meio-campo, deixa dois pra trás e bate rasteiro. FENÔMENO!",
    "Pedalada de Ronaldo, corte seco e gol. Não tem marcação que segure!",
  ],
  tevez: [
    "Tevez ganha a dividida na raça e finaliza. Carlitos é do povo!",
    "Tevez bate colocado e sai correndo pra abraçar a Fiel.",
  ],
  casagrande: ["Casagrande sobe de cabeça e explode a rede!"],
  baltazar: ["Cabecinha de Ouro! Baltazar testa no canto, sem chance."],
  claudio: ["Cláudio, o maior artilheiro da história do clube, faz mais um!"],
  teleco: ["Teleco mostra que faro de gol não envelhece. Gol!"],
  guerrero: ["Guerrero, de cabeça, como em Yokohama! Gol do Timão!"],
  sheik: ["Emerson Sheik aproveita a bobeira da zaga e marca. Malandragem pura!"],
  edilson: ["Edílson faz embaixadinha na cara do marcador e depois marca. Capetinha!"],
  luizao: ["Luizão aparece na pequena área, como sempre, e empurra pro gol."],
  liedson: ["Liedson escapa da marcação e toca de leve. É o Levezinho!"],
  jo: ["Jô marca e aponta pra arquibancada. A Fiel responde."],
  viola: ["Viola marca e corre pra galera, do jeito que a Fiel gosta."],
  paulinho: ["Paulinho chega de trás como elemento surpresa e marca de cabeça!"],
  "renato-augusto": ["Renato Augusto acha o espaço que ninguém viu e finaliza com classe."],
  jadson: ["Jadson bate de três dedos, a bola faz a curva e entra."],
  danilo: ["Danilo domina, espera o goleiro cair e toca. Zidanilo!"],
  zenon: ["Zenon cobra falta com perfeição. Camisa 10 é isso."],
  ricardinho: ["Ricardinho tabela, recebe de volta e finaliza com categoria."],
  chicao: ["Chicão bate o pênalti com a frieza de sempre. Gol!"],
};

const COR_SITUATION: Record<Situation, string[]> = {
  abre: ["O Timão sai na frente!", "Abre o placar!", "Primeiro gol é nosso!"],
  empata: ["Tudo igual!", "O Timão busca o empate!", "Placar empatado de novo!", "Buscou!"],
  vira: ["VIRADA DO TIMÃO!", "Era derrota, agora é vitória!", "Que virada!"],
  desempata: ["O Timão volta a ficar na frente!", "De novo na frente!"],
  amplia: ["O Timão amplia!", "Agora é festa na arquibancada.", "Dá pra respirar!", "Mais um!", "Tá virando passeio!"],
  desconta: ["Diminui a diferença!", "Ainda dá tempo?", "A esperança voltou.", "Tem jogo!"],
};

const OPP_GOAL: Line[] = [
  (c) => `Gol ${c.doOpp}.`,
  (c) => `${c.OOpp} chega pela direita, cruza e o atacante completa. Gol.`,
  (c) => `Bobeira na saída de bola e ${c.oOpp} não perdoa.`,
  (c) => `Chute de fora da área, a bola desvia e engana ${c.gk}. Gol ${c.doOpp}.`,
  (c) => `Escanteio, ninguém sobe com o atacante, e ${c.oOpp} marca.`,
  (c) => `Pênalti ${c.proOpp}... Convertido.`,
  (c) => `${c.gk} até toca na bola, mas não evita o gol ${c.doOpp}.`,
  (c) => `Falta perigosa... ${c.OOpp} cobra no canto. Gol.`,
  (c) => `Erro de marcação de ${c.def} e ${c.oOpp} aproveita.`,
  (c) => `Jogada individual pela esquerda e gol ${c.doOpp}.`,
  (c) => `Cabeçada no ângulo. Gol ${c.doOpp}, ${c.gk} não tinha o que fazer.`,
  (c) => `Contra-ataque rápido ${c.doOpp} e bola na rede.`,
  (c) => `Chute despretensioso, ${c.gk} aceita. Gol ${c.doOpp}.`,
  (c) =>
    c.home
      ? `Gol ${c.doOpp}. Silêncio ${c.venueIn}.`
      : `A torcida da casa explode: gol ${c.doOpp}.`,
];

const OPP_SITUATION: Record<Situation, Line[]> = {
  abre: [(c) => `${c.OOpp} sai na frente.`, () => "Saiu o primeiro, e não foi nosso.", (c) => `${c.OOpp} abre o placar.`],
  empata: [() => "Tudo igual.", () => "Lá se vai a vantagem.", (c) => `${c.OOpp} empata.`],
  vira: [(c) => `Virada ${c.doOpp}!`, () => "Era vitória, agora é derrota."],
  desempata: [(c) => `${c.OOpp} passa à frente de novo.`, () => "Lá vamos nós atrás outra vez."],
  amplia: [() => "Ficou difícil.", () => "A Fiel começa a deixar o estádio.", () => "Que noite ruim.", (c) => `${c.OOpp} amplia.`],
  desconta: [() => "Desconta.", () => "Ainda é vantagem do Timão, mas o jogo esquentou."],
};

// Gols contra no "destino".
const OWN_GOAL: Line[] = [
  (c) => `Gol contra bizarro de ${c.def}. A bola desvia na canela e entra.`,
  (c) => `${c.def} tenta afastar, pega mal e manda contra o próprio gol.`,
  (c) => `Recuo de ${c.def} sem olhar... a bola passa por ${c.gk} e entra. Inacreditável.`,
  (c) => `${c.gk} solta a bola nos pés de ${c.def}, que chuta contra a própria rede.`,
  (c) => `Cruzamento despretensioso, ${c.def} desvia de cabeça e encobre ${c.gk}. Gol contra.`,
  (c) => `A bola bate nas costas de ${c.def} e entra devagarinho. Ninguém acredita.`,
];

// Lances do "destino" quando o resultado precisa piorar.
const DRAMA: Line[] = [
  (c) => `VAR anula gol de ${c.star} por um impedimento milimétrico.`,
  (c) => `Pênalti para o Timão! ${c.star} bate... e isola.`,
  (c) => `${c.star} sente a coxa e sai de maca.`,
  () => "Apagão no estádio. Jogo parado por 14 minutos.",
  (c) => `${c.star} chuta, a bola bate nas duas traves e sai.`,
  () => "O VAR chama o árbitro para revisar um lance no meio-campo. Ninguém sabe qual.",
  (c) => `${c.star} sai cara a cara... e escorrega sozinho.`,
  () => "Um cachorro invade o campo e para o jogo justo no melhor momento do Timão.",
  (c) => `O árbitro marca falta de ${c.star} num lance em que ele nem tocou no adversário.`,
  (c) => `${c.gk} sai jogando e a bola quica num buraco do gramado.`,
  (c) => `Gol de ${c.star}! ... O bandeirinha levanta a bandeira. Anulado.`,
  (c) => `A bola de ${c.star} ia entrar, mas bate no árbitro e sai.`,
  (c) => `Pênalti claro em ${c.star}. O árbitro manda seguir. O VAR concorda.`,
  (c) => `${c.def2} é expulso por segundo amarelo num lance que ninguém viu.`,
  () => "Começa a chover granizo. Só em cima da área do Timão.",
  (c) => `${c.star} perde um gol embaixo da trave. Sem goleiro.`,
  () => "O impedimento semiautomático trava. Na dúvida, contra o Corinthians.",
  (c) => `${c.mid} acerta o travessão de cabeça. A bola sobe, sobe... e cai fora.`,
  () => "Um torcedor joga um rolo de papel higiênico. Jogo parado, o Timão esfria.",
  (c) => `O goleiro ${c.doOpp} pega tudo. Até o que não dava pra pegar.`,
];

const STOPPAGE: ((s: number) => string)[] = [
  (s) => `O árbitro dá ${s} minutos de acréscimo. Ninguém entende de onde.`,
  (s) => `Placa de acréscimo: ${s} minutos. A Fiel olha pro céu.`,
  (s) => `${s} minutos de acréscimo. O quarto árbitro confere duas vezes.`,
  (s) => `Acréscimo de ${s} minutos “pela cera”, diz o árbitro. Ninguém fez cera.`,
  (s) => `O relógio do estádio quebra. O árbitro, por garantia, dá ${s} minutos.`,
];

const FLAVOR: Line[] = [
  () => "A Fiel canta: “Aqui tem um bando de louco!”",
  () => "“Vai, Corinthians!” ecoa pelo estádio.",
  () => "Jogo truncado no meio-campo.",
  () => "Bola na trave! Quase!",
  (c) => `Cartão amarelo para ${c.def} por reclamação.`,
  () => "O técnico pede calma à beira do campo.",
  () => "Chuva forte cai sobre o gramado.",
  (c) => `${c.star} arrisca de fora. Pra fora, mas assustou.`,
  (c) => `${c.gk} faz um milagre no chute à queima-roupa!`,
  (c) => `${c.OOpp} assusta numa bola parada, mas ${c.gk} segura firme.`,
  (c) => `${c.mid} enfia uma bola linda, mas o atacante chega atrasado.`,
  (c) => `Cabeçada de ${c.def} rente à trave.`,
  (c) => `Amarelo pra um jogador ${c.doOpp} depois de falta dura em ${c.star}.`,
  () => "O Timão adianta a marcação e encurta os espaços.",
  (c) => `${c.OOpp} troca passes e tenta esfriar o jogo.`,
  () => "Muita disputa física e pouca criação neste momento.",
  () => "Calor forte: o árbitro para o jogo pra hidratação.",
  () => "O vento atrapalha os lançamentos longos.",
  (c) => `${c.star} pede a bola e a Fiel grita o nome dele.`,
  () => "Bola na rede pelo lado de fora. Teve gente comemorando.",
  () => "VAR checa um possível pênalti... nada marcado.",
  (c) => `${c.def} faz um corte providencial em cima da linha!`,
  (c) => `Contra-ataque ${c.doOpp} parado com falta. Amarelo pro Timão.`,
  (c) => `${c.mid} tenta o passe de calcanhar e a torcida reclama.`,
  (c) =>
    c.home
      ? "A arquibancada inteira pula junto. O estádio treme."
      : "A torcida da casa vaia cada toque do Corinthians.",
  () => "Lance perigoso na área do Timão, mas a zaga afasta.",
];

// Lances de lendas em campo (sem gol).
const LEGEND_FLAVOR: Record<string, string[]> = {
  socrates: ["Sócrates organiza o time com toques de calcanhar."],
  rivellino: ["Rivellino tenta o elástico na lateral e a torcida vai ao delírio."],
  ronaldo: ["Ronaldo pede a bola e três marcadores vão nele ao mesmo tempo."],
  cassio: ["Cássio voa no ângulo e espalma! Lembrou Yokohama."],
  gylmar: ["Gylmar sai do gol com segurança e fica com a bola. Paredão."],
  dida: ["Dida defende o pênalti! Paredão!"],
  gamarra: ["Gamarra desarma limpo, sem falta. Como sempre."],
  tevez: ["Tevez dá carrinho no campo de defesa. A Fiel aplaude de pé."],
  marcelinho: ["Marcelinho cobra escanteio fechado. Quase olímpico!"],
  "ze-maria": ["Zé Maria apoia pela direita com o fôlego de sempre. Super Zé!"],
  wladimir: ["Wladimir fecha o lado esquerdo. Por ali, ninguém passa."],
  rincon: ["Rincón dá um carrinho preciso e sai jogando de cabeça erguida."],
  vampeta: ["Vampeta provoca o adversário e ganha a dividida."],
  "domingos-da-guia": ["Domingos da Guia sai jogando com elegância. O Divino Mestre!"],
};

const LEGEND_GENERIC: ((n: string) => string)[] = [
  (n) => `${n} recebe aplausos a cada toque na bola.`,
  (n) => `Os adversários parecem não acreditar que estão marcando ${n}.`,
  (n) => `${n} conversa com os mais novos e ajeita o posicionamento.`,
];

const HALFTIME: Record<"win" | "draw" | "loss", string[]> = {
  win: [
    "O Timão vai pro vestiário com vantagem.",
    "Aplausos no intervalo.",
    "Primeiro tempo sólido. Agora é segurar.",
    "A Fiel canta durante todo o intervalo.",
  ],
  draw: [
    "Tudo igual no intervalo.",
    "Jogo aberto pro segundo tempo.",
    "Muito nervosismo nas arquibancadas.",
    "Precisa de mais no segundo tempo.",
  ],
  loss: [
    "Vaias no intervalo.",
    "O técnico vai ter trabalho no vestiário.",
    "A torcida cobra raça.",
    "Ainda há 45 minutos pra reagir.",
  ],
};

const FINAL: Record<"win" | "draw" | "loss" | "fate", string[]> = {
  win: [
    "Fim de jogo! Vitória do Timão!",
    "Apita o árbitro: três pontos pro Corinthians!",
    "Acabou! A Fiel faz a festa.",
    "Fim de jogo! Respira, Fiel.",
  ],
  draw: [
    "Fim de jogo. Empate.",
    "Acabou em empate. Um ponto que pode valer muito... ou nada.",
    "Fim de papo. Cada um com um ponto.",
  ],
  loss: [
    "Fim de jogo. Derrota do Corinthians.",
    "Acabou. A Fiel deixa o estádio em silêncio.",
    "Fim de jogo. A situação complica.",
  ],
  fate: [
    "Fim de jogo. Ninguém entende como isso aconteceu.",
    "Acabou. O destino parece ter escolhido um lado.",
    "Fim de jogo. Os jogadores saem olhando pro céu.",
    "Acabou. Até a torcida adversária ficou com pena.",
  ],
};

// ---------- montagem da partida ----------

function article(teamId: string) {
  const name = TEAM_BY_ID[teamId].name;
  const fem = teamId === "cha";
  return {
    oOpp: `${fem ? "a" : "o"} ${name}`,
    OOpp: `${fem ? "A" : "O"} ${name}`,
    doOpp: `${fem ? "da" : "do"} ${name}`,
    proOpp: `${fem ? "pra" : "pro"} ${name}`,
  };
}

function weightedScorer(lineup: Record<string, Player>): Player {
  const weight: Record<string, number> = { ATA: 4, MEI: 2.4, VOL: 1.1, ZAG: 0.5, LD: 0.5, LE: 0.5, GOL: 0 };
  const players = Object.values(lineup);
  const scored = players.map((p) => weight[p.pos] * Math.max(1, p.rating - 60) * (p.legend ? 1.4 : 1));
  let r = Math.random() * scored.reduce((a, b) => a + b, 0);
  for (let i = 0; i < players.length; i++) {
    r -= scored[i];
    if (r <= 0) return players[i];
  }
  return players[0];
}

function situation(forBefore: number, againstBefore: number, wasBehind: boolean): Situation {
  const after = forBefore + 1;
  if (forBefore === 0 && againstBefore === 0) return "abre";
  if (after === againstBefore) return "empata";
  if (forBefore === againstBefore) return wasBehind ? "vira" : "desempata";
  if (after > againstBefore) return "amplia";
  return "desconta";
}

function twoDefenders(lineup: Record<string, Player>) {
  const defenders = Object.values(lineup)
    .filter((p) => ["ZAG", "LD", "LE"].includes(p.pos))
    .sort(() => Math.random() - 0.5);
  return { def: defenders[0].name, def2: defenders[1].name };
}

export type NarrateInput = {
  corGoals: number;
  oppGoals: number;
  home: boolean;
  opponentId: string;
  venueIn: string;
  lineup: Record<string, Player>;
  /** O destino piorou o resultado: gols rivais no fim e lances bizarros. */
  fate: boolean;
  /** Frases já usadas na campanha (é atualizado aqui). */
  used: Set<string>;
};

export function narrate(input: NarrateInput): { events: MatchEvent[]; finalMinute: number } {
  const { corGoals, oppGoals, home, opponentId, venueIn, lineup, fate } = input;
  const picker = new Picker(input.used);
  const outfield = Object.values(lineup).filter((p) => p.pos !== "GOL");
  const star = [...outfield].sort((a, b) => b.rating - a.rating)[0];
  const ctx: Ctx = {
    home,
    venueIn,
    ...article(opponentId),
    star: star.name,
    gk: Object.values(lineup).find((p) => p.pos === "GOL")!.name,
    ...twoDefenders(lineup),
    mid: pickOne(Object.values(lineup).filter((p) => ["MEI", "VOL"].includes(p.pos))).name,
  };

  const stoppage = fate ? rand(7, 11) : rand(2, 5);
  const finalMinute = 90 + stoppage;

  // No "destino", o Timão abre vantagem cedo e os gols rivais vêm no fim.
  const goals = [
    ...Array.from({ length: corGoals }, () => ({ cor: true, minute: fate ? rand(4, 70) : rand(2, 89) })),
    ...Array.from({ length: oppGoals }, () => ({ cor: false, minute: fate ? rand(74, finalMinute) : rand(2, 89) })),
  ].sort((a, b) => a.minute - b.minute);
  // Dois gols nunca no mesmo minuto, e nenhum depois do apito final.
  for (let i = 1; i < goals.length; i++) {
    if (goals[i].minute <= goals[i - 1].minute) goals[i].minute = goals[i - 1].minute + 1;
  }
  for (let i = goals.length - 1; i >= 0; i--) {
    const limit = i === goals.length - 1 ? finalMinute - 1 : goals[i + 1].minute - 1;
    goals[i].minute = Math.min(goals[i].minute, limit);
  }

  const events: MatchEvent[] = [];
  let cor = 0;
  let opp = 0;
  let corWasBehind = false;
  let oppWasBehind = false;
  let ownGoalUsed = false;
  for (const g of goals) {
    if (g.cor) {
      const sit = situation(cor, opp, corWasBehind);
      const scorer = weightedScorer(lineup);
      const special = LEGEND_GOAL[scorer.id];
      let text: string;
      if (special && Math.random() < 0.6) text = picker.text(`legend-goal:${scorer.id}`, special);
      else if (["ZAG", "LD", "LE"].includes(scorer.pos) && Math.random() < 0.6)
        text = picker.pick("defender-goal", DEFENDER_GOAL.map((f) => () => f(scorer.name)), ctx);
      else text = picker.pick("cor-goal", COR_GOAL.map((f) => () => f(scorer.name)), ctx);
      events.push({
        minute: g.minute,
        kind: "goal-cor",
        text: `${text} ${picker.text(`cor-sit:${sit}`, COR_SITUATION[sit])}`,
      });
      cor++;
    } else {
      const sit = situation(opp, cor, oppWasBehind);
      let text: string;
      if (fate && !ownGoalUsed && g.minute >= 80) {
        ownGoalUsed = true;
        text = picker.pick("own-goal", OWN_GOAL, ctx);
      } else {
        text = picker.pick("opp-goal", OPP_GOAL, ctx);
      }
      events.push({
        minute: g.minute,
        kind: "goal-opp",
        text: `${text} ${picker.pick(`opp-sit:${sit}`, OPP_SITUATION[sit], ctx)}`,
      });
      opp++;
    }
    if (cor < opp) corWasBehind = true;
    if (opp < cor) oppWasBehind = true;
  }

  const taken = new Set(events.map((e) => e.minute));
  const freeMinute = (min: number, max: number) => {
    for (let i = 0; i < 20; i++) {
      const m = rand(min, max);
      if (!taken.has(m) && m !== 45) {
        taken.add(m);
        return m;
      }
    }
    return rand(min, max);
  };

  // Lances sem gol: 2 a 4, e um de lenda se houver alguma em campo.
  const flavorCount = fate ? rand(1, 2) : rand(2, 4);
  for (let i = 0; i < flavorCount; i++) {
    events.push({ minute: freeMinute(5, 86), kind: "info", text: picker.pick("flavor", FLAVOR, ctx) });
  }
  const legends = Object.values(lineup).filter((p) => p.legend);
  if (legends.length && Math.random() < 0.8) {
    const legend = pickOne(legends);
    const own = LEGEND_FLAVOR[legend.id];
    const text =
      own && Math.random() < 0.6
        ? picker.text(`legend-flavor:${legend.id}`, own)
        : picker.pick("legend-generic", LEGEND_GENERIC.map((f) => () => f(legend.name)), ctx);
    events.push({ minute: freeMinute(8, 80), kind: "info", text });
  }

  if (fate) {
    for (let i = 0; i < 2; i++) {
      events.push({ minute: freeMinute(70, 89), kind: "drama", text: picker.pick("drama", DRAMA, ctx) });
    }
    events.push({
      minute: 90,
      kind: "drama",
      text: picker.pick("stoppage", STOPPAGE.map((f) => () => f(stoppage)), ctx),
    });
  }

  // Intervalo com o placar parcial.
  const htCor = goals.filter((g) => g.cor && g.minute <= 45).length;
  const htOpp = goals.filter((g) => !g.cor && g.minute <= 45).length;
  const oppName = TEAM_BY_ID[opponentId].name;
  const score = home
    ? `Corinthians ${htCor} x ${htOpp} ${oppName}`
    : `${oppName} ${htOpp} x ${htCor} Corinthians`;
  const htState = htCor > htOpp ? "win" : htCor === htOpp ? "draw" : "loss";
  events.push({
    minute: 45,
    kind: "info",
    text: `Fim do 1º tempo: ${score}. ${picker.text(`halftime:${htState}`, HALFTIME[htState])}`,
  });

  events.sort((a, b) => a.minute - b.minute);
  events.unshift({
    minute: 0,
    kind: "info",
    text: picker.pick(home ? "kickoff-home" : "kickoff-away", home ? KICKOFF_HOME : KICKOFF_AWAY, ctx),
  });
  const finalState = fate && corGoals <= oppGoals ? "fate" : corGoals > oppGoals ? "win" : corGoals === oppGoals ? "draw" : "loss";
  events.push({ minute: finalMinute, kind: "info", text: picker.text(`final:${finalState}`, FINAL[finalState]) });
  return { events, finalMinute };
}
