// Dados do jogo "Missão Permanência". Tabela, jogos restantes e elenco são
// os reais do Brasileirão 2026 (até 11/10/2026); overalls são inventados.

export type Sector = "defesa" | "meio" | "ataque";
export type Position = "GOL" | "LD" | "ZAG" | "LE" | "VOL" | "MEI" | "ATA";

export type Player = {
  id: string;
  name: string;
  // Nome curto para o campinho.
  short?: string;
  pos: Position;
  rating: number;
  legend?: boolean;
  tagline?: string;
};

export type Team = {
  id: string;
  name: string;
  short: string;
  color: string;
  overall: number;
};

export type Standing = {
  teamId: string;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
};

export type Slot = {
  id: string;
  sector: Sector;
  pos: Position;
  // Posição no campo, em %, com o ataque para cima.
  x: number;
  y: number;
};

export const COR_ID = "cor";
export const FIRST_ROUND = 31;
export const LAST_ROUND = 38;
export const RELEGATION_SPOTS = 4;
export const STANDINGS_DATE = "11/10/2026";

// Overalls são fictícios; nomes e tabela são reais.
export const TEAMS: Team[] = [
  { id: "fla", name: "Flamengo", short: "FLA", color: "#c8102e", overall: 83 },
  { id: "pal", name: "Palmeiras", short: "PAL", color: "#0b7a3e", overall: 83 },
  { id: "flu", name: "Fluminense", short: "FLU", color: "#8a2346", overall: 78 },
  { id: "cap", name: "Athletico-PR", short: "CAP", color: "#991b1b", overall: 78 },
  { id: "bah", name: "Bahia", short: "BAH", color: "#1d4ed8", overall: 77 },
  { id: "cru", name: "Cruzeiro", short: "CRU", color: "#2f4fa2", overall: 77 },
  { id: "cam", name: "Atlético-MG", short: "CAM", color: "#a1a1aa", overall: 77 },
  { id: "san", name: "Santos", short: "SAN", color: "#f5f5f5", overall: 75 },
  { id: "spa", name: "São Paulo", short: "SAO", color: "#dc2626", overall: 75 },
  { id: "ctb", name: "Coritiba", short: "CFC", color: "#15803d", overall: 73 },
  { id: "rbb", name: "Bragantino", short: "RBB", color: "#e11d48", overall: 74 },
  { id: "vit", name: "Vitória", short: "VIT", color: "#ef4444", overall: 72 },
  { id: "bot", name: "Botafogo", short: "BOT", color: "#d4d4d8", overall: 75 },
  { id: "vas", name: "Vasco", short: "VAS", color: "#a3a3a3", overall: 74 },
  { id: "mir", name: "Mirassol", short: "MIR", color: "#facc15", overall: 72 },
  { id: "cor", name: "Corinthians", short: "COR", color: "#ffffff", overall: 75 },
  { id: "int", name: "Internacional", short: "INT", color: "#b91c1c", overall: 74 },
  { id: "gre", name: "Grêmio", short: "GRE", color: "#0ea5e9", overall: 73 },
  { id: "rem", name: "Remo", short: "REM", color: "#1e3a8a", overall: 70 },
  { id: "cha", name: "Chapecoense", short: "CHA", color: "#22c55e", overall: 67 },
];

export const TEAM_BY_ID: Record<string, Team> = Object.fromEntries(
  TEAMS.map((t) => [t.id, t])
);

