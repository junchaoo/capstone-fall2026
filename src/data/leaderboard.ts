// Types and the region list for the Leaderboard page.
// The real ladder data comes from the backend (see src/api/leaderboard.ts).
export const LB_REGIONS = [
    { code: 'NA', name: 'North America' },
    { code: 'EUW', name: 'Europe West' },
    { code: 'EUNE', name: 'Europe Nordic & East' },
    { code: 'KR', name: 'Korea' },
    { code: 'JP', name: 'Japan' },
    { code: 'BR', name: 'Brazil' },
    { code: 'LAN', name: 'Latin America North' },
    { code: 'LAS', name: 'Latin America South' },
    { code: 'OCE', name: 'Oceania' },
    { code: 'TR', name: 'Türkiye' },
    { code: 'RU', name: 'Russia' },
    { code: 'PH', name: 'Philippines' },
    { code: 'SG', name: 'Singapore' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'VN', name: 'Vietnam' },
] as const;

export type RegionCode = (typeof LB_REGIONS)[number]['code'];
export type Tier = 'Challenger' | 'Grandmaster' | 'Master';

export interface LeaderboardEntry {
    id: string;
    name: string;      
    tag: string;       
    region: RegionCode;
    tier: Tier;
    lp: number;
    wins: number;
    losses: number;
}