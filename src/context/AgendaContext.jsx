import React, { createContext, useState, useContext, useEffect } from 'react';
import initialData from '../data/agendas.json';

const AgendaContext = createContext();
export const useAgenda = () => useContext(AgendaContext);

const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';

const statusMap = {
  'Selesai': 'var(--color-status-green)',
  'Sedang Berlangsung': 'var(--color-status-blue)',
  'Acara Hari Ini': 'var(--color-status-yellow)',
  'Akan Dimulai': 'var(--color-primary-blue)',
  'Ditunda': 'var(--color-status-red)',
  'Dibatalkan': 'var(--color-status-gray)'
};

const getAutoStatusAndColor = (date, currentStatus) => {
  const today = new Date();
  const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  if (currentStatus === 'Dibatalkan' || currentStatus === 'Ditunda') {
    return { status: currentStatus, color: statusMap[currentStatus] || 'var(--color-status-gray)' };
  }

  if (date < todayStr) {
    return { status: 'Selesai', color: statusMap['Selesai'] };
  } else if (date === todayStr) {
    return { status: 'Acara Hari Ini', color: statusMap['Acara Hari Ini'] };
  } else {
    return { status: 'Akan Dimulai', color: statusMap['Akan Dimulai'] };
  }
};

export const AgendaProvider = ({ children }) => {
  const [agendas, setAgendas] = useState([]);

  const fetchAgendas = () => {
    fetch(`${API_URL}/api/agendas`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        
        let isUpdated = false;
        data = data.map(agenda => {
          const auto = getAutoStatusAndColor(agenda.date, agenda.status);
          if (agenda.status !== auto.status || agenda.color !== auto.color) {
            isUpdated = true;
            return { ...agenda, status: auto.status, color: auto.color };
          }
          return agenda;
        });

        setAgendas(data);
        if (isUpdated) {
          fetch(`${API_URL}/api/agendas`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('rsud_token')}`
            },
            body: JSON.stringify(data)
          }).catch(e => {});
        }
      })
      .catch(err => {
        console.error("Failed to fetch agendas from backend", err);
      });
  };

  useEffect(() => {
    fetchAgendas();

    let eventSource;
    let reconnectTimer;

    const setupSSE = () => {
      try {
        if (eventSource) eventSource.close();
        eventSource = new EventSource(`${API_URL}/api/events`);
        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'AGENDA_UPDATED') {
              fetchAgendas();
            }
          } catch (e) {}
        };
        eventSource.onerror = () => {
          if (eventSource) eventSource.close();
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(setupSSE, 3000);
        };
      } catch (err) {
        console.error("SSE connection error", err);
      }
    };

    setupSSE();

    // Safety fallback interval (30s)
    const interval = setInterval(fetchAgendas, 30000);
    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(reconnectTimer);
      clearInterval(interval);
    };
  }, []);

  const triggerAutoLogout = () => {
    localStorage.removeItem('rsud_user');
    localStorage.removeItem('rsud_token');
    window.location.href = '/login?message=Sesi+Anda+telah+berakhir.+Silakan+login+kembali.';
  };

  const saveAgendas = (newData) => {
    setAgendas(newData);
    fetch(`${API_URL}/api/agendas`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('rsud_token')}`
      },
      body: JSON.stringify(newData)
    }).then(res => {
      if (res.status === 401 || res.status === 403) {
        triggerAutoLogout();
      }
    }).catch(err => console.error("Failed to save agendas", err));
    localStorage.setItem('rsud_agendas_v5', JSON.stringify(newData)); // Backup
  };

  const addAgenda = (newAgenda) => {
    const catMap = {
      'Internal': 'var(--color-primary-blue)',
      'Eksternal': 'var(--color-status-yellow)'
    };
    const catColor = catMap[newAgenda.category] || 'var(--color-primary-blue)';
    const auto = getAutoStatusAndColor(newAgenda.date, newAgenda.status);

    const agenda = {
      ...newAgenda,
      note: newAgenda.note || '',
      status: auto.status,
      color: auto.color,
      catColor,
      id: Date.now(),
      admin: {
        suratTugas: 'Belum Dibuat',
        undangan: 'Belum Dibuat',
        notaDinas: 'Belum Dibuat',
        status: 'Belum Lengkap',
        statusColor: 'var(--color-status-red)'
      },
      adminFiles: { suratTugas: null, undangan: null, notaDinas: null }
    };
    
    // Save single agenda directly to server
    fetch(`${API_URL}/api/agendas/single`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('rsud_token')}`
      },
      body: JSON.stringify(agenda)
    }).then(res => {
      if (res.status === 401 || res.status === 403) {
        triggerAutoLogout();
      } else if (res.ok) {
        const newData = [agenda, ...agendas];
        setAgendas(newData);
        localStorage.setItem('rsud_agendas_v5', JSON.stringify(newData));
      }
    }).catch(err => console.error("Failed to add single agenda", err));
  };

  const updateAgenda = (id, updatedFields) => {
    const catMap = {
      'Internal': 'var(--color-primary-blue)',
      'Eksternal': 'var(--color-status-yellow)'
    };

    let targetAgenda = null;
    const newData = agendas.map(agenda => {
      if (agenda.id === id) {
        const merged = { ...agenda, ...updatedFields };
        const catColor = catMap[merged.category] || 'var(--color-primary-blue)';
        const auto = getAutoStatusAndColor(merged.date, merged.status);

        targetAgenda = {
          ...merged,
          status: auto.status,
          color: auto.color,
          catColor,
          note: merged.note || ''
        };
        return targetAgenda;
      }
      return agenda;
    });

    if (targetAgenda) {
      fetch(`${API_URL}/api/agendas/single`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('rsud_token')}`
        },
        body: JSON.stringify(targetAgenda)
      }).then(res => {
        if (res.status === 401 || res.status === 403) {
          triggerAutoLogout();
        } else if (res.ok) {
          setAgendas(newData);
          localStorage.setItem('rsud_agendas_v5', JSON.stringify(newData));
        }
      }).catch(err => console.error("Failed to update agenda", err));
    }
  };

  const uploadAdminFile = (id, field, fileName, dataUrl) => {
    fetch(`${API_URL}/api/upload-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('rsud_token')}`
      },
      body: JSON.stringify({ agendaId: id, field, fileName, fileData: dataUrl })
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          triggerAutoLogout();
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.success && data.fileInfo) {
          const newData = agendas.map(agenda => {
            if (agenda.id === id) {
              const newAdminFiles = { ...(agenda.adminFiles || {}), [field]: { name: data.fileInfo.name, url: data.fileInfo.url } };
              const newAdmin = { ...agenda.admin, [field]: 'Sudah Selesai' };
              
              const isAllDone = newAdmin.suratTugas === 'Sudah Selesai' && newAdmin.undangan === 'Sudah Selesai' && newAdmin.notaDinas === 'Sudah Selesai';
              const isSomeDone = newAdmin.suratTugas === 'Sudah Selesai' || newAdmin.undangan === 'Sudah Selesai' || newAdmin.notaDinas === 'Sudah Selesai';
              
              newAdmin.status = isAllDone ? 'Siap' : isSomeDone ? 'Perlu Tindak Lanjut' : 'Belum Lengkap';
              newAdmin.statusColor = isAllDone ? 'var(--color-status-green)' : isSomeDone ? 'var(--color-status-yellow)' : 'var(--color-status-red)';

              const updatedAgenda = { ...agenda, admin: newAdmin, adminFiles: newAdminFiles };
              
              fetch(`${API_URL}/api/agendas/single`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('rsud_token')}`
                },
                body: JSON.stringify(updatedAgenda)
              });

              return updatedAgenda;
            }
            return agenda;
          });
          setAgendas(newData);
        }
      })
      .catch(err => console.error("Error uploading PDF file to server:", err));
  };

  const removeAdminFile = (id, field) => {
    const targetAgenda = agendas.find(a => a.id === id);
    const existingFile = targetAgenda?.adminFiles?.[field];

    if (existingFile && typeof existingFile === 'object' && existingFile.url) {
      fetch(`${API_URL}/api/delete-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('rsud_token')}`
        },
        body: JSON.stringify({ fileUrl: existingFile.url })
      }).catch(err => console.error("Error deleting PDF file on server:", err));
    }

    const newData = agendas.map(agenda => {
      if (agenda.id === id) {
        const newAdminFiles = { ...(agenda.adminFiles || {}) };
        delete newAdminFiles[field];
        const newAdmin = { ...agenda.admin, [field]: 'Belum Dibuat' };
        
        const isAllDone = newAdmin.suratTugas === 'Sudah Selesai' && newAdmin.undangan === 'Sudah Selesai' && newAdmin.notaDinas === 'Sudah Selesai';
        const isSomeDone = newAdmin.suratTugas === 'Sudah Selesai' || newAdmin.undangan === 'Sudah Selesai' || newAdmin.notaDinas === 'Sudah Selesai';
        
        newAdmin.status = isAllDone ? 'Siap' : isSomeDone ? 'Perlu Tindak Lanjut' : 'Belum Lengkap';
        newAdmin.statusColor = isAllDone ? 'var(--color-status-green)' : isSomeDone ? 'var(--color-status-yellow)' : 'var(--color-status-red)';

        const updatedAgenda = { ...agenda, admin: newAdmin, adminFiles: newAdminFiles };
        
        fetch(`${API_URL}/api/agendas/single`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('rsud_token')}`
          },
          body: JSON.stringify(updatedAgenda)
        });

        return updatedAgenda;
      }
      return agenda;
    });
    setAgendas(newData);
  };

  const deleteAgenda = (id) => {
    fetch(`${API_URL}/api/agendas/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('rsud_token')}`
      }
    }).then(res => {
      if (res.status === 401 || res.status === 403) {
        triggerAutoLogout();
      } else if (res.ok) {
        const newData = agendas.filter(a => a.id !== id);
        setAgendas(newData);
        localStorage.setItem('rsud_agendas_v5', JSON.stringify(newData));
      }
    }).catch(err => console.error("Failed to delete agenda", err));
  };

  return (
    <AgendaContext.Provider value={{ agendas, addAgenda, updateAgenda, uploadAdminFile, removeAdminFile, deleteAgenda }}>
      {children}
    </AgendaContext.Provider>
  );
};