// Classificação real, com os jogos disputados até 11/10/2026.
export const INITIAL_STANDINGS: Standing[] = [
  { teamId: "fla", w: 19, d: 7, l: 4, gf: 58, ga: 25 },
  { teamId: "pal", w: 18, d: 9, l: 3, gf: 52, ga: 22 },
  { teamId: "flu", w: 14, d: 9, l: 7, gf: 48, ga: 37 },
  { teamId: "cap", w: 14, d: 8, l: 7, gf: 45, ga: 34 },
  { teamId: "bah", w: 13, d: 10, l: 7, gf: 44, ga: 36 },
  { teamId: "cru", w: 14, d: 6, l: 9, gf: 44, ga: 40 },
  { teamId: "cam", w: 13, d: 8, l: 9, gf: 41, ga: 35 },
  { teamId: "san", w: 11, d: 9, l: 10, gf: 46, ga: 45 },
  { teamId: "spa", w: 11, d: 6, l: 13, gf: 35, ga: 35 },
  { teamId: "ctb", w: 10, d: 8, l: 11, gf: 37, ga: 47 },
  { teamId: "rbb", w: 10, d: 7, l: 12, gf: 34, ga: 33 },
  { teamId: "vit", w: 10, d: 6, l: 14, gf: 33, ga: 44 },
  { teamId: "bot", w: 9, d: 8, l: 12, gf: 42, ga: 47 },
  { teamId: "vas", w: 9, d: 8, l: 12, gf: 36, ga: 42 },
  { teamId: "mir", w: 8, d: 9, l: 13, gf: 34, ga: 44 },
  { teamId: "cor", w: 8, d: 8, l: 14, gf: 31, ga: 38 },
  { teamId: "int", w: 7, d: 11, l: 12, gf: 33, ga: 38 },
  { teamId: "gre", w: 7, d: 10, l: 13, gf: 32, ga: 40 },
  { teamId: "rem", w: 5, d: 10, l: 15, gf: 33, ga: 48 },
  { teamId: "cha", w: 3, d: 9, l: 16, gf: 29, ga: 57 },
];

export type Round = {
  dates: string;
  // Jogo do Corinthians: data e estádio.
  corDate: string;
  venue: string;
  // "na Neo Química Arena", "no Morumbis" — para a narração.
  venueIn: string;
  matches: [home: string, away: string][];
  // Jogos adiados de rodadas anteriores, simulados junto com esta rodada.
  late?: [home: string, away: string][];
};

// Rodadas 31 a 38 conforme a tabela da CBF (datas sujeitas a alteração).
export const ROUNDS: Round[] = [
  {
    dates: "16 a 19/10",
    corDate: "seg, 19/10",
    venue: "Neo Química Arena",
    venueIn: "na Neo Química Arena",
    matches: [
      ["cor", "vit"], ["mir", "int"], ["bot", "cha"], ["cam", "ctb"], ["cap", "pal"],
      ["spa", "vas"], ["flu", "san"], ["gre", "cru"], ["bah", "fla"], ["rem", "rbb"],
    ],
    late: [["cha", "vas"]],
  },
  {
    dates: "23 a 26/10",
    corDate: "sáb, 24/10",
    venue: "São Januário",
    venueIn: "em São Januário",
    matches: [
      ["vas", "cor"], ["cru", "rem"], ["mir", "spa"], ["int", "bot"], ["vit", "cap"],
      ["pal", "rbb"], ["cha", "flu"], ["san", "bah"], ["ctb", "gre"], ["fla", "cam"],
    ],
    late: [["ctb", "bot"]],
  },
  {
    dates: "28 a 30/10",
    corDate: "sex, 30/10",
    venue: "Neo Química Arena",
    venueIn: "na Neo Química Arena",
    matches: [
      ["cor", "mir"], ["flu", "int"], ["san", "pal"], ["rbb", "cha"], ["bah", "spa"],
      ["rem", "bot"], ["cam", "cru"], ["ctb", "vit"], ["vas", "fla"], ["gre", "cap"],
    ],
    late: [["rbb", "cru"]],
  },
  {
    dates: "02 a 06/11",
    corDate: "qua, 04/11",
    venue: "Morumbis",
    venueIn: "no Morumbis",
    matches: [
      ["spa", "cor"], ["rbb", "san"], ["cha", "mir"], ["int", "ctb"], ["fla", "gre"],
      ["cap", "vas"], ["bot", "cam"], ["pal", "rem"], ["cru", "bah"], ["vit", "flu"],
    ],
    late: [["cha", "cap"]],
  },
  {
    dates: "18 e 19/11",
    corDate: "qua, 18/11",
    venue: "Neo Química Arena",
    venueIn: "na Neo Química Arena",
    matches: [
      ["cor", "bot"], ["fla", "cap"], ["vas", "int"], ["spa", "flu"], ["mir", "cam"],
      ["cru", "pal"], ["gre", "bah"], ["ctb", "san"], ["vit", "rbb"], ["rem", "cha"],
    ],
  },
  {
    dates: "21 a 23/11",
    corDate: "dom, 22/11",
    venue: "Arena MRV",
    venueIn: "na Arena MRV",
    matches: [
      ["cam", "cor"], ["flu", "mir"], ["bot", "spa"], ["san", "gre"], ["pal", "fla"],
      ["rbb", "vas"], ["int", "vit"], ["cap", "rem"], ["bah", "ctb"], ["cha", "cru"],
    ],
  },
  {
    dates: "28 e 29/11",
    corDate: "dom, 29/11",
    venue: "Neo Química Arena",
    venueIn: "na Neo Química Arena",
    matches: [
      ["cor", "gre"], ["flu", "cru"], ["bot", "bah"], ["spa", "rem"], ["mir", "cap"],
      ["cam", "vas"], ["int", "rbb"], ["ctb", "fla"], ["vit", "san"], ["cha", "pal"],
    ],
  },
  {
    dates: "02/12",
    corDate: "qua, 02/12",
    venue: "Baenão",
    venueIn: "no Baenão",
    matches: [
      ["rem", "cor"], ["fla", "cha"], ["vas", "vit"], ["san", "bot"], ["pal", "ctb"],
      ["rbb", "flu"], ["cru", "int"], ["gre", "mir"], ["cap", "spa"], ["bah", "cam"],
    ],
  },
];

