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
  'Burst mage', 'Juggernaut', 'Marksman', 'Tank', 'Assassin', 'Skirmisher', 'Utility caster',
  'Control mage', 'Frontline bruiser', 'Engage control', 'Burst carry', 'Support specialist'
];
const itemPool = [
  'Riftmaker', 'Kraken Slayer', 'Black Cleaver', 'Galeforce', 'Divine Sunderer', "Luden's Tempest",
  "Liandry's Anguish", 'Plated Steelcaps', 'Trinity Force', 'Blade of the Ruined King'
];
const runePool = [
  'Sorcery + Inspiration', 'Precision + Resolve', 'Resolve + Precision', 'Sorcery + Domination',
  'Precision + Domination', 'Resolve + Domination'
];
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

function buildRecentMatches(seed: number, championName: string) {
  return Array.from({ length: 4 }, (_, index) => {
    const result = resultPool[(seed + index) % resultPool.length];
    const queue = queuePool[(seed + index * 2) % queuePool.length];
    const date = datePool[(seed + index + championName.length) % datePool.length];
    const kda = [
      `${7 + ((seed + index) % 5)} / ${2 + ((seed + index * 2) % 5)} / ${8 + ((seed + index * 3) % 7)}`,
      `${9 + ((seed + index) % 3)} / ${3 + ((seed + index * 2) % 4)} / ${11 + ((seed + index * 4) % 6)}`,
      `${5 + ((seed + index + 2) % 6)} / ${6 + ((seed + index * 3) % 5)} / ${7 + ((seed + index * 2) % 8)}`,
    ][index % 3];
    const lp = result === 'Victory' ? `+${12 + ((seed + index * 3) % 16)}` : `-${6 + ((seed + index * 2) % 10)}`;

    return {
      queue,
      result,
      kda,
      lp,
      date,
    };
  });
}

