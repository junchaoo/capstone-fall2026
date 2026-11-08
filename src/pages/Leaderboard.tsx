import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    InputAdornment,
    MenuItem,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import { fetchLeaderboard } from '../api/leaderboard';
import { LB_REGIONS } from '../data/leaderboard';
import type { LeaderboardEntry, RegionCode, Tier } from '../data/leaderboard';

// Same palette as the login and Pro Players pages
const accentColor = '#D9B872';
const navyBg = '#0B0E1A';
const cardBg = '#111729';
const borderColor = 'rgba(255,255,255,0.08)';
const mutedText = '#9aa0b4';

// Medal colors for ranks 1-3
const MEDAL_COLORS = ['#D9B872', '#C0C7D4', '#C98A5B'];

// Badge colors for each tier
const TIER_STYLES: Record<Tier, { color: string; background: string }> = {
    Challenger: { color: '#D9B872', background: 'rgba(217,184,114,0.15)' },
    Grandmaster: { color: '#E5736B', background: 'rgba(229,115,107,0.15)' },
    Master: { color: '#B28DFF', background: 'rgba(178,141,255,0.15)' },
};

type RegionFilter = 'ALL' | RegionCode;
type SortKey = 'lp' | 'winRate' | 'games';
type RankedEntry = LeaderboardEntry & { rank: number };

const PAGE_SIZE = 25;

const winRateOf = (e: LeaderboardEntry) => {
    const games = e.wins + e.losses;
    return games > 0 ? e.wins / games : 0;
};
const gamesOf = (e: LeaderboardEntry) => e.wins + e.losses;

// Text box look (same idea as the login form)
const fieldSx = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: '6px',
        color: '#fff',
        '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
        '&:hover fieldset': { borderColor: accentColor },
        '&.Mui-focused fieldset': { borderColor: accentColor },
    },
    '& input::placeholder': { color: '#7d8397', opacity: 1 },
};

// Table header cell look
const headCellSx = {
    color: mutedText,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1.5,
    borderBottom: `1px solid ${borderColor}`,
    whiteSpace: 'nowrap' as const,
};

// Table body cell look
const bodyCellSx = { color: '#fff', borderBottom: `1px solid ${borderColor}` };