// 4-3-3, com o ataque para cima.
export const SLOTS: Slot[] = [
  { id: "a1", sector: "ataque", pos: "ATA", x: 20, y: 17 },
  { id: "a2", sector: "ataque", pos: "ATA", x: 50, y: 12 },
  { id: "a3", sector: "ataque", pos: "ATA", x: 80, y: 17 },
  { id: "m1", sector: "meio", pos: "MEI", x: 24, y: 42 },
  { id: "m2", sector: "meio", pos: "VOL", x: 50, y: 49 },
  { id: "m3", sector: "meio", pos: "MEI", x: 76, y: 42 },
  { id: "lb", sector: "defesa", pos: "LE", x: 12, y: 68 },
  { id: "cb1", sector: "defesa", pos: "ZAG", x: 37, y: 73 },
  { id: "cb2", sector: "defesa", pos: "ZAG", x: 63, y: 73 },
  { id: "rb", sector: "defesa", pos: "LD", x: 88, y: 68 },
  { id: "gk", sector: "defesa", pos: "GOL", x: 50, y: 89 },
];

// Base: escalação contra o Palmeiras (11/10/2026), com a volta de
// Garro e Kaio César, que cumpriram suspensão. Overalls fictícios.
export const STARTERS: Record<string, Player> = {
  gk: { id: "hugo-souza", name: "Hugo Souza", pos: "GOL", rating: 78 },
  rb: { id: "matheuzinho", name: "Matheuzinho", pos: "LD", rating: 73 },
  cb1: { id: "gabriel-paulista", name: "Gabriel Paulista", short: "G. Paulista", pos: "ZAG", rating: 73 },
  cb2: { id: "gustavo-henrique", name: "Gustavo Henrique", short: "G. Henrique", pos: "ZAG", rating: 72 },
  lb: { id: "matheus-bidu", name: "Matheus Bidu", short: "Bidu", pos: "LE", rating: 70 },
  m1: { id: "breno-bidon", name: "Breno Bidon", short: "Bidon", pos: "MEI", rating: 75 },
  m2: { id: "raniele", name: "Raniele", pos: "VOL", rating: 72 },
  m3: { id: "garro", name: "Rodrigo Garro", short: "Garro", pos: "MEI", rating: 77 },
  a1: { id: "kaio-cesar", name: "Kaio César", pos: "ATA", rating: 73 },
  a2: { id: "yuri-alberto", name: "Yuri Alberto", short: "Yuri", pos: "ATA", rating: 76 },
  a3: { id: "memphis", name: "Memphis Depay", short: "Memphis", pos: "ATA", rating: 80 },
};

const legend = (
  id: string,
  name: string,
  pos: Position,
  rating: number,
  tagline: string,
  short?: string
): Player => ({ id, name, short, pos, rating, tagline, legend: true });