function createChampionProfile(name: string, index: number) {
  const seed = hashString(name + index.toString());
  const roles = championRoles.get(name);
  if (!roles) {
    throw new Error(`Champion role data is missing for ${name}`);
  }
  const tagline = taglinePool[(seed + index) % taglinePool.length];
  const initial = name
    .split(/\s+|['&.-]/)
    .filter(Boolean)
    .map((part: string) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) || 'C';

  const winRate = 43 + ((seed + index) % 27) + ((index % 5) * 0.7);
  const pickRate = 8 + ((seed + 3) % 28) + ((index % 4) * 0.9);
  const counterScore = 4 + ((seed + index) % 15);
  const kda = `${(4.5 + ((seed + index) % 6)).toFixed(1)} / ${(2.2 + ((seed + index * 2) % 5)).toFixed(1)} / ${(6.2 + ((seed + index * 3) % 7)).toFixed(1)}`;

  const matchupSummary = [
    { label: 'Early game', value: 50 + ((seed + 4) % 40) },
    { label: 'Teamfight', value: 55 + ((seed + 9) % 38) },
    { label: 'Objective control', value: 45 + ((seed + 13) % 42) },
    { label: 'Scaling', value: 40 + ((seed + 17) % 50) },
  ];

  const buildPriorities = [
    `First item: ${itemPool[(seed + 1) % itemPool.length]}`,
    `Core skill order: ${['Q > E > W', 'Q > W > E', 'E > Q > W', 'W > Q > E'][(seed + index) % 4]}`,
    `Rune tier: ${runePool[(seed + index) % runePool.length]}`,
    `Best lane pressure: ${['side lane with roaming support', 'objective control and rotations', 'all-in on extended trades', 'pacing through wave clear'][((seed + index * 2) % 4)]}`,
  ];

  return {
    id: slugifyChampionName(name),
    name,
    roles,
    tagline,
    initial,
    winRate: Number(winRate.toFixed(1)),
    pickRate: Number(pickRate.toFixed(1)),
    kda,
    counterScore,
    matchupSummary,
    buildPriorities,
    recentMatches: buildRecentMatches(seed, name),
    trend: [
      35 + ((seed + 1) % 18),
      37 + ((seed + 3) % 22),
      45 + ((seed + 5) % 20),
      49 + ((seed + 7) % 24),
      56 + ((seed + 9) % 26),
      61 + ((seed + 11) % 26),
      66 + ((seed + 13) % 24),
    ],
  };
}

const championProfiles = championNames.map(createChampionProfile);

type DataDragonChampion = {
  name: string;
  image: {
    full: string;
  };
};

type DataDragonChampionResponse = {
  data: Record<string, DataDragonChampion>;
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

function ChampionAnalysis() {
  const [selectedChampionId, setSelectedChampionId] = useState(championProfiles[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [championImages, setChampionImages] = useState<Record<string, string>>({});
  const [imageError, setImageError] = useState('');
  const [missingImageCount, setMissingImageCount] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);

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

        const namesByNormalizedName = new Map<string, string>();
        for (const champion of Object.values(championData.data)) {
          namesByNormalizedName.set(
            champion.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
            champion.image.full,
          );
        }
        const imageNames: Record<string, string> = {};
        for (const name of championNames) {
          const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const imageName =
            namesByNormalizedName.get(normalizedName) ??
            (name === 'Wukong' ? 'MonkeyKing.png' : undefined);
          if (imageName) {
            imageNames[name] =
              `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${imageName}`;
          }
        }

        if (isCurrent) {
          setChampionImages(imageNames);
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
        </nav>

        <Link className='champion-analysis-back' to='/profile'>
          <ArrowBackRounded /> Profile
        </Link>
      </header>

      <main className='champion-analysis-main' id='overview'>
        <section className='champion-directory-panel'>
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
                    {selectedChampion.roles.join(' · ')} · {selectedChampion.tagline} · {selectedChampion.pickRate}% pick rate
                  </p>
                </div>
              </div>

              <div className='champion-trend' id='trend'>
                <div className='trend-header'>
                  <span>Win rate trend</span>
                  <strong>
                    <TrendingUpRounded /> {selectedChampion.winRate}%
                  </strong>
                </div>

                <div className='trend-bars' aria-label='Recent win rate trend'>
                  {selectedChampion.trend.map((value, index) => (
                    <span key={`${selectedChampion.id}-${index}`} style={{ height: `${value}%` }} />
                  ))}
                </div>
              </div>
            </div>

            <section className='analysis-metrics-grid' aria-label='Champion metrics'>
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
              </section>

              <section className='analysis-panel' id='builds'>
                <div className='panel-header'>
                  <div>
                    <span className='panel-eyebrow'>BUILD PRIORITIES</span>
                    <h2>Recommended setup</h2>
                  </div>
                </div>

                <div className='build-card'>
                  <div className='build-row'>
                    <span className='build-label'>Starter</span>
                    <strong>Doran's Ring</strong>
                  </div>
                  <div className='build-row'>
                    <span className='build-label'>Core</span>
                    <strong>{selectedChampion.buildPriorities[0].replace('First item: ', '')}</strong>
                  </div>
                  <div className='build-row'>
                    <span className='build-label'>Boots</span>
                    <strong>Ionian Boots of Lucidity</strong>
                  </div>
                </div>

                <ul className='analysis-list'>
                  {selectedChampion.buildPriorities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>

            <section className='analysis-panel performance-panel'>
              <div className='panel-header'>
                <div>
                  <span className='panel-eyebrow'>RECENT RESULTS</span>
                  <h2>Latest performances</h2>
                </div>
              </div>

              <div className='performance-table'>
                <div className='performance-head'>
                  <span>Queue</span>
                  <span>Result</span>
                  <span>KDA</span>
                  <span>LP</span>
                  <span>Date</span>
                </div>

                {selectedChampion.recentMatches.map((match) => (
                  <div key={`${selectedChampion.id}-${match.date}-${match.queue}`} className='performance-row'>
                    <span>{match.queue}</span>
                    <span className={match.result === 'Victory' ? 'result-win' : 'result-loss'}>{match.result}</span>
                    <span>{match.kda}</span>
                    <span className={match.lp.startsWith('+') ? 'lp-gain' : 'lp-loss'}>{match.lp}</span>
                    <span>{match.date}</span>
                  </div>
                ))}
              </div>
            </section>
          </section>
        </section>
      </main>
    </div>
  );
}

export default ChampionAnalysis;
