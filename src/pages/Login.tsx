import { useState } from 'react'; 
import { Box, Button, TextField, Typography, Alert, CircularProgress, Checkbox, FormControlLabel, Link, } from '@mui/material';
import { useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

//accent color used for inputs, checkbox, and button
const accentColor = '#D9B872';
const navyBg = '#0B0E1A';

export default function Login(){
    // Form field values
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Sign up state 
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [mode, setMode] = useState<'signin' | 'signup'> ('signin');
    const [visible, setVisible] = useState(true);

    // Error message + loading state (for the submit button spinner)
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // "Stay signed in" checkbox value
    const [staySignedIn, setStaySignedIn] = useState(false);

    //video toggle states 
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);

    const [isHovering, setIsHovering] = useState(false);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setIsMuted(video.muted);
    };

    //switches between sign in and signup aslo fades out and in the two forms
    const switchMode = (newMode: 'signin' | 'signup') => {
        setVisible(false);
        setError('');
        setTimeout(() => {
            setMode(newMode);
            setVisible(true);
        }, 200); 
    }

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password){
            setError('Please fill in both fields.');
            return;
        }
        setLoading(true);
        await new Promise ((r) => setTimeout(r, 1000));
        console.log("Sign in:", { email, password, staySignedIn });
        setLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); 
        if (!signupEmail || !signupPassword || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }
        if (signupPassword !== confirmPassword){
            setError('Password do not match.');
            return;
        }
        setLoading(true);
        await new Promise((r) => setTimeout(r,1000));
        console.log('Sign up:', {signupEmail, signupPassword});
        setLoading(false);
    };

    const isSignIn = mode === 'signin'; 

    

    return (
        <Box sx={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
            {/* FORM PANEL — always stays on the left, only its content fades */}
            <Box
                onMouseEnter = {() => setIsHovering(true)}
                onMouseLeave = {() => setIsHovering(false)}
                sx={{
                    width: { xs: '100%', md: 580 },
                    backgroundColor: navyBg,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    px: 5,
                    position: 'relative',
                    zIndex: 1,
                    transition: 'width 0.4s ease, background-color 0.4s ease, box-shadow 0.4s ease',
                    '&:hover': {
                        width: { xs: '100%', md: 780 },
                        backgroundColor: '#071830',
                        boxShadow: '10px 0 40px rgba(0, 0, 0, 0.6)',
                    },
                    '&:hover .brand-title': { color: '#111318', fontSize: 50 },
                    '&:hover .form-label': { color: '#D9B872' },
                    '&:hover .MuiInputBase-input': { color: '#D9B872' },
                    '&:hover .MuiInput-underline:before': { borderBottomColor: '#111318' },
                    '&:hover .switch-link': { color: '#8a6d2f' },
                    '&:hover .logo-wrapper': { transform: 'scale(1.20)', },
                }}
            > 

                    {/* "Back to home" — always visible, top-right */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 24,
                            left: 32,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            zIndex: 2,
                            cursor: 'pointer',
                            color: '#ccc',
                            '&:hover': { color: '#fff' },
                            transition: 'color 0.2s ease',
                        }}
                        onClick={() => console.log('Back to home clicked — wire up navigation later')}
                        >
                        <ArrowBackIcon sx={{ fontSize: 18 }} />
                        <Typography sx={{ fontSize: 14 }}>Back to home</Typography>
                    </Box>

                    <Box
                        className="logo-wrapper"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            mb: 5,
                            transformOrigin: 'left center',
                            transition: 'transform 0.4s ease',
                        }}
                    >
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            backgroundColor: accentColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 25,
                            color: '#1a1408',
                            flexShrink: 0,
                        }}
                    >
                        L
                </Box>
                
                <Typography sx={{ color: '#D9B872', fontSize: 30, fontWeight: 600 }}>
                    LevelUp.gg
                </Typography>

            </Box>
                {/* Wrapper that actually fades/slides when switching modes */}
                <Box
                    sx={{
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(6px)',
                    }}
                >
                    <Typography
                        className="form-label"
                        sx={{ color: '#e5e5e5', letterSpacing: 3, fontSize: 14, mb: 3, fontWeight: 500, transition: 'color 0.4s ease' }}
                    >
                        {isSignIn ? 'SIGN IN' : 'SIGN UP'}
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {isSignIn ? (
                        <form onSubmit={handleSignIn}>
                            <TextField
                                variant="standard" placeholder="USERNAME" fullWidth
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                sx={{ mb: 2, input: { color: '#fff' } }}
                            />
                            <TextField
                                variant="standard" placeholder="PASSWORD" type="password" fullWidth
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                sx={{ mb: 1, input: { color: '#fff' } }}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={staySignedIn}
                                        onChange={(e) => setStaySignedIn(e.target.checked)}
                                        sx={{ color: '#555', '&.Mui-checked': { color: accentColor } }}
                                    />
                                }
                                label={<Typography sx={{ color: '#999', fontSize: 13 }}>Stay signed in</Typography>}
                                sx={{ mb: 2 }}
                            />
                            <Button type="submit" fullWidth disabled={loading}
                                sx={{ backgroundColor: accentColor, color: '#0d0d0d', fontWeight: 600, py: 1.2, '&:hover': { backgroundColor: '#C9A75E' } }}
                            >
                                {loading ? <CircularProgress size={22} sx={{ color: '#0d0d0d' }} /> : 'LOGIN'}
                            </Button>

                            <Typography sx={{ mt: 3, fontSize: 13, color: '#999', textAlign: 'center' }}>
                                Don't have an account?{' '}
                                <Link
                                    component="button"
                                    type="button"
                                    className="switch-link"
                                    onClick={() => switchMode('signup')}
                                    sx={{ color: accentColor, fontWeight: 600 }}
                                >
                                    Sign up
                                </Link>
                            </Typography>
                        </form>
                    ) : (
                        <form onSubmit={handleSignUp}>
                            <TextField
                                variant="standard" placeholder="EMAIL" fullWidth
                                value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}
                                sx={{ mb: 2, input: { color: '#fff' } }}
                            />
                            <TextField
                                variant="standard" placeholder="PASSWORD" type="password" fullWidth
                                value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}
                                sx={{ mb: 2, input: { color: '#fff' } }}
                            />
                            <TextField
                                variant="standard" placeholder="CONFIRM PASSWORD" type="password" fullWidth
                                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                sx={{ mb: 2, input: { color: '#fff' } }}
                            />
                            <Button type="submit" fullWidth disabled={loading}
                                sx={{ backgroundColor: accentColor, color: '#0d0d0d', fontWeight: 600, py: 1.2, '&:hover': { backgroundColor: '#C9A75E' } }}
                            >
                                {loading ? <CircularProgress size={22} sx={{ color: '#0d0d0d' }} /> : 'SIGN UP'}
                            </Button>

                            <Typography sx={{ mt: 3, fontSize: 13, color: '#999', textAlign: 'center' }}>
                                Already have an account?{' '}
                                <Link
                                    component="button"
                                    type="button"
                                    className="switch-link"
                                    onClick={() => switchMode('signin')}
                                    sx={{ color: accentColor, fontWeight: 600 }}
                                >
                                    Sign in
                                </Link>
                            </Typography>
                        </form>
                    )}
                </Box>
            </Box>

            {/* VIDEO PANEL — stays fixed on the right */}
                <Box
                    sx={{
                        flex: 1,
                        display: { xs: 'none', md: 'block' },
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <video
                        ref={videoRef}
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: isHovering ? 0.35 : 1, transition: 'opacity 0.5s ease', }}
                    >
                        <source src="/lolvideo.mp4" type="video/mp4" />
                    </video>

                    <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0))' }} />

                

                    {/* Video control buttons — bottom-right corner and text overlay*/}
                    <Box
                        sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        px: 8,
                        opacity: isHovering ? 1 : 0,
                        transform: isHovering ? 'translateY(0)' : 'translateY(10px)',
                        transition: 'opacity 0.5s ease, transform 0.5s ease',
                        pointerEvents: 'none', // so this text never blocks clicks on the video below it
                    }}
                    >
                        <Typography sx={{ color: accentColor, letterSpacing: 2, fontSize: 13, fontWeight: 700, mb: 2 }}>
                        YOUR GAME, IN FOCUS
                        </Typography>

                        <Typography sx={{ color: '#fff', fontSize: 70, fontWeight: 800, lineHeight: 1.1, mb: 3 }}>
                        Every match<br />moves you<br />forward.
                        </Typography>

                        <Typography sx={{ color: accentColor, fontSize: 16, maxWidth: 420 }}>
                        Pick up where you left off and keep building your climb.
                        </Typography>

                        {/* Tagline */}
                        <Typography sx={{ color: accentColor, letterSpacing: 2, fontSize: 12, fontWeight: 600 }}>
                            COMPETE &bull; ANALYZE &bull; IMPROVE
                        </Typography>

                    </Box>

                    <Box sx={{ position: 'absolute', bottom: 24, right: 24, display: 'flex', gap: 2 }}>
                        <IconButton
                            onClick={togglePlay}
                            sx={{
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                color: '#fff',
                                '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                            }}
                        >
                            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>

                        <IconButton
                            onClick={toggleMute}
                            sx={{
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                color: '#fff',
                                '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                            }}
                        >
                            {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                        </IconButton>
                    </Box>
                </Box>
            </Box>
    );
}