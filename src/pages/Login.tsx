import { useState } from 'react'; 
import { Box, Button, TextField, Typography, Alert, CircularProgress, Checkbox, FormControlLabel, Link, } from '@mui/material';

const accentColor = '#39d3d3';

export default function Login(){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [staySignedIn, setStaySignedIn] = useState(false);

    const valid = () => {
        if (!email || !password){
            setError("Email and Password Required!");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!valid()) return;

        setLoading(true);

        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log('Fake login attempt:', { email, password, staySignedIn });
        setLoading(false);
    };

    return(
        <Box sx={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
        
        <Box
            sx={{
            width: { xs: '100%', md: 600 },
            backgroundColor: '#111318',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            px: 5,
            position: 'relative',
            zIndex: 1,
            transition: 'width 0.4s ease, box-shadow 0.4s ease',
            '&:hover': {
                width: { xs: '100%', md: 800 },
                boxShadow: '10px 0 40px rgba(0, 0, 0, 1)',
                backgroundColor: '#050505',
            },

            '&:hover .brand-title' : {
                color: '#000000',
                fontSize: 62,
            },
            '&:hover .sign-in-lablel': {
                color: '#ffffff',
            },
            '&:hover .MuiInputBase-input': {
            color: '#ffffff',
            },
            '&:hover .MuiInput-underline:before': {
            borderBottomColor: '#111318',
            },
            '&:hover .MuiFormLabel-root, &:hover .MuiInputLabel-root': {
            color: '#111318',
            },
            '&:hover .stay-signed-in-label': {
            color: '#d31717',
            },
          }}
        >
            <Typography
                className="brand-title"
                sx={{
                color: '#fdfdfc',
                fontSize: 42,
                fontWeight: 700,
                mb: 4,
                letterSpacing: 0.5,
                transition: 'color 0.4s ease, font-size 0.4s ease',
              }}
            >
              LevelUp.GG
            </Typography>

            <Typography
            sx={{
                color: '#e5e5e5',
                letterSpacing: 3,
                fontSize: 14,
                mb: 3,
                fontWeight: 500,
            }}
            >
            SIGN-IN
            </Typography>

            {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
            )}

            <form onSubmit={handleSubmit}>
            <TextField
                variant="standard"
                placeholder="USERNAME"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                mb: 2,
                input: { color: '#fff' },
                '& .MuiInput-underline:before': { borderBottomColor: '#333' },
                '& .MuiInput-underline:hover:before': {
                    borderBottomColor: accentColor,
                },
                '& .MuiInput-underline:after': {
                    borderBottomColor: accentColor,
                },
                }}
            />

            <TextField
                variant="standard"
                placeholder="PASSWORD"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                mb: 1,
                input: { color: '#fff' },
                '& .MuiInput-underline:before': { borderBottomColor: '#333' },
                '& .MuiInput-underline:hover:before': {
                    borderBottomColor: accentColor,
                },
                '& .MuiInput-underline:after': {
                    borderBottomColor: accentColor,
                },
                }}
            />

            <FormControlLabel
                control={
                <Checkbox
                    checked={staySignedIn}
                    onChange={(e) => setStaySignedIn(e.target.checked)}
                    sx={{
                    color: '#ffffff',
                    '&.Mui-checked': { color: accentColor },
                    }}
                />
                }
                label={
                <Typography sx={{ color: '#999', fontSize: 13 }}>
                    Stay signed in
                </Typography>
                }
                sx={{ mb: 2 }}
            />

            <Button
                type="submit"
                fullWidth
                disabled={loading}
                sx={{
                backgroundColor: accentColor,
                color: '#0d0d0d',
                fontWeight: 600,
                py: 1.2,
                '&:hover': { backgroundColor: '#ffffff' },
                }}
            >
                {loading ? <CircularProgress size={22} sx={{ color: '#0d0d0d' }} /> : 'LOGIN'}
            </Button>
            </form>
        </Box>

        
        <Box
            sx={{
                flex: 1,
                display: { xs: 'none', md: 'block' },
                position: 'relative',
                overflow: 'hidden',
            }}
            >
            <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                }}
            >
                <source src="/lolvideo.mp4" type="video/mp4" />
            </video>

            <Box
                sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0))',
                }}
            />
            </Box>
        </Box>
    );
}