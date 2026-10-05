import type { MatchSummary } from './match';
import './MatchHistory.css';
 
interface MatchCardProps 
{
  match: MatchSummary;
}
 
export default function MatchCard({ match }: MatchCardProps) 
{
  const kda = match.deaths === 0 ? 'Perfect' : ((match.kills + match.assists) / match.deaths).toFixed(2);
 
  const minutes = Math.floor(match.gameDuration / 60);
  const seconds = match.gameDuration % 60;
 
  return (
    <div className={`match-card ${match.win ? 'match-card--win' : 'match-card--loss'}`}>
      <img src={match.championIconUrl} alt={match.championName} className="match-card__champion" />
 
      <div className="match-card__info">
        <span className="match-card__result">{match.win ? 'Victory' : 'Defeat'}</span>
        <span className="match-card__duration">
          {minutes}m {seconds}s
        </span>
      </div>
 
      <div className="match-card__stats">
        <span className="match-card__kda-text">
          {match.kills} / {match.deaths} / {match.assists}
        </span>
        <span className="match-card__kda-ratio">{kda} KDA</span>
      </div>
    </div>
  );
}