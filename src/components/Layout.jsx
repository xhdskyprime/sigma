import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarRange, 
  Tv, 
  Settings, 
  Moon, 
  Sun, 
  Maximize, 
  Bell, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={17} /> },
    { name: 'Manajemen Agenda', path: '/agenda', icon: <CalendarRange size={17} /> },
    { name: 'Tampilan Layar', path: '/display', icon: <Tv size={17} /> },
    { name: 'Pengaturan', path: '/settings', icon: <Settings size={17} /> },
  ];

  return (
    <div className="app-container-topnav">
      {/* INSTAGRAM-STYLE TOP NAVBAR */}
      <header className="topnav">
        <div className="topnav-brand">
          <img src="/logo-rsud.png" alt="Logo RSUD" className="topnav-logo" />
          <div className="topnav-title">
            <h2>RSUD Tigaraksa</h2>
            <p>Executive Dashboard</p>
          </div>
        </div>

        {/* Center Navigation Links (Instagram Web Style) */}
        <nav className="topnav-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `topnav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="topnav-actions">
          <div className="topnav-clock">
            <span className="clock-date">
              {time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span className="clock-time">{time.toLocaleTimeString('id-ID')}</span>
          </div>

          <div className="topnav-divider"></div>

          <button onClick={() => setIsDarkMode(!isDarkMode)} className="topnav-icon-btn" title="Mode Gelap/Terang">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button onClick={() => navigate('/tv')} className="topnav-icon-btn" title="Mode TV Board">
            <Maximize size={18} />
          </button>

          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setUnreadCount(0);
              }} 
              className="topnav-icon-btn"
              title="Notifikasi"
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="notification-dot"></span>}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h4>🔔 Notifikasi Sistem</h4>
                  <button onClick={() => setShowNotifications(false)}>Tutup</button>
                </div>
                <div className="notification-body">
                  <div className="notification-item blue">
                    <strong>📅 Agenda Hari Ini Terpantau</strong>
                    <span>Sistem monitoring mengupdate jadwal rapat secara otomatis.</span>
                  </div>
                  <div className="notification-item green">
                    <strong>✉️ Laporan Email Harian</strong>
                    <span>Pengiriman email otomatis diatur setiap pukul 06:00 WIB.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="topnav-user">
            <div className="user-avatar">{user?.initial || 'A'}</div>
            <div className="user-details">
              <span className="user-name">{user?.name || 'Admin'}</span>
              <span className="user-role">{user?.role || 'Admin'}</span>
            </div>
          </div>

          <button 
            onClick={() => { logout(); navigate('/login'); }} 
            className="topnav-logout-btn" 
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="content-container">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION (Instagram Mobile Style) */}
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
