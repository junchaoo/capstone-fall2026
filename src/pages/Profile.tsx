import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Profile.css';

type JsonRecord = Record<string, unknown>;

type ProfileMatch = {
  champion: string;
  role: string;
  result: string;
  duration: string;
  kda: string;
  cs: string;
  won: boolean | null;
};

type ProfileChampion = {
  name: string;
  games: number;
  winRate: number | null;
  kda: number | null;
};

type ProfileData = {
  gameName: string;
  tagLine: string;
  wins: number | null;
  losses: number | null;
  winRate: number | null;
  averageKda: number | null;
  matches: ProfileMatch[];
  champions: ProfileChampion[];
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
  .replace(/\/+$/, '');

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function responseData(value: unknown): unknown {
  const record = asRecord(value);
  return record && 'data' in record ? record.data : value;
}

function firstValue(record: JsonRecord | null, keys: string[]): unknown {
  if (!record) return undefined;
  return keys.map((key) => record[key]).find((value) => value !== undefined);
}

function numericValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function metric(record: JsonRecord | null, keys: string[]): number | null {
  return numericValue(firstValue(record, keys));
}

function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${(value <= 1 ? value * 100 : value).toFixed(1)}%`;
}

function formatDuration(value: unknown): string {
  const seconds = numericValue(value);
  if (seconds === null) return '—';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function formatKda(kills: number | null, deaths: number | null, assists: number | null) {
  if (kills === null && deaths === null && assists === null) return '—';
  return `${kills ?? 0} / ${deaths ?? 0} / ${assists ?? 0}`;
}

function parseMatch(value: unknown): ProfileMatch | null {
  const outer = asRecord(responseData(value));
  const match = asRecord(outer?.match) ?? outer;
  if (!match) return null;

  const wonValue = firstValue(match, ['won', 'win', 'is_win', 'victory']);
  const won =
    typeof wonValue === 'boolean'
      ? wonValue
      : typeof wonValue === 'string'
        ? wonValue.toLowerCase() === 'win' || wonValue.toLowerCase() === 'victory'
          ? true
          : wonValue.toLowerCase() === 'loss' || wonValue.toLowerCase() === 'defeat'
            ? false
            : null
        : null;
  const kills = metric(match, ['kills', 'kill']);
  const deaths = metric(match, ['deaths', 'death']);
  const assists = metric(match, ['assists', 'assist']);
  const champion = firstValue(match, ['champion_name', 'championName', 'champion']);

  return {
    champion: typeof champion === 'string' ? champion : 'Unknown champion',
    role: String(firstValue(match, ['role', 'team_position', 'teamPosition', 'lane']) ?? '—'),
    result: won === null ? 'Match' : won ? 'Victory' : 'Defeat',
    duration: formatDuration(
      firstValue(match, ['game_duration', 'gameDuration', 'duration']),
    ),
    kda: formatKda(kills, deaths, assists),
    cs:
      metric(match, ['total_minions_killed', 'totalMinionsKilled', 'cs']) === null
        ? '—'
        : `${metric(match, ['total_minions_killed', 'totalMinionsKilled', 'cs'])} CS`,
    won,
  };
}

async function fetchJson(
  url: string,
  signal: AbortSignal,
  method: 'GET' | 'POST' = 'GET',
): Promise<unknown> {
  const response = await fetch(url, {
    method,
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      detail || `API request failed (${response.status} ${response.statusText})`,
    );
  }
  return response.status === 204 ? null : response.json();
}

function parseChampions(value: unknown): ProfileChampion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const champion = asRecord(entry);
    const name = firstValue(champion, ['champion_name', 'championName', 'name', 'champion']);
    if (!champion || typeof name !== 'string') return [];
    const games = metric(champion, ['games', 'games_played', 'gamesPlayed', 'count']) ?? 0;
    const winRate = metric(champion, ['win_rate', 'winRate', 'winrate']);
    const kda = metric(champion, ['average_kda', 'avg_kda', 'kda']);
    return [{ name, games, winRate, kda }];
  });
}

function deriveChampions(matches: ProfileMatch[]): ProfileChampion[] {
  const grouped = new Map<string, { games: number; wins: number; knownResults: number }>();
  for (const match of matches) {
    const stats = grouped.get(match.champion) ?? { games: 0, wins: 0, knownResults: 0 };
    stats.games += 1;
    if (match.won !== null) {
      stats.knownResults += 1;
      if (match.won) stats.wins += 1;
    }
    grouped.set(match.champion, stats);
  }
  return [...grouped.entries()]
    .map(([name, stats]) => ({
      name,
      games: stats.games,
      winRate: stats.knownResults ? stats.wins / stats.knownResults : null,
      kda: null,
    }))
    .sort((left, right) => right.games - left.games)
    .slice(0, 3);
}

async function loadProfile(
  gameName: string,
  tagLine: string,
  signal: AbortSignal,
): Promise<ProfileData> {
  const region = 'na1';
  const playerUrl = `${apiBaseUrl}/api/player/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const playerResponse = await fetchJson(playerUrl, signal);
  const playerData = asRecord(responseData(playerResponse));
  const puuid = playerData?.puuid;
  if (typeof puuid !== 'string' || !puuid) {
    throw new Error('Player lookup response did not include data.puuid.');
  }

  const encodedPuuid = encodeURIComponent(puuid);
  await fetchJson(
    `${apiBaseUrl}/api/matches/${region}/${encodedPuuid}/batch-cache?count=5`,
    signal,
    'POST',
  );

  const [analyticsResponse, matchesResponse] = await Promise.all([
    fetchJson(`${apiBaseUrl}/api/analytics/${encodedPuuid}`, signal),
    fetchJson(`${apiBaseUrl}/api/matches/${region}/${encodedPuuid}?count=5`, signal),
  ]);
  const analytics = asRecord(responseData(analyticsResponse));
  const matchListValue = responseData(matchesResponse);
  const matchList = Array.isArray(matchListValue)
    ? matchListValue
    : (() => {
        const record = asRecord(matchListValue);
        const value = firstValue(record, ['matches', 'match_ids', 'matchIds', 'ids']);
        return Array.isArray(value) ? value : [];
      })();
  const matchIds = matchList.flatMap((entry) => {
    if (typeof entry === 'string') return [entry];
    const id = firstValue(asRecord(entry), ['match_id', 'matchId', 'id']);
    return typeof id === 'string' ? [id] : [];
  });
  const matchResponses = await Promise.all(
    matchIds.map((matchId) =>
      fetchJson(
        `${apiBaseUrl}/api/match/${region}/${encodeURIComponent(matchId)}/${encodedPuuid}/outcome`,
        signal,
      ),
    ),
  );
  const matches = matchResponses.flatMap((matchResponse) => {
    const match = parseMatch(matchResponse);
    return match ? [match] : [];
  });
  const wins = metric(analytics, ['wins', 'win_count', 'winCount']);
  const losses = metric(analytics, ['losses', 'loss_count', 'lossCount']);
  const analyticsWinRate = metric(analytics, ['win_rate', 'winRate', 'winrate']);
  const analyticsKda = metric(analytics, ['average_kda', 'avg_kda', 'kda']);
  const championValue = firstValue(analytics, [
    'top_champions',
    'topChampions',
    'champions',
  ]);
  const champions = parseChampions(championValue);
  const name = firstValue(playerData, ['gameName', 'game_name', 'name']);
  const tag = firstValue(playerData, ['tagLine', 'tag_line', 'tag']);

  return {
    gameName: typeof name === 'string' ? name : gameName,
    tagLine: typeof tag === 'string' ? tag : tagLine,
    wins,
    losses,
    winRate:
      analyticsWinRate ??
      (wins !== null && losses !== null && wins + losses > 0
        ? wins / (wins + losses)
        : null),
    averageKda: analyticsKda,
    matches,
    champions: champions.length ? champions : deriveChampions(matches),
  };
}

