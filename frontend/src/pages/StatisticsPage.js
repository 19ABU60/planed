import { useState, useEffect } from 'react';
import { Clock, BookOpen, Calendar, X, FileSpreadsheet, FileText, File, TrendingUp, CalendarDays, Layers, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

// Use relative URL for production (nginx proxy) or env var for development
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
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
  
  const pieData = stats ? [
    { name: 'Geplant', value: stats.used_hours },
    { name: 'Offen', value: stats.remaining_hours },
    { name: 'Ausgefallen', value: stats.cancelled_hours }
  ].filter(d => d.value > 0) : [];
  
  const COLORS = ['#10b981', '#3b82f6', '#ef4444'];

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
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
          
          {/* Semester Info Card */}
          <div className="card bento-item span-2" style={{ background: `linear-gradient(135deg, ${currentClass?.color || '#3b82f6'}22, ${currentClass?.color || '#3b82f6'}11)`, borderLeft: `4px solid ${currentClass?.color || '#3b82f6'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: currentClass?.color || '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CalendarDays size={24} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>{currentClass?.name} - {currentClass?.subject}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>{stats.semester_name}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-paper)', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: currentClass?.color || '#3b82f6' }}>{stats.hours_per_week}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Std./Woche</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-paper)', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: currentClass?.color || '#3b82f6' }}>{stats.school_weeks}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Schulwochen</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-paper)', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)' }}>{stats.holiday_weeks}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ferienwochen</div>
              </div>
            </div>
          </div>

          {/* Main Stats */}
          <div className="stat-card bento-item">
            <div className="stat-card-icon primary"><Clock size={20} /></div>
            <span className="stat-card-label">Verfügbar im Halbjahr</span>
            <span className="stat-card-value">{stats.total_available_hours}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stunden</span>
          </div>
          
          <div className="stat-card bento-item">
            <div className="stat-card-icon success"><BookOpen size={20} /></div>
            <span className="stat-card-label">Geplant / Gehalten</span>
            <span className="stat-card-value">{stats.used_hours}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stunden</span>
          </div>
          
          <div className="stat-card bento-item">
            <div className="stat-card-icon warning"><Calendar size={20} /></div>
            <span className="stat-card-label">Noch offen</span>
            <span className="stat-card-value">{stats.remaining_hours}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stunden</span>
          </div>
          
          <div className="stat-card bento-item">
            <div className="stat-card-icon error"><X size={20} /></div>
            <span className="stat-card-label">Ausgefallen</span>
            <span className="stat-card-value">{stats.cancelled_hours}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stunden</span>
          </div>

          {/* Progress Card */}
          <div className="card bento-item span-2">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} /> Fortschritt
              </h3>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Planungsstand</span>
                <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--success)' }}>{stats.completion_percentage}%</span>
              </div>
              <div style={{ height: '12px', background: 'var(--bg-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${stats.completion_percentage}%`, 
                  background: `linear-gradient(90deg, ${currentClass?.color || 'var(--success)'}, var(--success))`,
                  borderRadius: '6px', 
                  transition: 'width 0.5s' 
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={16} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.9rem' }}><strong>{stats.topics_covered}</strong> Unterrichtseinheiten</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={16} style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: '0.9rem' }}><strong>{stats.workplan_entries_count}</strong> Arbeitsplan-Einträge</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="card bento-item span-2" style={{ height: '280px' }}>
            <div className="card-header"><h3 className="card-title">Stundenverteilung</h3></div>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="70%">
                  <PieChart>
                    <Pie 
                      data={pieData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={50} 
                      outerRadius={70} 
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
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '-0.5rem' }}>
                  {pieData.map((entry, index) => (
                    <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: COLORS[index] }} />
                      <span>{entry.name}: <strong>{entry.value}</strong></span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70%', color: 'var(--text-muted)' }}>
                Noch keine Daten
              </div>
            )}
          </div>

          {/* Upcoming Lessons */}
          <div className="card bento-item span-2">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowRight size={18} /> Nächste Stunden
              </h3>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              {stats.upcoming_lessons && stats.upcoming_lessons.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {stats.upcoming_lessons.map((lesson, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--bg-subtle)',
                        borderRadius: '8px',
                        borderLeft: `3px solid ${lesson.source === 'workplan' ? currentClass?.color || '#3b82f6' : 'var(--success)'}`
                      }}
                    >
                      <div style={{ 
                        minWidth: '70px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        color: 'var(--text-muted)'
                      }}>
                        {format(parseISO(lesson.date), 'dd.MM.', { locale: de })}
                      </div>
                      {lesson.period && (
                        <div style={{ 
                          background: currentClass?.color || '#3b82f6',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '700'
                        }}>
                          {lesson.period}. Std
                        </div>
                      )}
                      <div style={{ flex: 1, fontSize: '0.85rem' }}>
                        {lesson.topic || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Kein Thema</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Keine kommenden Stunden geplant
                </div>
              )}
            </div>
          </div>

          {/* Export */}
          <div className="card bento-item span-2">
            <div className="card-header"><h3 className="card-title">Export</h3></div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
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
