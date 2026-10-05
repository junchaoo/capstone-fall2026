import type { MatchSummary } from './match.ts' 
const API_BASE = 'http://localhost:5000/api';
 
export interface SummonerInfo 
{
  puuid: string;
  gameName: string;
  tagLine: string;
  profileIconUrl: string;
  items: string;
}
 
export async function fetchSummoner(gameName: string, tagLine: string): Promise<SummonerInfo> 
{
  const res = await fetch(
    `${API_BASE}/summoner?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}`
);

  if (!res.ok) throw new Error('Could not find that summoner');
  return res.json();
}
 
export async function fetchMatches(puuid: string, count = 10, queue = 420): Promise<MatchSummary[]>
{
  const res = await fetch(`${API_BASE}/matches?puuid=${puuid}&count=${count}&queue=${queue}`);
  
  if (!res.ok) throw new Error('Could not load match history');
  return res.json();
}

