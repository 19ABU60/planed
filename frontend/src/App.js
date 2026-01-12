import { useState, useEffect, createContext, useContext } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { 
  LayoutDashboard, Calendar, BarChart3, BookOpen, FolderOpen, 
  Settings, LogOut, Plus, ChevronLeft, ChevronRight, Edit2, 
  Trash2, Download, Sparkles, X, Menu, GraduationCap,
  FileText, FileSpreadsheet, File, Upload, Clock, Users, Share2, UserPlus, Eye, Pencil
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, 
  addMonths, subMonths, isWeekend, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('planed_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('planed_token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('planed_token', response.data.access_token);
    setToken(response.data.access_token);
    setUser(response.data.user);
    return response.data;
  };

  const register = async (email, password, name) => {
    const response = await axios.post(`${API}/auth/register`, { email, password, name });
    localStorage.setItem('planed_token', response.data.access_token);
    setToken(response.data.access_token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('planed_token');
    setToken(null);
    setUser(null);
  };

  const authAxios = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` }
  });

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, authAxios }}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Page
const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      toast.success(isLogin ? 'Willkommen zurück!' : 'Konto erstellt!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ein Fehler ist aufgetreten');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <GraduationCap size={28} color="white" />
          </div>
          <h1>PlanEd</h1>
        </div>
        <p className="login-subtitle">
          {isLogin ? 'Melden Sie sich an, um Ihre Arbeitspläne zu verwalten' : 'Erstellen Sie ein neues Konto'}
        </p>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ihr Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                data-testid="register-name-input"
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">E-Mail</label>
            <input
              type="email"
              className="form-input"
              placeholder="ihre@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="email-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Passwort</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="password-input"
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary btn-full" 
            disabled={loading}
            data-testid="login-submit-btn"
          >
            {loading ? <span className="spinner" /> : (isLogin ? 'Anmelden' : 'Konto erstellen')}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            className="btn btn-ghost"
            onClick={() => setIsLogin(!isLogin)}
            data-testid="toggle-auth-mode-btn"
          >
            {isLogin ? 'Noch kein Konto? Registrieren' : 'Bereits registriert? Anmelden'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ currentPage, onNavigate, onLogout, user }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Kalender', icon: Calendar },
    { id: 'statistics', label: 'Statistik', icon: BarChart3 },
    { id: 'classes', label: 'Klassen', icon: BookOpen },
    { id: 'sharing', label: 'Freigaben', icon: Share2 },
    { id: 'documents', label: 'Dokumente', icon: FolderOpen },
    { id: 'settings', label: 'Einstellungen', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <GraduationCap size={22} color="white" />
          </div>
          <h1>PlanEd</h1>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-label">Navigation</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              data-testid={`nav-${item.id}`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </div>
      </nav>
      
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-default)' }}>
        <div className="user-menu" onClick={onLogout} data-testid="logout-btn">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">Lehrer/in</span>
          </div>
          <LogOut size={18} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
        </div>
      </div>
    </aside>
  );
};

// Dashboard Page
const DashboardPage = ({ schoolYears, classes, lessons, onNavigate }) => {
  const totalLessons = lessons.length;
  const plannedLessons = lessons.filter(l => l.topic).length;
  const cancelledLessons = lessons.filter(l => l.is_cancelled).length;
  const totalUnits = lessons.reduce((sum, l) => sum + (l.is_cancelled ? 0 : l.teaching_units), 0);

  return (
    <div className="page-content">
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '2rem', fontFamily: 'Manrope, sans-serif' }}>
        Dashboard
      </h2>
      
      <div className="bento-grid">
        {/* Stats Row */}
        <div className="stat-card bento-item">
          <div className="stat-card-icon primary">
            <Calendar size={20} />
          </div>
          <span className="stat-card-label">Unterrichtstage</span>
          <span className="stat-card-value">{totalLessons}</span>
        </div>
        
        <div className="stat-card bento-item">
          <div className="stat-card-icon success">
            <BookOpen size={20} />
          </div>
          <span className="stat-card-label">Geplante Stunden</span>
          <span className="stat-card-value">{plannedLessons}</span>
        </div>
        
        <div className="stat-card bento-item">
          <div className="stat-card-icon warning">
            <Clock size={20} />
          </div>
          <span className="stat-card-label">Unterrichtseinheiten</span>
          <span className="stat-card-value">{totalUnits}</span>
        </div>
        
        <div className="stat-card bento-item">
          <div className="stat-card-icon error">
            <X size={20} />
          </div>
          <span className="stat-card-label">Ausfälle</span>
          <span className="stat-card-value">{cancelledLessons}</span>
        </div>
        
        {/* Classes Overview */}
        <div className="card bento-item span-2 row-2">
          <div className="card-header">
            <h3 className="card-title">Meine Klassen</h3>
            <button className="btn btn-ghost btn-icon" onClick={() => onNavigate('classes')} data-testid="view-all-classes-btn">
              <Plus size={18} />
            </button>
          </div>
          
          {classes.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <Users size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Noch keine Klassen angelegt</p>
              <button className="btn btn-secondary" onClick={() => onNavigate('classes')} style={{ marginTop: '1rem' }}>
                Klasse erstellen
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {classes.slice(0, 5).map(cls => (
                <div
                  key={cls.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => onNavigate('calendar', cls.id)}
                  data-testid={`class-item-${cls.id}`}
                >
                  <div style={{
                    width: '8px',
                    height: '40px',
                    borderRadius: '4px',
                    background: cls.color
                  }} />
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
        
        {/* Recent Activity */}
        <div className="card bento-item span-2 row-2">
          <div className="card-header">
            <h3 className="card-title">Letzte Aktivität</h3>
          </div>
          
          {lessons.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <Calendar size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Noch keine Unterrichtstunden geplant</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {lessons.slice(0, 6).map(lesson => {
                const cls = classes.find(c => c.id === lesson.class_subject_id);
                return (
                  <div
                    key={lesson.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      borderLeft: `3px solid ${cls?.color || 'var(--primary)'}`,
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '0 6px 6px 0'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lesson.topic || 'Kein Thema'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {cls?.name} • {format(parseISO(lesson.date), 'dd.MM.yyyy')}
                      </div>
                    </div>
                    {lesson.is_cancelled && <span className="badge badge-error">Ausfall</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* School Years */}
        <div className="card bento-item span-2">
          <div className="card-header">
            <h3 className="card-title">Schuljahre</h3>
          </div>
          {schoolYears.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Noch kein Schuljahr angelegt</p>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {schoolYears.map(year => (
                <div key={year.id} className="badge badge-primary" style={{ padding: '0.5rem 1rem' }}>
                  {year.name} - {year.semester}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="card bento-item span-2">
          <div className="card-header">
            <h3 className="card-title">Schnellaktionen</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('classes')} data-testid="quick-add-class-btn">
              <Plus size={18} /> Klasse anlegen
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('calendar')} data-testid="quick-calendar-btn">
              <Calendar size={18} /> Zum Kalender
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Calendar Page
const CalendarPage = ({ classes, lessons, holidays, onCreateLesson, onUpdateLesson, onDeleteLesson, selectedClassId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState(selectedClassId || (classes[0]?.id || ''));
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedDate, setSelectedDate] = useState(null);
  const { authAxios } = useAuth();
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (selectedClassId) setSelectedClass(selectedClassId);
  }, [selectedClassId]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const filteredLessons = lessons.filter(l => l.class_subject_id === selectedClass);
  const currentClass = classes.find(c => c.id === selectedClass);

  const getLessonsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredLessons.filter(l => l.date === dateStr);
  };

  const isHoliday = (date) => {
    return holidays.some(h => {
      const start = parseISO(h.start_date);
      const end = parseISO(h.end_date);
      return date >= start && date <= end;
    });
  };

  const openCreateModal = (date) => {
    setSelectedDate(date);
    setSelectedLesson(null);
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (lesson, e) => {
    e.stopPropagation();
    setSelectedLesson(lesson);
    setSelectedDate(parseISO(lesson.date));
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSaveLesson = async (lessonData) => {
    try {
      if (modalMode === 'create') {
        await onCreateLesson({
          ...lessonData,
          class_subject_id: selectedClass,
          date: format(selectedDate, 'yyyy-MM-dd')
        });
        toast.success('Stunde erstellt');
      } else {
        await onUpdateLesson(selectedLesson.id, lessonData);
        toast.success('Stunde aktualisiert');
      }
      setShowModal(false);
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleDeleteLesson = async () => {
    if (!selectedLesson) return;
    try {
      await onDeleteLesson(selectedLesson.id);
      toast.success('Stunde gelöscht');
      setShowModal(false);
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const handleAISuggestion = async () => {
    if (!currentClass) return;
    setAiLoading(true);
    try {
      const existingTopics = filteredLessons.filter(l => l.topic).map(l => l.topic);
      const response = await authAxios.post('/ai/suggestions', {
        subject: currentClass.subject,
        grade: currentClass.name,
        curriculum_topic: 'Allgemein',
        previous_topics: existingTopics.slice(-5)
      });
      
      if (response.data.suggestions?.length > 0) {
        const suggestion = response.data.suggestions[0];
        setSelectedLesson(prev => ({
          ...prev,
          topic: suggestion.topic || '',
          objective: suggestion.objective || '',
          key_terms: suggestion.key_terms || ''
        }));
        toast.success('KI-Vorschlag eingefügt');
      }
    } catch (error) {
      toast.error('KI-Vorschlag fehlgeschlagen');
    }
    setAiLoading(false);
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Manrope, sans-serif' }}>
          Kalender
        </h2>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            className="form-input"
            style={{ width: '250px' }}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            data-testid="class-select"
          >
            <option value="">Klasse wählen</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name} - {cls.subject}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-header">
          <div className="calendar-nav">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} data-testid="prev-month-btn">
              <ChevronLeft size={18} />
            </button>
          </div>
          <h3 className="calendar-title">
            {format(currentDate, 'MMMM yyyy', { locale: de })}
          </h3>
          <div className="calendar-nav">
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} data-testid="next-month-btn">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="calendar-grid">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
          
          {days.map(day => {
            const dayLessons = getLessonsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isWeekendDay = isWeekend(day);
            const isHolidayDay = isHoliday(day);

            return (
              <div
                key={day.toISOString()}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isWeekendDay ? 'weekend' : ''} ${isHolidayDay ? 'holiday' : ''}`}
                onClick={() => selectedClass && openCreateModal(day)}
                data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
              >
                <span className="calendar-day-number">{format(day, 'd')}</span>
                {dayLessons.map(lesson => (
                  <div
                    key={lesson.id}
                    className={`lesson-item ${lesson.is_cancelled ? 'cancelled' : ''}`}
                    onClick={(e) => openEditModal(lesson, e)}
                    style={{ borderLeftColor: currentClass?.color }}
                    data-testid={`lesson-${lesson.id}`}
                  >
                    <span className="lesson-item-title">
                      {lesson.topic || 'Kein Thema'}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lesson Modal */}
      {showModal && (
        <LessonModal
          lesson={selectedLesson}
          date={selectedDate}
          onSave={handleSaveLesson}
          onDelete={handleDeleteLesson}
          onClose={() => setShowModal(false)}
          onAISuggestion={handleAISuggestion}
          aiLoading={aiLoading}
          mode={modalMode}
        />
      )}
    </div>
  );
};

// Lesson Modal Component
const LessonModal = ({ lesson, date, onSave, onDelete, onClose, onAISuggestion, aiLoading, mode }) => {
  const [formData, setFormData] = useState({
    topic: lesson?.topic || '',
    objective: lesson?.objective || '',
    curriculum_reference: lesson?.curriculum_reference || '',
    educational_standards: lesson?.educational_standards || '',
    key_terms: lesson?.key_terms || '',
    notes: lesson?.notes || '',
    teaching_units: lesson?.teaching_units || 1,
    is_cancelled: lesson?.is_cancelled || false,
    cancellation_reason: lesson?.cancellation_reason || ''
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        topic: lesson.topic || '',
        objective: lesson.objective || '',
        curriculum_reference: lesson.curriculum_reference || '',
        educational_standards: lesson.educational_standards || '',
        key_terms: lesson.key_terms || '',
        notes: lesson.notes || '',
        teaching_units: lesson.teaching_units || 1,
        is_cancelled: lesson.is_cancelled || false,
        cancellation_reason: lesson.cancellation_reason || ''
      });
    }
  }, [lesson]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {mode === 'create' ? 'Neue Stunde' : 'Stunde bearbeiten'} - {date && format(date, 'dd.MM.yyyy', { locale: de })}
          </h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} data-testid="close-modal-btn">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onAISuggestion}
                disabled={aiLoading}
                data-testid="ai-suggestion-btn"
              >
                {aiLoading ? <span className="spinner" /> : <Sparkles size={18} />}
                KI-Vorschlag
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Stundenthema</label>
              <input
                type="text"
                className="form-input"
                value={formData.topic}
                onChange={e => setFormData({ ...formData, topic: e.target.value })}
                placeholder="z.B. Einführung in die Bruchrechnung"
                data-testid="lesson-topic-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Zielsetzung</label>
              <textarea
                className="form-input"
                style={{ height: '80px', resize: 'vertical', padding: '0.75rem' }}
                value={formData.objective}
                onChange={e => setFormData({ ...formData, objective: e.target.value })}
                placeholder="Was sollen die Schüler lernen?"
                data-testid="lesson-objective-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Lehrplanbezug</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.curriculum_reference}
                  onChange={e => setFormData({ ...formData, curriculum_reference: e.target.value })}
                  placeholder="LP-Verweis"
                  data-testid="lesson-curriculum-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Unterrichtseinheiten</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="10"
                  value={formData.teaching_units}
                  onChange={e => setFormData({ ...formData, teaching_units: parseInt(e.target.value) || 1 })}
                  data-testid="lesson-units-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Schlüsselbegriffe</label>
              <input
                type="text"
                className="form-input"
                value={formData.key_terms}
                onChange={e => setFormData({ ...formData, key_terms: e.target.value })}
                placeholder="Wichtige Begriffe, kommagetrennt"
                data-testid="lesson-terms-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hinweise/Notizen</label>
              <textarea
                className="form-input"
                style={{ height: '60px', resize: 'vertical', padding: '0.75rem' }}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Zusätzliche Hinweise..."
                data-testid="lesson-notes-input"
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_cancelled}
                  onChange={e => setFormData({ ...formData, is_cancelled: e.target.checked })}
                  data-testid="lesson-cancelled-checkbox"
                />
                <span>Unterrichtsausfall</span>
              </label>
            </div>

            {formData.is_cancelled && (
              <div className="form-group">
                <label className="form-label">Grund für Ausfall</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.cancellation_reason}
                  onChange={e => setFormData({ ...formData, cancellation_reason: e.target.value })}
                  placeholder="z.B. Schulferien, Fortbildung..."
                  data-testid="lesson-cancel-reason-input"
                />
              </div>
            )}
          </div>

          <div className="modal-footer">
            {mode === 'edit' && (
              <button type="button" className="btn btn-danger" onClick={onDelete} data-testid="delete-lesson-btn">
                <Trash2 size={18} /> Löschen
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary" data-testid="save-lesson-btn">
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Statistics Page
const StatisticsPage = ({ classes, lessons }) => {
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
  const { authAxios } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedClass) return;
      setLoading(true);
      try {
        const response = await authAxios.get(`/statistics/${selectedClass}`);
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
      setLoading(false);
    };
    fetchStats();
  }, [selectedClass, authAxios]);

  const currentClass = classes.find(c => c.id === selectedClass);

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Manrope, sans-serif' }}>
          Statistik
        </h2>
        
        <select
          className="form-input"
          style={{ width: '250px' }}
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          data-testid="stats-class-select"
        >
          <option value="">Klasse wählen</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name} - {cls.subject}</option>
          ))}
        </select>
      </div>

      {!selectedClass ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BarChart3 size={40} />
          </div>
          <h3 className="empty-state-title">Klasse auswählen</h3>
          <p className="empty-state-text">Wählen Sie eine Klasse, um die Statistik anzuzeigen</p>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <span className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      ) : stats && (
        <div className="bento-grid">
          <div className="stat-card bento-item">
            <div className="stat-card-icon primary">
              <Clock size={20} />
            </div>
            <span className="stat-card-label">Verfügbare Stunden</span>
            <span className="stat-card-value">{stats.total_available_hours}</span>
          </div>

          <div className="stat-card bento-item">
            <div className="stat-card-icon success">
              <BookOpen size={20} />
            </div>
            <span className="stat-card-label">Geplante Stunden</span>
            <span className="stat-card-value">{stats.used_hours}</span>
          </div>

          <div className="stat-card bento-item">
            <div className="stat-card-icon warning">
              <Calendar size={20} />
            </div>
            <span className="stat-card-label">Verbleibend</span>
            <span className="stat-card-value">{stats.remaining_hours}</span>
          </div>

          <div className="stat-card bento-item">
            <div className="stat-card-icon error">
              <X size={20} />
            </div>
            <span className="stat-card-label">Ausfallstunden</span>
            <span className="stat-card-value">{stats.cancelled_hours}</span>
          </div>

          <div className="card bento-item span-4">
            <div className="card-header">
              <h3 className="card-title">Stunden nach Wochentag</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginTop: '1rem' }}>
              {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'].map(day => (
                <div key={day} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{day}</div>
                  <div style={{
                    height: `${Math.max(20, (stats.hours_by_weekday[day] || 0) * 15)}px`,
                    background: `linear-gradient(to top, ${currentClass?.color || 'var(--primary)'}, transparent)`,
                    borderRadius: '4px 4px 0 0',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    paddingBottom: '0.25rem',
                    fontWeight: '600',
                    minHeight: '40px'
                  }}>
                    {stats.hours_by_weekday[day] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Buttons */}
          <div className="card bento-item span-4">
            <div className="card-header">
              <h3 className="card-title">Export</h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <a
                href={`${API}/export/excel/${selectedClass}`}
                className="btn btn-secondary"
                download
                data-testid="export-excel-btn"
              >
                <FileSpreadsheet size={18} /> Excel
              </a>
              <a
                href={`${API}/export/word/${selectedClass}`}
                className="btn btn-secondary"
                download
                data-testid="export-word-btn"
              >
                <FileText size={18} /> Word
              </a>
              <a
                href={`${API}/export/pdf/${selectedClass}`}
                className="btn btn-secondary"
                download
                data-testid="export-pdf-btn"
              >
                <File size={18} /> PDF
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Classes Page
const ClassesPage = ({ schoolYears, classes, onCreateClass, onUpdateClass, onDeleteClass, onCreateSchoolYear }) => {
  const [showClassModal, setShowClassModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

  const ClassModal = ({ cls, onClose }) => {
    const [formData, setFormData] = useState({
      name: cls?.name || '',
      subject: cls?.subject || '',
      color: cls?.color || '#3b82f6',
      hours_per_week: cls?.hours_per_week || 4,
      school_year_id: cls?.school_year_id || (schoolYears[0]?.id || '')
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        if (cls) {
          await onUpdateClass(cls.id, formData);
          toast.success('Klasse aktualisiert');
        } else {
          await onCreateClass(formData);
          toast.success('Klasse erstellt');
        }
        onClose();
      } catch (error) {
        toast.error('Fehler beim Speichern');
      }
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">{cls ? 'Klasse bearbeiten' : 'Neue Klasse'}</h3>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Schuljahr</label>
                <select
                  className="form-input"
                  value={formData.school_year_id}
                  onChange={e => setFormData({ ...formData, school_year_id: e.target.value })}
                  required
                  data-testid="class-year-select"
                >
                  <option value="">Schuljahr wählen</option>
                  {schoolYears.map(year => (
                    <option key={year.id} value={year.id}>{year.name} - {year.semester}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Klasse</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. 6a"
                    required
                    data-testid="class-name-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fach</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="z.B. Deutsch"
                    required
                    data-testid="class-subject-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Wochenstunden</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="10"
                  value={formData.hours_per_week}
                  onChange={e => setFormData({ ...formData, hours_per_week: parseInt(e.target.value) || 1 })}
                  data-testid="class-hours-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Farbe</label>
                <div className="color-picker">
                  {colors.map(color => (
                    <div
                      key={color}
                      className={`color-option ${formData.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                      data-testid={`color-${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
              <button type="submit" className="btn btn-primary" data-testid="save-class-btn">Speichern</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const SchoolYearModal = ({ onClose }) => {
    const [formData, setFormData] = useState({
      name: '2025/2026',
      semester: '1. Halbjahr',
      start_date: '2025-08-01',
      end_date: '2026-01-31'
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await onCreateSchoolYear(formData);
        toast.success('Schuljahr erstellt');
        onClose();
      } catch (error) {
        toast.error('Fehler beim Erstellen');
      }
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Neues Schuljahr</h3>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Schuljahr</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. 2025/2026"
                    required
                    data-testid="year-name-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Halbjahr</label>
                  <select
                    className="form-input"
                    value={formData.semester}
                    onChange={e => setFormData({ ...formData, semester: e.target.value })}
                    data-testid="year-semester-select"
                  >
                    <option value="1. Halbjahr">1. Halbjahr</option>
                    <option value="2. Halbjahr">2. Halbjahr</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Startdatum</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    data-testid="year-start-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Enddatum</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    data-testid="year-end-input"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
              <button type="submit" className="btn btn-primary" data-testid="save-year-btn">Erstellen</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Manrope, sans-serif' }}>
          Klassen & Fächer
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowYearModal(true)} data-testid="add-year-btn">
            <Plus size={18} /> Schuljahr
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingClass(null); setShowClassModal(true); }} data-testid="add-class-btn">
            <Plus size={18} /> Klasse
          </button>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BookOpen size={40} />
          </div>
          <h3 className="empty-state-title">Keine Klassen vorhanden</h3>
          <p className="empty-state-text">
            Erstellen Sie zuerst ein Schuljahr und dann Ihre Klassen, um mit der Planung zu beginnen.
          </p>
          <button className="btn btn-primary" onClick={() => setShowYearModal(true)}>
            <Plus size={18} /> Schuljahr erstellen
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {classes.map(cls => {
            const year = schoolYears.find(y => y.id === cls.school_year_id);
            return (
              <div key={cls.id} className="card" style={{ borderLeft: `4px solid ${cls.color}` }}>
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{cls.name} - {cls.subject}</h3>
                    <span className="card-subtitle">{year?.name} ({year?.semester})</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => { setEditingClass(cls); setShowClassModal(true); }}
                      data-testid={`edit-class-${cls.id}`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={async () => {
                        if (window.confirm('Klasse wirklich löschen?')) {
                          await onDeleteClass(cls.id);
                          toast.success('Klasse gelöscht');
                        }
                      }}
                      data-testid={`delete-class-${cls.id}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="badge badge-primary">{cls.hours_per_week} Std./Woche</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showClassModal && <ClassModal cls={editingClass} onClose={() => setShowClassModal(false)} />}
      {showYearModal && <SchoolYearModal onClose={() => setShowYearModal(false)} />}
    </div>
  );
};

// Sharing Page
const SharingPage = ({ classes }) => {
  const { authAxios } = useAuth();
  const [myShares, setMyShares] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedClassToShare, setSelectedClassToShare] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShares();
  }, []);

  const fetchShares = async () => {
    setLoading(true);
    try {
      const [mySharesRes, sharedWithMeRes] = await Promise.all([
        authAxios.get('/shares/my-shares'),
        authAxios.get('/shares/shared-with-me')
      ]);
      setMyShares(mySharesRes.data);
      setSharedWithMe(sharedWithMeRes.data);
    } catch (error) {
      console.error('Fehler beim Laden der Freigaben:', error);
    }
    setLoading(false);
  };

  const handleRemoveShare = async (shareId) => {
    if (!window.confirm('Freigabe wirklich entfernen?')) return;
    try {
      await authAxios.delete(`/shares/${shareId}`);
      toast.success('Freigabe entfernt');
      fetchShares();
    } catch (error) {
      toast.error('Fehler beim Entfernen');
    }
  };

  const ShareModal = ({ cls, onClose }) => {
    const [email, setEmail] = useState('');
    const [canEdit, setCanEdit] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleShare = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        await authAxios.post('/shares', {
          class_subject_id: cls.id,
          shared_with_email: email,
          can_edit: canEdit
        });
        toast.success('Klasse erfolgreich freigegeben');
        onClose();
        fetchShares();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Fehler beim Freigeben');
      }
      setSubmitting(false);
    };

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Klasse freigeben</h3>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleShare}>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Geben Sie <strong>{cls.name} - {cls.subject}</strong> für einen Kollegen frei
              </p>
              
              <div className="form-group">
                <label className="form-label">E-Mail des Kollegen</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="kollege@schule.de"
                  required
                  data-testid="share-email-input"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={canEdit}
                    onChange={e => setCanEdit(e.target.checked)}
                    data-testid="share-can-edit-checkbox"
                  />
                  <span>Bearbeitung erlauben</span>
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {canEdit ? 'Kollege kann Unterrichtsstunden hinzufügen und bearbeiten' : 'Kollege kann nur ansehen'}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
              <button type="submit" className="btn btn-primary" disabled={submitting} data-testid="confirm-share-btn">
                {submitting ? <span className="spinner" /> : <><Share2 size={18} /> Freigeben</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <span className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '2rem', fontFamily: 'Manrope, sans-serif' }}>
        Freigaben
      </h2>

      {/* My Classes to Share */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Meine Klassen freigeben</h3>
        </div>
        
        {classes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Keine Klassen vorhanden</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {classes.map(cls => {
              const classShares = myShares.filter(s => s.class_subject_id === cls.id);
              return (
                <div key={cls.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${cls.color}`
                }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{cls.name} - {cls.subject}</div>
                    {classShares.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Freigegeben für: {classShares.map(s => s.shared_with_email).join(', ')}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => { setSelectedClassToShare(cls); setShowShareModal(true); }}
                    data-testid={`share-class-${cls.id}`}
                  >
                    <UserPlus size={16} /> Freigeben
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Active Shares */}
      {myShares.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title">Aktive Freigaben</h3>
          </div>
          <table className="data-table" style={{ marginTop: '0.5rem' }}>
            <thead>
              <tr>
                <th>Klasse</th>
                <th>Freigegeben für</th>
                <th>Berechtigung</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {myShares.map(share => {
                const cls = classes.find(c => c.id === share.class_subject_id);
                return (
                  <tr key={share.id}>
                    <td>{cls?.name} - {cls?.subject}</td>
                    <td>{share.shared_with_email}</td>
                    <td>
                      <span className={`badge ${share.can_edit ? 'badge-success' : 'badge-primary'}`}>
                        {share.can_edit ? <><Pencil size={12} /> Bearbeiten</> : <><Eye size={12} /> Nur Ansicht</>}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleRemoveShare(share.id)}
                        data-testid={`remove-share-${share.id}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Shared With Me */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Mit mir geteilt</h3>
        </div>
        
        {sharedWithMe.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>
            Noch keine Klassen mit Ihnen geteilt
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {sharedWithMe.map(cls => (
              <div key={cls.id} className="card" style={{ borderLeft: `4px solid ${cls.color}`, background: 'rgba(139, 92, 246, 0.05)' }}>
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{cls.name} - {cls.subject}</h3>
                    <span className="card-subtitle">Von: {cls.owner_name}</span>
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-secondary">{cls.hours_per_week} Std./Woche</span>
                  <span className={`badge ${cls.can_edit ? 'badge-success' : 'badge-primary'}`}>
                    {cls.can_edit ? 'Bearbeiten' : 'Nur Ansicht'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showShareModal && selectedClassToShare && (
        <ShareModal cls={selectedClassToShare} onClose={() => { setShowShareModal(false); setSelectedClassToShare(null); }} />
      )}
    </div>
  );
};

// Documents Page
const DocumentsPage = ({ classes }) => {
  const { authAxios } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const params = selectedClass ? { class_subject_id: selectedClass } : {};
        const response = await authAxios.get('/documents', { params });
        setDocuments(response.data);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      }
    };
    fetchDocs();
  }, [selectedClass, authAxios]);

  const handleUpload = async (e) => {
    if (!e.target.files?.length || !selectedClass) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    
    try {
      await authAxios.post(`/documents/upload?class_subject_id=${selectedClass}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Dokument hochgeladen');
      // Refresh list
      const response = await authAxios.get('/documents', { params: { class_subject_id: selectedClass } });
      setDocuments(response.data);
    } catch (error) {
      toast.error('Upload fehlgeschlagen');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Dokument wirklich löschen?')) return;
    try {
      await authAxios.delete(`/documents/${docId}`);
      setDocuments(documents.filter(d => d.id !== docId));
      toast.success('Dokument gelöscht');
    } catch (error) {
      toast.error('Löschen fehlgeschlagen');
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['doc', 'docx'].includes(ext)) return <FileText size={24} color="var(--primary)" />;
    if (['jpg', 'jpeg', 'png'].includes(ext)) return <File size={24} color="var(--success)" />;
    if (ext === 'pdf') return <File size={24} color="var(--error)" />;
    return <File size={24} />;
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Manrope, sans-serif' }}>
          Dokumente
        </h2>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            className="form-input"
            style={{ width: '250px' }}
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            data-testid="docs-class-select"
          >
            <option value="">Alle Klassen</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name} - {cls.subject}</option>
            ))}
          </select>
          
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <input
              type="file"
              accept=".docx,.doc,.pdf,.jpg,.jpeg,.png"
              onChange={handleUpload}
              style={{ display: 'none' }}
              disabled={!selectedClass || uploading}
              data-testid="upload-input"
            />
            {uploading ? <span className="spinner" /> : <Upload size={18} />}
            Hochladen
          </label>
        </div>
      </div>

      {!selectedClass ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FolderOpen size={40} />
          </div>
          <h3 className="empty-state-title">Klasse auswählen</h3>
          <p className="empty-state-text">Wählen Sie eine Klasse, um Dokumente hochzuladen und anzuzeigen</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FolderOpen size={40} />
          </div>
          <h3 className="empty-state-title">Keine Dokumente</h3>
          <p className="empty-state-text">Laden Sie Unterrichtsmaterialien, Arbeitsblätter oder Bilder hoch</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {documents.map(doc => {
            const cls = classes.find(c => c.id === doc.class_subject_id);
            return (
              <div key={doc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {getFileIcon(doc.filename)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {doc.filename}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {cls?.name} • {(doc.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a
                    href={`${API}/documents/${doc.id}/download`}
                    className="btn btn-ghost btn-icon"
                    download
                    data-testid={`download-doc-${doc.id}`}
                  >
                    <Download size={16} />
                  </a>
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => handleDelete(doc.id)}
                    data-testid={`delete-doc-${doc.id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Settings Page
const SettingsPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="page-content">
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '2rem', fontFamily: 'Manrope, sans-serif' }}>
        Einstellungen
      </h2>
      
      <div className="card" style={{ maxWidth: '600px' }}>
        <div className="card-header">
          <h3 className="card-title">Profil</h3>
        </div>
        
        <div style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input type="text" className="form-input" value={user?.name || ''} readOnly />
          </div>
          
          <div className="form-group">
            <label className="form-label">E-Mail</label>
            <input type="email" className="form-input" value={user?.email || ''} readOnly />
          </div>
          
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-default)' }}>
            <button className="btn btn-danger" onClick={logout} data-testid="settings-logout-btn">
              <LogOut size={18} /> Abmelden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const MainApp = () => {
  const { user, logout, authAxios } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [schoolYears, setSchoolYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [yearsRes, classesRes, lessonsRes, holidaysRes] = await Promise.all([
          authAxios.get('/school-years'),
          authAxios.get('/classes'),
          authAxios.get('/lessons'),
          authAxios.get('/holidays')
        ]);
        setSchoolYears(yearsRes.data);
        setClasses(classesRes.data);
        setLessons(lessonsRes.data);
        setHolidays(holidaysRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, [authAxios]);

  const handleNavigate = (page, classId = null) => {
    setCurrentPage(page);
    if (classId) setSelectedClassId(classId);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // CRUD operations
  const createSchoolYear = async (data) => {
    const response = await authAxios.post('/school-years', data);
    setSchoolYears([...schoolYears, response.data]);
    return response.data;
  };

  const createClass = async (data) => {
    const response = await authAxios.post('/classes', data);
    setClasses([...classes, response.data]);
    return response.data;
  };

  const updateClass = async (id, data) => {
    const response = await authAxios.put(`/classes/${id}`, data);
    setClasses(classes.map(c => c.id === id ? response.data : c));
    return response.data;
  };

  const deleteClass = async (id) => {
    await authAxios.delete(`/classes/${id}`);
    setClasses(classes.filter(c => c.id !== id));
    setLessons(lessons.filter(l => l.class_subject_id !== id));
  };

  const createLesson = async (data) => {
    const response = await authAxios.post('/lessons', data);
    setLessons([...lessons, response.data]);
    return response.data;
  };

  const updateLesson = async (id, data) => {
    const response = await authAxios.put(`/lessons/${id}`, data);
    setLessons(lessons.map(l => l.id === id ? response.data : l));
    return response.data;
  };

  const deleteLesson = async (id) => {
    await authAxios.delete(`/lessons/${id}`);
    setLessons(lessons.filter(l => l.id !== id));
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage schoolYears={schoolYears} classes={classes} lessons={lessons} onNavigate={handleNavigate} />;
      case 'calendar':
        return <CalendarPage classes={classes} lessons={lessons} holidays={holidays} onCreateLesson={createLesson} onUpdateLesson={updateLesson} onDeleteLesson={deleteLesson} selectedClassId={selectedClassId} />;
      case 'statistics':
        return <StatisticsPage classes={classes} lessons={lessons} />;
      case 'classes':
        return <ClassesPage schoolYears={schoolYears} classes={classes} onCreateClass={createClass} onUpdateClass={updateClass} onDeleteClass={deleteClass} onCreateSchoolYear={createSchoolYear} />;
      case 'sharing':
        return <SharingPage classes={classes} />;
      case 'documents':
        return <DocumentsPage classes={classes} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage schoolYears={schoolYears} classes={classes} lessons={lessons} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout} user={user} />
      <main className="main-content">
        <header className="main-header">
          <h1 className="main-header-title">
            {currentPage === 'dashboard' && 'Dashboard'}
            {currentPage === 'calendar' && 'Kalender'}
            {currentPage === 'statistics' && 'Statistik'}
            {currentPage === 'classes' && 'Klassen'}
            {currentPage === 'sharing' && 'Freigaben'}
            {currentPage === 'documents' && 'Dokumente'}
            {currentPage === 'settings' && 'Einstellungen'}
          </h1>
        </header>
        {renderPage()}
      </main>
    </div>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster 
          position="top-right" 
          richColors 
          theme="dark"
          toastOptions={{
            style: {
              background: '#18181b',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fafafa'
            }
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><MainApp /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
