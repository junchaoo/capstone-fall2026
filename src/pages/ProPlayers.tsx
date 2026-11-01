import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Card,
    CardActionArea,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    Divider,
    IconButton,
    InputAdornment,
    MenuItem,
    TextField,
    Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { fetchPros } from '../api/pros';
import { ROLES, REGIONS } from '../data/proPlayers';
import type { ProPlayer, Role, Region } from '../data/proPlayers';

// Same palette as the login page
const accentColor = '#D9B872';
const navyBg = '#0B0E1A';
const cardBg = '#111729';
const borderColor = 'rgba(255,255,255,0.08)';
const mutedText = '#9aa0b4';

type RoleFilter = 'All' | Role;
type RegionFilter = 'All' | Region;

const roleOptions: RoleFilter[] = ['All', ...ROLES];
const regionOptions: RegionFilter[] = ['All', ...REGIONS];

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

// Small gold section heading used inside the detail popup
const sectionLabelSx = { color: accentColor, letterSpacing: 2, fontSize: 12, fontWeight: 700, mb: 1.5 };


// Image pieces. Each one shows a placeholder if the image is missing,
// so the page still looks good before any pictures are added.


// Team logo. Fallback: a small gold badge with the team's first letters.
function TeamLogo({ src, team, size }: { src?: string | null; team: string; size: number }) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <Box
                sx={{
                    width: size,
                    height: size,
                    borderRadius: '10px',
                    backgroundColor: 'rgba(217,184,114,0.15)',
                    border: `1px solid rgba(217,184,114,0.35)`,
                    color: accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: size * 0.32,
                    flexShrink: 0,
                }}
            >
                {team.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase()}
            </Box>
        );
    }

    return (
        <img
            src={src}
            alt={`${team} logo`}
            onError={() => setFailed(true)}
            style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
        />
    );
}

// Big headshot on the right side of a card. Fallback: a huge faded initial.
function CardPhoto({ src, name }: { src?: string | null; name: string }) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <Typography
                sx={{
                    position: 'absolute',
                    right: 20,
                    bottom: -14,
                    fontSize: 150,
                    fontWeight: 800,
                    lineHeight: 1,
                    color: 'rgba(217,184,114,0.12)',
                    userSelect: 'none',
                }}
            >
                {name.charAt(0).toUpperCase()}
            </Typography>
        );
    }

    return (
        <img
            src={src}
            alt={name}
            onError={() => setFailed(true)}
            style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                height: '100%',
                width: '58%',
                objectFit: 'cover',
                objectPosition: 'top center',
            }}
        />
    );
}

// Round avatar for the popup header. Fallback: gold circle with the first letter.
function PlayerAvatar({ src, name, size }: { src?: string | null; name: string; size: number }) {
    const [failed, setFailed] = useState(false);

    if (src && !failed) {
        return (
            <img
                src={src}
                alt={name}
                onError={() => setFailed(true)}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    objectPosition: 'top center',
                    flexShrink: 0,
                }}
            />
        );
    }

    return (
        <Box
            sx={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${accentColor}, #a98b45)`,
                color: '#1a1408',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: size * 0.42,
                flexShrink: 0,
            }}
        >
            {name.charAt(0)}
        </Box>
    );
}

