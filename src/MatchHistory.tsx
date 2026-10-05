import { useEffect, useState } from 'react';
import { fetchSummoner, fetchMatches, type SummonerInfo } from './riotAPI';
import type { MatchSummary } from './match';
import MatchCard from './MatchCard';
import './MatchHistory.css';
 
interface MatchHistoryProps 
{
  gameName: string;
  tagLine: string;
}
 
export default function MatchHistory({ gameName, tagLine }: MatchHistoryProps) 
{
  const [summoner, setSummoner] = useState<SummonerInfo | null>(null);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  useEffect(() => 
  {
    let cancelled = false; // avoids setting state if the component unmounts mid-fetch
    
    async function load() 
    {
        setLoading(true);
        setError(null); 
        try 
        {
            const summonerData = await fetchSummoner(gameName, tagLine);
            if (cancelled) return;
            setSummoner(summonerData);
    
            const matchData = await fetchMatches(summonerData.puuid);
            if (cancelled) return;
            setMatches(matchData);
        } 
        catch (err) 
        {
            if (!cancelled) 
            {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            }
        } 
        finally 
        {
            if (!cancelled) setLoading(false);
        }
    }
        load();

        return () => 
        {
            cancelled = true;
        };
  }, [gameName, tagLine]);
 
  if (loading) return <p className="match-history__status">Loading match history…</p>;
  if (error) return <p className="match-history__status match-history__status--error">{error}</p>;
 
  return (
    <div className="match-history">
      {summoner && (
        <div className="match-history__header">
          <img src={summoner.profileIconUrl} alt="" className="match-history__icon" />
          <div>
            <h2>
              {summoner.gameName}
              <span className="match-history__tag">#{summoner.tagLine}</span>
            </h2>
          </div>
        </div>
      )}
 
      <div className="match-history__list">
        {matches.map((match) => (
          <MatchCard key={match.matchId} match={match} />
        ))}
      </div>
    </div>
  );
}