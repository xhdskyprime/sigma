import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCircle2 } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sessionMsg = new URLSearchParams(window.location.search).get('message');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'var(--bg-image)',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-main)',
      fontFamily: 'Outfit, sans-serif'
    }}>
      <div className="card" style={{
        width: '400px',
        maxWidth: '90%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '3rem 2rem',
        gap: '2rem'
      }}>
        <img src="/logo-rsud.png" alt="Logo RSUD" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>RSUD TIGARAKSA</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Silakan login untuk mengakses Executive Dashboard</p>
        </div>

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sessionMsg && !error && (
            <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fffbeb', color: '#92400e', borderRadius: '10px', fontSize: '0.85rem', textAlign: 'center', border: '1px solid #fde68a', fontWeight: '600' }}>
              ℹ️ {sessionMsg}
            </div>
          )}

          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-status-red)', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-main)' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-main)' }}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{
              marginTop: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
              padding: '1rem', width: '100%', borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-primary-blue), #3b82f6)',
              color: 'white', fontSize: '1rem', fontWeight: '600',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(14,165,233,0.3)',
              transition: 'transform 0.2s',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Memproses...' : 'Masuk ke Sistem'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
