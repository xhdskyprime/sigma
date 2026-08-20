import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, Maximize, Bell, LogOut } from 'lucide-react';
import { FcComboChart, FcCalendar, FcDocument, FcServices, FcFilm, FcDataSheet } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <FcComboChart size={24} /> },
    { name: 'Manajemen Agenda', path: '/agenda', icon: <FcDataSheet size={24} /> },
    { name: 'Tampilan Layar', path: '/display', icon: <FcFilm size={24} /> },
    { name: 'Pengaturan', path: '/settings', icon: <FcServices size={24} /> },
  ];

  return (
    <div className="app-container">
      {/* Sidebar / Bottom Nav */}
      <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo-rsud.png" alt="Logo" />
          <div className="sidebar-title">
            <h2>RSUD Tigaraksa</h2>
            <p>Executive Dashboard</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span className="nav-text">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="flex items-center gap-2" style={{ minWidth: 0, flex: 1 }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="toggle-btn" style={{ color: 'var(--text-main)', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Menu size={22} />
            </button>
            <h1 className="topbar-title" style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-primary-blue)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Agenda & Monitoring Kegiatan
            </h1>
          </div>
          
          <div className="flex items-center gap-2 topbar-actions" style={{ flexShrink: 0 }}>
            <div className="topbar-clock-block" style={{ textAlign: 'right' }}>
              <div className="topbar-date-text" style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>
                {time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-primary-blue)', lineHeight: 1 }}>
                {time.toLocaleTimeString('id-ID')}
              </div>
            </div>

            <div className="topbar-divider" style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.25rem' }}></div>

            <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ color: 'var(--text-main)', padding: '0.4rem' }} title="Mode Gelap/Terang">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => navigate('/tv')} style={{ color: 'var(--text-main)', padding: '0.4rem' }} title="Mode TV">
              <Maximize size={18} />
            </button>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setUnreadCount(0);
                }} 
                style={{ color: 'var(--text-main)', padding: '0.4rem', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                title="Notifikasi Sistem"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', width: '7px', height: '7px', backgroundColor: 'var(--color-status-red)', borderRadius: '50%' }}></span>
                )}
              </button>

              {/* Notification Dropdown Box */}
              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '40px',
                  right: 0,
                  width: '300px',
                  background: 'var(--bg-main, #ffffff)',
                  color: 'var(--text-main)',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
                  borderRadius: '16px',
                  padding: '1rem',
                  zIndex: 9999,
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>🔔 Notifikasi Sistem</h4>
                    <button style={{ fontSize: '0.75rem', color: 'var(--color-primary-blue)', fontWeight: '700', cursor: 'pointer', border: 'none', background: 'none' }} onClick={() => setShowNotifications(false)}>Tutup</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '250px', overflowY: 'auto' }}>
                    <div style={{ padding: '0.65rem 0.75rem', background: 'rgba(14,165,233,0.12)', borderRadius: '10px', fontSize: '0.8rem', borderLeft: '3px solid var(--color-primary-blue)' }}>
                      <strong style={{ color: 'var(--color-primary-blue)', display: 'block', marginBottom: '0.2rem' }}>📅 Agenda Hari Ini Terpantau</strong>
                      <span style={{ color: 'var(--text-main)', opacity: 0.9 }}>Sistem monitoring mengupdate jadwal rapat secara otomatis.</span>
                    </div>

                    <div style={{ padding: '0.65rem 0.75rem', background: 'rgba(34,197,94,0.12)', borderRadius: '10px', fontSize: '0.8rem', borderLeft: '3px solid var(--color-primary-green)' }}>
                      <strong style={{ color: 'var(--color-primary-green)', display: 'block', marginBottom: '0.2rem' }}>✉️ Laporan Email Harian</strong>
                      <span style={{ color: 'var(--text-main)', opacity: 0.9 }}>Pengiriman email otomatis diatur setiap pukul 06:00 WIB.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="user-profile">
              <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                {user?.initial || 'A'}
              </div>
              <div className="user-info">
                <span>{user?.name || 'Admin'}</span>
                <span style={{ textTransform: 'capitalize' }}>{user?.role || 'Admin'}</span>
              </div>
            </div>

            <button 
              onClick={() => { logout(); navigate('/login'); }} 
              style={{ color: 'var(--color-status-red)', padding: '0.4rem' }} 
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {children}
        </div>

      </main>
    </div>
  );
};

export default Layout;
