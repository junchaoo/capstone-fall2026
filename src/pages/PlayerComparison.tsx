import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import CompareArrowsRounded from '@mui/icons-material/CompareArrowsRounded';
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './PlayerComparison.css';

type JsonRecord = Record<string, unknown>;

type ComparedChampion = {
  name: string;
  icon: string;
  games: number;
  winRate: number | null;
};

type ComparedPlayer = {
  riotId: string;
  wins: number;
  losses: number;
  winRate: number | null;
  kda: number | null;
  avgKills: number | null;
  avgDeaths: number | null;
  avgAssists: number | null;
  champions: ComparedChampion[];
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
  .replace(/\/+$/, '');

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function responseData(value: unknown): unknown {
  const record = asRecord(value);
  return record && 'data' in record ? record.data : value;
}

function numericValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function metric(record: JsonRecord | null, keys: string[]): number | null {
  if (!record) return null;
  for (const key of keys) {
    const value = numericValue(record[key]);
    if (value !== null) return value;
  }
  return null;
}

async function fetchJson(url: string, signal: AbortSignal, method: 'GET' | 'POST' = 'GET') {
  const response = await fetch(url, {
    method,
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) {
    const body = await response.text();
    let message = body || `Request failed (${response.status})`;
    try {
      const errorBody: unknown = JSON.parse(body);
      const detail = asRecord(errorBody)?.detail;
      if (typeof detail === 'string') message = detail;
    } catch {
      // Keep the response text when the server does not return JSON.
    }
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json() as Promise<unknown>;
}

async function loadComparedPlayer(riotId: string, signal: AbortSignal): Promise<ComparedPlayer> {
  const separator = riotId.lastIndexOf('#');
  const gameName = riotId.slice(0, separator).trim();
  const tagLine = riotId.slice(separator + 1).trim();
  if (separator < 1 || !gameName || !tagLine) {
    throw new Error('Enter a Riot ID in the format Player#NA1.');
  }

  const region = 'na1';
  const playerResponse = await fetchJson(
    `${apiBaseUrl}/api/player/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    signal,
  );
  const player = asRecord(responseData(playerResponse));
  const puuid = player?.puuid;
  if (typeof puuid !== 'string' || !puuid) {
    throw new Error('Player lookup response did not include a PUUID.');
  }

  const encodedPuuid = encodeURIComponent(puuid);
  await fetchJson(
    `${apiBaseUrl}/api/matches/${region}/${encodedPuuid}/batch-cache?count=5`,
    signal,
    'POST',
  );
  const analyticsResponse = await fetchJson(
    `${apiBaseUrl}/api/analytics/${encodedPuuid}`,
    signal,
  );
  const analytics = asRecord(responseData(analyticsResponse));
  const summary = asRecord(analytics?.summary) ?? analytics;
  const wins = metric(summary, ['wins', 'win_count', 'winCount']) ?? 0;
  const losses = metric(summary, ['losses', 'loss_count', 'lossCount']) ?? 0;
  const winRate = metric(summary, ['winrate', 'win_rate', 'winRate']);
  const championsValue = analytics?.top_champions;
  const champions = Array.isArray(championsValue)
    ? championsValue.flatMap((value): ComparedChampion[] => {
      const entry = asRecord(value);
      const champion = asRecord(entry?.champion);
      const name = champion?.name;
      if (typeof name !== 'string') return [];
      const icon = champion?.icon;
      return [{
        name,
        icon: typeof icon === 'string' ? icon : '',
        games: metric(entry, ['games_played', 'games', 'count']) ?? 0,
        winRate: metric(entry, ['winrate', 'win_rate', 'winRate']),
      }];
    })
    : [];
  const averages = asRecord(summary?.averages);
  const resolvedGameName = player?.gameName;
  const resolvedTagLine = player?.tagLine;

  return {
    riotId: `${typeof resolvedGameName === 'string' ? resolvedGameName : gameName}#${typeof resolvedTagLine === 'string' ? resolvedTagLine : tagLine}`,
    wins,
    losses,
    winRate,
    kda: metric(summary, ['overall_kda', 'average_kda', 'avg_kda', 'kda']),
    avgKills: metric(averages, ['kills']),
    avgDeaths: metric(averages, ['deaths']),
    avgAssists: metric(averages, ['assists']),
    champions,
  };
}

function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${(value <= 1 ? value * 100 : value).toFixed(1)}%`;
}

function formatKda(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(2)} KDA`;
}

function formatAverageKda(player: ComparedPlayer): string {
  if (player.avgKills === null || player.avgDeaths === null || player.avgAssists === null) return '—';
  return `${player.avgKills.toFixed(1)} / ${player.avgDeaths.toFixed(1)} / ${player.avgAssists.toFixed(1)}`;
}

function percentValue(value: number | null): number {
  if (value === null) return 0;
  return Math.max(0, Math.min(100, value <= 1 ? value * 100 : value));
}

function compareMetric(left: number | null, right: number | null, higherIsBetter = true) {
  if (left === null || right === null || left === right) return 'Even';
  const leftWins = higherIsBetter ? left > right : left < right;
  return leftWins ? 'Player 1 advantage' : 'Player 2 advantage';
}

function PlayerComparison() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [riotIdOne, setRiotIdOne] = useState(searchParams.get('p1') ?? '');
  const [riotIdTwo, setRiotIdTwo] = useState(searchParams.get('p2') ?? '');
  const [players, setPlayers] = useState<[ComparedPlayer | null, ComparedPlayer | null]>([null, null]);
  const [errors, setErrors] = useState<[string, string]>(['', '']);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const requestId = useRef(0);

  async function runComparison(idOne: string, idTwo: string) {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setPlayers([null, null]);
    setErrors(['', '']);

    const results = await Promise.all([idOne, idTwo].map(async (riotId) => {
      try {
        return { player: await loadComparedPlayer(riotId, new AbortController().signal), error: '' };
      } catch (error) {
        return {
          player: null,
          error: error instanceof Error ? error.message : 'Could not load this player.',
        };
      }
    }));

    if (currentRequest !== requestId.current) return;
    setPlayers([results[0].player, results[1].player]);
    setErrors([results[0].error, results[1].error]);
    setLoading(false);
  }

  function startComparison(idOne: string, idTwo: string) {
    setSearchParams({ p1: idOne, p2: idTwo });
    void runComparison(idOne, idTwo);
  }

  useEffect(() => {
    const idOne = searchParams.get('p1')?.trim();
    const idTwo = searchParams.get('p2')?.trim();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (idOne && idTwo) void runComparison(idOne, idTwo);
    // Only auto-run for the URL the page was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCompare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startComparison(riotIdOne.trim(), riotIdTwo.trim());
  }

  function handleSwap() {
    setRiotIdOne(riotIdTwo);
    setRiotIdTwo(riotIdOne);
    if (riotIdOne.trim() && riotIdTwo.trim()) startComparison(riotIdTwo.trim(), riotIdOne.trim());
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const [playerOne, playerTwo] = players;
  const bothLoaded = playerOne && playerTwo;

  let summaryText = '';
  if (playerOne && playerTwo) {
    let oneScore = 0;
    let twoScore = 0;
    for (const [a, b, higherIsBetter] of [
      [playerOne.winRate, playerTwo.winRate, true],
      [playerOne.kda, playerTwo.kda, true],
      [playerOne.avgDeaths, playerTwo.avgDeaths, false],
    ] as const) {
      if (a === null || b === null || a === b) continue;
      if ((a > b) === higherIsBetter) oneScore++;
      else twoScore++;
    }
    summaryText = oneScore === twoScore
      ? 'Too close to call — these players are evenly matched.'
      : `${oneScore > twoScore ? playerOne.riotId : playerTwo.riotId} has the overall advantage (${Math.max(oneScore, twoScore)} of 3 key metrics: win rate, KDA, deaths).`;
  }

  const commonChampions = playerOne && playerTwo
    ? playerOne.champions.flatMap((champion) => {
      const other = playerTwo.champions.find((entry) => entry.name === champion.name);
      return other ? [{ champion, other }] : [];
    })
    : [];

  return (
    <div className='leaderboard-page'>
      <header className='leaderboard-header'>
        <Link className='leaderboard-brand' to='/' aria-label='LevelUp.gg home'>
          <span className='leaderboard-brand-mark'>L</span>
          <span>LevelUp<span>.</span>gg</span>
        </Link>
        <nav aria-label='Main navigation'>
          <Link to='/'>Home</Link>
          <Link to='/champions'>Champions</Link>
          <Link className='selected' to='/comparison'>Player Comparison</Link>
        </nav>
        <Link className='leaderboard-back' to='/'>
          <ArrowBackRounded /> Home
        </Link>
      </header>

      <main className='leaderboard-main'>
        <section className='leaderboard-intro'>
          <span className='leaderboard-eyebrow'>PLAYER COMPARISON</span>
          <h1>Who’s climbing higher?</h1>
          <p>Search two Riot IDs to compare their recent performance side by side.</p>
        </section>

        <form className='comparison-search' onSubmit={handleCompare}>
          <label className='comparison-player-input'>
            <span>PLAYER 1</span>
            <input
              value={riotIdOne}
              onChange={(event) => setRiotIdOne(event.target.value)}
              placeholder='Riot ID (e.g. Player#NA1)'
              aria-label='First player Riot ID'
              required
            />
            {errors[0] && <small role='alert'>{errors[0]}</small>}
          </label>
          <div className='comparison-versus' aria-hidden='true'>
            <CompareArrowsRounded />
            <span>VS</span>
          </div>
          <label className='comparison-player-input'>
            <span>PLAYER 2</span>
            <input
              value={riotIdTwo}
              onChange={(event) => setRiotIdTwo(event.target.value)}
              placeholder='Riot ID (e.g. Player#NA1)'
              aria-label='Second player Riot ID'
              required
            />
            {errors[1] && <small role='alert'>{errors[1]}</small>}
          </label>
          <button
            className='comparison-swap'
            type='button'
            onClick={handleSwap}
            aria-label='Swap players'
            title='Swap players'
          >
            <SwapHorizRounded />
          </button>
          <button className='comparison-submit' type='submit' disabled={loading}>
            {loading ? 'Loading players…' : 'Compare players'}
          </button>
        </form>

        {players.some(Boolean) && (
          <section className='comparison-results' aria-label='Player comparison results'>
            {bothLoaded && (
              <div className='comparison-summary'>
                <strong>{summaryText}</strong>
                <button type='button' onClick={handleCopyLink}>
                  {copied ? 'Link copied!' : 'Copy share link'}
                </button>
              </div>
            )}

            {bothLoaded && (
              <div className='comparison-winrate' aria-label='Win rate comparison'>
                <span className='comparison-section-label'>WIN RATE</span>
                {[playerOne, playerTwo].map((player, index) => (
                  <div className='comparison-bar-row' key={`bar-${index}`}>
                    <span>{player.riotId}</span>
                    <div
                      className='comparison-bar-track'
                      role='progressbar'
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(percentValue(player.winRate))}
                    >
                      <div
                        className={`comparison-bar-fill player-${index + 1}`}
                        style={{ width: `${percentValue(player.winRate)}%` }}
                      />
                    </div>
                    <strong>{formatPercent(player.winRate)}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className='comparison-table'>
              <div className='comparison-table-heading'>
                <span>PERFORMANCE</span>
                <strong>{playerOne?.riotId ?? (riotIdOne.trim() || 'Player 1')}</strong>
                <strong>{playerTwo?.riotId ?? (riotIdTwo.trim() || 'Player 2')}</strong>
              </div>
              {[
                {
                  label: 'Win rate',
                  left: playerOne ? formatPercent(playerOne.winRate) : '—',
                  right: playerTwo ? formatPercent(playerTwo.winRate) : '—',
                  outcome: playerOne && playerTwo ? compareMetric(playerOne.winRate, playerTwo.winRate) : '',
                },
                {
                  label: 'Overall KDA',
                  left: playerOne ? formatKda(playerOne.kda) : '—',
                  right: playerTwo ? formatKda(playerTwo.kda) : '—',
                  outcome: playerOne && playerTwo ? compareMetric(playerOne.kda, playerTwo.kda) : '',
                },
                {
                  label: 'Avg K / D / A',
                  left: playerOne ? formatAverageKda(playerOne) : '—',
                  right: playerTwo ? formatAverageKda(playerTwo) : '—',
                  outcome: playerOne && playerTwo ? compareMetric(playerOne.avgDeaths, playerTwo.avgDeaths, false) : '',
                },
                {
                  label: 'Games played',
                  left: playerOne ? `${playerOne.wins + playerOne.losses} games` : '—',
                  right: playerTwo ? `${playerTwo.wins + playerTwo.losses} games` : '—',
                  outcome: '',
                },
                {
                  label: 'Wins / losses',
                  left: playerOne ? `${playerOne.wins} / ${playerOne.losses}` : '—',
                  right: playerTwo ? `${playerTwo.wins} / ${playerTwo.losses}` : '—',
                  outcome: '',
                },
              ].map((row) => (
                <div className='comparison-table-row' key={row.label}>
                  <span>{row.label}</span>
                  <strong>{row.left}</strong>
                  <strong>{row.right}</strong>
                  {row.outcome && <small>{row.outcome}</small>}
                </div>
              ))}
            </div>

            <div className='comparison-champions'>
              {[playerOne, playerTwo].map((player, index) => (
                <article className='comparison-champion-card' key={`player-${index + 1}`}>
                  <h2>{player?.riotId ?? (index === 0 ? riotIdOne.trim() : riotIdTwo.trim())}</h2>
                  <span className='comparison-section-label'>MOST PLAYED CHAMPIONS</span>
                  {player ? (
                    player.champions.length ? (
                      <ol>
                        {player.champions.slice(0, 3).map((champion) => (
                          <li key={champion.name} className={playerOne && playerTwo && commonChampions.some((common) => common.champion.name === champion.name) ? 'common' : undefined}>
                            {champion.icon ? <img src={champion.icon} alt='' loading='lazy' /> : <span className='comparison-champion-fallback'>{champion.name.slice(0, 1)}</span>}
                            <span>{champion.name}</span>
                            <small>{champion.games} games · {formatPercent(champion.winRate)}</small>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p>No cached champion stats are available.</p>
                    )
                  ) : (
                    <p>{errors[index] || (loading ? 'Loading…' : 'Player data unavailable.')}</p>
                  )}
                </article>
              ))}
            </div>
            {bothLoaded && (
              <div className='comparison-common'>
                <span className='comparison-section-label'>COMMON CHAMPIONS</span>
                {commonChampions.length ? (
                  <ul>
                    {commonChampions.map(({ champion, other }) => (
                      <li key={champion.name}>
                        {champion.icon ? <img src={champion.icon} alt='' loading='lazy' /> : <span className='comparison-champion-fallback'>{champion.name.slice(0, 1)}</span>}
                        <strong>{champion.name}</strong>
                        <span>{playerOne.riotId}: {champion.games} games · {formatPercent(champion.winRate)}</span>
                        <span>{playerTwo.riotId}: {other.games} games · {formatPercent(other.winRate)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>These players have no top champions in common.</p>
                )}
              </div>
            )}
            <p className='comparison-disclaimer'>
              Stats are calculated from games currently cached by the connected API.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

export default PlayerComparison;
