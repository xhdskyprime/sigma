import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { XCircle } from 'lucide-react';
import { useAgenda } from '../context/AgendaContext';
import PegawaiSelect from './PegawaiSelect';

const getTodayWibStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CreateAgendaModal = ({ onClose, agendaToEdit }) => {
  const { addAgenda, updateAgenda } = useAgenda();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSampaiSelesai, setIsSampaiSelesai] = useState(() => {
    return agendaToEdit ? (agendaToEdit.timeEnd === 's/d Selesai' || agendaToEdit.timeEnd === 'Selesai') : false;
  });
  
  const [formData, setFormData] = useState(() => {
    if (agendaToEdit) {
      return {
        title: agendaToEdit.title || '',
        date: agendaToEdit.date || getTodayWibStr(),
        timeStart: agendaToEdit.timeStart || '08:00',
        timeEnd: agendaToEdit.timeEnd || '09:00',
        location: agendaToEdit.location || '',
        pic: agendaToEdit.pic || '',
        unit: agendaToEdit.unit || '',
        attendees: agendaToEdit.attendees || '',
        category: agendaToEdit.category || 'Internal',
        status: agendaToEdit.status || 'Akan Dimulai',
        note: agendaToEdit.note || ''
      };
    }
    return {
      title: '',
      date: getTodayWibStr(),
      timeStart: '08:00',
      timeEnd: '09:00',
      location: '',
      pic: '',
      unit: '',
      attendees: '',
      category: 'Internal',
      status: 'Akan Dimulai',
      note: ''
    };
  });

  const [timeError, setTimeError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (!isSampaiSelesai && (name === 'timeStart' || name === 'timeEnd')) {
      const start = name === 'timeStart' ? value : formData.timeStart;
      const end = name === 'timeEnd' ? value : formData.timeEnd;
      if (start && end && end <= start) {
        setTimeError('⚠️ Waktu selesai harus setelah waktu mulai');
      } else {
        setTimeError('');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!isSampaiSelesai && formData.timeEnd <= formData.timeStart) {
      setTimeError('⚠️ Waktu selesai harus setelah waktu mulai');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...formData,
      timeEnd: isSampaiSelesai ? 's/d Selesai' : formData.timeEnd
    };

    if (agendaToEdit) {
      updateAgenda(agendaToEdit.id, payload);
    } else {
      addAgenda(payload);
    }
    onClose();
  };

  const inputStyle = {
    padding: '0.45rem 0.65rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1', // slate-300
    background: 'white',
    color: '#1e293b', // slate-800
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
    fontSize: '0.82rem',
    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)'
  };

  const labelStyle = {
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#475569', // slate-600
    marginBottom: '0.2rem'
  };

  const formGroupStyle = {
    display: 'flex',
    flexDirection: 'column'
  };

  const modalContent = (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh',
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      zIndex: 999999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
    }}>
      <div style={{
        background: 'white', borderRadius: '14px', padding: '1.1rem 1.35rem',
        width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid #e2e8f0', color: '#1e293b'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            {agendaToEdit ? 'Edit Agenda Rapat' : 'Tambah Agenda Rapat Baru'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
            <XCircle size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Judul Agenda Rapat *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="Contoh: Rapat Koordinasi Penanganan Stunting"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Tanggal *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Lokasi Rapat *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="Contoh: Aula Utama RSUD"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Waktu Mulai *</label>
              <input
                type="time"
                name="timeStart"
                value={formData.timeStart}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={labelStyle}>Waktu Selesai {!isSampaiSelesai && '*'}</label>
                <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer', color: 'var(--color-primary-blue)', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={isSampaiSelesai}
                    onChange={(e) => {
                      setIsSampaiSelesai(e.target.checked);
                      if (e.target.checked) setTimeError('');
                    }}
                  />
                  s/d Selesai
                </label>
              </div>
              {!isSampaiSelesai ? (
                <input
                  type="time"
                  name="timeEnd"
                  value={formData.timeEnd}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              ) : (
                <input
                  type="text"
                  value="s/d Selesai"
                  disabled
                  style={{ ...inputStyle, background: '#f1f5f9', color: '#64748b', fontWeight: '600' }}
                />
              )}
            </div>
          </div>
          {timeError && <span style={{ color: 'var(--color-status-red)', fontSize: '0.75rem', fontWeight: '600' }}>{timeError}</span>}

          <div style={formGroupStyle}>
            <label style={labelStyle}>Pejabat / Petugas Hadir (PIC)</label>
            <PegawaiSelect
              value={formData.attendees}
              onChange={(val) => {
                const newAttendees = typeof val === 'string' ? val : (val?.target?.value || '');
                const firstPerson = newAttendees ? newAttendees.split(';')[0].trim() : '';
                setFormData(prev => ({
                  ...prev,
                  attendees: newAttendees,
                  pic: firstPerson
                }));
              }}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Kategori</label>
            <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
              <option value="Internal">Internal</option>
              <option value="Eksternal">Eksternal</option>
            </select>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Catatan / Keterangan Tambahan</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Contoh: Peserta membawa laptop. Seragam PDH."
            />
          </div>

          <div style={{ padding: '0.45rem 0.65rem', borderRadius: '8px', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', fontSize: '0.72rem', color: '#0369a1', lineHeight: '1.3' }}>
            ℹ️ <b>Petunjuk:</b> Dokumen dapat diunggah melalui kolom tabel <i>Manajemen Agenda</i>.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.35rem' }}>
            <button type="button" onClick={onClose} disabled={isSubmitting} style={{ padding: '0.45rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#334155', fontWeight: '600', fontSize: '0.8rem', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.45rem 1.1rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, var(--color-primary-blue), var(--color-primary-green))', color: 'white', fontWeight: '700', fontSize: '0.8rem', boxShadow: '0 3px 10px rgba(14,165,233,0.3)', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Menyimpan...' : (agendaToEdit ? 'Simpan Perubahan' : 'Simpan Agenda')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default CreateAgendaModal;
