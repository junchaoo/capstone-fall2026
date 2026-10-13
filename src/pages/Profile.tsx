import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import { Link, useSearchParams } from 'react-router-dom';
import './Profile.css';

const recentMatches = [
  {
    champion: 'A',
    name: 'Ahri',
    role: 'MID',
    result: 'Victory',
    time: '28:14',
    kda: '9 / 2 / 11',
    cs: '218 CS',
    lp: '+24 LP',
    won: true,
  },
  {
    champion: 'J',
    name: 'Jinx',
    role: 'BOT',
    result: 'Defeat',
    time: '34:51',
    kda: '5 / 7 / 8',
    cs: '264 CS',
    lp: '-18 LP',
    won: false,
  },
  {
    champion: 'L',
    name: 'Lee Sin',
    role: 'JUNGLE',
    result: 'Victory',
    time: '26:32',
    kda: '7 / 3 / 12',
    cs: '191 CS',
    lp: '+22 LP',
    won: true,
  },
  {
    champion: 'A',
    name: 'Ahri',
    role: 'MID',
    result: 'Victory',
    time: '31:06',
    kda: '11 / 4 / 6',
    cs: '246 CS',
    lp: '+23 LP',
    won: true,
  },
];

const topChampions = [
  {
    initial: 'A',
    name: 'Ahri',
    games: '18 games',
    winRate: '66.7%',
    kda: '5.8 KDA',
    color: 'rose',
  },
  {
    initial: 'J',
    name: 'Jinx',
    games: '12 games',
    winRate: '58.3%',
    kda: '4.9 KDA',
    color: 'blue',
  },
  {
    initial: 'L',
    name: 'Lee Sin',
    games: '8 games',
    winRate: '62.5%',
    kda: '4.2 KDA',
    color: 'gold',
  },
];

const weeklyActivity = [34, 52, 42, 72, 58, 84, 64];

function Profile() {
  const [searchParams] = useSearchParams();
  const requestedGameId = searchParams.get('gameId')?.trim();
  const isOwnProfile = !requestedGameId;
  const searchedGameId = requestedGameId || 'Sora#NA1';
  const [gameName = 'Sora', gameTag] = searchedGameId.split('#', 2);

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
            <h1>{isOwnProfile ? 'My profile' : `${gameName}'s profile`}</h1>
          </div>
          <button className='profile-season-select' type='button'>
            Season 2026 <KeyboardArrowDownRounded />
          </button>
        </div>

        <section
          className='summoner-card'
          aria-label={
            isOwnProfile ? 'Your game account' : 'Public summoner details'
          }
        >
          <div className='summoner-info'>
            <div className='summoner-avatar'>
              {gameName.charAt(0).toUpperCase()}
              <span />
            </div>
            <div>
              <div className='summoner-name-line'>
                <h2>{gameName}</h2>
                {gameTag && <span className='summoner-tag'>#{gameTag}</span>}
                <span
                  className={`profile-view-badge ${isOwnProfile ? 'owner-badge' : 'public-badge'}`}
                >
                  {isOwnProfile ? 'MY ACCOUNT' : 'PUBLIC'}
                </span>
              </div>
              <p className='summoner-subtitle'>
                Level 287 <i /> North America{' '}
                <span className='region-label'>NA</span>
              </p>
              <p className='summoner-updated'>Last updated 4 minutes ago</p>
            </div>
          </div>
          <div className='summoner-rank'>
            <div className='rank-emblem'>II</div>
            <div>
              <span className='rank-queue'>SOLO / DUO</span>
              <h3>Emerald II</h3>
              <p>
                72 LP <i /> 58% win rate
              </p>
            </div>
          </div>
        </section>

        <section className='profile-stat-grid' aria-label='Season statistics'>
          <article>
            <span>WIN RATE</span>
            <strong>
              58.4<small>%</small>
            </strong>
            <p className='stat-up'>
              ↑ 4.2% <em>vs. last season</em>
            </p>
          </article>
          <article>
            <span>AVERAGE KDA</span>
            <strong>
              4.82<small className='stat-unit'> KDA</small>
            </strong>
            <p>3.9 / 4.6 / 8.3</p>
          </article>
          <article>
            <span>GAMES PLAYED</span>
            <strong>142</strong>
            <p>
              81W <i>/</i> 61L
            </p>
          </article>
          <article>
            <span>CURRENT STREAK</span>
            <strong>
              3<small className='stat-unit'> wins</small>
            </strong>
            <p className='stat-up'>Keep it going</p>
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
                <span className='panel-period'>Last 20 games</span>
              </div>
              <div className='performance-summary'>
                <div className='win-rate-ring'>
                  <div>
                    <strong>
                      65<small>%</small>
                    </strong>
                    <span>WIN RATE</span>
                  </div>
                </div>
                <div className='performance-detail'>
                  <div className='performance-record'>
                    <strong>
                      13W <i>/</i> 7L
                    </strong>
                    <span>+5 net wins</span>
                  </div>
                  <p>
                    {isOwnProfile
                      ? "You're winning more games than usual. Keep building on this run."
                      : `${gameName} is winning more games than usual. Recent form is trending up.`}
                  </p>
                  <div
                    className='weekly-activity'
                    aria-label='Ranked activity over the last week'
                  >
                    {weeklyActivity.map((height, index) => (
                      <span
                        key={index}
                        className={index === 5 ? 'current-day' : ''}
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                  <div className='activity-labels'>
                    <span>7 days ago</span>
                    <span>Today</span>
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
                {recentMatches.map((match, index) => (
                  <article
                    className={`profile-match-row ${match.won ? 'match-win' : 'match-loss'}`}
                    key={`${match.name}-${index}`}
                  >
                    <div
                      className={`profile-champion-icon champion-${match.champion.toLowerCase()}`}
                    >
                      {match.champion}
                    </div>
                    <div className='match-queue-info'>
                      <strong>{match.result}</strong>
                      <span>
                        {match.role} <i /> {match.time}
                      </span>
                    </div>
                    <div className='match-kda-info'>
                      <strong>{match.kda}</strong>
                      <span>{match.cs}</span>
                    </div>
                    <span
                      className={`match-lp ${match.won ? 'lp-gain' : 'lp-loss'}`}
                    >
                      {match.lp}
                    </span>
                  </article>
                ))}
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
                {topChampions.map((champion, index) => (
                  <article className='top-champion-row' key={champion.name}>
                    <span
                      className={`profile-champion-icon champion-${champion.color}`}
                    >
                      {champion.initial}
                    </span>
                    <div className='top-champion-name'>
                      <strong>{champion.name}</strong>
                      <span>{champion.games}</span>
                    </div>
                    <div className='top-champion-stats'>
                      <strong>{champion.winRate}</strong>
                      <span>{champion.kda}</span>
                    </div>
                    <span className='champion-position'>0{index + 1}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className='rank-climb-panel'>
              <span className='climb-eyebrow'>↗ &nbsp; RANK PROGRESS</span>
              <h2>One step closer.</h2>
              <p>
                {isOwnProfile ? "You're" : `${gameName} is`}{' '}
                <strong>128 LP</strong> from Diamond. Keep the momentum.
              </p>
              <div className='rank-progress'>
                <span />
              </div>
              <div className='rank-progress-labels'>
                <span>Emerald II</span>
                <span>Diamond IV</span>
              </div>
            </section>
          </aside>
        </div>

        <footer className='profile-page-footer'>
          <span>
            LEVELUP.GG <i /> SAMPLE PROFILE DATA
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
