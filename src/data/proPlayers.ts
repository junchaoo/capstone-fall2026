export const ROLES = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'] as const;
export const REGIONS = ['KR', 'CN', 'EU', 'NA', 'APAC', 'BR'] as const;

export type Role = (typeof ROLES)[number];
export type Region = (typeof REGIONS)[number];
export type League = 'LCK' | 'LPL' | 'LEC' | 'LCS' | 'LCP' | 'CBLOL';

export interface ProAccount {
    name: string;
}

export interface ProSocial {
    platform: 'X' | 'Twitch' | 'Instagram' | 'YouTube';
    handle: string;
    url: string;
}

export interface ProPlayer {
    id: string;
    name: string;
    team: string;
    role: Role;
    region: Region;
    league: League;
    logoUrl?: string | null;
    photoUrl?: string | null;
    accounts: ProAccount[];
    socials: ProSocial[];
    leaguepediaUrl?: string | null;
}