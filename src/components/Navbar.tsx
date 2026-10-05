import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import './Navbar.css';
 
export interface NavLink 
{
  label: string;
  to: string;
  icon?: ReactNode;
  children?: NavLink[];
}
 
interface NavbarProps 
{
  brand: string;
  links: NavLink[];
}
 
export default function Navbar({ brand, links }: NavbarProps) 
{
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
 
  // close any open dropdown when you click outside the navbar
  useEffect(() => 
    {
    const handleClickOutside = (e: MouseEvent) => 
    {
      if (navRef.current && !navRef.current.contains(e.target as Node)) 
      {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
 
  const handleLinkClick = () => 
  {
    setIsOpen(false);
    setOpenDropdown(null);
  };
 
  return (
    <nav className="navbar" ref={navRef}>
      <Link className="navbar__brand" to="/" onClick={handleLinkClick}>
        {brand}
      </Link>
 
      <button
        className={`navbar__toggle ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span/><span/><span/>
      </button>
 
      <ul className={`navbar__links ${isOpen ? 'is-open' : ''}`}>
        {links.map((link) => (
          <li key={link.to} className="navbar__item">
            {link.children ? (
              <div className="navbar__dropdown-wrapper">
                <Link
                  to={link.to}
                  className={location.pathname === link.to ? 'is-active' : ''}
                  onClick={handleLinkClick}
                >
                  {link.icon && <span className="navbar__icon">{link.icon}</span>}
                  {link.label}
                </Link>

                <ul className={`navbar__dropdown ${openDropdown === link.to ? 'is-open' : ''}`}>
                  {link.children.map((child) => (
                    <li key={child.to}>
                      <Link to={child.to} onClick={handleLinkClick}>
                        {child.icon && <span className="navbar__icon">{child.icon}</span>}
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <Link
                to={link.to}
                className={location.pathname === link.to ? 'is-active' : ''}
                onClick={handleLinkClick}
              >
                {link.icon && <span className="navbar__icon">{link.icon}</span>}
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
 