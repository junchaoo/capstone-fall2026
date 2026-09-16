import { useState } from 'react'; 
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress, } from '@mui/material';

export default function login(){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
        console.log('Fake login attempt:', { email, password });
        setLoading(false);
    };

    return(
        <Box sx ={{
            display: 'flex',
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh', 
            backgorundColor: '#f5f5f5',
            }}>

            <Paper elevation={3} sx ={{padding: 4, width: 350 }}>
                <Typography variant="h5" sx={{ mb: 2, textAlign: 'center' }}>
                    Log In
                </Typography>

                {error && (<Alert severity = "error" sx = {{mb: 2}}>
                    {error}
                </Alert>)}

                <form onSubmit = {handleSubmit}>
                    <TextField
                        label = "Email"
                        type = "email"
                        fullWidth
                        margin = 'normal'
                        value = {email}
                        onChange={(e) => setEmail(e.target.value)}>
                    </TextField>
                    
                    <TextField
                        label = "Password"
                        type = "password"
                        fullWidth
                        margin = 'normal'
                        value = {password}
                        onChange={(e) => setPassword(e.target.value)}>
                    </TextField>

                    <Button type = "submit" variant = "contained" fullWidth sx ={{ mt: 2}} disabled = {loading}>
                        {loading ? <CircularProgress size = {24} /> : 'Login'}
                    </Button>
                </form>
            </Paper>
        </Box>
    )
}