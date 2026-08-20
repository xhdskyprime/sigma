import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import { Trash2 } from 'lucide-react';

const Settings = () => {
  const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';
  const { announcements, addAnnouncement, deleteAnnouncement, mobilePin, updateMobilePin, emailSettings, updateEmailSettings } = useSettings();
  const { user } = useAuth();
  const [formData, setFormData] = useState({ title: '', content: '', type: 'blue' });
  const [pinInput, setPinInput] = useState(mobilePin || '');
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    setPinInput(mobilePin || '');
  }, [mobilePin]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;
    addAnnouncement(formData);
    setFormData({ title: '', content: '', type: 'blue' });
    showToast('Pengumuman baru berhasil ditambahkan', 'success');
  };

  const handlePinSave = () => {
    updateMobilePin(pinInput);
    showToast('PIN Mobile View berhasil disimpan secara terpusat!', 'success');
  };

  const handlePinRemove = () => {
    setPinInput('');
    updateMobilePin('');
    showToast('PIN Mobile View berhasil dinonaktifkan', 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>Pengaturan Sistem</h2>
        <p style={{ color: 'var(--text-muted)' }}>Kelola pengaturan tampilan, keamanan, dan informasi publik.</p>
      </div>

      {/* Keamanan Mobile View */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Keamanan Mobile View 
            {mobilePin ? <span className="badge" style={{ backgroundColor: 'var(--color-primary-green)' }}>Aktif</span> : <span className="badge" style={{ backgroundColor: 'var(--color-status-gray)', color: 'var(--text-main)' }}>Nonaktif</span>}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
            Atur PIN angka untuk mengunci tampilan Layar Mobile. Jika diaktifkan, pengguna harus memasukkan PIN ini untuk melihat jadwal rapat.
          </p>
        </div>
        
        {user?.role === 'admin' ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              type="password" 
              maxLength="6"
              placeholder="Masukkan PIN (cth: 1234)" 
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-main)', color: 'var(--text-main)', width: '200px', fontSize: '1.1rem', letterSpacing: '2px', textAlign: 'center' }}
            />
            <button onClick={handlePinSave} style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary-blue)', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
              Simpan PIN
            </button>
            {mobilePin && (
              <button onClick={handlePinRemove} style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--color-status-red)', background: 'transparent', color: 'var(--color-status-red)', fontWeight: '600', cursor: 'pointer' }}>
                Nonaktifkan
              </button>
            )}
          </div>
        ) : (
          <div style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-main)', borderRadius: '8px', color: 'var(--text-muted)' }}>
            Hanya Admin yang dapat mengubah PIN.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Form Tambah */}
        <div className="card" style={{ flex: '1 1 400px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem' }}>Tambah Informasi Pegawai</h3>
          {user?.role === 'admin' ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Judul Informasi</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  placeholder="Contoh: Info Cuti Pegawai"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Isi Informasi / Detail</label>
                <textarea 
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100px' }}
                  placeholder="Tuliskan detail informasi..."
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Warna Aksen</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                >
                  <option value="blue">Biru (Info Umum)</option>
                  <option value="green">Hijau (Pembaruan/Berhasil)</option>
                  <option value="red">Merah (Penting/Urgent)</option>
                  <option value="orange">Oranye (Peringatan)</option>
                </select>
              </div>
              <button type="submit" style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, var(--color-primary-blue), var(--color-primary-green))', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                Tambahkan ke TV Board
              </button>
            </form>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-main)', borderRadius: '8px', color: 'var(--text-muted)' }}>
              Hanya Admin yang dapat menambahkan informasi.
            </div>
          )}
        </div>

        {/* Daftar Informasi */}
        <div className="card" style={{ flex: '1 1 400px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem' }}>Daftar Informasi Aktif</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
            {announcements.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>Belum ada informasi yang ditampilkan.</p>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} style={{ 
                  padding: '1rem', 
                  backgroundColor: 'var(--bg-main)', 
                  borderRadius: '12px', 
                  borderLeft: `4px solid ${ann.type === 'blue' ? 'var(--color-primary-blue)' : ann.type === 'green' ? 'var(--color-primary-green)' : ann.type === 'red' ? 'var(--color-status-red)' : 'var(--color-status-orange)'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: 'var(--text-main)' }}>{ann.title}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{ann.content}</div>
                  </div>
                  {user?.role === 'admin' && (
                    <button onClick={() => deleteAnnouncement(ann.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-status-red)', padding: '0.25rem' }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Email Notification Settings */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Konfigurasi Notifikasi Email Harian
          {user?.role === 'admin' ? (
            <span className="badge" style={{ backgroundColor: 'var(--color-primary-blue)' }}>Admin</span>
          ) : null}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
          Sistem akan mengirimkan daftar seluruh kegiatan hari ini ke alamat email yang terdaftar setiap hari pada jam yang ditentukan.
        </p>

        {user?.role === 'admin' ? (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Pengirim */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '12px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>Akun Pengirim (Gmail)</h4>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Alamat Email (Gmail)</label>
                <input 
                  type="email" 
                  value={emailSettings.emailSender || ''}
                  onChange={e => updateEmailSettings({ ...emailSettings, emailSender: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-main)' }}
                  placeholder="contoh@gmail.com"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>App Password (Sandi Aplikasi)</label>
                <input 
                  type="password" 
                  value={emailSettings.emailPassword || ''}
                  onChange={e => updateEmailSettings({ ...emailSettings, emailPassword: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-main)' }}
                  placeholder="16 karakter app password"
                />
              </div>
            </div>

            {/* Penerima dan Jadwal */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '12px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>Penerima & Waktu</h4>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Daftar Email Penerima (Pisahkan dengan koma)</label>
                <textarea 
                  value={(emailSettings.emailRecipients || []).join(', ')}
                  onChange={e => {
                    const list = e.target.value.split(',').map(m => m.trim()).filter(Boolean);
                    updateEmailSettings({ ...emailSettings, emailRecipients: list });
                  }}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-main)', minHeight: '60px' }}
                  placeholder="penerima1@gmail.com, penerima2@yahoo.com"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Jadwal Pengiriman (Setiap Hari)</label>
                <input 
                  type="time" 
                  value={emailSettings.emailSchedule || '07:00'}
                  onChange={e => updateEmailSettings({ ...emailSettings, emailSchedule: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-main)' }}
                />
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <button 
                  disabled={isSendingEmail}
                  onClick={() => {
                    setIsSendingEmail(true);
                    showToast('Menguji pengiriman email... mohon tunggu.', 'info');
                    fetch(`${API_URL}/api/test-email`, { 
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('rsud_token')}`
                      }
                    })
                      .then(res => res.json())
                      .then(data => {
                        setIsSendingEmail(false);
                        if (data.success) {
                          showToast('✉️ Email agenda harian berhasil dikirim!', 'success');
                        } else {
                          showToast('❌ Gagal mengirim email: ' + (data.error || 'Periksa SMTP Server'), 'error');
                        }
                      })
                      .catch(err => {
                        setIsSendingEmail(false);
                        showToast('❌ Terjadi kesalahan koneksi server.', 'error');
                      });
                  }}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: isSendingEmail ? '#94a3b8' : 'var(--color-primary-green)', color: 'white', fontWeight: '600', cursor: isSendingEmail ? 'not-allowed' : 'pointer' }}
                >
                  {isSendingEmail ? 'Mengirim Email Test...' : 'Kirim Email Uji Coba Sekarang'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-main)', borderRadius: '8px', color: 'var(--text-muted)' }}>
            Hanya Admin yang dapat mengubah konfigurasi notifikasi email harian.
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '600px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Ubah Kata Sandi (Keamanan)</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
          Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan data.
        </p>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const oldPassword = e.target.oldPassword.value;
          const newPassword = e.target.newPassword.value;
          const confirmPassword = e.target.confirmPassword.value;
          
          if (newPassword !== confirmPassword) {
            return alert('Kata sandi baru dan konfirmasi tidak cocok!');
          }
          
          try {
            const res = await fetch(`${API_URL}/api/change-password`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('rsud_token')}`
              },
              body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
              alert('Kata sandi berhasil diubah!');
              e.target.reset();
            } else {
              alert('Gagal mengubah kata sandi: ' + data.error);
            }
          } catch (err) {
            alert('Kesalahan jaringan.');
          }
        }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Sandi Lama</label>
            <input name="oldPassword" type="password" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-main)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Sandi Baru</label>
            <input name="newPassword" type="password" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-main)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Konfirmasi Sandi Baru</label>
            <input name="confirmPassword" type="password" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)', color: 'var(--text-main)' }} />
          </div>
          <button type="submit" style={{ padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary-blue)', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
            Perbarui Sandi
          </button>
        </form>
      </div>

    </div>
  );
};

export default Settings;
