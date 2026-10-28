import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './ChampionAnalysis.css';

const championNames = [
  'Aatrox', 'Ahri', 'Akali', 'Akshan', 'Alistar', 'Ambessa', 'Amumu', 'Anivia', 'Annie', 'Aphelios',
  'Ashe', 'Aurelion Sol', 'Azir', 'Bard', "Bel'Veth", 'Blitzcrank', 'Brand', 'Braum', 'Briar',
  'Caitlyn', 'Camille', 'Cassiopeia', "Cho'Gath", 'Corki', 'Darius', 'Diana', 'Dr. Mundo', 'Draven',
  'Ekko', 'Elise', 'Evelynn', 'Ezreal', 'Fiddlesticks', 'Fiora', 'Fizz', 'Galio', 'Gangplank', 'Garen',
  'Gnar', 'Gragas', 'Graves', 'Gwen', 'Hecarim', 'Heimerdinger', 'Hwei', 'Illaoi', 'Irelia', 'Ivern',
  'Janna', 'Jarvan IV', 'Jax', 'Jayce', 'Jhin', 'Jinx', "K'Sante", "Kai'Sa", 'Kalista', 'Karma',
  'Karthus', 'Kassadin', 'Katarina', 'Kayle', 'Kayn', 'Kennen', "Kha'Zix", 'Kindred', 'Kled',
  "Kog'Maw", 'LeBlanc', 'Lee Sin', 'Leona', 'Lillia', 'Lissandra', 'Lucian', 'Lulu', 'Lux',
  'Malphite', 'Malzahar', 'Maokai', 'Master Yi', 'Milio', 'Miss Fortune', 'Mordekaiser', 'Morgana',
  'Naafiri', 'Nami', 'Nasus', 'Nautilus', 'Neeko', 'Nidalee', 'Nilah', 'Nocturne', 'Nunu & Willump',
  'Olaf', 'Orianna', 'Ornn', 'Pantheon', 'Poppy', 'Pyke', 'Qiyana', 'Quinn', 'Rakan', 'Rammus',
  "Rek'Sai", 'Rell', 'Renata Glasc', 'Renekton', 'Rengar', 'Riven', 'Rumble', 'Ryze', 'Samira',
  'Sejuani', 'Senna', 'Seraphine', 'Sett', 'Shaco', 'Shen', 'Shyvana', 'Singed', 'Sion', 'Sivir',
  'Skarner', 'Sona', 'Soraka', 'Swain', 'Sylas', 'Syndra', 'Tahm Kench', 'Taliyah', 'Talon', 'Taric',
  'Teemo', 'Thresh', 'Tristana', 'Trundle', 'Tryndamere', 'Twisted Fate', 'Twitch', 'Udyr', 'Urgot',
  'Varus', 'Vayne', 'Veigar', "Vel'Koz", 'Vex', 'Vi', 'Viego', 'Viktor', 'Vladimir', 'Volibear', 'Warwick',
  'Wukong', 'Xayah', 'Xerath', 'Xin Zhao', 'Yasuo', 'Yone', 'Yorick', 'Yuumi', 'Zac', 'Zed', 'Zeri',
  'Ziggs', 'Zilean', 'Zoe', 'Zyra'
];

const championRoleGroups: Record<string, string[]> = {
  'Top lane': [
    'Aatrox', 'Akali', 'Akshan', 'Ambessa', 'Camille', 'Cassiopeia', "Cho'Gath",
    'Darius', 'Diana', 'Dr. Mundo', 'Fiora', 'Gangplank', 'Garen', 'Gnar', 'Gragas',
    'Gwen', 'Heimerdinger', 'Illaoi', 'Irelia', 'Jax', 'Jayce', "K'Sante", 'Kayle',
    'Kennen', 'Kled', 'Lillia', 'Malphite', 'Maokai', 'Mordekaiser', 'Nasus',
    'Olaf', 'Ornn', 'Pantheon', 'Poppy', 'Quinn', 'Renekton', 'Rengar', 'Riven',
    'Rumble', 'Ryze', 'Sett', 'Shen', 'Singed', 'Sion', 'Skarner', 'Sylas',
    'Tahm Kench', 'Teemo', 'Trundle', 'Tryndamere', 'Udyr', 'Urgot', 'Vayne',
    'Vladimir', 'Volibear', 'Warwick', 'Wukong', 'Yasuo', 'Yone', 'Yorick', 'Zac',
  ],
  Jungle: [
    'Amumu', 'Bel\'Veth', 'Brand', 'Briar', 'Diana', 'Ekko', 'Elise', 'Evelynn',
    'Fiddlesticks', 'Gragas', 'Graves', 'Hecarim', 'Ivern', 'Jarvan IV', 'Jax',
    'Karthus', 'Kayn', "Kha'Zix", 'Kindred', 'Lee Sin', 'Lillia', 'Maokai',
    'Master Yi', 'Nidalee', 'Nocturne', 'Nunu & Willump', 'Olaf', 'Poppy',
    'Rammus', "Rek'Sai", 'Rengar', 'Sejuani', 'Shaco', 'Shyvana', 'Skarner',
    'Taliyah', 'Trundle', 'Udyr', 'Vi', 'Viego', 'Volibear', 'Warwick', 'Wukong',
    'Xin Zhao', 'Zac',
  ],
  'Mid lane': [
    'Ahri', 'Akali', 'Akshan', 'Anivia', 'Annie', 'Aurelion Sol', 'Azir', 'Brand',
    'Cassiopeia', 'Corki', 'Diana', 'Ekko', 'Fizz', 'Galio', 'Gragas', 'Heimerdinger',
    'Hwei', 'Irelia', 'Jayce', 'Kassadin', 'Katarina', 'Kayle', 'LeBlanc', 'Lissandra',
    'Lucian', 'Lux', 'Malzahar', 'Naafiri', 'Neeko', 'Orianna', 'Pantheon', 'Qiyana',
    'Ryze', 'Swain', 'Sylas', 'Syndra', 'Taliyah', 'Talon', 'Tristana', 'Twisted Fate',
    'Veigar', "Vel'Koz", 'Vex', 'Viktor', 'Vladimir', 'Xerath', 'Yasuo', 'Yone',
    'Zed', 'Ziggs', 'Zilean', 'Zoe',
  ],
  'Bot lane': [
    'Aphelios', 'Ashe', 'Caitlyn', 'Corki', 'Draven', 'Ezreal', 'Jhin', 'Jinx',
    "Kai'Sa", 'Kalista', "Kog'Maw", 'Lucian', 'Miss Fortune', 'Nilah', 'Samira',
    'Senna', 'Seraphine', 'Sivir', 'Swain', 'Tristana', 'Twitch', 'Varus', 'Vayne',
    'Veigar', 'Xayah', 'Yasuo', 'Zeri', 'Ziggs',
  ],
  Support: [
    'Alistar', 'Amumu', 'Annie', 'Bard', 'Blitzcrank', 'Brand', 'Braum', 'Galio',
    'Heimerdinger', 'Janna', 'Karma', 'Leona', 'Lulu', 'Lux', 'Maokai', 'Milio',
    'Morgana', 'Nami', 'Nautilus', 'Neeko', 'Pantheon', 'Poppy', 'Pyke', 'Rakan',
    'Rell', 'Renata Glasc', 'Senna', 'Seraphine', 'Shaco', 'Sona', 'Soraka', 'Swain',
    'Tahm Kench', 'Taric', 'Thresh', 'Vel\'Koz', 'Xerath', 'Yuumi', 'Zyra',
  ],
};
type ChampionRole = keyof typeof championRoleGroups;