export default function ProPlayers() {
    const navigate = useNavigate();

    // Data from the backend
    const [players, setPlayers] = useState<ProPlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    // Filters + which player's popup is open
    const [search, setSearch] = useState('');
    const [role, setRole] = useState<RoleFilter>('All');
    const [region, setRegion] = useState<RegionFilter>('All');
    const [selected, setSelected] = useState<ProPlayer | null>(null);

    // Load the players once, when the page opens
    useEffect(() => {
        fetchPros()
            .then(setPlayers)
            .catch(() => setLoadError('Could not load players. Is the backend running?'))
            .finally(() => setLoading(false));
    }, []);

    // Apply search + role + region to the player list.
    // Search matches player name, team name, or any of their account names.
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return players.filter((p) => {
            if (role !== 'All' && p.role !== role) return false;
            if (region !== 'All' && p.region !== region) return false;
            if (!q) return true;
            return (
                p.name.toLowerCase().includes(q) ||
                p.team.toLowerCase().includes(q) ||
                p.accounts.some((a) => a.name.toLowerCase().includes(q))
            );
        });
    }, [players, search, role, region]);

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: navyBg, color: '#fff', textAlign: 'left' }}>
            <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 5 }, py: 4 }}>
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
                    TRACK THE PROS
                </Typography>
                <Typography sx={{ fontSize: { xs: 34, md: 46 }, fontWeight: 800, lineHeight: 1.1, mb: 1.5 }}>
                    Pro Players
                </Typography>
                <Typography sx={{ color: mutedText, fontSize: 16, mb: 4, maxWidth: 560 }}>
                    Browse professional players, their accounts and their socials in one place.
                </Typography>

                {/* Search + region filter */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    <TextField
                        placeholder="Search players, teams or account names"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: mutedText }} />
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{ ...fieldSx, flex: 1, minWidth: 260 }}
                    />
                    <TextField
                        select
                        value={region}
                        onChange={(e) => setRegion(e.target.value as RegionFilter)}
                        sx={{ ...fieldSx, minWidth: 160, '& .MuiSelect-icon': { color: mutedText } }}
                    >
                        {regionOptions.map((r) => (
                            <MenuItem key={r} value={r}>
                                {r === 'All' ? 'All regions' : r}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>

                {/* Role filter chips */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {roleOptions.map((r) => {
                        const active = role === r;
                        return (
                            <Chip
                                key={r}
                                label={r}
                                clickable
                                onClick={() => setRole(r)}
                                variant={active ? 'filled' : 'outlined'}
                                sx={{
                                    fontWeight: 600,
                                    borderColor,
                                    color: active ? '#1a1408' : '#cfd3e0',
                                    backgroundColor: active ? accentColor : 'transparent',
                                    '&:hover': {
                                        backgroundColor: active ? accentColor : 'rgba(255,255,255,0.06)',
                                    },
                                }}
                            />
                        );
                    })}
                </Box>

                {!loading && !loadError && (
                    <Typography sx={{ color: mutedText, fontSize: 13, mb: 2 }}>
                        Showing {filtered.length} of {players.length} players
                    </Typography>
                )}

                {/* Loading / error / cards / empty */}
                {loading ? (
                    <Box sx={{ textAlign: 'center', py: 10 }}>
                        <CircularProgress sx={{ color: accentColor }} />
                    </Box>
                ) : loadError ? (
                    <Alert severity="error">{loadError}</Alert>
                ) : filtered.length > 0 ? (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: 3,
                        }}
                    >
                        {filtered.map((p) => (
                            <Card
                                key={p.id}
                                sx={{
                                    backgroundColor: cardBg,
                                    backgroundImage: 'none',
                                    color: '#fff',
                                    border: `1px solid ${borderColor}`,
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        borderColor: accentColor,
                                        boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                                    },
                                }}
                            >
                                <CardActionArea
                                    onClick={() => setSelected(p)}
                                    sx={{ position: 'relative', display: 'block', height: 230 }}
                                >
                                    {/* Soft gold glow in the corner */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            background:
                                                'linear-gradient(135deg, rgba(217,184,114,0.10), rgba(0,0,0,0) 60%)',
                                        }}
                                    />

                                    {/* Headshot (right side) */}
                                    <CardPhoto src={p.photoUrl} name={p.name} />

                                    {/* Dark fade at the bottom so the text stays readable */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            background:
                                                'linear-gradient(to top, rgba(11,14,26,0.9), rgba(11,14,26,0) 55%)',
                                        }}
                                    />

                                    {/* Team logo (top left) */}
                                    <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
                                        <TeamLogo src={p.logoUrl} team={p.team} size={44} />
                                    </Box>

                                    {/* Name, role and team (bottom left) */}
                                    <Box sx={{ position: 'absolute', left: 20, bottom: 18, right: '42%' }}>
                                        <Typography sx={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1, mb: 0.5 }}>
                                            {p.name}
                                        </Typography>
                                        <Typography
                                            sx={{ color: accentColor, letterSpacing: 1.5, fontSize: 12, fontWeight: 700 }}
                                        >
                                            {p.role.toUpperCase()} · {p.league}
                                        </Typography>
                                        <Typography sx={{ color: mutedText, fontSize: 13, mt: 0.25 }}>
                                            {p.team}
                                        </Typography>
                                    </Box>
                                </CardActionArea>
                            </Card>
                        ))}
                    </Box>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 10, color: mutedText }}>
                        <Typography sx={{ fontSize: 18, mb: 1 }}>No players match your filters.</Typography>
                        <Typography sx={{ fontSize: 14 }}>Try a different search, role or region.</Typography>
                    </Box>
                )}

            </Box>

            {/* Player detail popup */}
            <Dialog
                open={selected !== null}
                onClose={() => setSelected(null)}
                fullWidth
                maxWidth="sm"
                slotProps={{
                    paper: {
                        sx: {
                            backgroundColor: '#0f1424',
                            backgroundImage: 'none',
                            color: '#fff',
                            border: `1px solid ${borderColor}`,
                            borderRadius: 3,
                        },
                    },
                }}
            >
                {selected && (
                    <DialogContent sx={{ p: 4 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <PlayerAvatar src={selected.photoUrl} name={selected.name} size={72} />
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: 26, fontWeight: 700 }}>{selected.name}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <TeamLogo src={selected.logoUrl} team={selected.team} size={22} />
                                    <Typography sx={{ color: mutedText }}>
                                        {selected.team} · {selected.role} · {selected.league}
                                    </Typography>
                                </Box>
                            </Box>
                            <IconButton
                                aria-label="Close"
                                onClick={() => setSelected(null)}
                                sx={{ color: mutedText, alignSelf: 'flex-start' }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>

                        <Divider sx={{ borderColor, mb: 3 }} />

                        {/* Accounts */}
                        <Typography sx={sectionLabelSx}>ACCOUNTS</Typography>
                        {selected.accounts.length === 0 && (
                            <Typography sx={{ color: mutedText, fontSize: 14 }}>No accounts added yet.</Typography>
                        )}
                        {selected.accounts.map((a) => (
                            <Box
                                key={a.name}
                                sx={{
                                    py: 1,
                                    borderBottom: `1px solid ${borderColor}`,
                                }}
                            >
                                <Typography sx={{ fontSize: 15 }}>
                                    {a.name}
                                </Typography>
                            </Box>
                        ))}

                        {/* Socials */}
                        <Typography sx={{ ...sectionLabelSx, mt: 3 }}>SOCIALS</Typography>
                        {selected.socials.length === 0 && (
                            <Typography sx={{ color: mutedText, fontSize: 14 }}>No socials added yet.</Typography>
                        )}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {selected.socials.map((s) => (
                                <Chip
                                    key={s.platform}
                                    component="a"
                                    href={s.url}
                                    clickable
                                    label={`${s.platform}  ${s.handle}`}
                                    sx={{
                                        backgroundColor: 'rgba(217,184,114,0.15)',
                                        color: accentColor,
                                        fontWeight: 600,
                                    }}
                                />
                            ))}
                        </Box>

                        {/* Team history */}
                        <Typography sx={{ ...sectionLabelSx, mt: 3 }}>TEAM HISTORY</Typography>

                        {selected.leaguepediaUrl ? (
                            <Chip
                                component="a"
                                href={selected.leaguepediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                clickable
                                label="View Leaguepedia Page →"
                                sx={{
                                    backgroundColor: 'rgba(217,184,114,0.15)',
                                    color: accentColor,
                                    fontWeight: 600,
                                }}
                            />
                        ) : (
                            <Typography sx={{ color: mutedText, fontSize: 14 }}>
                                No Leaguepedia page added yet.
                            </Typography>
                        )}
                    </DialogContent>
                )}
            </Dialog>
        </Box>
    );
}