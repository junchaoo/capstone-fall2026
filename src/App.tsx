import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProPlayers from './pages/ProPlayers';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/pros' element={<ProPlayers />} />
      </Routes>
    </BrowserRouter>
  );
}
