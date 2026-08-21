import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useAgenda } from '../context/AgendaContext';
import { useAuth } from '../context/AuthContext';
import CreateAgendaModal from '../components/CreateAgendaModal';
import Toast from '../components/Toast';
import { 
  Trash2, Pencil, CheckCircle2, Circle, X, Upload, Eye, FileText, ExternalLink,
  Calendar as CalendarIcon, Search, Filter, RotateCcw, 
  ChevronLeft, ChevronRight 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';

const getPdfUrl = (fileEntry) => {
  if (!fileEntry) return null;
  if (typeof fileEntry === 'string') {
    if (fileEntry.startsWith('data:') || fileEntry.startsWith('http')) return fileEntry;
    return `${API_URL}${fileEntry}`;
  }
  if (fileEntry.url) {
    if (fileEntry.url.startsWith('data:') || fileEntry.url.startsWith('http')) return fileEntry.url;
    return `${API_URL}${fileEntry.url}`;
  }
  return null;
};

const AgendaManagement = () => {
  const { agendas, deleteAgenda, uploadAdminFile, removeAdminFile } = useAgenda();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [previewPdf, setPreviewPdf] = useState(null);
  
  // Filter & Toast states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [dateFilter, setDateFilter] = useState(''); // YYYY-MM-DD
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const getLocalDateStr = (d) => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr(new Date());

  const generateMonthDates = () => {
    const dates = [];
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const emptySlots = firstDay === 0 ? 6 : firstDay - 1; // Align Monday as 1st col
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < emptySlots; i++) {
      dates.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(new Date(year, month, i));
    }
    return dates;
  };

  const handleFileChange = (e, agendaId, field) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (event) => {
        uploadAdminFile(agendaId, field, file.name, event.target.result);
        showToast('Dokumen PDF berhasil diunggah!', 'success');
      };
      reader.readAsDataURL(file);
    } else if (file) {
      showToast('Hanya file PDF yang diizinkan!', 'error');
    }
  };

  const renderAdminCheck = (agenda, field) => {
    const statusText = agenda.admin?.[field];
    const fileEntry = agenda.adminFiles?.[field];
    const isDone = statusText === 'Sudah Selesai';
    const fileName = typeof fileEntry === 'object' ? fileEntry?.name : (typeof fileEntry === 'string' ? fileEntry : 'Dokumen PDF');
    const pdfUrl = getPdfUrl(fileEntry);
    
    const fieldLabels = {
      suratTugas: 'Surat Tugas',
      undangan: 'Surat Undangan',
      notaDinas: 'Nota Dinas'
    };

    return (
      <div 
        style={{ 
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem', position: 'relative'
        }}
        title={fileName ? `Klik untuk preview PDF: ${fileName}` : "Belum ada file PDF terlampir"}
      >
        {isDone ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-status-green)' }}>
            <button 
              onClick={() => {
                if (pdfUrl) {
                  setPreviewPdf({
                    title: `${fieldLabels[field] || 'Dokumen'} - ${agenda.title}`,
                    name: fileName,
                    url: pdfUrl
                  });
                } else {
                  showToast('File PDF belum tersedia untuk dipreview', 'error');
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)',
                color: 'var(--color-status-green)', padding: '0.2rem 0.45rem', borderRadius: '6px',
                fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Klik untuk Preview PDF"
            >
              <CheckCircle2 size={15} />
              <Eye size={13} color="var(--color-primary-blue)" />
            </button>

            {user?.role === 'admin' && (
              <button onClick={() => {
                if (window.confirm(`Hapus lampiran PDF untuk dokumen ini?`)) {
                  removeAdminFile(agenda.id, field);
                  showToast('Lampiran PDF berhasil dihapus', 'info');
                }
              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-status-red)', padding: '0.15rem', display: 'flex', alignItems: 'center' }} title="Hapus PDF">
                <X size={13} />
              </button>
            )}
          </div>
        ) : (
          <div style={{ position: 'relative', width: '18px', height: '18px', color: '#94a3b8', transition: 'color 0.2s' }}
               onMouseOver={e => e.currentTarget.style.color = 'var(--color-primary-blue)'}
               onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}>
            <Upload size={18} style={{ position: 'absolute', top: 0, left: 0 }} />
            {user?.role === 'admin' && (
              <input 
                type="file" 
                accept="application/pdf"
                onChange={(e) => handleFileChange(e, agenda.id, field)}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                title="Klik untuk upload PDF"
              />
            )}
          </div>
        )}
      </div>
    );
  };

  const filteredAgendas = agendas.filter(a => {
    const matchesSearch = (a.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (a.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (a.attendees || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'Semua' || a.category === categoryFilter;
    const matchesDate = !dateFilter || a.date === dateFilter;
    return matchesSearch && matchesCat && matchesDate;
  });

  const sortedAgendas = [...filteredAgendas].sort((a, b) => {
    const isAPast = a.date < todayStr;
    const isBPast = b.date < todayStr;
    
    if (isAPast && !isBPast) return 1;
    if (!isAPast && isBPast) return -1;
    
    if (!isAPast) {
       if (a.date !== b.date) return a.date.localeCompare(b.date);
       return a.timeStart.localeCompare(b.timeStart);
    } else {
       if (a.date !== b.date) return b.date.localeCompare(a.date);
       return b.timeStart.localeCompare(a.timeStart);
    }
  });

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(sortedAgendas.length / ITEMS_PER_PAGE) || 1;
  const paginatedAgendas = sortedAgendas.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const resetAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('Semua');
    setDateFilter('');
    setCurrentPage(1);
    showToast('Filter pencarian & tanggal telah direset', 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Daftar Seluruh Agenda</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.15rem 0 0 0' }}>Kelola semua jadwal rapat dan kegiatan RSUD di sini.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowCalendar(true)} style={{
            padding: '0.45rem 0.9rem', borderRadius: '10px',
            border: dateFilter ? '2px solid var(--color-primary-blue)' : '1px solid rgba(14,165,233,0.3)',
            background: dateFilter ? 'rgba(14,165,233,0.08)' : 'white', display: 'flex', alignItems: 'center', gap: '0.4rem',
            color: 'var(--color-primary-blue)', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <CalendarIcon size={15} /> {dateFilter ? `Filter: ${new Date(dateFilter + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : 'Kalender Filter'}
          </button>
          
          {user?.role === 'admin' && (
            <button onClick={() => setIsModalOpen(true)} style={{
              padding: '0.45rem 1rem', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, var(--color-primary-blue), var(--color-primary-green))',
              color: 'white', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
              boxShadow: '0 3px 12px rgba(14,165,233,0.3)'
            }}>
              + Tambah Agenda Baru
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem' }} />
          <input 
            type="text" 
            placeholder="Cari judul agenda, lokasi, atau peserta..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%', padding: '0.45rem 0.75rem 0.45rem 2.2rem', borderRadius: '8px',
              border: '1px solid var(--border-glass)', background: 'var(--bg-main)',
              color: 'var(--text-main)', outline: 'none', fontSize: '0.82rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter size={15} color="var(--text-muted)" />
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Kategori:</span>
          <select 
            value={categoryFilter} 
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-glass)',
              background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', fontSize: '0.82rem', fontWeight: '600'
            }}
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Internal">Internal</option>
            <option value="Eksternal">Eksternal</option>
          </select>
        </div>

        {dateFilter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem', borderRadius: '8px', background: 'rgba(14,165,233,0.1)', color: 'var(--color-primary-blue)', fontSize: '0.78rem', fontWeight: '600' }}>
            <CalendarIcon size={13} /> Tanggal: {new Date(dateFilter + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            <button 
              onClick={() => { setDateFilter(''); setCurrentPage(1); }} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-status-red)', display: 'flex', alignItems: 'center', padding: '0 0 0 0.2rem' }} 
              title="Hapus Filter Tanggal"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {(searchQuery || categoryFilter !== 'Semua' || dateFilter) && (
          <button 
            onClick={resetAllFilters}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.45rem 0.85rem',
              borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569',
              fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer'
            }}
          >
            <RotateCcw size={13} /> Reset Filter
          </button>
        )}
      </div>

      <div className="card" style={{ overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.85rem 1rem' }}>
        <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-glass)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.6rem 0.75rem' }}>Tanggal</th>
              <th style={{ padding: '0.6rem 0.75rem' }}>Waktu</th>
              <th style={{ padding: '0.6rem 0.75rem' }}>Judul Kegiatan</th>
              <th style={{ padding: '0.6rem 0.75rem' }}>Lokasi</th>
              <th style={{ padding: '0.6rem 0.75rem' }}>PIC / Hadir</th>
              <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }} title="Surat Tugas">S. Tugas</th>
              <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }} title="Surat Undangan">Undangan</th>
              <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }} title="Nota Dinas">N. Dinas</th>
              {user?.role === 'admin' && <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedAgendas.length === 0 ? (
              <tr>
                <td colSpan={user?.role === 'admin' ? 9 : 8} style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <Search size={32} color="#cbd5e1" />
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#64748b' }}>Agenda Tidak Ditemukan</div>
                    <div style={{ fontSize: '0.8rem' }}>Tidak ada agenda yang cocok dengan pencarian atau filter yang dipilih.</div>
                    {(searchQuery || categoryFilter !== 'Semua' || dateFilter) && (
                      <button 
                        onClick={resetAllFilters}
                        style={{ marginTop: '0.35rem', padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary-blue)', color: 'white', fontWeight: '600', fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        Reset Filter Pencarian & Tanggal
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : paginatedAgendas.map((agenda) => (
              <tr key={agenda.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s' }}>
                <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap', fontWeight: '600' }}>
                  {new Date(agenda.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  {agenda.timeStart} - {agenda.timeEnd}
                </td>
                <td style={{ padding: '0.65rem 0.75rem', fontWeight: '700', color: 'var(--text-main)', maxWidth: '280px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>{agenda.title}</span>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <span className="badge" style={{ backgroundColor: agenda.color, fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>{agenda.status}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.05)', padding: '0.15rem 0.45rem', borderRadius: '5px' }}>{agenda.category}</span>
                    </div>
                    {agenda.note && (
                      <span style={{ fontSize: '0.68rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', padding: '0.15rem 0.45rem', borderRadius: '5px', marginTop: '0.15rem' }}>
                        📌 Catatan: {agenda.note}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{agenda.location}</td>
                <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{agenda.attendees || agenda.pic}</td>
                
                <td style={{ padding: '0.65rem 0.75rem' }}>{renderAdminCheck(agenda, 'suratTugas')}</td>
                <td style={{ padding: '0.65rem 0.75rem' }}>{renderAdminCheck(agenda, 'undangan')}</td>
                <td style={{ padding: '0.65rem 0.75rem' }}>{renderAdminCheck(agenda, 'notaDinas')}</td>
                
                {user?.role === 'admin' && (
                  <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      <button 
                        onClick={() => setEditingAgenda(agenda)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-blue)', padding: '0.4rem' }}
                        title="Edit Agenda"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => { if(window.confirm('Yakin ingin menghapus agenda ini?')) { deleteAgenda(agenda.id); showToast('Agenda berhasil dihapus', 'info'); } }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-status-red)', padding: '0.4rem' }}
                        title="Hapus Agenda"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem 1rem 1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Menampilkan {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, sortedAgendas.length)} dari {sortedAgendas.length} agenda
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                Sebelumnya
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingAgenda && (
        <CreateAgendaModal 
          isOpen={!!editingAgenda} 
          onClose={() => setEditingAgenda(null)} 
          agendaToEdit={editingAgenda}
        />
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <CreateAgendaModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

      {/* Interactive Calendar Filter Modal */}
      {showCalendar && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)',
          zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{ width: '420px', maxWidth: '100%', background: 'white', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} style={{ background: 'rgba(241,245,249,1)', border: 'none', borderRadius: '10px', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={20} color="#334155" />
              </button>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--color-primary-blue)', margin: 0 }}>
                {calendarMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} style={{ background: 'rgba(241,245,249,1)', border: 'none', borderRadius: '10px', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={20} color="#334155" />
              </button>
            </div>
            
            {/* Day Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '0.75rem' }}>
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
                <div key={d} style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b' }}>{d}</div>
              ))}
            </div>

            {/* Dates Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem', textAlign: 'center', marginBottom: '1.25rem' }}>
              {generateMonthDates().map((d, i) => {
                if (!d) return <div key={`empty-${i}`} />;
                
                const localStr = getLocalDateStr(d);
                const isToday = localStr === todayStr;
                const isSelected = dateFilter === localStr;
                const hasEvent = agendas.some(a => a.date === localStr);

                return (
                  <div key={i} 
                    onClick={() => { 
                      setDateFilter(localStr); 
                      setCurrentPage(1); 
                      setShowCalendar(false);
                      showToast(`Filter tanggal ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} aktif`, 'info');
                    }}
                    title={hasEvent ? `Ada agenda kegiatan pada tanggal ini` : `Tidak ada agenda`}
                    style={{
                      aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '12px',
                      background: isSelected ? 'var(--color-primary-blue)' : isToday ? 'rgba(14,165,233,0.15)' : 'rgba(241,245,249,0.7)',
                      border: isSelected ? '2px solid var(--color-primary-blue)' : isToday ? '1px solid var(--color-primary-blue)' : '1px solid rgba(0,0,0,0.05)',
                      color: isSelected ? 'white' : isToday ? 'var(--color-primary-blue)' : 'var(--text-main)',
                      fontWeight: '700', cursor: 'pointer', position: 'relative',
                      boxShadow: isSelected ? '0 4px 10px rgba(14,165,233,0.3)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontSize: '0.85rem' }}>{d.getDate()}</span>
                    
                    {/* Red Dot Indicator for dates with agendas */}
                    {hasEvent && (
                      <div style={{
                        position: 'absolute', bottom: '5px',
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: isSelected ? 'white' : 'var(--color-status-red, #ef4444)',
                        boxShadow: isSelected ? 'none' : '0 0 4px rgba(239, 68, 68, 0.6)'
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {dateFilter && (
                <button 
                  onClick={() => {
                    setDateFilter('');
                    setCurrentPage(1);
                    setShowCalendar(false);
                    showToast('Filter tanggal telah dibersihkan', 'info');
                  }} 
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontWeight: '700', cursor: 'pointer' }}
                >
                  Reset Filter Tanggal
                </button>
              )}
              <button 
                onClick={() => setShowCalendar(false)} 
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', background: 'rgba(241,245,249,1)', border: 'none', color: '#334155', fontWeight: '700', cursor: 'pointer' }}
              >
                Tutup Kalender
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      {previewPdf && (
        ReactDOM.createPortal(
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            zIndex: 999999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
          }}>
            <div style={{
              background: 'white', borderRadius: '16px', padding: '1.25rem',
              width: '100%', maxWidth: '880px', height: '88vh', display: 'flex',
              flexDirection: 'column', gap: '0.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #e2e8f0', color: '#1e293b'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                  <FileText size={22} color="var(--color-primary-blue)" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {previewPdf.title}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📄 {previewPdf.name || 'Dokumen PDF Terlampir'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                  <a 
                    href={previewPdf.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.45rem 0.85rem', borderRadius: '8px',
                      background: 'rgba(14,165,233,0.1)', color: 'var(--color-primary-blue)',
                      fontSize: '0.78rem', fontWeight: '700', textDecoration: 'none',
                      border: '1px solid rgba(14,165,233,0.25)'
                    }}
                  >
                    <ExternalLink size={14} /> Buka Tab Baru
                  </a>
                  <button 
                    onClick={() => setPreviewPdf(null)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: '0.3rem' }}
                  >
                    <X size={22} />
                  </button>
                </div>
              </div>

              {/* PDF Viewer */}
              <div style={{ flex: 1, background: '#f8fafc', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
                <iframe 
                  src={previewPdf.url} 
                  title="PDF Preview" 
                  style={{ width: '100%', height: '100%', border: 'none' }}
                ></iframe>
              </div>
            </div>
          </div>,
          document.body
        )
      )}
    </div>
  );
};

export default AgendaManagement;
