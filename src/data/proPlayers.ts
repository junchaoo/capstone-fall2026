// accounts, socials and teamHistory are intentionally EMPTY for now.

export const ROLES = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'] as const;
export const REGIONS = ['KR', 'CN', 'EU', 'NA', 'APAC', 'BR'] as const;
export type Role = (typeof ROLES)[number];
export type Region = (typeof REGIONS)[number];
export type League = 'LCK' | 'LPL' | 'LEC' | 'LCS' | 'LCP' | 'CBLOL';

export interface ProAccount {
    server: string;
    name: string;
    rank: string;
}

export interface ProSocial {
    platform: 'X' | 'Twitch' | 'Instagram' | 'YouTube';
    handle: string;
    url: string;
}

export interface ProTeamStint {
    team: string;
    years: string;
}

export interface ProPlayer {
    id: string;
    name: string;
    team: string;
    role: Role;
    region: Region;
    league: League;
    accounts: ProAccount[];
    socials: ProSocial[];
    teamHistory: ProTeamStint[];
}

interface TeamEntry {
    team: string;
    league: League;
    region: Region;
    // Always in this order: Top, Jungle, Mid, ADC (bot lane), Support
    roster: string[];
}

const worldsTeams: TeamEntry[] = [
    // LCK (Korea)
    { team: 'Gen.G', league: 'LCK', region: 'KR', roster: ['Kiin', 'Canyon', 'Chovy', 'Ruler', 'Duro'] },
    { team: 'Hanwha Life Esports', league: 'LCK', region: 'KR', roster: ['Zeus', 'Kanavi', 'Zeka', 'Gumayusi', 'Delight'] },
    { team: 'T1', league: 'LCK', region: 'KR', roster: ['Doran', 'Oner', 'Faker', 'Peyz', 'Keria'] },
    { team: 'Dplus KIA', league: 'LCK', region: 'KR', roster: ['Siwoo', 'Lucid', 'ShowMaker', 'Smash', 'Career'] },

    // LPL (China)
    { team: "Anyone's Legend", league: 'LPL', region: 'CN', roster: ['Breathe', 'Tarzan', 'Shanks', 'hope', 'Kael'] },
    { team: 'Bilibili Gaming', league: 'LPL', region: 'CN', roster: ['bin', 'XUN', 'Knight', 'Viper', 'ON'] },
    // Regular top laner ZUIAN was still sorting out a US visa, so 369 is listed as the temporary replacement
    { team: 'Top Esports', league: 'LPL', region: 'CN', roster: ['369', 'Tian', 'Creme', 'JackeyLove', 'Zhuo'] },
    { team: 'Shanghai Invictus Gaming', league: 'LPL', region: 'CN', roster: ['TheShy', 'Wei', 'Rookie', 'JiaQi', 'meiko'] },

    // LEC (Europe / EMEA)
    { team: 'G2 Esports', league: 'LEC', region: 'EU', roster: ['BrokenBlade', 'SkewMond', 'Caps', 'hans sama', 'Labrov'] },
    { team: 'Movistar KOI', league: 'LEC', region: 'EU', roster: ['Myrwn', 'Elyoya', 'jojopyun', 'Supa', 'Alvaro'] },
    { team: 'Karmine Corp', league: 'LEC', region: 'EU', roster: ['Canna', 'Yike', 'Kyeahoo', 'Caliste', 'Busio'] },

    // LCS (North America)
    { team: 'Team Liquid Alienware', league: 'LCS', region: 'NA', roster: ['Morgan', 'Josedeodo', 'Quid', 'Yeon', 'CoreJJ'] },
    { team: 'LYON', league: 'LCS', region: 'NA', roster: ['Dhokla', 'Inspired', 'Saint', 'Berserker', 'Isles'] },
    { team: 'Cloud9 KIA', league: 'LCS', region: 'NA', roster: ['Thanatos', 'Blaber', 'Loki', 'Tactical', 'Vulcan'] },

    // LCP (Asia-Pacific)
    { team: 'Team Secret Whales', league: 'LCP', region: 'APAC', roster: ['Pun', 'Hizto', 'Dire', 'Eddie', 'Bie'] },
    { team: 'CTBC Flying Oyster', league: 'LCP', region: 'APAC', roster: ['Rest', 'Shad0w', 'Pout', 'Doggo', 'Kino'] },
    { team: 'MVK Esports', league: 'LCP', region: 'APAC', roster: ['Kratos', 'Gury', 'Chika', 'Harky', 'SiuLoong'] },

    // CBLOL (Brazil)
    { team: 'LOS', league: 'CBLOL', region: 'BR', roster: ['ZEST', 'Curse', 'Feisty', 'Duduhh', 'Ackerman'] },
    { team: 'FURIA Esports', league: 'CBLOL', region: 'BR', roster: ['Guigo', 'Tatu', 'Tutsz', 'Ayu', 'Jojo'] },
];


const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

// Turns the team list above into one entry per player
export const proPlayers: ProPlayer[] = worldsTeams.flatMap((t) =>
    t.roster.map(
        (name, i): ProPlayer => ({
            id: `${slug(t.team)}-${slug(name)}`,
            name,
            team: t.team,
            role: ROLES[i],
            region: t.region,
            league: t.league,
            accounts: [],
            socials: [],
            teamHistory: [],
        }),
    ),
);