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

  function timeAgo(timestamp: number): string
  {
    const seconds = Math.floor((Date.now() - timestamp) / 1000); // Date.now returns in milliseconds
    const units: [string, number][] =                            // convert to seconds
    [
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60],
    ];

    for (const [name, size] of units)
    {
      const value = Math.floor(seconds / size);
      if (value >= 1) return `${value} ${name}${value > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  }
 
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

  const [spell1, spell2] = match.summonerSpellIconUrls; // spell1 on D hotkey, spell2 on F hotkey

  const KDA = match.deaths === 0 ? 'Perfect' : ((match.kills + match.assists) / match.deaths).toFixed(2);

  const minutes = Math.floor(match.gameDuration / 60);
  const seconds = match.gameDuration % 60;

  const csPerMin = (match.cs / (match.gameDuration / 60)).toFixed(1);

  const [item0, item1, item2, item3, item4, item5, trinket] = match.itemIconUrls; 

  // KP = kill participation
  const KP = match.teamKills > 0 ? Math.round(((match.kills + match.assists) / match.teamKills) * 100) : 0;
  
 
  return (
    <div className={`match-card ${match.win ? 'match-card--win' : 'match-card--loss'}`}>
  
      {/* champion and role and match date*/}
      <div className="match-card__champion-col">
        <span className="match-card__queue">{queueName}</span>

        <div className="match-card__champion-row">
          <div className="match-card__portrait">
            <div className="match-card__champion-wrapper">
              <img src={match.championIconUrl} alt={match.championName} className="match-card__champion" />
            </div>
            <span className="match-card__level">{match.champLevel}</span>
            {roleIcon && <img src={roleIcon} alt={match.teamPosition} className="match-card__role" />}
          </div>
          
          
          {/* summoner spells and runes */}
          <div className="match-card__loadout">
            <div className="match-card__spells">
              <Slot url={spell1} className="match-card__slot--spell" />
              <Slot url={spell2} className="match-card__slot--spell" />
            </div>
            <div className="match-card__runes">
              <Slot url={match.keystoneIconUrl} className="match-card__slot--rune match-card__slot--keystone" />
              <Slot url={match.secondaryTreeIconUrl} className="match-card__slot--rune match-card__slot--secondary" />
            </div>
          </div>
        </div>
        <span className="match-card__date">{timeAgo(match.gameEndTimestamp)}</span>
      </div>
    
      {/* victory/death and match duration */}
      <div className="match-card__info">
        <span className="match-card__result">{match.win ? 'Victory' : 'Defeat'}</span>
        <span className="match-card__duration">
          {minutes}m {seconds}s
        </span>
      </div>

      {/* KDA, KDA ratio, CS, kill participation*/}
      <div className="match-card__stats">
        <span className="match-card__kda-text">
          {match.kills} / {match.deaths} / {match.assists}
        </span>
        <span className="match-card__kda-ratio">{KDA} KDA</span>
        <span className="match-card__cs"> {match.cs} CS ({csPerMin}) </span>
        <span className="match-card__kp">{KP}% KP</span>
      </div>

      {/* items + tricket and vision score */}
      <div className="match-card__build">
        <Slot url={item0} className="match-card__slot--item" />
        <Slot url={item1} className="match-card__slot--item" />
        <Slot url={item2} className="match-card__slot--item" />
        <Slot url={trinket} className="match-card__slot--trinket" />

        <div className="match-card__vision" title="Vision score">
          <span className="match-card__vision-value">{match.visionScore}</span>
        </div>

        <Slot url={item3} className="match-card__slot--item" />
        <Slot url={item4} className="match-card__slot--item" />
        <Slot url={item5} className="match-card__slot--item" />
        <Slot url={match.questItemIconUrl} className="match-card__slot--trinket" />
      </div>

      {/* players in the match */}
      <div className="match-card__players">
        {match.players.map((p) => (
          <div key={p.puuid} className={`match-card__player ${p.isMe ? 'match-card__player--me' : ''}`}>
            <img src={p.championIconUrl} alt={p.championName} className="match-card__player-icon" />
            <span className="match-card__player-name" title={`${p.name}#${p.tagLine}`}>{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}