function Profile() {
  const [searchParams] = useSearchParams();
  const requestedGameId = searchParams.get('gameId')?.trim();
  const isOwnProfile = !requestedGameId;
  const [requestedName, requestedTag] = (requestedGameId ?? '').split('#', 2);
  const gameName = requestedName || '';
  const gameTag = requestedTag || '';
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function loadRequestedProfile() {
      await Promise.resolve();
      if (!requestedGameId) {
        setProfile(null);
        setLoading(false);
        setError('');
        return;
      }
      if (!gameName || !gameTag) {
        setProfile(null);
        setLoading(false);
        setError('Enter a Riot ID in the format Player#NA1.');
        return;
      }

      setProfile(null);
      setLoading(true);
      setError('');
      try {
        setProfile(await loadProfile(gameName, gameTag, controller.signal));
      } catch (reason: unknown) {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : 'Could not load this profile.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadRequestedProfile();
    return () => controller.abort();
  }, [requestedGameId, gameName, gameTag]);

  const displayName = profile?.gameName ?? gameName;
  const matches = profile?.matches ?? [];
  const champions = profile?.champions ?? [];
  const wins = profile?.wins ?? null;
  const losses = profile?.losses ?? null;
  const winRate = profile?.winRate ?? null;
  const averageKda = profile?.averageKda ?? null;
  const recentWins = matches.filter((match) => match.won === true).length;
  const recentLosses = matches.filter((match) => match.won === false).length;
  const recentResults = recentWins + recentLosses;
  const recentWinRate = recentResults ? recentWins / recentResults : null;

  return (
    <div
      className={`player-profile-page ${isOwnProfile ? 'own-profile' : 'public-profile'}`}
    >
      <header className='player-profile-header'>
        <Link
          className='player-profile-brand'
          to='/'
          aria-label='LevelUp.gg home'
        >
          <span className='player-profile-brand-mark'>L</span>
          <span>
            LevelUp<span>.</span>gg
          </span>
        </Link>
        <nav className='player-profile-nav' aria-label='Profile navigation'>
          <a className='selected' href='#overview'>
            Overview
          </a>
          <a href='#matches'>Matches</a>
          <Link to='/champions'>Champions</Link>
        </nav>
        <Link className='profile-home-link' to='/'>
          <ArrowBackRounded /> Home
        </Link>
      </header>

      <main className='player-profile-main' id='overview'>
        <div className='profile-page-heading'>
          <div>
            <p className='profile-eyebrow'>
              {isOwnProfile ? 'YOUR ACCOUNT' : 'PUBLIC PLAYER PROFILE'}{' '}
              <span>·</span> SEASON 2026
            </p>
            <h1>{isOwnProfile ? 'My profile' : `${displayName}'s profile`}</h1>
          </div>
          <button className='profile-season-select' type='button'>
            Season 2026 <KeyboardArrowDownRounded />
          </button>
        </div>

        {(loading || error || isOwnProfile) && (
          <p className={`profile-data-message ${error ? 'has-error' : ''}`} role={error ? 'alert' : 'status'}>
            {error ||
              (loading
                ? 'Loading player profile and recent match data…'
                : 'Search for a Riot ID from the home page to load a player profile.')}
          </p>
        )}

        <section
          className='summoner-card'
          aria-label={
            isOwnProfile ? 'Your game account' : 'Public summoner details'
          }
        >
          <div className='summoner-info'>
            <div className='summoner-avatar'>
              {displayName.charAt(0).toUpperCase() || '?'}
              <span />
            </div>
            <div>
              <div className='summoner-name-line'>
                <h2>{displayName || 'No player selected'}</h2>
                {(profile?.tagLine || gameTag) && (
                  <span className='summoner-tag'>#{profile?.tagLine ?? gameTag}</span>
                )}
                <span
                  className={`profile-view-badge ${isOwnProfile ? 'owner-badge' : 'public-badge'}`}
                >
                  {isOwnProfile ? 'MY ACCOUNT' : 'PUBLIC'}
                </span>
              </div>
              <p className='summoner-subtitle'>
                North America{' '}
                <span className='region-label'>NA</span>
              </p>
              <p className='summoner-updated'>
                {profile ? 'Profile data loaded from the API' : 'Rank details are not available'}
              </p>
            </div>
          </div>
          <div className='summoner-rank'>
            <div>
              <span className='rank-queue'>RANKED STATUS</span>
              <h3>Unavailable</h3>
              <p>Rank data is not provided by the connected API.</p>
            </div>
          </div>
        </section>

        <section className='profile-stat-grid' aria-label='Season statistics'>
          <article>
            <span>WIN RATE</span>
            <strong>
              {formatPercent(winRate)}
            </strong>
            <p>Based on cached match statistics</p>
          </article>
          <article>
            <span>AVERAGE KDA</span>
            <strong>
              {averageKda === null ? '—' : averageKda.toFixed(2)}
              <small className='stat-unit'> KDA</small>
            </strong>
            <p>Average kills / deaths / assists</p>
          </article>
          <article>
            <span>GAMES PLAYED</span>
            <strong>{wins !== null && losses !== null ? wins + losses : '—'}</strong>
            <p>
              {wins === null ? '—' : `${wins}W`} <i>/</i>{' '}
              {losses === null ? '—' : `${losses}L`}
            </p>
          </article>
          <article>
            <span>RECENT MATCHES</span>
            <strong>{matches.length}</strong>
            <p>{loading ? 'Loading…' : 'Most recent cached games'}</p>
          </article>
        </section>

        <div className='profile-dashboard-grid'>
          <div className='profile-dashboard-main'>
            <section className='profile-panel'>
              <div className='profile-panel-heading'>
                <div>
                  <span className='panel-eyebrow'>
                    {isOwnProfile ? 'YOUR FORM' : 'RECENT FORM'}
                  </span>
                  <h2>Ranked performance</h2>
                </div>
                <span className='panel-period'>Recent cached games</span>
              </div>
              <div className='performance-summary'>
                <div className='win-rate-ring'>
                  <div>
                    <strong>
                      {formatPercent(recentWinRate)}
                    </strong>
                    <span>WIN RATE</span>
                  </div>
                </div>
                <div className='performance-detail'>
                  <div className='performance-record'>
                    <strong>
                      {recentWins}W <i>/</i> {recentLosses}L
                    </strong>
                    <span>{recentResults} results</span>
                  </div>
                  <p>
                    {isOwnProfile
                      ? 'Recent performance will appear after searching for a Riot ID.'
                      : `${displayName}'s recent performance from cached matches.`}
                  </p>
                  <div
                    className='weekly-activity'
                    aria-label='Recent match results'
                  >
                    {matches.map((match, index) => (
                      <span
                        key={`${match.champion}-${index}`}
                        className={match.won === true ? 'current-day' : ''}
                        style={{ height: match.won === null ? '35%' : match.won ? '84%' : '48%' }}
                      />
                    ))}
                  </div>
                  <div className='activity-labels'>
                    <span>Most recent</span>
                    <span>Oldest shown</span>
                  </div>
                </div>
              </div>
            </section>

            <section className='profile-panel match-history-panel' id='matches'>
              <div className='profile-panel-heading'>
                <div>
                  <span className='panel-eyebrow'>RECENT GAMES</span>
                  <h2>Match history</h2>
                </div>
                <a className='profile-view-all' href='#matches'>
                  View all <span>↗</span>
                </a>
              </div>
              <div className='profile-match-list'>
                {matches.map((match, index) => (
                  <article
                    className={`profile-match-row ${match.won === null ? '' : match.won ? 'match-win' : 'match-loss'}`}
                    key={`${match.champion}-${index}`}
                  >
                    <div
                      className='profile-champion-icon'
                    >
                      {match.champion.charAt(0).toUpperCase()}
                    </div>
                    <div className='match-queue-info'>
                      <strong>{match.result}</strong>
                      <span>
                        {match.role} <i /> {match.duration}
                      </span>
                    </div>
                    <div className='match-kda-info'>
                      <strong>{match.kda}</strong>
                      <span>{match.cs}</span>
                    </div>
                  </article>
                ))}
                {!matches.length && (
                  <p className='profile-empty-state'>
                    {loading ? 'Loading recent matches…' : 'No recent matches are available.'}
                  </p>
                )}
              </div>
            </section>
          </div>

          <aside className='profile-dashboard-side'>
            <section className='profile-panel' id='champions'>
              <div className='profile-panel-heading'>
                <div>
                  <span className='panel-eyebrow'>COMFORT PICKS</span>
                  <h2>Top champions</h2>
                </div>
                <Link className='profile-view-all' to='/champions'>
                  All <span>↗</span>
                </Link>
              </div>
              <div className='top-champion-list'>
                {champions.map((champion, index) => (
                  <article className='top-champion-row' key={champion.name}>
                    <span
                      className='profile-champion-icon'
                    >
                      {champion.name.charAt(0).toUpperCase()}
                    </span>
                    <div className='top-champion-name'>
                      <strong>{champion.name}</strong>
                      <span>{champion.games} games</span>
                    </div>
                    <div className='top-champion-stats'>
                      <strong>{formatPercent(champion.winRate)}</strong>
                      <span>{champion.kda === null ? '—' : `${champion.kda.toFixed(1)} KDA`}</span>
                    </div>
                    <span className='champion-position'>0{index + 1}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className='rank-climb-panel'>
              <span className='climb-eyebrow'>↗ &nbsp; RANK PROGRESS</span>
              <h2>Rank data unavailable.</h2>
              <p>
                The connected API does not currently return ranked tier or LP.
              </p>
            </section>
          </aside>
        </div>

        <footer className='profile-page-footer'>
          <span>
            LEVELUP.GG <i /> {profile ? 'LIVE API DATA' : 'PLAYER PROFILE'}
          </span>
          <span>
            SUMMONER'S RIFT <i /> NA REGION
          </span>
        </footer>
      </main>
    </div>
  );
}

export default Profile;
