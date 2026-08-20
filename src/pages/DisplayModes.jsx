import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Smartphone } from 'lucide-react';

const DisplayModes = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>Tampilan Layar</h2>
        <p style={{ color: 'var(--text-muted)' }}>Pilih jenis tampilan layar yang ingin Anda jalankan.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* TV Board Card */}
        <div 
          className="card"
          onClick={() => navigate('/tv')}
          style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', 
            gap: '1.5rem', padding: '3rem 2rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
            border: '2px solid transparent'
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--color-primary-blue)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
        >
          <div style={{ padding: '1.5rem', backgroundColor: 'rgba(14, 165, 233, 0.1)', borderRadius: '50%', color: 'var(--color-primary-blue)' }}>
            <Monitor size={64} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Layar TV (TV Board)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Tampilan lanskap yang didesain khusus untuk layar lebar (TV, Proyektor, Monitor Eksternal). Cocok untuk dipasang di ruang tunggu atau lobi utama.
            </p>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 'auto', width: '100%' }}>Luncurkan Layar TV</button>
        </div>

        {/* Mobile View Card */}
        <div 
          className="card"
          onClick={() => navigate('/mobile')}
          style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', 
            gap: '1.5rem', padding: '3rem 2rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
            border: '2px solid transparent'
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--color-primary-green)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
        >
          <div style={{ padding: '1.5rem', backgroundColor: 'rgba(40, 167, 69, 0.1)', borderRadius: '50%', color: 'var(--color-primary-green)' }}>
            <Smartphone size={64} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Layar Mobile (HP)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Tampilan potret (vertikal) yang didesain ringan, cepat, dan responsif untuk diakses melalui perangkat pintar atau tablet (Mobile View).
            </p>
          </div>
          <button className="btn" style={{ marginTop: 'auto', width: '100%', backgroundColor: 'var(--color-primary-green)', color: 'white', border: 'none' }}>Luncurkan Layar Mobile</button>
        </div>

      </div>
    </div>
  );
};

export default DisplayModes;
