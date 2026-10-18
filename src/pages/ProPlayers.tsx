import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardActionArea, Chip, Dialog, DialogContent, Divider, IconButton, InputAdornment, MenuItem, TextField, Typography, } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { proPlayers, ROLES, REGIONS } from '../data/proPlayers';
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

// Round gold avatar with the player's first letter (placeholder until we have photos)
function PlayerAvatar({ name, size }: { name: string; size: number }) {
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

    // Filters + which player's popup is open
    const [search, setSearch] = useState('');
    const [role, setRole] = useState<RoleFilter>('All');
    const [region, setRegion] = useState<RegionFilter>('All');
    const [selected, setSelected] = useState<ProPlayer | null>(null);

    // Apply search + role + region to the player list.
    // Search matches player name, team name, or any of their account names.
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return proPlayers.filter((p) => {
            if (role !== 'All' && p.role !== role) return false;
            if (region !== 'All' && p.region !== region) return false;
            if (!q) return true;
            return (
                p.name.toLowerCase().includes(q) ||
                p.team.toLowerCase().includes(q) ||
                p.accounts.some((a) => a.name.toLowerCase().includes(q))
            );
        });
    }, [search, role, region]);

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

                <Typography sx={{ color: mutedText, fontSize: 13, mb: 2 }}>
                    Showing {filtered.length} of {proPlayers.length} players
                </Typography>

                {/* Player card grid */}
                {filtered.length > 0 ? (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
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
                                    transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        borderColor: accentColor,
                                        boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                                    },
                                }}
                            >
                                <CardActionArea onClick={() => setSelected(p)} sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <PlayerAvatar name={p.name} size={56} />
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography sx={{ fontSize: 20, fontWeight: 700 }}>{p.name}</Typography>
                                            <Typography sx={{ color: mutedText, fontSize: 14 }}>{p.team}</Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                        <Chip
                                            size="small"
                                            label={p.role}
                                            sx={{
                                                backgroundColor: 'rgba(217,184,114,0.15)',
                                                color: accentColor,
                                                fontWeight: 600,
                                            }}
                                        />
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            label={p.region}
                                            sx={{ borderColor, color: '#cfd3e0' }}
                                        />
                                    </Box>

                                    <Typography sx={{ color: mutedText, fontSize: 13 }}>
                                        {p.accounts[0]
                                            ? `${p.accounts[0].server} · ${p.accounts[0].rank}`
                                            : p.league}
                                    </Typography>
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
                            <PlayerAvatar name={selected.name} size={72} />
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: 26, fontWeight: 700 }}>{selected.name}</Typography>
                                <Typography sx={{ color: mutedText }}>
                                    {selected.team} · {selected.role} · {selected.league}
                                </Typography>
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
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 2,
                                    py: 1,
                                    borderBottom: `1px solid ${borderColor}`,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Chip
                                        size="small"
                                        variant="outlined"
                                        label={a.server}
                                        sx={{ borderColor, color: '#cfd3e0' }}
                                    />
                                    <Typography sx={{ fontSize: 15 }}>{a.name}</Typography>
                                </Box>
                                <Typography sx={{ color: mutedText, fontSize: 14 }}>{a.rank}</Typography>
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
                        {selected.teamHistory.length === 0 && (
                            <Typography sx={{ color: mutedText, fontSize: 14 }}>No team history added yet.</Typography>
                        )}
                        {selected.teamHistory.map((t) => (
                            <Box
                                key={t.team + t.years}
                                sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}
                            >
                                <Typography sx={{ fontSize: 15 }}>{t.team}</Typography>
                                <Typography sx={{ color: mutedText, fontSize: 14 }}>{t.years}</Typography>
                            </Box>
                        ))}
                    </DialogContent>
                )}
            </Dialog>
        </Box>
    );
}