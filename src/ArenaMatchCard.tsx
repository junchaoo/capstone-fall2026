import type { ArenaMatch } from './match';
import { timeAgo } from './timeAgo';
import './MatchHistory.css';
import './ArenaMatchCard.css';

const PLACEMENT_LABELS = ['', '1st', '2nd', '3rd'];

export default function ArenaMatchCard({ match }: { match: ArenaMatch })
{
  const placementLabel = PLACEMENT_LABELS[match.placement] ?? `${match.placement}th`;

  const minutes = Math.floor(match.gameDuration / 60);
  const seconds = match.gameDuration % 60;

  const kda = match.deaths === 0 ? 'Perfect' : ((match.kills + match.assists) / match.deaths).toFixed(2);

  return (
    <div className={`match-card ${match.win ? 'match-card--win' : 'match-card--loss'}`}>

      {/* mode, champion, match date */}
      <div className="match-card__champion-col">
        <span className="match-card__queue">Arena</span>

        <div className="match-card__champion-row match-card__champion-row--solo">
          <div className="match-card__portrait">
            <img src={match.championIconUrl} alt={match.championName} className="match-card__champion" />
            <span className="match-card__level">{match.champLevel}</span>
          </div>
        </div>

        <span className="match-card__date">{timeAgo(match.gameEndTimestamp)}</span>
      </div>

      {/* placement and match duration */}
      <div className="match-card__info arena-card__info">
        <span className="match-card__result">{placementLabel}</span>
        <span className="match-card__duration">{minutes}m {seconds}s</span>
      </div>

      {/* KDA */}
      <div className="match-card__stats arena-card__stats">
        <span className="match-card__kda-text">
          {match.kills} / {match.deaths} / {match.assists}
        </span>
        <span className="match-card__kda-ratio">{kda} KDA</span>
      </div>

      {/* augments: always 6 slots */}
      <div className="arena-card__augments">
        {match.augments.map((aug, i) =>
        {
          if (!aug) return <div key={i} className="arena-card__augment arena-card__augment--blank" />;

          return aug.iconUrl ? (
            <img
              key={i}
              src={aug.iconUrl}
              alt={aug.name}
              title={aug.name}
              className={`arena-card__augment arena-card__augment--rarity-${aug.rarity}`}
            />
          ) : (
            <div key={i} title={aug.name} className="arena-card__augment arena-card__augment--unknown"></div>
          );
        })}
      </div>

      {/* items, prismatics are highlighted */}
      <div className="arena-card__items">
        {match.items.map((item, i) =>
          item ? (
            <img
              key={i}
              src={item.iconUrl}
              alt=""
              className={`arena-card__item ${item.prismatic ? 'arena-card__item--prismatic' : ''}`}
            />
          ) : (
            <div key={i} className="arena-card__item arena-card__item--empty" />
          )
        )}
      </div>

      {/* teams, ordered by placement */}
      <div className="arena-card__teams">
        {match.teams.map((team) => (
          <div
            key={team.players[0].puuid}
            className={`arena-card__team ${team.players.some((p) => p.isMe) ? 'arena-card__team--me' : ''}`}
          >
            <span className="arena-card__team-rank">{team.placement}</span>
            <div className="arena-card__team-players">
              {team.players.map((p) => (
                <div key={p.puuid} className={`arena-card__team-player ${p.isMe ? 'arena-card__team-player--me' : ''}`}>
                  <img src={p.championIconUrl} alt={p.championName} className="arena-card__team-icon" />
                  <span className="arena-card__team-name" title={`${p.name}#${p.tagLine}`}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}