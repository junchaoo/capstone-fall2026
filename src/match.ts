export interface SummonersRiftMatch 
{
  kind: 'summonersRift';
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

export interface ArenaItem
{
  iconUrl: string;
  prismatic: boolean;
}

export interface ArenaTeamPlayer
{
  puuid: string;
  name: string;
  tagLine: string;
  championName: string;
  championIconUrl: string;
  isMe: boolean;
}

export interface ArenaTeam
{
  placement: number;
  players: ArenaTeamPlayer[];
}

export interface ArenaMatch
{
  kind: 'arena';
  matchId: string;
  queueId: number;
  win: boolean;
  placement: number;
  championName: string;
  championIconUrl: string;
  champLevel: number;
  kills: number;
  deaths: number;
  assists: number;
  gameDuration: number;
  gameEndTimestamp: number;
  items: (ArenaItem | null)[];
  augments: ArenaAugment[];
  teams: ArenaTeam[];
}

export interface ArenaAugment
{
  name: string;
  iconUrl: string | null;
  rarity: number;
}

export type MatchSummary = SummonersRiftMatch | ArenaMatch;

