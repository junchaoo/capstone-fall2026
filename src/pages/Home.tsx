import "./Home.css";

function Home() {
  return (
    <div>
      <header>
        <h1>LevelUp.gg</h1>

        <nav>
            <a href="#">Leaderboard</a>
            <a href="#">Login</a>
            <a href="#">Sign Up</a>
        </nav>
        </header>

      <main>
        <section className="hero">
          <h2>Level Up Your Game</h2>

          <p>Compete. Analyze. Improve.</p>

          <p>
            Track your League of Legends performance,
            compare yourself with friends, and improve your game.
          </p>

          <button>Find Your Profile</button>
        </section>

        <section className="features">
            <h2>What can you do?</h2>

            <div className="feature-card">
                <h3>Leaderboard</h3>
                <p>See how you rank against other players.</p>
            </div>

            <div className="feature-card">
                <h3>Player Stats</h3>
                <p>Analyze your performance and track your progress.</p>
            </div>

            <div className="feature-card">
                <h3>Player Comparison</h3>
                <p>Compare your performance with your friends.</p>
            </div>
            </section>
      </main>
    </div>
  );
}

export default Home;