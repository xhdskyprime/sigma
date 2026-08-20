import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Activity, Bell, Calendar as CalendarIcon, Lock, FileText, Users, Download } from 'lucide-react';
import { useAgenda } from '../context/AgendaContext';
import { useSettings } from '../context/SettingsContext';

const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';

const getPdfUrl = (fileObj) => {
  if (!fileObj) return '';
  let target = typeof fileObj === 'string' ? fileObj : (fileObj.url || fileObj.data || '');
  if (!target) return '';
  if (target.startsWith('data:application/pdf')) return target;
  if (target.startsWith('/uploads')) {
    return `${API_URL}${target}`;
  }
  return target;
};

const MobileView = () => {
  const navigate = useNavigate();
  const { agendas } = useAgenda();
  const { announcements, mobilePin, settingsLoaded } = useSettings();
  const [activeTab, setActiveTab] = useState('agenda'); // 'agenda' or 'calendar'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const selectedDateRef = useRef(null);
  const dateContainerRef = useRef(null);

  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // Auto-scroll horizontal calendar container to center selected date without scrolling page
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedDateRef.current && dateContainerRef.current) {
        const container = dateContainerRef.current;
        const selected = selectedDateRef.current;
        const scrollLeft = selected.offsetLeft - (container.clientWidth / 2) + (selected.clientWidth / 2);
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedDate, isUnlocked]);
  
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  
  // Document Preview State
  const [previewFile, setPreviewFile] = useState(null);

  // Custom Calendar State
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Check PIN requirement after settings are fetched from server
  useEffect(() => {
    if (settingsLoaded) {
      if (mobilePin && mobilePin.trim() !== '') {
        setIsUnlocked(false);
      } else {
        setIsUnlocked(true);
      }
    }
  }, [mobilePin, settingsLoaded]);

  // Reset scroll to top when unlocked to prevent virtual keyboard scroll offset
  useEffect(() => {
    if (isUnlocked) {
      window.scrollTo(0, 0);
    }
  }, [isUnlocked]);

  const handleUnlock = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/api/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pinInput })
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setIsUnlocked(true);
          setPinError(false);
          window.scrollTo(0, 0);
        } else {
          setPinError(true);
          setPinInput('');
        }
      })
      .catch(err => {
        console.error("PIN verification error", err);
        // Fallback local check if offline
        if (pinInput === mobilePin) {
          setIsUnlocked(true);
          setPinError(false);
          window.scrollTo(0, 0);
        } else {
          setPinError(true);
          setPinInput('');
        }
      });
  };

  // Generate dates (-15 days to +30 days from today)
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for(let i = -15; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };
  const weekDates = generateDates();

  const selectedStr = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD local format safely
  // Alternative safe YYYY-MM-DD:
  const offset = selectedDate.getTimezoneOffset()
  const localDateStr = new Date(selectedDate.getTime() - (offset*60*1000)).toISOString().split('T')[0]

  const filteredAgendas = agendas.filter(a => a.date === localDateStr);

  // If locked, return Lock Screen
  if (!isUnlocked) {
    return (
      <div style={{
        width: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        backgroundImage: 'var(--bg-image)', backgroundSize: 'cover', backgroundPosition: 'center',
        backgroundColor: '#f8fafc', color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          padding: '2.5rem', borderRadius: '32px', border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)', textAlign: 'center', maxWidth: '90%', width: '360px'
        }}>
          <div style={{ background: 'var(--color-primary-blue)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem auto', color: 'white', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.4)' }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Layar Terkunci</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>Silakan masukkan PIN keamanan untuk mengakses Jadwal & Informasi.</p>
          
          <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="password"
              inputMode="numeric"
              maxLength="6"
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value.replace(/[^0-9]/g, '')); setPinError(false); }}
              placeholder="Masukkan PIN"
              style={{
                width: '100%', padding: '1rem', borderRadius: '16px', border: pinError ? '2px solid var(--color-status-red)' : '1px solid rgba(0,0,0,0.1)',
                background: 'rgba(255,255,255,0.9)', fontSize: '1.25rem', letterSpacing: '4px', textAlign: 'center', fontWeight: '700', outline: 'none', color: 'var(--text-main)'
              }}
              autoFocus
            />
            {pinError && <span style={{ color: 'var(--color-status-red)', fontSize: '0.85rem', fontWeight: '600' }}>PIN tidak sesuai. Silakan coba lagi.</span>}
            <button type="submit" style={{
              width: '100%', padding: '1rem', borderRadius: '16px', border: 'none',
              background: 'linear-gradient(135deg, var(--color-primary-blue), #2563eb)', color: 'white',
              fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', marginTop: '0.5rem'
            }}>
              Buka Kunci
            </button>
            <button type="button" onClick={() => navigate(-1)} style={{
              background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem', padding: '0.5rem'
            }}>
              Kembali ke Menu Utama
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundImage: 'var(--bg-image)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: '#f8fafc',
      color: 'var(--text-main)',
      fontFamily: 'Outfit, sans-serif',
      position: 'relative'
    }}>
      
      {/* Mobile Header (Light Glassmorphism) */}
      <header style={{
        padding: '1rem 1rem 0.75rem 1rem',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.8)',
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
      }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logo-rsud.png" alt="Logo RSUD Tigaraksa" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, letterSpacing: '0.5px' }}>RSUD TIGARAKSA</h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, fontWeight: '600' }}>Sistem Monitoring Agenda</p>
            </div>
          </div>
        </div>

        {/* Horizontal Calendar Picker */}
        <div 
          ref={dateContainerRef}
          style={{ 
            display: 'flex', overflowX: 'auto', gap: '0.75rem', paddingBottom: '0.25rem', 
            scrollbarWidth: 'none', msOverflowStyle: 'none'
          }}
        >
          {/* Hide scrollbar for webkit */}
          <style>{`
            div::-webkit-scrollbar { display: none; }
          `}</style>
          
          {weekDates.map((d, i) => {
            const isSelected = d.toDateString() === selectedDate.toDateString();
            const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
            const dateNum = d.getDate();
            const isToday = d.toDateString() === new Date().toDateString();
            
            const offset = d.getTimezoneOffset();
            const localStr = new Date(d.getTime() - (offset*60*1000)).toISOString().split('T')[0];
            const hasEvent = agendas.some(a => a.date === localStr);

            return (
              <div 
                key={d.toISOString()} 
                ref={isSelected ? selectedDateRef : null}
                onClick={() => setSelectedDate(d)}
                style={{
                  minWidth: '48px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0.55rem 0.4rem',
                  borderRadius: '14px',
                  background: isSelected ? 'var(--color-primary-blue)' : 'rgba(255,255,255,0.7)',
                  color: isSelected ? 'white' : 'var(--text-main)',
                  boxShadow: isSelected ? '0 6px 14px rgba(14, 165, 233, 0.25)' : '0 2px 6px rgba(0,0,0,0.03)',
                  border: isSelected ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: '700', opacity: isSelected ? 0.9 : 0.6, textTransform: 'uppercase' }}>
                  {isToday && !isSelected ? 'HARI INI' : dayName}
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', marginTop: '0.15rem', marginBottom: hasEvent ? '0.15rem' : '0' }}>{dateNum}</span>
                {hasEvent && (
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? 'white' : 'var(--color-status-red)' }}></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tabs (iOS Segmented Control Style) */}
        <div style={{ 
          display: 'flex', gap: '0.25rem', background: 'rgba(0,0,0,0.04)', padding: '0.3rem', 
          borderRadius: '14px', border: '1px solid rgba(255,255,255,0.5)'
        }}>
          <button 
            onClick={() => setActiveTab('agenda')}
            style={{ 
              flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '0.9rem',
              background: activeTab === 'agenda' ? 'white' : 'transparent',
              color: activeTab === 'agenda' ? 'var(--color-primary-blue)' : 'var(--text-muted)',
              boxShadow: activeTab === 'agenda' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.3s'
            }}>
            Jadwal Rapat
          </button>
          <button 
            onClick={() => {
              setActiveTab('calendar');
              setCalendarMonth(new Date(selectedDate));
            }}
            style={{ 
              flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '0.9rem',
              background: activeTab === 'calendar' ? 'white' : 'transparent',
              color: activeTab === 'calendar' ? 'var(--color-primary-blue)' : 'var(--text-muted)',
              boxShadow: activeTab === 'calendar' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.3s'
            }}>
            Kalender
          </button>
        </div>
      </header>

      {/* Content Area */}
      <main style={{ flex: 1, padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {activeTab === 'agenda' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              <CalendarIcon size={20} color="var(--color-primary-blue)" /> 
              {filteredAgendas.length} Kegiatan ({selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
            </h2>
            
            {filteredAgendas.length === 0 ? (
              <div style={{ 
                textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.6)', 
                borderRadius: '24px', border: '1px dashed rgba(0,0,0,0.1)' 
              }}>
                <CalendarIcon size={48} color="rgba(0,0,0,0.1)" style={{ margin: '0 auto 1rem auto' }} />
                <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Tidak ada kegiatan yang dijadwalkan pada tanggal ini.</p>
              </div>
            ) : (
              filteredAgendas.map((agenda) => (
                <div key={agenda.id} style={{ 
                  background: 'rgba(255, 255, 255, 0.85)', padding: '1.25rem', borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,1)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                  borderLeft: `6px solid ${agenda.color}`, position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                    
                    {/* Left Column (Main Info) */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, lineHeight: 1.4, color: 'var(--text-main)', marginBottom: '0.75rem' }}>{agenda.title}</h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ padding: '0.4rem', background: 'rgba(14,165,233,0.1)', borderRadius: '10px' }}>
                            <Clock size={16} color="var(--color-primary-blue)"/> 
                          </div>
                          {agenda.timeStart} - {agenda.timeEnd} WIB
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.1)', borderRadius: '10px' }}>
                            <MapPin size={16} color="var(--color-status-red)"/> 
                          </div>
                          <span style={{ wordBreak: 'break-word' }}>{agenda.location}</span>
                        </span>
                        {agenda.attendees && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.4rem', background: 'rgba(14,165,233,0.1)', borderRadius: '10px' }}>
                              <Users size={16} color="var(--color-primary-blue)"/> 
                            </div>
                            <span style={{ wordBreak: 'break-word' }}>{agenda.attendees}</span>
                          </span>
                        )}
                        {agenda.note && (
                          <div style={{
                            marginTop: '0.6rem',
                            padding: '0.75rem 0.9rem',
                            borderRadius: '12px',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.08)',
                            color: '#92400e',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            lineHeight: '1.45'
                          }}>
                            📌 <span style={{ fontWeight: '800', color: '#78350f' }}>Catatan:</span> {agenda.note}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column (Documents) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', borderLeft: '1px dashed rgba(0,0,0,0.1)', paddingLeft: '1rem', minWidth: '105px' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', margin: '0 0 0.25rem 0', textAlign: 'right' }}>Lampiran:</p>
                      
                      {!(agenda.adminFiles && (agenda.adminFiles.undangan || agenda.adminFiles.notaDinas || agenda.adminFiles.suratTugas)) && (
                        <span style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.2)', fontWeight: '600' }}>-</span>
                      )}

                      {agenda.adminFiles?.undangan && (
                        <button onClick={() => setPreviewFile(agenda.adminFiles.undangan)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 0.8rem', minHeight: '44px', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--color-primary-blue)', border: '1px solid rgba(14, 165, 233, 0.25)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                          <FileText size={14} /> Undangan
                        </button>
                      )}
                      {agenda.adminFiles?.notaDinas && (
                        <button onClick={() => setPreviewFile(agenda.adminFiles.notaDinas)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 0.8rem', minHeight: '44px', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--color-primary-blue)', border: '1px solid rgba(14, 165, 233, 0.25)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                          <FileText size={14} /> Nota
                        </button>
                      )}
                      {agenda.adminFiles?.suratTugas && (
                        <button onClick={() => setPreviewFile(agenda.adminFiles.suratTugas)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 0.8rem', minHeight: '44px', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--color-primary-blue)', border: '1px solid rgba(14, 165, 233, 0.25)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                          <FileText size={14} /> Tugas
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'calendar' && (() => {
          const year = calendarMonth.getFullYear();
          const month = calendarMonth.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
          const prevMonthDays = new Date(year, month, 0).getDate();
          
          const days = [];
          for (let i = 0; i < firstDay; i++) {
            days.push({ empty: true, dateNum: prevMonthDays - firstDay + i + 1 });
          }
          for (let i = 1; i <= daysInMonth; i++) {
            const currentDate = new Date(year, month, i);
            const offset = currentDate.getTimezoneOffset();
            const localStr = new Date(currentDate.getTime() - (offset*60*1000)).toISOString().split('T')[0];
            const hasEvent = agendas.some(a => a.date === localStr);
            days.push({ empty: false, dateNum: i, dateObj: currentDate, hasEvent });
          }
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>
              <div style={{
                background: 'rgba(255,255,255,0.8)', borderRadius: '24px',
                padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                border: '1px solid rgba(255,255,255,0.9)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <button 
                    onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                    style={{ background: 'var(--bg-main)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                  >
                    &#8592;
                  </button>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {calendarMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button 
                    onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                    style={{ background: 'var(--bg-main)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                  >
                    &#8594;
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>
                  {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                    <div key={d} style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>{d}</div>
                  ))}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                  {days.map((day, idx) => (
                    <div key={idx} 
                      onClick={() => {
                        if(!day.empty) {
                          setSelectedDate(day.dateObj);
                          setActiveTab('agenda');
                        }
                      }}
                      style={{
                        aspectRatio: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                        borderRadius: '50%', background: day.empty ? 'transparent' : (day.dateObj.toDateString() === selectedDate.toDateString() ? 'var(--color-primary-blue)' : 'transparent'),
                        color: day.empty ? 'rgba(0,0,0,0.2)' : (day.dateObj.toDateString() === selectedDate.toDateString() ? 'white' : 'var(--text-main)'),
                        cursor: day.empty ? 'default' : 'pointer', fontWeight: '600', fontSize: '0.9rem', position: 'relative'
                      }}
                    >
                      {day.dateNum}
                      {day.hasEvent && (
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: day.dateObj.toDateString() === selectedDate.toDateString() ? 'white' : 'var(--color-status-red)', position: 'absolute', bottom: '6px' }}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

      </main>

      {/* Document Preview Modal */}
      {previewFile && (() => {
        const pdfUrlToRender = getPdfUrl(previewFile);
        return (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          zIndex: 9999, display: 'flex', flexDirection: 'column'
        }}>
          {/* Modal Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white', flex: '1 1 200px', minWidth: 0 }}>
              <div style={{ padding: '0.5rem', background: 'rgba(14,165,233,0.2)', borderRadius: '10px', flexShrink: 0 }}>
                <FileText size={20} color="var(--color-primary-blue)" />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {typeof previewFile === 'string' ? previewFile : (previewFile.name || 'Dokumen PDF')}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Pratinjau Dokumen PDF</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              {pdfUrlToRender && (
                <a
                  href={pdfUrlToRender}
                  download={typeof previewFile === 'object' ? (previewFile.name || 'dokumen.pdf') : 'dokumen.pdf'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.5rem 0.85rem', borderRadius: '10px',
                    background: 'var(--color-primary-blue)', color: 'white',
                    fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(14,165,233,0.4)', cursor: 'pointer'
                  }}
                >
                  <Download size={14} /> Unduh / Buka Full
                </a>
              )}
              <button onClick={() => setPreviewFile(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '0.5rem 0.85rem', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}>
                Tutup
              </button>
            </div>
          </div>
          
          {/* PDF Viewer Area */}
          <div style={{ flex: 1, padding: '0.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <div style={{ 
              width: '100%', height: '100%', maxWidth: '650px', 
              background: 'white', borderRadius: '12px', 
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {pdfUrlToRender ? (
                <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative', overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <object
                    data={`${pdfUrlToRender}#view=FitH&toolbar=1`}
                    type="application/pdf"
                    style={{ width: '100%', height: '100%', minHeight: '450px', border: 'none' }}
                  >
                    <iframe 
                      src={`${pdfUrlToRender}#view=FitH&toolbar=1`} 
                      style={{ width: '100%', height: '100%', minHeight: '450px', border: 'none', background: 'white' }} 
                      title="PDF Preview" 
                    />
                  </object>
                </div>
              ) : (
                <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                  <div style={{ width: '100%', display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '2px solid black', paddingBottom: '1rem', marginBottom: '1rem' }}>
                     <img src="/logo-rsud.png" alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                     <div>
                        <h2 style={{ fontSize: '1.1rem', margin: 0, textAlign: 'center' }}>PEMERINTAH KABUPATEN TANGERANG</h2>
                        <h1 style={{ fontSize: '1.2rem', margin: 0, textAlign: 'center', fontWeight: 'bold' }}>RUMAH SAKIT UMUM DAERAH TIGARAKSA</h1>
                     </div>
                  </div>
                  <div style={{ width: '60%', height: '16px', background: '#e2e8f0', borderRadius: '4px', margin: '0 auto' }}></div>
                  <div style={{ width: '80%', height: '12px', background: '#f1f5f9', borderRadius: '4px', marginTop: '2rem' }}></div>
                  <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '4px' }}></div>
                  <div style={{ width: '90%', height: '12px', background: '#f1f5f9', borderRadius: '4px' }}></div>
                  <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '4px' }}></div>
                  <div style={{ width: '70%', height: '12px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '2rem' }}></div>
                  
                  <div style={{ alignSelf: 'flex-end', width: '40%', height: '60px', border: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>Tanda Tangan</div>
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      
    </div>
  );
};

export default MobileView;