const championRoles = new Map<string, ChampionRole[]>();
for (const [role, names] of Object.entries(championRoleGroups) as [
  ChampionRole,
  string[],
][]) {
  for (const name of names) {
    const roles = championRoles.get(name) ?? [];
    roles.push(role);
    championRoles.set(name, roles);
  }
}

const missingChampionRoles = championNames.filter(
  (name) => !championRoles.has(name),
);
if (missingChampionRoles.length > 0) {
  throw new Error(
    `Champion role data is missing for: ${missingChampionRoles.join(', ')}`,
  );
}

const taglinePool = [
  'Burst mage', 'Juggernaut', 'Marksman', 'Tank', 'Assassin', 'Skirmisher',
  'Utility caster', 'Control mage', 'Frontline bruiser', 'Engage control',
  'Burst carry', 'Support specialist',
];
const itemPool = [
  'Riftmaker', 'Kraken Slayer', 'Black Cleaver', 'Galeforce',
  'Divine Sunderer', "Luden's Tempest", "Liandry's Anguish",
  'Plated Steelcaps', 'Trinity Force', 'Blade of the Ruined King',
];
const runePool = [
  'Sorcery + Inspiration', 'Precision + Resolve', 'Resolve + Precision',
  'Sorcery + Domination', 'Precision + Domination', 'Resolve + Domination',
];
const roleRuneRecommendations: Record<ChampionRole, {
  primary: { tree: string; keystone: string; runes: string[] };
  secondary: { tree: string; runes: string[] };
  shards: string[];
}> = {
  'Top lane': {
    primary: { tree: 'Precision', keystone: 'Conqueror', runes: ['Triumph', 'Legend: Haste', 'Last Stand'] },
    secondary: { tree: 'Resolve', runes: ['Second Wind', 'Overgrowth'] },
    shards: ['Attack Speed', 'Adaptive Force', 'Health Scaling'],
  },
  Jungle: {
    primary: { tree: 'Precision', keystone: 'Conqueror', runes: ['Triumph', 'Legend: Alacrity', 'Coup de Grace'] },
    secondary: { tree: 'Domination', runes: ['Sudden Impact', 'Treasure Hunter'] },
    shards: ['Attack Speed', 'Adaptive Force', 'Health Scaling'],
  },
  'Mid lane': {
    primary: { tree: 'Sorcery', keystone: 'Arcane Comet', runes: ['Manaflow Band', 'Transcendence', 'Scorch'] },
    secondary: { tree: 'Domination', runes: ['Cheap Shot', 'Ultimate Hunter'] },
    shards: ['Adaptive Force', 'Adaptive Force', 'Health Scaling'],
  },
  'Bot lane': {
    primary: { tree: 'Precision', keystone: 'Press the Attack', runes: ['Presence of Mind', 'Legend: Alacrity', 'Cut Down'] },
    secondary: { tree: 'Sorcery', runes: ['Absolute Focus', 'Gathering Storm'] },
    shards: ['Attack Speed', 'Adaptive Force', 'Health Scaling'],
  },
  Support: {
    primary: { tree: 'Resolve', keystone: 'Guardian', runes: ['Font of Life', 'Bone Plating', 'Revitalize'] },
    secondary: { tree: 'Inspiration', runes: ['Biscuit Delivery', 'Cosmic Insight'] },
    shards: ['Ability Haste', 'Health', 'Health Scaling'],
  },
};
const roleSpellRecommendations: Record<ChampionRole, string[]> = {
  'Top lane': ['Flash', 'Teleport'],
  Jungle: ['Flash', 'Smite'],
  'Mid lane': ['Flash', 'Teleport'],
  'Bot lane': ['Flash', 'Heal'],
  Support: ['Flash', 'Exhaust'],
};
const roleSkillCombos: Record<ChampionRole, { name: string; sequence: string; purpose: string }[]> = {
  'Top lane': [
    { name: 'Short trade', sequence: 'Q → Basic Attack → E out', purpose: 'Trade briefly, then disengage.' },
    { name: 'All-in', sequence: 'E → Q → W → R', purpose: 'Commit when the opponent is low.' },
  ],
  Jungle: [
    { name: 'Gank', sequence: 'Approach → E → Q → W', purpose: 'Start with crowd control, then follow up.' },
    { name: 'Team fight', sequence: 'R → E → Q → W', purpose: 'Engage when allies can follow.' },
  ],
  'Mid lane': [
    { name: 'Poke', sequence: 'E → Q → W', purpose: 'Use range to soften the opponent.' },
    { name: 'All-in', sequence: 'W → E → Q → R', purpose: 'Look for a crowd-control setup.' },
  ],
  'Bot lane': [
    { name: 'Trade', sequence: 'Basic Attack → Q → Basic Attack', purpose: 'Add an ability between basic attacks.' },
    { name: 'All-in', sequence: 'E → Q → W → R', purpose: 'Follow your support’s engage.' },
  ],
  Support: [
    { name: 'Engage', sequence: 'W → Q → E → R', purpose: 'Lock down a target for your team.' },
    { name: 'Peel', sequence: 'Hold Q / E → R', purpose: 'Save crowd control for divers.' },
  ],
};
const resultPool = ['Victory', 'Defeat'];
const queuePool = ['Ranked', 'Draft', 'Normal', 'Elite'];
const datePool = ['Today', '2 days ago', '4 days ago', 'Last week'];

function slugifyChampionName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildSkillLevelOrder(maxOrder: string[]) {
  const skillRanks: Record<string, number> = { Q: 0, W: 0, E: 0 };
  return Array.from({ length: 18 }, (_, index) => {
    const level = index + 1;
    if ([6, 11, 16].includes(level)) return { level, skill: 'R' };
    const skill = level <= 3
      ? maxOrder[level - 1]
      : maxOrder.find((candidate) => skillRanks[candidate] < 5) ?? maxOrder[0];
    skillRanks[skill] += 1;
    return { level, skill };
  });
}

function buildRecentMatches(seed: number, championName: string) {
  return Array.from({ length: 4 }, (_, index) => {
    const result = resultPool[(seed + index) % resultPool.length];
    return {
      queue: queuePool[(seed + index * 2) % queuePool.length],
      result,
      date: datePool[(seed + index + championName.length) % datePool.length],
      kda: `${7 + ((seed + index) % 5)} / ${2 + ((seed + index * 2) % 5)} / ${8 + ((seed + index * 3) % 7)}`,
      lp: result === 'Victory'
        ? `+${12 + ((seed + index * 3) % 16)}`
        : `-${6 + ((seed + index * 2) % 10)}`,
    };
  });
}