export default function Leaderboard() {
    const navigate = useNavigate();

    // Data from the backend
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [region, setRegion] = useState<RegionFilter>('NA');
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('lp');
    const [visible, setVisible] = useState(PAGE_SIZE);

    // load the saved ladders once when the page opens
    useEffect(() => {
        fetchLeaderboard()
            .then((data) => {
                setEntries(data.entries);
                setUpdatedAt(data.updatedAt);
            })
            .catch(() => setLoadError('Could not load the leaderboard. Is the backend running?'))
            .finally(() => setLoading(false));
    }, []);

    // Full name of the selected region, shown under the tabs
    const regionName =
        region === 'ALL' ? 'All regions combined' : LB_REGIONS.find((r) => r.code === region)?.name ?? region;

    const ranked = useMemo<RankedEntry[]>(() => {
        const pool = region === 'ALL' ? entries : entries.filter((e) => e.region === region);
        return [...pool].sort((a, b) => b.lp - a.lp).map((e, i) => ({ ...e, rank: i + 1 }));
    }, [entries, region]);

    // Apply the search box, then the "sort by" choice
    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        const filtered = q ? ranked.filter((e) => e.name.toLowerCase().includes(q)) : [...ranked];

        if (sortKey === 'winRate') filtered.sort((a, b) => winRateOf(b) - winRateOf(a));
        else if (sortKey === 'games') filtered.sort((a, b) => gamesOf(b) - gamesOf(a));
        // 'lp' keeps the order the ranking already has

        return filtered;
    }, [ranked, search, sortKey]);

    const shownRows = rows.slice(0, visible);

    const handleRegionChange = (value: string) => {
        setRegion(value as RegionFilter);
        setVisible(PAGE_SIZE);
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: navyBg, color: '#fff', textAlign: 'left' }}>
            <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 5 }, py: 4 }}>
                {/* Back link */}
                <Box
                    onClick={() => navigate('/')}
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer',
                        color: '#ccc',
                        mb: 5,
                        transition: 'color 0.2s ease',
                        '&:hover': { color: '#fff' },
                    }}
                >
                    <ArrowBackIcon sx={{ fontSize: 18 }} />
                    <Typography sx={{ fontSize: 14 }}>Back to home</Typography>
                </Box>

                {/* Page heading */}
                <Typography sx={{ color: accentColor, letterSpacing: 3, fontSize: 13, fontWeight: 700, mb: 1 }}>
                    RANKED LADDER
                </Typography>
                <Typography sx={{ fontSize: { xs: 34, md: 46 }, fontWeight: 800, lineHeight: 1.1, mb: 1.5 }}>
                    Leaderboard
                </Typography>
                <Typography sx={{ color: mutedText, fontSize: 16, mb: 1, maxWidth: 560 }}>
                    See the top ranked players in every region.
                </Typography>
                <Typography sx={{ color: '#6b7186', fontSize: 13, mb: 4 }}>
                    {updatedAt
                        ? `Ranked Solo/Duo. Last updated ${new Date(updatedAt).toLocaleString()}.`
                        : 'Ranked Solo/Duo.'}
                </Typography>

                {/* Region tabs */}
                <Box sx={{ borderBottom: `1px solid ${borderColor}`, mb: 1 }}>
                    <Tabs
                        value={region}
                        onChange={(_, value: string) => handleRegionChange(value)}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{
                            '& .MuiTabs-indicator': { backgroundColor: accentColor },
                            '& .MuiTab-root': { color: mutedText, fontWeight: 700, minWidth: 64 },
                            '& .MuiTab-root.Mui-selected': { color: accentColor },
                            '& .MuiTabs-scrollButtons': { color: mutedText },
                        }}
                    >
                        <Tab label="Global" value="ALL" />
                        {LB_REGIONS.map((r) => (
                            <Tab key={r.code} label={r.code} value={r.code} />
                        ))}
                    </Tabs>
                </Box>
                <Typography sx={{ color: mutedText, fontSize: 14, mb: 3 }}>{regionName}</Typography>

                {/* Search + sort */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    <TextField
                        placeholder="Search players"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setVisible(PAGE_SIZE);
                        }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: mutedText }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{ ...fieldSx, flex: 1, minWidth: 240 }}
                    />
                    <TextField
                        select
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value as SortKey)}
                        sx={{ ...fieldSx, minWidth: 220, '& .MuiSelect-icon': { color: mutedText } }}
                    >
                        <MenuItem value="lp">Sort by LP</MenuItem>
                        <MenuItem value="winRate">Sort by win rate</MenuItem>
                        <MenuItem value="games">Sort by games played</MenuItem>
                    </TextField>
                </Box>

                {/* Ranking table */}
                {loading ? (
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                        <CircularProgress sx={{ color: accentColor }} />
                    </Box>
                ) : loadError ? (
                    <Alert severity="error">{loadError}</Alert>
                ) : entries.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 10, color: mutedText }}>
                        <Typography sx={{ fontSize: 18, mb: 1 }}>No ranking data yet.</Typography>
                        <Typography sx={{ fontSize: 14 }}>
                            Run python refresh_leaderboard.py in the backend folder to fetch it from Riot.
                        </Typography>
                    </Box>
                ) : rows.length > 0 ? (
                    <>
                        <TableContainer
                            sx={{
                                backgroundColor: cardBg,
                                border: `1px solid ${borderColor}`,
                                borderRadius: 3,
                            }}
                        >
                            <Table sx={{ minWidth: 640 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ ...headCellSx, width: 70 }}>RANK</TableCell>
                                        <TableCell sx={headCellSx}>PLAYER</TableCell>
                                        {region === 'ALL' && <TableCell sx={headCellSx}>REGION</TableCell>}
                                        <TableCell sx={headCellSx}>TIER</TableCell>
                                        <TableCell sx={headCellSx} align="right">LP</TableCell>
                                        <TableCell sx={{ ...headCellSx, minWidth: 150 }}>WIN RATE</TableCell>
                                        <TableCell sx={headCellSx} align="right">GAMES</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {shownRows.map((e) => {
                                        const winRate = winRateOf(e);
                                        const medal = e.rank <= 3 ? MEDAL_COLORS[e.rank - 1] : null;
                                        return (
                                            <TableRow
                                                key={e.id}
                                                sx={{
                                                    backgroundColor: medal ? 'rgba(217,184,114,0.04)' : 'transparent',
                                                    transition: 'background-color 0.2s ease',
                                                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
                                                    '&:last-child td': { borderBottom: 0 },
                                                }}
                                            >
                                                {/* Rank (top 3 get a colored circle) */}
                                                <TableCell sx={bodyCellSx}>
                                                    {medal ? (
                                                        <Box
                                                            sx={{
                                                                width: 30,
                                                                height: 30,
                                                                borderRadius: '50%',
                                                                backgroundColor: medal,
                                                                color: '#1a1408',
                                                                fontWeight: 800,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            {e.rank}
                                                        </Box>
                                                    ) : (
                                                        <Typography sx={{ color: mutedText, fontWeight: 700, pl: 1 }}>
                                                            {e.rank}
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                {/* Player name + tag */}
                                                <TableCell sx={bodyCellSx}>
                                                    <Typography component="span" sx={{ fontWeight: 700 }}>
                                                        {e.name}
                                                    </Typography>
                                                    {e.tag && (
                                                        <Typography component="span" sx={{ color: mutedText, ml: 0.5 }}>
                                                            #{e.tag}
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                {/* Region (only in the Global view) */}
                                                {region === 'ALL' && (
                                                    <TableCell sx={bodyCellSx}>
                                                        <Chip
                                                            size="small"
                                                            variant="outlined"
                                                            label={e.region}
                                                            sx={{ borderColor, color: '#cfd3e0' }}
                                                        />
                                                    </TableCell>
                                                )}

                                                {/* Tier badge */}
                                                <TableCell sx={bodyCellSx}>
                                                    <Chip
                                                        size="small"
                                                        label={e.tier}
                                                        sx={{
                                                            backgroundColor: TIER_STYLES[e.tier].background,
                                                            color: TIER_STYLES[e.tier].color,
                                                            fontWeight: 700,
                                                        }}
                                                    />
                                                </TableCell>

                                                {/* LP */}
                                                <TableCell sx={{ ...bodyCellSx, fontWeight: 700 }} align="right">
                                                    {e.lp.toLocaleString()}
                                                </TableCell>

                                                {/* Win rate with a small bar */}
                                                <TableCell sx={bodyCellSx}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Typography sx={{ fontSize: 14, width: 42 }}>
                                                            {Math.round(winRate * 100)}%
                                                        </Typography>
                                                        <Box
                                                            sx={{
                                                                flex: 1,
                                                                height: 6,
                                                                borderRadius: 3,
                                                                backgroundColor: 'rgba(255,255,255,0.08)',
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    width: `${winRate * 100}%`,
                                                                    height: '100%',
                                                                    backgroundColor: accentColor,
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                    <Typography sx={{ color: mutedText, fontSize: 12, mt: 0.25 }}>
                                                        {e.wins}W {e.losses}L
                                                    </Typography>
                                                </TableCell>

                                                {/* Games played */}
                                                <TableCell sx={{ ...bodyCellSx, color: mutedText }} align="right">
                                                    {gamesOf(e)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Show more */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                            <Typography sx={{ color: mutedText, fontSize: 13 }}>
                                Showing {shownRows.length} of {rows.length} players
                            </Typography>
                            {visible < rows.length && (
                                <Button
                                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                                    sx={{ color: accentColor, fontWeight: 600 }}
                                >
                                    Show more
                                </Button>
                            )}
                        </Box>
                    </>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 10, color: mutedText }}>
                        <Typography sx={{ fontSize: 18, mb: 1 }}>No players match your search.</Typography>
                        <Typography sx={{ fontSize: 14 }}>Try a different name.</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}