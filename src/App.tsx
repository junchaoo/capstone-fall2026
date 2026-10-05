import { Routes, Route } from 'react-router-dom';
import { FaInfoCircle } from 'react-icons/fa';
import { FaRankingStar } from 'react-icons/fa6';
import { GiCrestedHelmet, GiSwitchWeapon } from 'react-icons/gi';
import { HiHome } from 'react-icons/hi';
import Navbar, { type NavLink } from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Leaderboard from './pages/Leaderboard';
import Champions from './pages/Champions';


const links: NavLink[] = 
[
  { label: 'Home', to: '/', icon: <HiHome/>},
  { label: 'About', to: '/about', icon: <FaInfoCircle/>},
  { label: 'Leaderboard', to: '/leaderboard', icon: <FaRankingStar/>,
    children: [
      { label: 'Ranked Solo/Duo', to: '/leaderboard/ranked' },
      { label: 'Ranked Flex', to: '/leaderboard/ranked-flex' },
      { label: 'Mastery', to: '/leaderboard/mastery' },
      { label: 'Levels', to: '/leaderboard/levels' },
    ]
  },
  { label: 'Champions', to: '/champions', icon: <GiCrestedHelmet/>,
    children: [
      { label: 'Top', to: '/champions/top' },
      { label: 'Jungle', to: '/champions/jungle' },
      { label: 'Mid Lane', to: '/champions/mid' },
      { label: 'ADC', to: '/champions/adc' },
      { label: 'Support', to: '/champions/support' }
    ] 
  },
  {label: 'Items', to: '/items', icon: <GiSwitchWeapon/>},
];

function App() 
{
  return (
    <>
      <Navbar brand="LevelUp.gg" links={links} />
      <main style={{ padding: '2rem' }}>
        <Routes>
          <Route path="/home" element={<Home/>}/>
          <Route path="/about" element={<About/>}/>
          <Route path="/leaderboard" element={<Leaderboard/>}/>
          <Route path="/champions" element={<Champions/>}/>
        </Routes>
      </main>
    </>
  );
}

export default App;