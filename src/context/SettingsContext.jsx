import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';

export const SettingsProvider = ({ children }) => {
  const [announcements, setAnnouncements] = useState([
    { id: 1, title: 'Rapat Koordinasi Bulanan', content: 'Seluruh Kepala Ruangan harap hadir pada pukul 13.00 WIB di Aula Utama.', type: 'blue' },
    { id: 2, title: 'Pembaruan Sistem SIRS', content: 'Sistem SIRS akan mengalami maintenance pada malam ini pukul 23.00 - 01.00.', type: 'green' }
  ]);

  const [emailSettings, setEmailSettings] = useState({
    emailSender: '',
    emailPassword: '',
    emailRecipients: [],
    emailSchedule: '07:00'
  });

  const [mobilePin, setMobilePin] = useState('');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const fetchSettings = () => {
    fetch(`${API_URL}/api/settings`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setEmailSettings({
            emailSender: data.emailSender || '',
            emailPassword: data.emailPassword || '',
            emailRecipients: data.emailRecipients || [],
            emailSchedule: data.emailSchedule || '07:00'
          });
          if (data.mobilePin !== undefined) {
            setMobilePin(data.mobilePin);
          }
          if (data.announcements && Array.isArray(data.announcements) && data.announcements.length > 0) {
            setAnnouncements(data.announcements);
          }
        }
      })
      .catch(err => console.error("Failed to fetch settings", err))
      .finally(() => setSettingsLoaded(true));
  };

  useEffect(() => {
    fetchSettings();

    let eventSource;
    let reconnectTimer;

    const setupSSE = () => {
      try {
        if (eventSource) eventSource.close();
        eventSource = new EventSource(`${API_URL}/api/events`);
        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'SETTINGS_UPDATED') {
              fetchSettings();
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

    const interval = setInterval(fetchSettings, 30000);
    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(reconnectTimer);
      clearInterval(interval);
    };
  }, []);

  const saveAllSettings = (payload) => {
    fetch(`${API_URL}/api/settings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('rsud_token')}`
      },
      body: JSON.stringify(payload)
    }).catch(err => console.error("Failed to save settings", err));
  };

  const updateEmailSettings = (newSettings) => {
    const updatedEmail = { ...emailSettings, ...newSettings };
    setEmailSettings(updatedEmail);
    saveAllSettings({
      ...updatedEmail,
      mobilePin,
      announcements
    });
  };

  const updateMobilePin = (newPin) => {
    setMobilePin(newPin);
    saveAllSettings({
      ...emailSettings,
      mobilePin: newPin,
      announcements
    });
  };

  const addAnnouncement = (announcement) => {
    const updatedAnnouncements = [...announcements, { ...announcement, id: Date.now() }];
    setAnnouncements(updatedAnnouncements);
    saveAllSettings({
      ...emailSettings,
      mobilePin,
      announcements: updatedAnnouncements
    });
  };

  const deleteAnnouncement = (id) => {
    const updatedAnnouncements = announcements.filter(a => a.id !== id);
    setAnnouncements(updatedAnnouncements);
    saveAllSettings({
      ...emailSettings,
      mobilePin,
      announcements: updatedAnnouncements
    });
  };

  return (
    <SettingsContext.Provider value={{ 
      announcements, addAnnouncement, deleteAnnouncement, 
      mobilePin, updateMobilePin,
      emailSettings, updateEmailSettings,
      settingsLoaded
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
