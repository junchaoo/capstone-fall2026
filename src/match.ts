export interface MatchSummary 
{
  matchId: string;
  championName: string;
  championIconUrl: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  gameDuration: number; //seconds
  queueId: number;
  items: number[];
  itemIconUrls: (string | null)[];
  teamPosition: 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY' | '';
  visionScore: number;
  gameEndTimestamp: number;
  summonerSpellIconUrls: (string | null)[];
  questItemIconUrl: string | null;
  cs: number;
  keystoneIconUrl: string | null;
  secondaryTreeIconUrl: string | null;
  champLevel: number;
  players: MatchPlayer[];
  teamKills: number;
}

export interface MatchPlayer 
{
  puuid: string;
  name: string;
  tagLine: string;
  championName: string;
  championIconUrl: string;
  teamId: number;
  isMe: boolean;
}



