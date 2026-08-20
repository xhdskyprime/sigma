import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bgColors = {
    success: 'linear-gradient(135deg, #10b981, #059669)',
    error: 'linear-gradient(135deg, #ef4444, #dc2626)',
    info: 'linear-gradient(135deg, #0ea5e9, #0284c7)'
  };

  const icons = {
    success: <CheckCircle2 size={20} color="white" />,
    error: <AlertCircle size={20} color="white" />,
    info: <Info size={20} color="white" />
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      background: bgColors[type] || bgColors.success,
      color: 'white',
      padding: '0.85rem 1.25rem',
      borderRadius: '14px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontSize: '0.9rem',
      fontWeight: '600',
      animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      maxWidth: '380px'
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div>{icons[type]}</div>
      <div style={{ flex: 1 }}>{message}</div>
      <button 
        onClick={onClose} 
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: 0 }}
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;
