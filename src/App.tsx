import Home from './pages/Home';
import Profile from './pages/Profile';
import ChampionAnalysis from './pages/ChampionAnalysis';
import Login from './pages/Login';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/champions' element={<ChampionAnalysis />} />
        <Route path='/login' element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
