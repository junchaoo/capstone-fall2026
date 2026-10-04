import { useState } from 'react';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import { Link, useNavigate } from 'react-router-dom';
import backgroundVideo from '../assets/gameplay.mov';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className='login-page'>
      <section className='login-visual' aria-label='LevelUp.gg'>
        <video className='login-video' autoPlay muted loop playsInline>
          <source src={backgroundVideo} type='video/quicktime' />
        </video>
        <div className='login-visual-overlay' />
        <Link className='login-brand' to='/' aria-label='LevelUp.gg home'>
          <span className='login-brand-mark'>L</span>
          <span>
            LevelUp<span>.</span>gg
          </span>
        </Link>
        <div className='login-visual-copy'>
          <span className='login-overline'>YOUR GAME, IN FOCUS</span>
          <h1>
            Every match
            <br />
            moves you forward.
          </h1>
          <p>Pick up where you left off and keep building your climb.</p>
          <div className='login-visual-rule'>
            <span />
          </div>
          <span className='login-visual-caption'>
            COMPETE <i /> ANALYZE <i /> IMPROVE
          </span>
        </div>
        <span className='login-visual-footnote'>
          LEVELUP.GG <i /> SUMMONER'S RIFT
        </span>
      </section>

      <section className='login-panel'>
        <Link className='login-back-link' to='/'>
          <ArrowBackRounded /> Back to home
        </Link>
        <div className='login-form-wrap'>
          <p className='login-kicker'>PLAYER ACCOUNT</p>
          <p className='login-intro'>Sign in to continue to your profile.</p>

          <form
            className='login-form'
            onSubmit={(event) => {
              event.preventDefault();
              navigate('/profile');
            }}
          >
            <label htmlFor='login-email'>Email address</label>
            <input
              id='login-email'
              name='email'
              type='email'
              autoComplete='email'
              placeholder='you@example.com'
              required
            />

            <div className='login-password-label'>
              <label htmlFor='login-password'>Password</label>
              <button className='login-text-button' type='button'>
                Forgot password?
              </button>
            </div>
            <div className='login-password-field'>
              <input
                id='login-password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                autoComplete='current-password'
                placeholder='Enter your password'
                required
              />
              <button
                className='login-password-toggle'
                type='button'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? (
                  <VisibilityOffRounded />
                ) : (
                  <VisibilityRounded />
                )}
              </button>
            </div>

            <button className='login-submit' type='submit'>
              Sign in <span aria-hidden='true'>→</span>
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default Login;
