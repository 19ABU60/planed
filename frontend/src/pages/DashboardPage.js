import { Calendar, BookOpen, Clock, X, Plus, Users, ListTodo, Square, FileCheck } from 'lucide-react';

const DashboardPage = ({ schoolYears, classes, lessons, todos, onNavigate }) => {
  const totalLessons = lessons.length;
  const plannedLessons = lessons.filter(l => l.topic).length;
  const cancelledLessons = lessons.filter(l => l.is_cancelled).length;
  const totalUnits = lessons.reduce((sum, l) => sum + (l.is_cancelled ? 0 : l.teaching_units), 0);
  const pendingTodos = todos.filter(t => !t.is_completed).length;

  return (
    <div className="page-content">
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '2rem', fontFamily: 'Manrope, sans-serif' }}>
        Dashboard
      </h2>
      <div className="bento-grid">
        <div className="stat-card bento-item">
          <div className="stat-card-icon primary"><Calendar size={20} /></div>
          <span className="stat-card-label">Unterrichtstage</span>
          <span className="stat-card-value">{totalLessons}</span>
        </div>
        <div className="stat-card bento-item">
          <div className="stat-card-icon success"><BookOpen size={20} /></div>
          <span className="stat-card-label">Geplante Stunden</span>
          <span className="stat-card-value">{plannedLessons}</span>
        </div>
        <div className="stat-card bento-item">
          <div className="stat-card-icon warning"><Clock size={20} /></div>
          <span className="stat-card-label">Unterrichtseinheiten</span>
          <span className="stat-card-value">{totalUnits}</span>
        </div>
        <div className="stat-card bento-item">
          <div className="stat-card-icon error"><X size={20} /></div>
          <span className="stat-card-label">Ausfälle</span>
          <span className="stat-card-value">{cancelledLessons}</span>
        </div>

        {/* Classes */}
        <div className="card bento-item span-2 row-2">
          <div className="card-header">
            <h3 className="card-title">Meine Klassen</h3>
            <button className="btn btn-ghost btn-icon" onClick={() => onNavigate('classes')}>
              <Plus size={18} />
            </button>
          </div>
          {classes.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <Users size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>Noch keine Klassen</p>
              <button 
                className="btn btn-secondary" 
                onClick={() => onNavigate('classes')} 
                style={{ marginTop: '1rem' }}
              >
                Klasse erstellen
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {classes.slice(0, 5).map(cls => (
                <div 
                  key={cls.id} 
                  onClick={() => onNavigate('calendar', cls.id)} 
                  data-testid={`class-item-${cls.id}`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    padding: '0.75rem', 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: '8px', 
                    cursor: 'pointer' 
                  }}
                >
                  <div style={{ width: '8px', height: '40px', borderRadius: '4px', background: cls.color }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{cls.name} - {cls.subject}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {cls.hours_per_week} Std./Woche
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Todos */}
        <div className="card bento-item span-2 row-2">
          <div className="card-header">
            <h3 className="card-title">Offene Aufgaben ({pendingTodos})</h3>
            <button className="btn btn-ghost btn-icon" onClick={() => onNavigate('todos')}>
              <Plus size={18} />
            </button>
          </div>
          {todos.filter(t => !t.is_completed).length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ListTodo size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p>Keine offenen Aufgaben</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {todos.filter(t => !t.is_completed).slice(0, 5).map(todo => (
                <div 
                  key={todo.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    padding: '0.5rem', 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: '6px' 
                  }}
                >
                  <Square size={16} style={{ color: todo.priority === 'high' ? 'var(--error)' : 'var(--text-muted)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem' }}>{todo.title}</div>
                    {todo.due_date && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Fällig: {todo.due_date}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card bento-item span-4">
          <div className="card-header"><h3 className="card-title">Schnellaktionen</h3></div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('classes')}>
              <Plus size={18} /> Klasse anlegen
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('calendar')}>
              <Calendar size={18} /> Zum Kalender
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('templates')}>
              <FileCheck size={18} /> Vorlagen
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('todos')}>
              <ListTodo size={18} /> Aufgaben
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
