import './Home.css';
import backgroundVideo from '../assets/gameplay.mov';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className='home-page'>
      <header className='topbar'>
        <div className='brand-wrap'>
          <div className='brand-mark'>L</div>
          <h1>LevelUp.gg</h1>
        </div>

        <nav aria-label='Main navigation'>
          <a href='#'>Leaderboard</a>
          <Link to='/pros'>Pros</Link>
          <a href='#'>Features</a>
          <a href='#'>Community</a>
          <Link to='/login' className='signup-button'>
            Sign In
          </Link>
        </nav>
      </header>

      <main className='home-main'>
        <section className='hero'>
          <video className='hero-video' autoPlay muted loop playsInline>
            <source src={backgroundVideo} type='video/quicktime' />
          </video>

          <div className='hero-overlay' />

          <div className='hero-content'>
            <span className='eyebrow'>League of Legends performance hub</span>
            <h2>Level Up Your Game</h2>
            <p className='tagline'>Compete. Analyze. Improve.</p>
            <p className='hero-copy'>
              Track your match history, compare your stats, and uncover what is
              driving your next win.
            </p>

            <div className='hero-actions'>
              <button className='primary-btn'>Find Your Profile</button>
              <button className='secondary-btn'>See Leaderboard</button>
            </div>

            <form
              className='hero-profile-search'
              onSubmit={(event) => {
                event.preventDefault();
                const gameId = new FormData(event.currentTarget)
                  .get('gameId')
                  ?.toString()
                  .trim();
                if (gameId) {
                  navigate(`/profile?gameId=${encodeURIComponent(gameId)}`);
                }
              }}
            >
              <label className='sr-only' htmlFor='hero-player-search'>
                Game ID or account name
              </label>
              <input
                id='hero-player-search'
                type='text'
                name='gameId'
                placeholder='Riot ID (e.g. Player#NA1)'
                aria-label='Game ID or account name'
                required
              />
              <button type='submit' className='search-btn'>
                Search
              </button>
            </form>
          </div>
        </section>

        <section className='about'>
          <div className='section-header'>
            <span className='section-tag'>About</span>
            <h2>What is LevelUp.gg?</h2>
          </div>

          <div className='about-grid'>
            <div className='about-copy'>
              <p>
                LevelUp.gg is a League of Legends performance platform designed
                to help players understand their game and climb with confidence.
              </p>
              <p>
                From rank trends to champion insights, every stat is built to
                help you learn faster and compete smarter.
              </p>
            </div>

            <div className='about-panel'>
              <div className='panel-row'>
                <span>Win rate</span>
                <strong>+12.4%</strong>
              </div>
              <div className='panel-row'>
                <span>Average KDA</span>
                <strong>6.8 / 3.1 / 8.4</strong>
              </div>
              <div className='panel-row'>
                <span>Rank trend</span>
                <strong>Rising</strong>
              </div>
            </div>
          </div>
        </section>

        <section className='features'>
          <div className='section-header'>
            <span className='section-tag'>Features</span>
            <h2>What can you do?</h2>
          </div>

          <div className='feature-container'>
            <div className='feature-card'>
              <div className='feature-number'>01</div>
              <h3>Leaderboard</h3>
              <p>
                See where you stand and compare your rank with other players in
                a live competitive snapshot.
              </p>
            </div>

            <div className='feature-card'>
              <div className='feature-number'>02</div>
              <h3>Player Stats</h3>
              <p>
                Analyze your performance, monitor your progress, and pinpoint
                the areas that need improvement.
              </p>
            </div>

            <div className='feature-card'>
              <div className='feature-number'>03</div>
              <h3>Player Comparison</h3>
              <p>
                Compare your strengths against others and discover what
                separates good games from great ones.
              </p>
            </div>
          </div>
        </section>

        <section className='how-it-works'>
          <div className='section-header'>
            <span className='section-tag'>Workflow</span>
            <h2>How It Works</h2>
          </div>

          <div className='steps'>
            <div className='step'>
              <span>01</span>
              <h3>Find Your Profile</h3>
              <p>
                Search for your player profile and instantly view your current
                rank, progress, and recent form.
              </p>
            </div>

            <div className='step'>
              <span>02</span>
              <h3>Analyze Your Stats</h3>
              <p>
                Explore champions, game trends, win rate, and performance data
                that reveal your biggest strengths.
              </p>
            </div>

            <div className='step'>
              <span>03</span>
              <h3>Improve Your Game</h3>
              <p>
                Use clear insight to sharpen your decision-making and keep
                building momentum in every queue.
              </p>
            </div>
          </div>
        </section>

        <section className='cta'>
          <div className='cta-card'>
            <span className='section-tag'>Ready to climb?</span>
            <h2>Ready to Level Up?</h2>
            <p>
              Discover your strengths, understand your performance, and take
              your game to the next level with data-backed insight.
            </p>
            <button className='primary-btn'>Find Your Profile</button>

            <form
              className='profile-search'
              onSubmit={(event) => {
                event.preventDefault();
                const gameId = new FormData(event.currentTarget)
                  .get('gameId')
                  ?.toString()
                  .trim();
                if (gameId) {
                  navigate(`/profile?gameId=${encodeURIComponent(gameId)}`);
                }
              }}
            >
              <label className='sr-only' htmlFor='player-search'>
                Game ID or account name
              </label>
              <input
                id='player-search'
                type='text'
                name='gameId'
                placeholder='Riot ID (e.g. Player#NA1)'
                aria-label='Game ID or account name'
                required
              />
              <button type='submit' className='search-btn'>
                Search
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
