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
}



