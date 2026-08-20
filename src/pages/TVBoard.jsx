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

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      padding: '1.25rem',
      gap: '1.25rem',
      backgroundImage: 'var(--bg-image)',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-main)',
      fontFamily: 'Outfit, sans-serif'
    }}>
      
      {/* HEADER Glassmorphism */}
      <header className="card" style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 3rem',
        border: '1px solid var(--border-glass)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <img src="/logo-rsud.png" alt="Logo RSUD" style={{ width: '75px', height: '75px', objectFit: 'contain' }} />
          <div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: '800', margin: 0, letterSpacing: '1px', color: 'var(--text-main)' }}>RSUD TIGARAKSA</h1>
            <p style={{ fontSize: '1.35rem', color: 'var(--color-primary-blue)', margin: 0, fontWeight: '700' }}>Papan Pengumuman & Agenda Kegiatan Harian</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.35rem', color: 'var(--text-muted)', fontWeight: '700' }}>
            {time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--color-primary-green)', lineHeight: '1', marginTop: '0.2rem' }}>
            {time.toLocaleTimeString('id-ID', { hour12: false })}
          </div>
        </div>
      </header>

      {/* CONTENT: 2 Columns */}
      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '6.5fr 3.5fr', gap: '1.25rem', overflow: 'hidden' }}>
        
        {/* VIDEO SECTION */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
          <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&loop=1&playlist=jfKfPfyJRdk" 
            title="Video Profile RSUD" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            style={{ flex: 1, objectFit: 'cover' }}
          ></iframe>
        </div>

        {/* AGENDA SECTION */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'hidden', border: '1px solid var(--border-glass)' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', margin: 0 }}>
            <Activity size={40} color="var(--color-primary-blue)" /> Agenda Hari Ini
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {todayAgendas.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.25rem', fontWeight: '600' }}>
                Tidak ada kegiatan rapat terjadwal untuk hari ini.
              </div>
            ) : (
              todayAgendas.map((agenda) => (
                <div key={agenda.id} className="glass-item" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  borderLeft: `8px solid ${agenda.color}`,
                  padding: '1.5rem',
                  borderRadius: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, lineHeight: '1.35' }}>{agenda.title}</h3>
                    <span className="badge" style={{ backgroundColor: agenda.color, fontSize: '1rem', padding: '0.5rem 1.25rem', borderRadius: '10px', whiteSpace: 'nowrap' }}>{agenda.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-muted)', fontSize: '1.15rem', fontWeight: '600', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Clock size={22} color="var(--color-primary-blue)" /> {agenda.timeStart} - {agenda.timeEnd} WIB</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><MapPin size={22} color="var(--color-status-red)" /> {agenda.location}</span>
                  </div>
                  {agenda.attendees && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-primary-blue)', fontSize: '1.15rem', fontWeight: '700' }}>
                      <Users size={22} /> {agenda.attendees}
                    </div>
                  )}
                  {agenda.note && (
                    <div style={{
                      marginTop: '0.25rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#78350f',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      lineHeight: '1.4'
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
      <div className="card" style={{ display: 'flex', gap: '2rem', overflowX: 'auto', padding: '1.5rem 2rem', border: '1px solid var(--border-glass)', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '900', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', borderRight: '2px solid var(--border-glass)', paddingRight: '2rem', margin: 0, color: 'var(--color-primary-green)' }}>
          INFORMASI PEGAWAI
        </h3>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'nowrap' }}>
          {announcements.length === 0 ? (
            <span style={{ color: 'var(--text-muted)', fontSize: '1.15rem', fontStyle: 'italic' }}>Belum ada informasi publik.</span>
          ) : (
            announcements.map(ann => (
              <div key={ann.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', whiteSpace: 'nowrap', padding: '0.85rem 1.5rem', background: 'var(--bg-main)', borderRadius: '14px', borderLeft: `6px solid ${ann.type === 'blue' ? 'var(--color-primary-blue)' : ann.type === 'green' ? 'var(--color-primary-green)' : ann.type === 'red' ? 'var(--color-status-red)' : 'var(--color-status-orange)'}` }}>
                <strong style={{ color: 'var(--text-main)', fontSize: '1.25rem' }}>{ann.title}:</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '1.15rem', fontWeight: '600' }}>{ann.content}</span>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Hidden button to exit back to dashboard */}
      <button 
        onClick={() => navigate('/')} 
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          width: '80px',
          height: '80px',
          opacity: 0, /* Fully invisible */
          cursor: 'pointer',
          border: 'none',
          background: 'transparent'
        }}
        title="Kembali ke Dashboard (Klik Pojok Kanan Atas)"
      />
    </div>
  );
};

export default TVBoard;
