import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import MatchHistory from './MatchHistory';
import './App.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MatchHistory gameName="oSilly" tagLine="NA1" />;
  </StrictMode>,
)
