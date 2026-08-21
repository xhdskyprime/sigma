import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Activity, Users } from 'lucide-react';
import { useAgenda } from '../context/AgendaContext';
import { useSettings } from '../context/SettingsContext';

const TVBoard = () => {
  const navigate = useNavigate();
  const { agendas } = useAgenda();
  const { announcements } = useSettings();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAgendas = agendas.filter(a => a.date === todayStr);

  const getBorderColor = (type) => {
    if (type === 'blue') return 'var(--color-primary-blue)';
    if (type === 'green') return 'var(--color-primary-green)';
    if (type === 'red') return 'var(--color-status-red)';
    return 'var(--color-status-yellow)';
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      padding: '0.85rem',
      gap: '0.85rem',
      backgroundImage: 'var(--bg-image)',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-main)',
      fontFamily: 'Outfit, sans-serif'
    }}>
      
      {/* HEADER Glassmorphism */}
      <header className="card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1.5rem',
        border: '1px solid var(--border-glass)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <img src="/logo-rsud.png" alt="Logo RSUD" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, letterSpacing: '0.5px', color: 'var(--text-main)' }}>RSUD TIGARAKSA</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-primary-blue)', margin: 0, fontWeight: '700' }}>Papan Pengumuman & Agenda Kegiatan Harian</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              {time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: '900', color: 'var(--color-primary-green)', lineHeight: '1', marginTop: '0.1rem' }}>
              {time.toLocaleTimeString('id-ID', { hour12: false })}
            </div>
          </div>
          <button 
            onClick={() => navigate('/')} 
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '12px',
              background: 'rgba(14, 165, 233, 0.12)',
              border: '1px solid var(--color-primary-blue)',
              color: 'var(--color-primary-blue)',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease'
            }}
            title="Kembali ke Dashboard"
          >
            ⬅️ Exit
          </button>
        </div>
      </header>

      {/* CONTENT: 2 Columns */}
      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '6fr 4fr', gap: '0.85rem', overflow: 'hidden' }}>
        
        {/* VIDEO / PROFILES SECTION */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--border-glass)', background: '#090d16', position: 'relative' }}>
          <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/videoseries?list=PLrEnWoR738-q5n3p4E7Y31v_3e8f8101a&autoplay=1&mute=1&loop=1" 
            title="Video Profile RSUD" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            style={{ flex: 1, objectFit: 'cover' }}
          ></iframe>
        </div>

        {/* AGENDA SECTION */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'hidden', border: '1px solid var(--border-glass)', padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem', margin: 0, color: 'var(--color-primary-blue)' }}>
            <Activity size={24} color="var(--color-primary-blue)" /> Agenda Hari Ini
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', paddingRight: '0.35rem' }}>
            {todayAgendas.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '600' }}>
                Tidak ada kegiatan rapat terjadwal untuk hari ini.
              </div>
            ) : (
              todayAgendas.map((agenda) => (
                <div key={agenda.id} className="glass-item" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  borderLeft: `5px solid ${agenda.color}`,
                  padding: '1rem',
                  borderRadius: '14px',
                  background: 'var(--bg-glass-hover)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, lineHeight: '1.3' }}>{agenda.title}</h3>
                    <span className="badge" style={{ backgroundColor: agenda.color, fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: '8px', whiteSpace: 'nowrap' }}>{agenda.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '600', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={16} color="var(--color-primary-blue)" /> {agenda.timeStart} - {agenda.timeEnd} WIB</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={16} color="var(--color-status-red)" /> {agenda.location}</span>
                  </div>
                  {agenda.attendees && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary-blue)', fontSize: '0.82rem', fontWeight: '600' }}>
                      <Users size={16} /> {agenda.attendees}
                    </div>
                  )}
                  {agenda.note && (
                    <div style={{
                      marginTop: '0.15rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      color: 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      📌 Catatan: {agenda.note}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* INFORMASI PEGAWAI (Banner Scrolling/List) */}
      <div className="card" style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', padding: '0.85rem 1.25rem', border: '1px solid var(--border-glass)', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: '900', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', borderRight: '2px solid var(--border-glass)', paddingRight: '1.25rem', margin: 0, color: 'var(--color-primary-green)', letterSpacing: '0.5px' }}>
          INFORMASI PEGAWAI
        </h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'nowrap' }}>
          {announcements.length === 0 ? (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Belum ada informasi publik.</span>
          ) : (
            announcements.map(ann => (
              <div key={ann.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', padding: '0.5rem 1rem', background: 'var(--bg-glass-hover)', borderRadius: '10px', borderLeft: `4px solid ${getBorderColor(ann.type)}` }}>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>{ann.title}:</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>{ann.content}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TVBoard;