function createChampionProfile(name: string) {
  const roles = championRoles.get(name);
  if (!roles) {
    throw new Error(`Champion role data is missing for ${name}`);
  }
  const initial = name
    .split(/\s+|['&.-]/)
    .filter(Boolean)
    .map((part: string) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) || 'C';

  const seed = hashString(name);
  const index = championNames.indexOf(name);
  const skillMaxOrder = ['Q > E > W', 'Q > W > E', 'E > Q > W', 'W > Q > E'][
    (seed + index) % 4
  ].split(' > ');
  const itemBuild = {
    starting: ["Doran's Ring", 'Health Potion'],
    boots: ['Ionian Boots of Lucidity'],
    core: [0, 1, 2].map((itemIndex) => itemPool[(seed + 1 + itemIndex * 2) % itemPool.length]),
  };

  return {
    id: slugifyChampionName(name),
    name,
    roles,
    initial,
    tagline: taglinePool[(seed + index) % taglinePool.length],
    winRate: Number((43 + ((seed + index) % 27) + ((index % 5) * 0.7)).toFixed(1)),
    pickRate: Number((8 + ((seed + 3) % 28) + ((index % 4) * 0.9)).toFixed(1)),
    kda: `${(4.5 + ((seed + index) % 6)).toFixed(1)} / ${(2.2 + ((seed + index * 2) % 5)).toFixed(1)} / ${(6.2 + ((seed + index * 3) % 7)).toFixed(1)}`,
    counterScore: 4 + ((seed + index) % 15),
    matchupSummary: [
      { label: 'Early game', value: 50 + ((seed + 4) % 40) },
      { label: 'Teamfight', value: 55 + ((seed + 9) % 38) },
      { label: 'Objective control', value: 45 + ((seed + 13) % 42) },
      { label: 'Scaling', value: 40 + ((seed + 17) % 50) },
    ],
    itemBuild,
    runeRecommendation: roleRuneRecommendations[roles[0]],
    recommendedSpells: roleSpellRecommendations[roles[0]],
    skillMaxOrder,
    skillLevelOrder: buildSkillLevelOrder(skillMaxOrder),
    skillCombos: roleSkillCombos[roles[0]],
    buildPriorities: [
      `First item: ${itemPool[(seed + 1) % itemPool.length]}`,
      `Core skill order: ${skillMaxOrder.join(' > ')}`,
      `Rune tier: ${runePool[(seed + index) % runePool.length]}`,
      `Best lane pressure: ${['side lane with roaming support', 'objective control and rotations', 'all-in on extended trades', 'pacing through wave clear'][(seed + index * 2) % 4]}`,
    ],
    recentMatches: buildRecentMatches(seed, name),
    trend: Array.from({ length: 7 }, (_, trendIndex) => 35 + ((seed + trendIndex * 2 + 1) % 35)),
  };
}

const championProfiles = championNames.map(createChampionProfile);

type DataDragonChampionStats = {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeed: number;
  attackspeedperlevel: number;
};

type DataDragonChampion = {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  lore: string;
  tags: string[];
  partype: string;
  info: {
    attack: number;
    defense: number;
    magic: number;
    difficulty: number;
  };
  stats: DataDragonChampionStats;
  image: {
    full: string;
  };
  allytips: string[];
  enemytips: string[];
  passive: {
    name: string;
    description: string;
    image: { full: string };
  };
  spells: {
    name: string;
    description: string;
    tooltip: string;
    cooldown: number[];
    cost: number[];
    range: number[];
    image: { full: string };
  }[];
  skins: DataDragonSkin[];
};

type DataDragonSkin = {
  name: string;
  num: number;
};

type DataDragonChampionResponse = {
  data: Record<string, Pick<DataDragonChampion, 'id' | 'name' | 'image'>>;
};

type DataDragonDetailResponse = {
  data: Record<string, DataDragonChampion>;
};

type DataDragonAssetResponse = {
  data: Record<string, { name: string; image: { full: string } }>;
};

function isDataDragonChampionResponse(
  value: unknown,
): value is DataDragonChampionResponse {
  if (typeof value !== 'object' || value === null || !('data' in value)) {
    return false;
  }

  const data = value.data;
  return (
    typeof data === 'object' &&
    data !== null &&
    Object.values(data).every(
      (champion) =>
        typeof champion === 'object' &&
        champion !== null &&
        'id' in champion &&
        typeof champion.id === 'string' &&
        'name' in champion &&
        typeof champion.name === 'string' &&
        'image' in champion &&
        typeof champion.image === 'object' &&
        champion.image !== null &&
        'full' in champion.image &&
        typeof champion.image.full === 'string',
    )
  );
}

function isDataDragonDetailResponse(value: unknown): value is DataDragonDetailResponse {
  if (typeof value !== 'object' || value === null || !('data' in value)) {
    return false;
  }

  const data = value.data;
  return (
    typeof data === 'object' &&
    data !== null &&
    Object.values(data).some(
      (champion) =>
        typeof champion === 'object' &&
        champion !== null &&
        'id' in champion &&
        typeof champion.id === 'string' &&
        'lore' in champion &&
        typeof champion.lore === 'string' &&
        'stats' in champion &&
        typeof champion.stats === 'object' &&
        champion.stats !== null &&
        'spells' in champion &&
        Array.isArray(champion.spells) &&
        'passive' in champion &&
        typeof champion.passive === 'object' &&
        champion.passive !== null &&
        'skins' in champion &&
        Array.isArray(champion.skins) &&
        champion.skins.every(
          (skin: unknown) =>
            typeof skin === 'object' &&
            skin !== null &&
            'name' in skin &&
            typeof skin.name === 'string' &&
            'num' in skin &&
            typeof skin.num === 'number',
        ),
    )
  );
}

function isDataDragonAssetResponse(value: unknown): value is DataDragonAssetResponse {
  if (typeof value !== 'object' || value === null || !('data' in value)) return false;
  const data = value.data;
  return typeof data === 'object' && data !== null &&
    Object.values(data).every((asset) =>
      typeof asset === 'object' && asset !== null &&
      'name' in asset && typeof asset.name === 'string' &&
      'image' in asset && typeof asset.image === 'object' &&
      asset.image !== null && 'full' in asset.image &&
      typeof asset.image.full === 'string',
    );
}

function plainText(value: string): string {
  const container = document.createElement('div');
  container.innerHTML = value;
  return container.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function normalizeRuneKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function ChampionAnalysis() {
  const [selectedChampionId, setSelectedChampionId] = useState(championProfiles[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [counterSearchTerm, setCounterSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [championImages, setChampionImages] = useState<Record<string, string>>({});
  const [championDataIds, setChampionDataIds] = useState<Record<string, string>>({});
  const [dataDragonVersion, setDataDragonVersion] = useState('');
  const [championDetails, setChampionDetails] = useState<DataDragonChampion | null>(null);
  const [detailsError, setDetailsError] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedSkinNumber, setSelectedSkinNumber] = useState<number | null>(null);
  const [failedSkinImageUrls, setFailedSkinImageUrls] = useState<string[]>([]);
  const [itemImages, setItemImages] = useState<Record<string, string>>({});
  const [spellImages, setSpellImages] = useState<Record<string, string>>({});
  const [runeImages, setRuneImages] = useState<Record<string, string>>({});
  const [runeTreeImages, setRuneTreeImages] = useState<Record<string, string>>({});
  const [imageError, setImageError] = useState('');
  const [missingImageCount, setMissingImageCount] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [failedItemImages, setFailedItemImages] = useState<string[]>([]);
  const [failedSpellImages, setFailedSpellImages] = useState<string[]>([]);

  useEffect(() => {
    let isCurrent = true;

    async function loadChampionImages() {
      try {
        const versionsResponse = await fetch(
          'https://ddragon.leagueoflegends.com/api/versions.json',
        );
        if (!versionsResponse.ok) {
          throw new Error(`Version request failed (${versionsResponse.status})`);
        }

        const versions: unknown = await versionsResponse.json();
        if (!Array.isArray(versions) || typeof versions[0] !== 'string') {
          throw new Error('Data Dragon returned an invalid version list');
        }

        const version = versions[0];
        if (isCurrent) {
          setDataDragonVersion(version);
        }
        const championsResponse = await fetch(
          `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
        );
        if (!championsResponse.ok) {
          throw new Error(`Champion image request failed (${championsResponse.status})`);
        }

        const championData: unknown = await championsResponse.json();
        if (!isDataDragonChampionResponse(championData)) {
          throw new Error('Data Dragon returned invalid champion image data');
        }

        const imagesByNormalizedId = new Map<string, string>();
        const idsByNormalizedName = new Map<string, string>();
        for (const champion of Object.values(championData.data)) {
          const normalizedName = champion.id.toLowerCase().replace(/[^a-z0-9]/g, '');
          imagesByNormalizedId.set(normalizedName, champion.image.full);
          idsByNormalizedName.set(normalizedName, champion.id);
        }
        const imageNames: Record<string, string> = {};
        const championIds: Record<string, string> = {};
        const dataIdsByGameName: Record<string, string> = {
          Wukong: 'MonkeyKing',
          'Nunu & Willump': 'Nunu',
          "Kai'Sa": 'Kaisa',
          "Cho'Gath": 'Chogath',
          "Kha'Zix": 'Khazix',
          "Kog'Maw": 'KogMaw',
          "Rek'Sai": 'RekSai',
          "Bel'Veth": 'Belveth',
          "Vel'Koz": 'Velkoz',
          "K'Sante": 'KSante',
          'Dr. Mundo': 'DrMundo',
          'Miss Fortune': 'MissFortune',
          'Jarvan IV': 'JarvanIV',
          'Master Yi': 'MasterYi',
          'Twisted Fate': 'TwistedFate',
          'Lee Sin': 'LeeSin',
          'Xin Zhao': 'XinZhao',
        };
        for (const name of championNames) {
          const normalizedName = (dataIdsByGameName[name] ?? name)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
          const imageName = imagesByNormalizedId.get(normalizedName);
          if (imageName) {
            imageNames[name] =
              `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${imageName}`;
          }
          const championDataId = idsByNormalizedName.get(normalizedName);
          if (championDataId) {
            championIds[name] = championDataId;
          }
        }

        for (const [endpoint, assetType] of [
          ['item.json', 'item'],
          ['summoner.json', 'spell'],
        ] as const) {
          try {
            const response = await fetch(
              `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/${endpoint}`,
            );
            if (!response.ok) throw new Error(`${assetType} request failed (${response.status})`);
            const value: unknown = await response.json();
            if (!isDataDragonAssetResponse(value)) {
              throw new Error(`Data Dragon returned invalid ${assetType} data`);
            }
            const images: Record<string, string> = {};
            for (const asset of Object.values(value.data)) {
              images[asset.name.toLowerCase()] =
                `https://ddragon.leagueoflegends.com/cdn/${version}/img/${assetType}/${asset.image.full}`;
            }
            if (isCurrent) {
              if (assetType === 'item') setItemImages(images);
              else setSpellImages(images);
            }
          } catch (error) {
            console.error(`Failed to load ${assetType} data from Data Dragon.`, error);
          }
        }

        try {
          const runesResponse = await fetch(
            `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`,
          );
          if (!runesResponse.ok) {
            throw new Error(`Rune request failed (${runesResponse.status})`);
          }

          const runesData: unknown = await runesResponse.json();
          if (!Array.isArray(runesData)) {
            throw new Error('Data Dragon returned invalid rune data');
          }

          const runesByName: Record<string, string> = {};
          const runeTreesByName: Record<string, string> = {};
          for (const tree of runesData) {
            if (typeof tree !== 'object' || tree === null || !('slots' in tree)) continue;
            const treeData = tree as {
              key?: string;
              name?: string;
              icon?: string;
              slots?: Array<{ runes?: Array<{ name?: string; icon?: string }> }>;
            };
            if (typeof treeData.name === 'string' && typeof treeData.icon === 'string') {
              runeTreesByName[normalizeRuneKey(treeData.name)] = `https://ddragon.leagueoflegends.com/cdn/img/${treeData.icon}`;
            }
            const slots = treeData.slots;
            if (!Array.isArray(slots)) continue;

            for (const slot of slots) {
              if (!slot || !Array.isArray(slot.runes)) continue;
              for (const rune of slot.runes) {
                if (!rune || typeof rune.name !== 'string' || typeof rune.icon !== 'string') continue;
                runesByName[normalizeRuneKey(rune.name)] = `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`;
              }
            }
          }

          if (isCurrent) {
            setRuneImages(runesByName);
            setRuneTreeImages(runeTreesByName);
          }
        } catch (error) {
          console.error('Failed to load rune images from Data Dragon.', error);
        }

        if (isCurrent) {
          setChampionImages(imageNames);
          setChampionDataIds(championIds);
          setMissingImageCount(championNames.length - Object.keys(imageNames).length);
          setImageError('');
        }
      } catch (error) {
        console.error('Failed to load champion images from Data Dragon.', error);
        if (isCurrent) {
          setImageError('Unable to load champion images. Please try again later.');
        }
      }
    }

    void loadChampionImages();

    return () => {
      isCurrent = false;
    };
  }, []);

  const roleFilters = useMemo(
    () => ['All', ...Object.keys(championRoleGroups)],
    [],
  );

  const filteredChampions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return championProfiles.filter((champion) => {
      const matchesSearch =
        !normalizedSearch || champion.name.toLowerCase().includes(normalizedSearch);
      const matchesRole =
        selectedRole === 'All' || champion.roles.includes(selectedRole);

      return matchesSearch && matchesRole;
    });
  }, [searchTerm, selectedRole]);

  const selectedChampion = useMemo(() => {
    const championFromSelection = championProfiles.find(
      (champion) => champion.id === selectedChampionId,
    );

    if (
      championFromSelection &&
      filteredChampions.some((champion) => champion.id === championFromSelection.id)
    ) {
      return championFromSelection;
    }

    return filteredChampions[0] ?? championProfiles[0];
  }, [filteredChampions, selectedChampionId]);
  const counterChampions = useMemo(() => {
    const normalizedCounterSearch = counterSearchTerm.trim().toLowerCase();

    const laneChampions = championProfiles.filter((champion) =>
      champion.id !== selectedChampion.id &&
      champion.roles.includes(selectedChampion.roles[0]),
    );

    const filtered = normalizedCounterSearch
      ? laneChampions.filter((champion) =>
        champion.name.toLowerCase().includes(normalizedCounterSearch),
      )
      : laneChampions;

    return filtered.slice(0, 20);
  }, [counterSearchTerm, selectedChampion.id, selectedChampion.roles]);
  const getSampleCounterWinRate = (championName: string) =>
    42 + (hashString(`${selectedChampion.name}:${championName}`) % 17);

  useEffect(() => {
    const championDataId = championDataIds[selectedChampion.name];
    if (!dataDragonVersion || !championDataId) return;

    const controller = new AbortController();
    async function loadChampionDetails() {
      setDetailsLoading(true);
      setDetailsError('');
      setChampionDetails(null);
      setSelectedSkinNumber(null);
      try {
        const response = await fetch(
          `https://ddragon.leagueoflegends.com/cdn/${dataDragonVersion}/data/en_US/champion/${championDataId}.json`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`Champion detail request failed (${response.status})`);
        }

        const value: unknown = await response.json();
        if (!isDataDragonDetailResponse(value)) {
          throw new Error('Data Dragon returned invalid champion detail data');
        }

        const championDetail = value.data[championDataId];
        if (!championDetail) {
          throw new Error(`Data Dragon did not return data for ${championDataId}`);
        }
        setChampionDetails(championDetail);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(`Failed to load ${selectedChampion.name} data from Data Dragon.`, error);
          setDetailsError('Unable to load champion details. Please try again later.');
        }
      } finally {
        if (!controller.signal.aborted) setDetailsLoading(false);
      }
    }

    void loadChampionDetails();
    return () => controller.abort();
  }, [championDataIds, dataDragonVersion, selectedChampion.name]);

  const selectedChampionDataId = championDataIds[selectedChampion.name];
  const skinsLoading = detailsLoading;
  const getSkinSplashUrl = (skinNumber: number) =>
    `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${selectedChampionDataId}_${skinNumber}.jpg`;
  const championSkins = championDetails?.skins ?? [];
  const availableChampionSkins = championSkins.filter(
    (skin) => !failedSkinImageUrls.includes(getSkinSplashUrl(skin.num)),
  );
  const selectedSkin =
    availableChampionSkins.find((skin) => skin.num === selectedSkinNumber) ??
    availableChampionSkins[0];
  return (
    <div className='champion-analysis-page'>
      <header className='champion-analysis-header'>
        <Link className='champion-analysis-brand' to='/' aria-label='LevelUp.gg home'>
          <span className='champion-analysis-brand-mark'>L</span>
          <span>
            LevelUp<span>.</span>gg
          </span>
        </Link>

        <nav className='champion-analysis-nav' aria-label='Champion analysis navigation'>
          <a className='selected' href='#overview'>Overview</a>
          <a href='#matchup'>Matchup</a>
          <a href='#builds'>Builds</a>
          <a href='#trend'>Trend</a>
          <a href='#abilities'>Abilities</a>
          <a href='#stats'>Stats</a>
          <a href='#skins'>Skins</a>
        </nav>

        <Link className='champion-analysis-back' to='/profile'>
          <ArrowBackRounded /> Profile
        </Link>
      </header>

      <main className='champion-analysis-main' id='overview'>
        <section className='champion-directory-panel'>
          <div className='champion-sidebar'>
            <aside className='champion-list-panel'>
              <div className='panel-header'>
                <div>
                  <span className='panel-eyebrow'>CHAMPION LIST</span>
                  <h2>Pick a champion</h2>
                </div>
              </div>

              <div className='champion-search-wrap'>
                <input
                  className='champion-search-input'
                  type='text'
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder='Search champion name'
                  aria-label='Search champion name'
                />
              </div>

              <div className='champion-filter-row' aria-label='Champion roles'>
                {roleFilters.map((role) => (
                  <button
                    key={role}
                    type='button'
                    className={`champion-filter-chip ${selectedRole === role ? 'selected' : ''}`}
                    onClick={() => setSelectedRole(role)}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <div className='champion-grid'>
                {imageError && (
                  <p className='champion-image-error' role='alert'>
                    {imageError}
                  </p>
                )}
                {!imageError && missingImageCount > 0 && (
                  <p className='champion-image-notice' role='status'>
                    {missingImageCount} champion images could not be found and are shown as initials.
                  </p>
                )}
                {filteredChampions.length > 0 ? (
                  filteredChampions.map((champion) => (
                    <button
                      key={champion.id}
                      type='button'
                      className={`champion-card ${selectedChampion.id === champion.id ? 'active' : ''}`}
                      onClick={() => setSelectedChampionId(champion.id)}
                    >
                      <div className='champion-card-header'>
                        {championImages[champion.name] &&
                        !failedImages.includes(champion.name) ? (
                          <img
                            className='champion-card-avatar'
                            src={championImages[champion.name]}
                            alt=''
                            loading='lazy'
                            onError={() =>
                              setFailedImages((previous) =>
                                previous.includes(champion.name)
                                  ? previous
                                  : [...previous, champion.name],
                              )
                            }
                          />
                        ) : (
                          <span className='champion-card-avatar'>
                            {champion.initial}
                          </span>
                        )}
                        <span className='champion-card-win'>{champion.winRate}%</span>
                      </div>

                      <div className='champion-card-body'>
                        <strong>{champion.name}</strong>
                        <small>{champion.roles.join(' · ')}</small>
                      </div>

                      <div className='champion-card-foot'>
                        <span>{champion.tagline}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className='champion-empty-state'>No champion found.</div>
                )}
              </div>
            </aside>

            <section className='analysis-panel champion-counter-panel' id='counters' aria-labelledby='champion-counter-heading'>
              <div className='panel-header'>
                <div>
                  <span className='panel-eyebrow'>SAME-LANE MATCHUPS</span>
                  <h2 id='champion-counter-heading'>Counter list · {selectedChampion.roles[0]}</h2>
                </div>
                <span className='rune-role-label'>{counterChampions.length} champions</span>
              </div>
              <p className='champion-counter-note'>
                Sample matchup rates for layout preview only; these are not real game statistics.
              </p>
              <div className='champion-counter-search-wrap'>
                <input
                  className='champion-search-input champion-counter-search-input'
                  type='text'
                  value={counterSearchTerm}
                  onChange={(event) => setCounterSearchTerm(event.target.value)}
                  placeholder='Search counter champion'
                  aria-label='Search counter champion'
                />
              </div>
              <ul className='champion-counter-list' aria-label={`${selectedChampion.roles[0]} champions`}>
                {counterChampions.length > 0 ? (
                  counterChampions.map((champion) => (
                    <li className={champion.id === selectedChampion.id ? 'selected' : ''} key={champion.id}>
                      {championImages[champion.name] && !failedImages.includes(champion.name) ? (
                        <img src={championImages[champion.name]} alt='' loading='lazy' />
                      ) : (
                        <span className='champion-counter-avatar'>{champion.initial}</span>
                      )}
                      <span>{champion.name}</span>
                      <strong className={`champion-counter-rate ${getSampleCounterWinRate(champion.name) < 50 ? 'below-average' : 'above-average'}`}>
                        {getSampleCounterWinRate(champion.name)}%
                      </strong>
                    </li>
                  ))
                ) : (
                  <li className='champion-counter-empty'>No matching champion found.</li>
                )}
              </ul>
            </section>
          </div>

          <section className='champion-detail-panel'>
            <div className='champion-hero-panel'>
              <div className='champion-identity'>
                {championImages[selectedChampion.name] &&
                !failedImages.includes(selectedChampion.name) ? (
                  <img
                    className='champion-avatar'
                    src={championImages[selectedChampion.name]}
                    alt={`${selectedChampion.name} champion`}
                    onError={() =>
                      setFailedImages((previous) =>
                        previous.includes(selectedChampion.name)
                          ? previous
                          : [...previous, selectedChampion.name],
                      )
                    }
                  />
                ) : (
                  <div className='champion-avatar'>{selectedChampion.initial}</div>
                )}
                <div>
                  <p className='analysis-kicker'>CHAMPION ANALYSIS</p>
                  <h1>{selectedChampion.name}</h1>
                  <p className='champion-subtitle'>
                    {championDetails
                      ? `${championDetails.title} · ${championDetails.tags.join(' · ')} · ${selectedChampion.pickRate}% pick rate`
                      : selectedChampion.roles.join(' · ')}
                  </p>
                </div>
              </div>

              <div className='champion-trend' id='trend'>
                <div className='trend-header'>
                  <span>Win rate trend</span>
                  <strong><TrendingUpRounded /> {selectedChampion.winRate}%</strong>
                </div>
                <div className='trend-bars' aria-label='Recent win rate trend'>
                  {selectedChampion.trend.map((value, index) => (
                    <span key={`${selectedChampion.id}-${index}`} style={{ height: `${value}%` }} />
                  ))}
                </div>
              </div>
            </div>

            <section className='analysis-metrics-grid' id='stats' aria-label='Champion metrics'>
              <article>
                <span>WIN RATE</span>
                <strong>{selectedChampion.winRate}%</strong>
                <p className='metric-positive'>↑ trending with recent form</p>
              </article>
              <article>
                <span>PICK RATE</span>
                <strong>{selectedChampion.pickRate}%</strong>
                <p>Flexible role fit</p>
              </article>
              <article>
                <span>AVERAGE KDA</span>
                <strong>{selectedChampion.kda.split(' / ')[0]}</strong>
                <p>{selectedChampion.kda}</p>
              </article>
              <article>
                <span>COUNTER SCORE</span>
                <strong>+{selectedChampion.counterScore}</strong>
                <p className='metric-positive'>Good matchup pressure</p>
              </article>
            </section>
            <p className='item-build-note champion-data-note'>
              Win rate, pick rate, KDA, matchup, build, rune, and match rows below are sample display data. Data Dragon does not provide live meta statistics.
            </p>

            <div className='analysis-content-grid'>
              <section className='analysis-panel' id='matchup'>
                <div className='panel-header'>
                  <div>
                    <span className='panel-eyebrow'>PLAYSTYLE</span>
                    <h2>Matchup profile</h2>
                  </div>
                </div>
                <div className='skill-bar-list'>
                  {selectedChampion.matchupSummary.map((item) => (
                    <div key={item.label} className='skill-row'>
                      <div className='skill-meta'>
                        <span>{item.label}</span>
                        <strong>{item.value}%</strong>
                      </div>
                      <div className='skill-track'>
                        <span style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <ul className='analysis-list'>
                  <li>Best lane pressure occurs when your team can force early vision and tempo before 12 minutes.</li>
                  <li>High-value timing windows appear around dragon fights and objective rotations.</li>
                  <li>Counterplay comes from controlling spacing and punishing bad engages.</li>
                </ul>
                <div className='recommendation-priorities'>
                  <span className='rune-path-name'>Enemy tips</span>
                  <ul className='analysis-list champion-tips-list'>
                    {championDetails?.enemytips.map((tip) => <li key={tip}>{tip}</li>)}
                    {championDetails && championDetails.enemytips.length === 0 && (
                      <li>No enemy tips are available in Data Dragon.</li>
                    )}
                  </ul>
                </div>
              </section>

              <section className='analysis-panel recommendation-card' id='recommendations'>
                <div className='panel-header'>
                  <div><span className='panel-eyebrow'>RECOMMENDED RUNES</span><h2>Runes & gameplay</h2></div>
                  <span className='rune-role-label'>{selectedChampion.roles[0]}</span>
                </div>
                <div className='rune-summary'>
                  <div className='rune-tree-card'>
                    <div className='rune-tree-header'>
                      {runeTreeImages[normalizeRuneKey(selectedChampion.runeRecommendation.primary.tree)] && (
                        <img
                          className='rune-tree-icon'
                          src={runeTreeImages[normalizeRuneKey(selectedChampion.runeRecommendation.primary.tree)]}
                          alt=''
                          loading='lazy'
                        />
                      )}
                      <span>{selectedChampion.runeRecommendation.primary.tree}</span>
                    </div>

                    <div className='rune-keystone-wrap'>
                      {runeImages[normalizeRuneKey(selectedChampion.runeRecommendation.primary.keystone)] && (
                        <img
                          className='rune-keystone-icon'
                          src={runeImages[normalizeRuneKey(selectedChampion.runeRecommendation.primary.keystone)]}
                          alt=''
                          loading='lazy'
                        />
                      )}
                      <div>
                        <span className='rune-slot-label'>Primary keystone</span>
                        <strong>{selectedChampion.runeRecommendation.primary.keystone}</strong>
                      </div>
                    </div>

                    <div className='rune-slot-list'>
                      {selectedChampion.runeRecommendation.primary.runes.map((rune) => (
                        <div className='rune-slot' key={rune}>
                          {runeImages[normalizeRuneKey(rune)] && (
                            <img className='rune-slot-icon' src={runeImages[normalizeRuneKey(rune)]} alt='' loading='lazy' />
                          )}
                          <span>{rune}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className='rune-tree-card'>
                    <div className='rune-tree-header'>
                      {runeTreeImages[normalizeRuneKey(selectedChampion.runeRecommendation.secondary.tree)] && (
                        <img
                          className='rune-tree-icon'
                          src={runeTreeImages[normalizeRuneKey(selectedChampion.runeRecommendation.secondary.tree)]}
                          alt=''
                          loading='lazy'
                        />
                      )}
                      <span>{selectedChampion.runeRecommendation.secondary.tree}</span>
                    </div>

                    <div className='rune-slot-list'>
                      {selectedChampion.runeRecommendation.secondary.runes.map((rune) => (
                        <div className='rune-slot' key={rune}>
                          {runeImages[normalizeRuneKey(rune)] && (
                            <img className='rune-slot-icon' src={runeImages[normalizeRuneKey(rune)]} alt='' loading='lazy' />
                          )}
                          <span>{rune}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className='rune-tree-card'>
                    <div className='rune-tree-header'>
                      <div className='rune-tree-badge'>✦</div>
                      <span>Stat shards</span>
                    </div>

                    <div className='rune-slot-list'>
                      {selectedChampion.runeRecommendation.shards.map((shard, index) => (
                        <div className='rune-slot' key={`${shard}-${index}`}>
                          {runeImages[normalizeRuneKey(shard)] && (
                            <img className='rune-slot-icon' src={runeImages[normalizeRuneKey(shard)]} alt='' loading='lazy' />
                          )}
                          <span>{shard}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className='recommendation-priorities'>
                  <span className='rune-path-name'>Gameplay tips</span>
                  <ul className='analysis-list'>{selectedChampion.buildPriorities.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <p className='rune-disclaimer'>Sample recommendations by primary role. Adjust for matchup and patch.</p>
              </section>

              <div className='spell-item-build-row'>
                <section className='analysis-panel spell-recommendation-panel' aria-labelledby='recommended-spells-heading'>
                  <div className='panel-header'>
                    <div>
                      <span className='panel-eyebrow'>SUMMONER SPELLS</span>
                      <h2 id='recommended-spells-heading'>Recommended spells</h2>
                    </div>
                    <span className='rune-role-label'>{selectedChampion.roles[0]}</span>
                  </div>
                  <div className='spell-recommendation-list'>
                    {selectedChampion.recommendedSpells.map((spellName) => (
                      <div className='spell-recommendation' key={spellName}>
                        {spellImages[spellName.toLowerCase()] &&
                        !failedSpellImages.includes(spellName) ? (
                          <img
                            className='spell-recommendation-icon'
                            src={spellImages[spellName.toLowerCase()]}
                            alt=''
                            loading='lazy'
                            onError={() => setFailedSpellImages((previous) =>
                              previous.includes(spellName) ? previous : [...previous, spellName],
                            )}
                          />
                        ) : (
                          <span className='spell-recommendation-icon spell-recommendation-fallback'>
                            {spellName.slice(0, 1)}
                          </span>
                        )}
                        <div>
                          <strong>{spellName}</strong>
                          <span>{spellName === 'Flash' ? 'Mobility / escape' : `Recommended for ${selectedChampion.roles[0]}`}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className='item-build-note'>Role-based sample recommendation. Adjust for champion and matchup.</p>
                </section>

                <section className='analysis-panel item-build-panel' id='builds'>
                <div className='panel-header'>
                  <div>
                    <span className='panel-eyebrow'>POPULAR BUILD</span>
                    <h2>Item build</h2>
                  </div>
                </div>
                <div className='item-build-sections'>
                  {[
                    { label: 'Starting items', items: selectedChampion.itemBuild.starting },
                    { label: 'Boots', items: selectedChampion.itemBuild.boots },
                    { label: 'Core build', items: selectedChampion.itemBuild.core },
                  ].map((section) => (
                    <section className='item-build-section' key={section.label}>
                      <h3>{section.label}</h3>
                      <div className='item-build-items'>
                        {section.items.map((itemName) => (
                          <div className='item-build-item' key={`${section.label}-${itemName}`}>
                            {itemImages[itemName.toLowerCase()] &&
                            !failedItemImages.includes(itemName) ? (
                              <img
                                className='item-build-icon'
                                src={itemImages[itemName.toLowerCase()]}
                                alt=''
                                loading='lazy'
                                onError={() => setFailedItemImages((previous) =>
                                  previous.includes(itemName) ? previous : [...previous, itemName],
                                )}
                              />
                            ) : (
                              <span className='item-build-icon item-build-fallback'>{itemName.slice(0, 1)}</span>
                            )}
                            <strong title={itemName}>{itemName}</strong>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
                <p className='item-build-note'>Sample build order · Adjust items for the match.</p>
                </section>
              </div>

                <section className='analysis-panel spell-recommendation-panel ability-details-panel'>
                  <div className='panel-header'>
                    <div>
                      <span className='panel-eyebrow'>ABILITIES</span>
                      <h2 id='spell-recommendation-heading'>{selectedChampion.name} abilities</h2>
                    </div>
                    <span className='rune-role-label'>Passive · Q · W · E · R</span>
                  </div>

                  <div className='spell-recommendation-list'>
                    {championDetails && [
                      {
                        key: 'P',
                        name: championDetails.passive.name,
                        description: championDetails.passive.description,
                        image: championDetails.passive.image.full,
                        metadata: '',
                      },
                      ...championDetails.spells.map((spell, index) => ({
                        key: ['Q', 'W', 'E', 'R'][index] ?? `Ability ${index + 1}`,
                        name: spell.name,
                        description: spell.description || spell.tooltip,
                        image: spell.image.full,
                        metadata: [
                          `Cooldown: ${spell.cooldown.join(' / ')} sec`,
                          `Cost: ${spell.cost.join(' / ')} ${championDetails.partype}`,
                          `Range: ${spell.range.join(' / ')}`,
                        ].join(' · '),
                      })),
                    ].map((ability) => (
                      <article className='spell-recommendation' key={ability.key}>
                        <img
                          className='spell-recommendation-icon'
                          src={`https://ddragon.leagueoflegends.com/cdn/${dataDragonVersion}/img/${ability.key === 'P' ? 'passive' : 'spell'}/${ability.image}`}
                          alt=''
                          loading='lazy'
                        />
                        <div>
                          <strong>{ability.key}: {ability.name}</strong>
                          <span>{plainText(ability.description)}</span>
                          {ability.metadata && <span>{ability.metadata}</span>}
                        </div>
                      </article>
                    ))}
                    {!championDetails && !detailsLoading && (
                      <p className='champion-skins-message'>
                        {detailsError || 'Ability information is not available.'}
                      </p>
                    )}
                  </div>
                  <p className='item-build-note'>Ability names and descriptions from Data Dragon (English).</p>
                </section>

                <section className='analysis-panel skill-order-panel' aria-labelledby='skill-order-heading'>
                    <div className='panel-header'>
                      <div>
                        <span className='panel-eyebrow'>ABILITY LEVELING</span>
                        <h2 id='skill-order-heading'>Skill order</h2>
                      </div>
                      <span className='rune-role-label'>{selectedChampion.roles[0]}</span>
                    </div>
                    <div className='skill-max-order'>
                      <span className='rune-path-name'>Max priority</span>
                      <strong>{selectedChampion.skillMaxOrder.join(' > ')}</strong>
                    </div>
                    <div className='skill-level-order' aria-label='Recommended skill level order from level 1 to 18'>
                      {selectedChampion.skillLevelOrder.map(({ level, skill }) => (
                        <div className={`skill-level-point skill-level-${skill.toLowerCase()}`} key={level} title={`Level ${level}: ${skill}`}>
                          <span>{level}</span><strong>{skill}</strong>
                        </div>
                      ))}
                    </div>
                    <div className='skill-combos'>
                      <span className='rune-path-name'>Skill combo examples</span>
                      {selectedChampion.skillCombos.map((combo) => (
                        <article className='skill-combo' key={combo.name}>
                          <div className='skill-combo-heading'><strong>{combo.name}</strong><span>{combo.sequence}</span></div>
                          <p>{combo.purpose}</p>
                        </article>
                      ))}
                    </div>
                    <p className='item-build-note'>R is leveled at 6, 11, and 16. Sample order; champion abilities may vary.</p>
                </section>

              <section className='analysis-panel skill-order-panel' aria-labelledby='combat-statistics-heading'>
                <div className='panel-header'>
                  <div>
                    <span className='panel-eyebrow'>BASE ATTRIBUTES</span>
                    <h2 id='combat-statistics-heading'>Combat statistics</h2>
                  </div>
                  <span className='rune-role-label'>{championDetails?.partype || '—'}</span>
                </div>
                <div className='champion-stat-list'>
                  {([
                    ['Health', `${championDetails?.stats.hp ?? '—'} (+${championDetails?.stats.hpperlevel ?? '—'} / level)`],
                    ['Attack damage', `${championDetails?.stats.attackdamage ?? '—'} (+${championDetails?.stats.attackdamageperlevel ?? '—'} / level)`],
                    ['Armor', `${championDetails?.stats.armor ?? '—'} (+${championDetails?.stats.armorperlevel ?? '—'} / level)`],
                    ['Attack range', `${championDetails?.stats.attackrange ?? '—'}`],
                    ['Mana / resource', `${championDetails?.stats.mp ?? '—'} (+${championDetails?.stats.mpperlevel ?? '—'} / level, ${championDetails?.partype ?? '—'})`],
                    ['Movement speed', `${championDetails?.stats.movespeed ?? '—'}`],
                    ['Magic resistance', `${championDetails?.stats.spellblock ?? '—'} (+${championDetails?.stats.spellblockperlevel ?? '—'} / level)`],
                    ['Health regeneration', `${championDetails?.stats.hpregen ?? '—'} (+${championDetails?.stats.hpregenperlevel ?? '—'} / level)`],
                    ['Resource regeneration', `${championDetails?.stats.mpregen ?? '—'} (+${championDetails?.stats.mpregenperlevel ?? '—'} / level)`],
                    ['Attack speed', `${championDetails?.stats.attackspeed ?? '—'} (+${championDetails?.stats.attackspeedperlevel ?? '—'}% / level)`],
                  ] as const).map(([label, value]) => (
                    <div className='champion-stat-row' key={label}>
                      <span>{label}</span>
                      <strong>{value ?? (detailsLoading ? '…' : '—')}</strong>
                    </div>
                  ))}
                </div>
                <p className='item-build-note'>
                  Base values are shown with per-level growth where provided by Data Dragon.
                </p>
              </section>

              <section className='analysis-panel recommendation-card'>
                <div className='panel-header'>
                  <div>
                    <span className='panel-eyebrow'>ALLY TIPS</span>
                    <h2>Playing {selectedChampion.name}</h2>
                  </div>
                  <span className='rune-role-label'>Data Dragon</span>
                </div>
                <ul className='analysis-list champion-tips-list'>
                  {championDetails?.allytips.map((tip) => <li key={tip}>{tip}</li>)}
                  {championDetails && championDetails.allytips.length === 0 && (
                    <li>No gameplay tips are available in Data Dragon.</li>
                  )}
                </ul>
              </section>

            </div>

            <p className='item-build-note champion-data-note'>
              Data Dragon provides static champion information, not win rates, pick rates, rune statistics, or recommended item builds.
            </p>

            <section className='champion-skins-panel' id='skins' aria-labelledby='champion-skins-heading'>
              <div className='champion-skins-header'>
                <div>
                  <span className='panel-eyebrow'>CHAMPION COSMETICS</span>
                  <h2 id='champion-skins-heading'>{selectedChampion.name} skins</h2>
                </div>
                {selectedSkin && (
                  <span className='champion-skin-count'>
                    {selectedSkin.num === 0 ? 'Classic' : `Skin ${selectedSkin.num}`}
                  </span>
                )}
              </div>

              {skinsLoading ? (
                <p className='champion-skins-message' role='status'>Loading skins…</p>
              ) : detailsError ? (
                <p className='champion-skins-message' role='alert'>{detailsError}</p>
              ) : selectedSkin ? (
                <>
                  <div className='champion-skin-feature'>
                    <img
                      src={getSkinSplashUrl(selectedSkin.num)}
                      alt={`${selectedChampion.name} — ${selectedSkin.name === 'default' ? 'Classic' : selectedSkin.name}`}
                      onError={() =>
                        setFailedSkinImageUrls((previous) =>
                          previous.includes(getSkinSplashUrl(selectedSkin.num))
                            ? previous
                            : [...previous, getSkinSplashUrl(selectedSkin.num)],
                        )
                      }
                    />
                    <span className='champion-skin-feature-name'>
                      {selectedSkin.name === 'default' ? 'Classic' : selectedSkin.name}
                    </span>
                  </div>

                  <div className='champion-skin-gallery' aria-label={`${selectedChampion.name} skins`}>
                    {availableChampionSkins.map((skin) => (
                      <button
                        className={`champion-skin-card ${selectedSkin.num === skin.num ? 'active' : ''}`}
                        key={skin.num}
                        type='button'
                        aria-pressed={selectedSkin.num === skin.num}
                        onClick={() => setSelectedSkinNumber(skin.num)}
                      >
                        <img
                          src={getSkinSplashUrl(skin.num)}
                          alt=''
                          loading='lazy'
                          onError={() =>
                            setFailedSkinImageUrls((previous) =>
                              previous.includes(getSkinSplashUrl(skin.num))
                                ? previous
                                : [...previous, getSkinSplashUrl(skin.num)],
                            )
                          }
                        />
                        <span>{skin.name === 'default' ? 'Classic' : skin.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className='champion-skins-message'>No skins are available for this champion.</p>
              )}
            </section>
          </section>
        </section>
      </main>
    </div>
  );
}

export default ChampionAnalysis;
