import React, { useState, useEffect, useRef } from 'react';
import pegawaiData from '../data/pegawai.json';
import { Search, X } from 'lucide-react';

const PegawaiSelect = ({ value, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Convert separated string (by semicolon) to array
  const selectedList = value 
    ? String(value).split(';').map(v => v.trim()).filter(Boolean) 
    : [];

  const handleSelect = (nama) => {
    if (!selectedList.includes(nama)) {
      const newList = [...selectedList, nama];
      const valStr = newList.join('; ');
      if (typeof onChange === 'function') {
        onChange(valStr);
      }
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleRemove = (nama) => {
    const newList = selectedList.filter(item => item !== nama);
    const valStr = newList.join('; ');
    if (typeof onChange === 'function') {
      onChange(valStr);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      handleSelect(searchTerm.trim());
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPegawai = pegawaiData.filter(p => 
    (p.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.profesi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.jabatan || '').toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 50); // Limit to 50 results for performance

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{
        minHeight: '34px',
        padding: '0.25rem 0.4rem',
        borderRadius: '8px',
        border: '1px solid #cbd5e1',
        background: 'white',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.35rem',
        alignItems: 'center',
        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
        cursor: 'text'
      }} onClick={() => setIsOpen(true)}>
        {selectedList.map((item, idx) => (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
            background: 'rgba(14, 165, 233, 0.12)',
            color: 'var(--color-primary-blue)',
            border: '1px solid rgba(14, 165, 233, 0.25)',
            padding: '0.15rem 0.45rem',
            borderRadius: '5px',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {item}
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); handleRemove(item); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--color-primary-blue)' }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedList.length === 0 ? "Cari nama pegawai RSUD atau ketik manual..." : "Ketik untuk tambah pegawai lagi..."}
          style={{
            flex: 1,
            minWidth: '150px',
            fontSize: '0.8rem',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: '0.35rem',
            color: '#1e293b',
            fontFamily: 'inherit',
            fontSize: '0.9rem'
          }}
        />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          maxHeight: '260px',
          overflowY: 'auto',
          zIndex: 3000
        }}>
          {filteredPegawai.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Tidak ditemukan pegawai dengan nama tersebut. <br/>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-primary-blue)', fontWeight: '600' }}>
                (Tekan Enter untuk memilih <b>"{searchTerm}"</b> sebagai input manual)
              </span>
            </div>
          ) : (
            filteredPegawai.map(p => (
              <div 
                key={p.id} 
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(p.nama);
                }}
                style={{ 
                  padding: '0.75rem 1rem', 
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  background: selectedList.includes(p.nama) ? 'rgba(14, 165, 233, 0.08)' : 'white'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(14, 165, 233, 0.12)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = selectedList.includes(p.nama) ? 'rgba(14, 165, 233, 0.08)' : 'white'}
              >
                <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.9rem' }}>
                  {p.nama} {selectedList.includes(p.nama) && <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-blue)', marginLeft: '0.5rem' }}>✓ Terpilih</span>}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{p.jabatan} • {p.profesi}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PegawaiSelect;
