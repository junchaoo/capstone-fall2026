import type { MatchSummary } from './match';
import './MatchHistory.css';
 
interface MatchCardProps 
{
  match: MatchSummary;
}
 
  const ROLE_ICONS: Record<string, string> = 
  {
    TOP: '/role_icons/toplane_icon.png',
    JUNGLE: '/role_icons/jungle_icon.png',
    MIDDLE: '/role_icons/midlane_icon.png',
    BOTTOM: '/role_icons/botlane_icon.png',
    UTILITY: '/role_icons/support_icon.png',
  };

  const QUEUE_NAMES: Record<number, string> = 
  {
    420: 'Ranked Solo/Duo',
    440: 'Ranked Flex',
    400: 'Normal Draft',
    450: 'ARAM',
  };

  function Slot({ url, className = '' }: { url: string | null; className?: string }) 
  {
    return url ? (
      <img src={url} alt="" className={`match-card__slot ${className}`} />
    ) : (
      <div className={`match-card__slot match-card__slot--empty ${className}`} />
    );
  }

export default function MatchCard({ match }: MatchCardProps) 
{
  const roleIcon = ROLE_ICONS[match.teamPosition];

  const queueName = QUEUE_NAMES[match.queueId];

  const kda = match.deaths === 0 ? 'Perfect' : ((match.kills + match.assists) / match.deaths).toFixed(2);
 
  const minutes = Math.floor(match.gameDuration / 60);
  const seconds = match.gameDuration % 60;

  const [item0, item1, item2, item3, item4, item5, trinket] = match.itemIconUrls; 
 
  return (
    <div className={`match-card ${match.win ? 'match-card--win' : 'match-card--loss'}`}>

      <div className="match-card__champion-col">
        <div className="match-card__portrait">
          <div className="match-card__champion-wrapper">
            <img src={match.championIconUrl} alt={match.championName} className="match-card__champion" />
          </div>
          {roleIcon && <img src={roleIcon} alt={match.teamPosition} className="match-card__role" />}
        </div>
        <span className="match-card__queue">{queueName}</span>
      </div>
      

      <div className="match-card__info">
        <span className="match-card__result">{match.win ? 'Victory' : 'Defeat'}</span>
        <span className="match-card__duration">
          {minutes}m {seconds}s
        </span>
      </div>

      <div className="match-card__build">
        <Slot url={item0} className="match-card__slot--item" />
        <Slot url={item1} className="match-card__slot--item" />
        <Slot url={item2} className="match-card__slot--item" />
        <Slot url={trinket} className="match-card__slot--trinket" />

        <div className="match-card__vision" title="Vision score">
          <span className="match-card__vision-value">{match.visionScore}</span>
          <span className="match-card__vision-label"></span>
        </div>

        <Slot url={item3} className="match-card__slot--item" />
        <Slot url={item4} className="match-card__slot--item" />
        <Slot url={item5} className="match-card__slot--item" />
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