import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { logoutUser } from '../../api';
import {
  Dashboard,
  Logout,
  NotificationsNone,
  PeopleOutline,
  PersonOutline,
  Settings,
  CalendarMonth,
  BarChart,
  Fingerprint,
} from '@mui/icons-material';
import './Nav.css';

const navItems = [
  { label: 'Dashboard', path: '/home', icon: Dashboard },
  { label: 'Reports', path: '/attendance', icon: BarChart },
  { label: 'User Management', path: '/profile/:id', icon: PeopleOutline },
  { label: 'Settings', path: '/settings', icon: Settings },
];

const Nav = () => {
  const [activeItem, setActiveItem] = useState('Dashboard');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = (item) => {
    setActiveItem(item.label);
    navigate(item.path);
  };

  const handleLogout = async () => {
    await logoutUser();
    logout();
    navigate('/');
  };

  return (
    <>
      <aside className="bio-sidebar">
        <div className="bio-brand">
          <span className="bio-brand-mark">
            <Fingerprint fontSize="large" />
          </span>
          <span>
            BIOMETRIC
            <br />
            ATTENDANCE SYSTEM
          </span>
        </div>

        <nav className="bio-nav-list" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.label;

            return (
              <button
                key={item.label}
                type="button"
                className={`bio-nav-item ${isActive ? 'is-active' : ''}`}
                onClick={() => handleNavigate(item)}
              >
                <Icon />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button type="button" className="bio-logout" onClick={handleLogout} aria-label="Logout">
          <Logout />
        </button>
      </aside>

      <header className="bio-topbar">
        <h1>Admin Dashboard</h1>
        <div className="bio-topbar-actions">
          <button type="button" aria-label="Calendar">
            <CalendarMonth />
          </button>
          <button type="button" className="bio-alert-button" aria-label="Notifications">
            <NotificationsNone />
            <span>2</span>
          </button>
          <button type="button" aria-label="Profile">
            <PersonOutline />
          </button>
        </div>
      </header>
    </>
  );
};

export default Nav;
