import { useState, useEffect } from 'react';
import { Clock, BookOpen, Calendar, X, FileSpreadsheet, FileText, File } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StatisticsPage = ({ classes, lessons }) => {
  const { authAxios } = useAuth();
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedClass) fetchStats();
  }, [selectedClass]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await authAxios.get(`/statistics/${selectedClass}`);
      setStats(response.data);
    } catch (error) { 
      console.error('Error:', error); 
    }
    setLoading(false);
  };

  const currentClass = classes.find(c => c.id === selectedClass);
  const weekdayData = stats ? Object.entries(stats.hours_by_weekday).map(([name, value]) => ({ name, value })) : [];
  const pieData = stats ? [
    { name: 'Geplant', value: stats.used_hours },
    { name: 'Verbleibend', value: stats.remaining_hours },
    { name: 'Ausgefallen', value: stats.cancelled_hours }
  ] : [];
  const COLORS = ['#10b981', '#3b82f6', '#ef4444'];

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Manrope, sans-serif' }}>Statistik</h2>
        <select 
          className="form-input" 
          style={{ width: '250px' }} 
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name} - {c.subject}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <span className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      ) : stats && (
        <div className="bento-grid">
          <div className="stat-card bento-item">
            <div className="stat-card-icon primary"><Clock size={20} /></div>
            <span className="stat-card-label">Verfügbar</span>
            <span className="stat-card-value">{stats.total_available_hours}</span>
          </div>
          <div className="stat-card bento-item">
            <div className="stat-card-icon success"><BookOpen size={20} /></div>
            <span className="stat-card-label">Geplant</span>
            <span className="stat-card-value">{stats.used_hours}</span>
          </div>
          <div className="stat-card bento-item">
            <div className="stat-card-icon warning"><Calendar size={20} /></div>
            <span className="stat-card-label">Verbleibend</span>
            <span className="stat-card-value">{stats.remaining_hours}</span>
          </div>
          <div className="stat-card bento-item">
            <div className="stat-card-icon error"><X size={20} /></div>
            <span className="stat-card-label">Ausgefallen</span>
            <span className="stat-card-value">{stats.cancelled_hours}</span>
          </div>

          {/* Bar Chart */}
          <div className="card bento-item span-2" style={{ height: '300px' }}>
            <div className="card-header"><h3 className="card-title">Stunden nach Wochentag</h3></div>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={weekdayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: 'var(--bg-paper)', border: '1px solid var(--border-default)' }} />
                <Bar dataKey="value" fill={currentClass?.color || 'var(--primary)'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="card bento-item span-2" style={{ height: '300px' }}>
            <div className="card-header"><h3 className="card-title">Stundenverteilung</h3></div>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-paper)', border: '1px solid var(--border-default)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '-1rem' }}>
              {pieData.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: COLORS[index] }} />
                  <span>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="card bento-item span-2">
            <div className="card-header"><h3 className="card-title">Fortschritt</h3></div>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Lehrplanerfüllung</span>
                <span style={{ fontWeight: '600' }}>{stats.completion_percentage}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${stats.completion_percentage}%`, 
                  background: 'var(--success)', 
                  borderRadius: '4px', 
                  transition: 'width 0.5s' 
                }} />
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {stats.topics_covered} Themen behandelt
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="card bento-item span-2">
            <div className="card-header"><h3 className="card-title">Export</h3></div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <a href={`${API}/export/excel/${selectedClass}`} className="btn btn-secondary" download>
                <FileSpreadsheet size={18} /> Excel
              </a>
              <a href={`${API}/export/word/${selectedClass}`} className="btn btn-secondary" download>
                <FileText size={18} /> Word
              </a>
              <a href={`${API}/export/pdf/${selectedClass}`} className="btn btn-secondary" download>
                <File size={18} /> PDF
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;
