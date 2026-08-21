import React, { useState } from 'react';
import { useAgenda } from '../context/AgendaContext';
import { useAuth } from '../context/AuthContext';
import { 
  Users, MapPin, Clock, Calendar
} from 'lucide-react';
import { FcSurvey, FcCheckmark, FcVideoProjector, FcClock, FcHighPriority } from 'react-icons/fc';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const Dashboard = () => {
  const { agendas } = useAgenda();
  const { user } = useAuth();
  const [selectedAgenda, setSelectedAgenda] = useState(null);

  // Helper for timezone-safe YYYY-MM-DD
  const getLocalDateStr = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr(new Date());
  const todayAgendas = agendas.filter(a => a.date === todayStr);

  // Calculate dynamic stats across all agendas & today's agendas
  const stats = {
    total: agendas.length,
    selesai: agendas.filter(a => a.status === 'Selesai').length,
    berlangsung: agendas.filter(a => a.status === 'Acara Hari Ini' || a.status === 'Sedang Berlangsung').length,
    akanDimulai: agendas.filter(a => a.status === 'Akan Dimulai').length,
    tertunda: agendas.filter(a => a.status === 'Ditunda' || a.status === 'Dibatalkan').length
  };

  // Dynamic Bar Chart for Current Week (Senin - Minggu)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const chartDataBar = daysOfWeek.map((dayName, idx) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + idx);
    const dayStr = getLocalDateStr(dayDate);
    const count = agendas.filter(a => a.date === dayStr).length;
    return { name: dayName, kegiatan: count };
  });

  // Dynamic Pie Chart for Category Distribution
  const categoryCounts = agendas.reduce((acc, a) => {
    const cat = a.category || 'Internal';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const catColors = { 'Internal': 'var(--color-primary-blue)', 'Eksternal': 'var(--color-status-yellow)' };
  
  const chartDataPie = Object.keys(categoryCounts).map(key => ({
    name: key,
    value: categoryCounts[key],
    color: catColors[key] || 'var(--color-primary-green)'
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>Dashboard Executive</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.1rem 0 0 0' }}>Ringkasan dan pemantauan real-time seluruh kegiatan RSUD Tigaraksa.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
        {[
          { title: 'Total Semua Agenda', count: stats.total, icon: <FcSurvey size={28} />, color: 'var(--color-primary-blue)' },
          { title: 'Selesai', count: stats.selesai, icon: <FcCheckmark size={28} />, color: 'var(--color-status-green)' },
          { title: 'Acara Hari Ini', count: stats.berlangsung, icon: <FcVideoProjector size={28} />, color: 'var(--color-status-blue)' },
          { title: 'Akan Dimulai', count: stats.akanDimulai, icon: <FcClock size={28} />, color: 'var(--color-status-yellow)' },
          { title: 'Ditunda / Dibatalkan', count: stats.tertunda, icon: <FcHighPriority size={28} />, color: 'var(--color-status-red)' }
        ].map((stat, index) => (
          <div key={index} className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: stat.color, lineHeight: 1 }}>{stat.count}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '0.15rem' }}>{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid" style={{ gap: '1rem' }}>
        {/* Agenda Hari Ini */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
          <div className="flex justify-between items-center">
            <h2 style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
              <Calendar size={18} color="var(--color-primary-blue)" /> 
              Agenda Hari Ini ({todayAgendas.length})
            </h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '300px', overflowY: 'auto' }}>
            {todayAgendas.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.82rem' }}>
                Tidak ada kegiatan rapat terjadwal untuk hari ini.
              </div>
            ) : todayAgendas.map((agenda) => (
              <div 
                key={agenda.id} 
                onClick={() => setSelectedAgenda(agenda)}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem', border: '1px solid var(--border-glass)', borderRadius: '10px',
                  borderLeft: `4px solid ${agenda.color}`, cursor: 'pointer', background: 'rgba(255,255,255,0.03)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{agenda.title}</span>
                  <div className="flex items-center gap-3" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><Clock size={13} color="var(--color-primary-blue)"/> {agenda.timeStart} - {agenda.timeEnd} WIB</span>
                    <span className="flex items-center gap-1"><MapPin size={13} color="var(--color-status-red)"/> {agenda.location}</span>
                  </div>
                </div>
                <span className="badge" style={{ backgroundColor: agenda.color, fontSize: '0.7rem', padding: '0.25rem 0.6rem' }}>{agenda.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>Distribusi Kategori Agenda</h2>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartDataPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value">
                  {chartDataPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-glass)', color: 'var(--text-main)', fontSize: '0.75rem' }}/>
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>Frekuensi Agenda Minggu Ini</h2>
          <div style={{ height: '190px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataBar} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-glass)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-glass)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '0.75rem' }} />
                <Bar dataKey="kegiatan" fill="var(--color-primary-blue)" radius={[5, 5, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;