export const LEGENDS: Record<Sector, Player[]> = {
  defesa: [
    legend("cassio", "Cássio", "GOL", 90, "Herói do Mundial de 2012"),
    legend("gylmar", "Gylmar", "GOL", 91, "Paredão dos anos 50"),
    legend("ronaldo-giovanelli", "Ronaldo Giovanelli", "GOL", 86, "Goleiro do título de 1990", "Ronaldo G."),
    legend("dida", "Dida", "GOL", 89, "Campeão do Mundial de 2000"),
    legend("ze-maria", "Zé Maria", "LD", 89, "O Super Zé"),
    legend("alessandro", "Alessandro", "LD", 83, "Capitão da Libertadores 2012"),
    legend("fagner", "Fagner", "LD", 84, "Campeão brasileiro em 2015 e 2017"),
    legend("wladimir", "Wladimir", "LE", 87, "Recordista de jogos pelo clube"),
    legend("fabio-santos", "Fábio Santos", "LE", 84, "Lateral do Mundial de 2012", "F. Santos"),
    legend("gamarra", "Gamarra", "ZAG", 90, "O zagueiro que não fazia falta"),
    legend("domingos-da-guia", "Domingos da Guia", "ZAG", 91, "O Divino Mestre", "Domingos"),
    legend("chicao", "Chicão", "ZAG", 84, "Campeão da Libertadores 2012"),
    legend("paulo-andre", "Paulo André", "ZAG", 83, "Zagueiro do Mundial de 2012", "P. André"),
    legend("gil", "Gil", "ZAG", 84, "Xerife do título de 2015"),
    legend("balbuena", "Balbuena", "ZAG", 85, "Muralha paraguaia de 2017"),
  ],
  meio: [
    legend("socrates", "Sócrates", "MEI", 96, "Doutor da Democracia Corinthiana"),
    legend("rivellino", "Rivellino", "MEI", 95, "O Reizinho do Parque"),
    legend("marcelinho", "Marcelinho Carioca", "MEI", 91, "O Pé de Anjo", "Marcelinho"),
    legend("neto", "Neto", "MEI", 89, "Xodó da Fiel, campeão de 1990"),
    legend("ricardinho", "Ricardinho", "MEI", 88, "Cérebro do Mundial de 2000"),
    legend("rincon", "Freddy Rincón", "VOL", 89, "Capitão do Mundial de 2000", "Rincón"),
    legend("vampeta", "Vampeta", "VOL", 87, "Volante do bi brasileiro 98/99"),
    legend("paulinho", "Paulinho", "VOL", 88, "Motor do time de 2012"),
    legend("ralf", "Ralf", "VOL", 85, "Incansável de 2012"),
    legend("elias", "Elias", "VOL", 85, "Campeão brasileiro de 2015"),
    legend("renato-augusto", "Renato Augusto", "MEI", 87, "Maestro do título de 2015", "R. Augusto"),
    legend("danilo", "Danilo", "MEI", 86, "O Zidanilo"),
    legend("jadson", "Jadson", "MEI", 85, "Meia do título de 2015"),
    legend("biro-biro", "Biro-Biro", "VOL", 84, "Raça da Democracia Corinthiana"),
    legend("zenon", "Zenon", "MEI", 86, "Camisa 10 do bi paulista 82/83"),
  ],
  ataque: [
    legend("ronaldo", "Ronaldo Fenômeno", "ATA", 95, "O Fenômeno de 2009", "Ronaldo"),
    legend("tevez", "Carlitos Tevez", "ATA", 92, "Craque do Brasileirão 2005", "Tevez"),
    legend("claudio", "Cláudio", "ATA", 89, "Maior artilheiro da história do clube"),
    legend("baltazar", "Baltazar", "ATA", 88, "O Cabecinha de Ouro"),
    legend("teleco", "Teleco", "ATA", 88, "Artilheiro dos anos 30 e 40"),
    legend("edilson", "Edílson", "ATA", 89, "O Capetinha do Mundial de 2000"),
    legend("luizao", "Luizão", "ATA", 88, "Artilheiro da Libertadores 2000"),
    legend("casagrande", "Casagrande", "ATA", 87, "Centroavante da Democracia"),
    legend("viola", "Viola", "ATA", 86, "Gol do título paulista de 1988"),
    legend("sheik", "Emerson Sheik", "ATA", 86, "Herói da final da Libertadores 2012", "Sheik"),
    legend("guerrero", "Paolo Guerrero", "ATA", 87, "Gol do título Mundial de 2012", "Guerrero"),
    legend("liedson", "Liedson", "ATA", 85, "O Levezinho de 2011"),
    legend("jo", "Jô", "ATA", 84, "Artilheiro do título de 2017"),
  ],
};

export const SECTOR_LABEL: Record<Sector, string> = {
  defesa: "Defesa",
  meio: "Meio-campo",
  ataque: "Ataque",
};
