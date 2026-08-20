import React, { Component, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { useAgenda } from '../context/AgendaContext';
import { XCircle, Clock, MapPin, User, Tag } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', background: 'white' }}>
          <h2>Calendar Error:</h2>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const CalendarContent = () => {
  const { agendas } = useAgenda();
  const [selectedEvent, setSelectedEvent] = useState(null);

  const calendarEvents = (Array.isArray(agendas) ? agendas : []).map(a => {
    return {
      id: a?.id?.toString() || Math.random().toString(),
      title: a?.title || 'Agenda',
      start: a?.date && a?.timeStart ? `${a.date}T${a.timeStart}:00` : new Date().toISOString(),
      end: a?.date && a?.timeEnd ? `${a.date}T${a.timeEnd}:00` : new Date().toISOString(),
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: a?.catColor || 'var(--color-primary-blue)',
      extendedProps: {
        location: a?.location || '-',
        pic: a?.pic || '-',
        attendees: a?.attendees || '-',
        category: a?.category || '-',
        status: a?.status || '-',
        timeStart: a?.timeStart || '-',
        timeEnd: a?.timeEnd || '-'
      }
    };
  });

  const handleEventClick = (clickInfo) => {
    setSelectedEvent({
      title: clickInfo.event.title,
      ...clickInfo.event.extendedProps
    });
  };

  const renderEventContent = (eventInfo) => {
    return (
      <div 
        style={{ 
          width: '10px', 
          height: '10px', 
          borderRadius: '50%', 
          backgroundColor: eventInfo.event.textColor,
          margin: '2px auto',
          cursor: 'pointer'
        }}
        title={`${eventInfo.event.title}\n${eventInfo.event.extendedProps?.location}`}
      />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 160px)' }}>
      <style>{`
        .fc {
          --fc-border-color: var(--border-glass);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: rgba(255, 255, 255, 0.05);
          --fc-neutral-text-color: var(--text-muted);
          --fc-today-bg-color: rgba(40, 167, 69, 0.05);
          color: var(--text-main);
          height: 100%;
          font-family: inherit;
        }
        .fc-theme-standard .fc-scrollgrid { border: 1px solid var(--border-glass); border-radius: 8px; overflow: hidden; }
        .fc-theme-standard th, .fc-theme-standard td { border: 1px solid var(--border-glass); }
        .fc .fc-button-primary {
          background-color: var(--color-primary-blue);
          border-color: var(--color-primary-blue);
          text-transform: capitalize;
        }
        .fc .fc-button-primary:not(:disabled):active, 
        .fc .fc-button-primary:not(:disabled).fc-button-active {
          background-color: #004494;
          border-color: #004494;
        }
        .fc .fc-list-event:hover td {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .fc-header-toolbar {
          margin-bottom: 1rem !important;
        }
        .fc-event {
          border: none !important;
          background-color: transparent !important;
          box-shadow: none !important;
          display: flex;
          justify-content: center;
        }
        .fc-event:hover {
          background-color: transparent !important;
        }
        .fc-daygrid-event-harness {
          margin-top: 2px !important;
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Kalender Agenda RSUD</h2>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-cat-direksi)' }}></span> Direksi
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-cat-diklat)' }}></span> Diklat
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-cat-pelayanan)' }}></span> Pelayanan
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-cat-akreditasi)' }}></span> Akreditasi
          </div>
        </div>
      </div>
      <div className="card" style={{ flex: 1, padding: '1rem', overflow: 'hidden' }}>
        <FullCalendar
          plugins={[ dayGridPlugin, timeGridPlugin, listPlugin ]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek'
          }}
          events={calendarEvents}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          height="100%"
        />
      </div>

      {/* Detail Modal */}
      {selectedEvent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'rgba(255, 255, 255, 0.95)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
              <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <XCircle size={24} />
              </button>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', paddingRight: '2rem' }}>{selectedEvent.title}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <span className="badge" style={{ backgroundColor: 'var(--color-primary-blue)' }}>{selectedEvent.category}</span>
                <span className="badge" style={{ backgroundColor: 'var(--color-status-gray)', color: 'var(--text-main)' }}>{selectedEvent.status}</span>
              </div>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}><Clock size={20} color="var(--color-primary-blue)" /></div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Waktu Pelaksanaan</div>
                  <div style={{ fontWeight: '500' }}>{selectedEvent.timeStart} - {selectedEvent.timeEnd} WIB</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}><MapPin size={20} color="var(--color-status-red)" /></div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Lokasi</div>
                  <div style={{ fontWeight: '500' }}>{selectedEvent.location}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}><User size={20} color="var(--color-status-green)" /></div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>PIC / Pejabat Hadir</div>
                  <div style={{ fontWeight: '500' }}>{selectedEvent.attendees || selectedEvent.pic}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CalendarView = () => (
  <ErrorBoundary>
    <CalendarContent />
  </ErrorBoundary>
);

export default CalendarView;
