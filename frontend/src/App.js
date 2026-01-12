import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { 
  LayoutDashboard, Calendar, BarChart3, BookOpen, FolderOpen, 
  Settings, LogOut, Plus, ChevronLeft, ChevronRight, Edit2, 
  Trash2, Download, Sparkles, X, GraduationCap,
  FileText, FileSpreadsheet, File, Upload, Clock, Users, Share2, UserPlus, Eye, Pencil,
  Bell, CheckCheck, GripVertical, Search, CheckSquare, Square, Copy,
  FileCheck, Sun, Moon, HelpCircle, ListTodo, MessageSquare, History
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, 
  addMonths, subMonths, isWeekend, startOfWeek, endOfWeek, parseISO, formatDistanceToNow,
  startOfWeek as getStartOfWeek, endOfWeek as getEndOfWeek, addWeeks, subWeeks, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Joyride, { STATUS } from 'react-joyride';

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

  const updateUser = (newUser) => setUser(newUser);

  const authAxios = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` }
  });

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, authAxios, updateUser }}>
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
              <input type="text" className="form-input" placeholder="Ihr Name" value={name}
                onChange={(e) => setName(e.target.value)} required={!isLogin} data-testid="register-name-input" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">E-Mail</label>
            <input type="email" className="form-input" placeholder="ihre@email.de" value={email}
              onChange={(e) => setEmail(e.target.value)} required data-testid="email-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Passwort</label>
            <input type="password" className="form-input" placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} required data-testid="password-input" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} data-testid="login-submit-btn">
            {loading ? <span className="spinner" /> : (isLogin ? 'Anmelden' : 'Konto erstellen')}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button className="btn btn-ghost" onClick={() => setIsLogin(!isLogin)} data-testid="toggle-auth-mode-btn">
            {isLogin ? 'Noch kein Konto? Registrieren' : 'Bereits registriert? Anmelden'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Global Search Component
const GlobalSearch = ({ onNavigate }) => {
  const { authAxios } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = useCallback(async (q) => {
    if (q.length < 2) { setResults(null); return; }
    try {
      const response = await authAxios.get(`/search?q=${encodeURIComponent(q)}`);
      setResults(response.data);
      setShowResults(true);
    } catch (error) { console.error('Search error:', error); }
  }, [authAxios]);

  useEffect(() => {
    const timer = setTimeout(() => { if (query) handleSearch(query); }, 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const totalResults = results ? 
    results.lessons.length + results.classes.length + results.templates.length + results.todos.length : 0;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-subtle)', borderRadius: '8px', padding: '0 0.75rem' }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input type="text" placeholder="Suchen... (Strg+K)" value={query}
          onChange={(e) => setQuery(e.target.value)} onFocus={() => query && setShowResults(true)}
          style={{ background: 'transparent', border: 'none', padding: '0.5rem', color: 'var(--text-default)', width: '200px', outline: 'none' }}
          data-testid="global-search-input" />
      </div>
      
      {showResults && results && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 29 }} onClick={() => setShowResults(false)} />
          <div className="dropdown-menu" style={{ width: '400px', maxHeight: '400px', overflow: 'auto', left: 0, right: 'auto' }}>
            {totalResults === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Keine Ergebnisse</div>
            ) : (
              <>
                {results.lessons.length > 0 && (
                  <div>
                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-disabled)', textTransform: 'uppercase' }}>Stunden</div>
                    {results.lessons.map(l => (
                      <div key={l.id} className="dropdown-item" onClick={() => { onNavigate('calendar'); setShowResults(false); }}>
                        <Calendar size={14} /> <span>{l.topic || 'Ohne Thema'}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.date}</span>
                      </div>
                    ))}
                  </div>
                )}
                {results.classes.length > 0 && (
                  <div>
                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-disabled)', textTransform: 'uppercase' }}>Klassen</div>
                    {results.classes.map(c => (
                      <div key={c.id} className="dropdown-item" onClick={() => { onNavigate('classes'); setShowResults(false); }}>
                        <BookOpen size={14} /> <span>{c.name} - {c.subject}</span>
                      </div>
                    ))}
                  </div>
                )}
                {results.templates.length > 0 && (
                  <div>
                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-disabled)', textTransform: 'uppercase' }}>Vorlagen</div>
                    {results.templates.map(t => (
                      <div key={t.id} className="dropdown-item" onClick={() => { onNavigate('templates'); setShowResults(false); }}>
                        <FileCheck size={14} /> <span>{t.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Notification Bell Component
const NotificationBell = () => {
  const { authAxios } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await authAxios.get('/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.is_read).length);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await authAxios.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) { console.error('Error:', error); }
  };

  const markAsRead = async (id) => {
    try {
      await authAxios.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) { console.error('Error:', error); }
  };

  const markAllAsRead = async () => {
    try {
      await authAxios.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) { toast.error('Fehler'); }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-ghost btn-icon" onClick={() => setShowDropdown(!showDropdown)} data-testid="notification-bell">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '4px', right: '4px', width: '18px', height: '18px', background: 'var(--error)',
            borderRadius: '50%', fontSize: '0.7rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {showDropdown && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 29 }} onClick={() => setShowDropdown(false)} />
          <div className="dropdown-menu" style={{ width: '360px', maxHeight: '400px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-default)' }}>
              <span style={{ fontWeight: '600' }}>Benachrichtigungen</span>
              {unreadCount > 0 && (
                <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={markAllAsRead}>
                  <CheckCheck size={14} /> Alle gelesen
                </button>
              )}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Bell size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} /><p>Keine Benachrichtigungen</p>
                </div>
              ) : notifications.map(n => (
                <div key={n.id} onClick={() => !n.is_read && markAsRead(n.id)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem',
                    background: n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.1)', borderBottom: '1px solid var(--border-default)', cursor: 'pointer' }}>
                  <Share2 size={16} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', fontSize: '0.85rem' }}>{n.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.message}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-disabled)', marginTop: '0.25rem' }}>
                      {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true, locale: de })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
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
    { id: 'templates', label: 'Vorlagen', icon: FileCheck },
    { id: 'todos', label: 'Aufgaben', icon: ListTodo },
    { id: 'sharing', label: 'Freigaben', icon: Share2 },
    { id: 'documents', label: 'Dokumente', icon: FolderOpen },
    { id: 'history', label: 'Verlauf', icon: History },
    { id: 'settings', label: 'Einstellungen', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><GraduationCap size={22} color="white" /></div>
          <h1>PlanEd</h1>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-label">Navigation</div>
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)} data-testid={`nav-${item.id}`}>
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </div>
      </nav>
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-default)' }}>
        <div className="user-menu" onClick={onLogout} data-testid="logout-btn">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
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
const DashboardPage = ({ schoolYears, classes, lessons, todos, onNavigate }) => {
  const totalLessons = lessons.length;
  const plannedLessons = lessons.filter(l => l.topic).length;
  const cancelledLessons = lessons.filter(l => l.is_cancelled).length;
  const totalUnits = lessons.reduce((sum, l) => sum + (l.is_cancelled ? 0 : l.teaching_units), 0);
  const pendingTodos = todos.filter(t => !t.is_completed).length;

  return (
    <div className="page-content">
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '2rem', fontFamily: 'Manrope, sans-serif' }}>Dashboard</h2>
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
            <button className="btn btn-ghost btn-icon" onClick={() => onNavigate('classes')}><Plus size={18} /></button>
          </div>
          {classes.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <Users size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>Noch keine Klassen</p>
              <button className="btn btn-secondary" onClick={() => onNavigate('classes')} style={{ marginTop: '1rem' }}>Klasse erstellen</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {classes.slice(0, 5).map(cls => (
                <div key={cls.id} onClick={() => onNavigate('calendar', cls.id)} data-testid={`class-item-${cls.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', cursor: 'pointer' }}>
                  <div style={{ width: '8px', height: '40px', borderRadius: '4px', background: cls.color }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{cls.name} - {cls.subject}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cls.hours_per_week} Std./Woche</div>
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
            <button className="btn btn-ghost btn-icon" onClick={() => onNavigate('todos')}><Plus size={18} /></button>
          </div>
          {todos.filter(t => !t.is_completed).length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ListTodo size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p>Keine offenen Aufgaben</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {todos.filter(t => !t.is_completed).slice(0, 5).map(todo => (
                <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                  <Square size={16} style={{ color: todo.priority === 'high' ? 'var(--error)' : 'var(--text-muted)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem' }}>{todo.title}</div>
                    {todo.due_date && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fällig: {todo.due_date}</div>}
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
            <button className="btn btn-primary" onClick={() => onNavigate('classes')}><Plus size={18} /> Klasse anlegen</button>
            <button className="btn btn-secondary" onClick={() => onNavigate('calendar')}><Calendar size={18} /> Zum Kalender</button>
            <button className="btn btn-secondary" onClick={() => onNavigate('templates')}><FileCheck size={18} /> Vorlagen</button>
            <button className="btn btn-secondary" onClick={() => onNavigate('todos')}><ListTodo size={18} /> Aufgaben</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Calendar Page (simplified for space)
const CalendarPage = ({ classes, lessons, holidays, schoolHolidays, publicHolidays, onCreateLesson, onUpdateLesson, onDeleteLesson, selectedClassId, onCopyLesson }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState(selectedClassId || (classes[0]?.id || ''));
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month');
  const { authAxios } = useAuth();
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { if (selectedClassId) setSelectedClass(selectedClassId); }, [selectedClassId]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = viewMode === 'month' 
    ? eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    : eachDayOfInterval({ start: getStartOfWeek(currentDate, { weekStartsOn: 1 }), end: getEndOfWeek(currentDate, { weekStartsOn: 1 }) });

  const filteredLessons = lessons.filter(l => l.class_subject_id === selectedClass);
  const currentClass = classes.find(c => c.id === selectedClass);

  const getLessonsForDay = (date) => filteredLessons.filter(l => l.date === format(date, 'yyyy-MM-dd'));

  const isHolidayDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (publicHolidays.some(h => h.date === dateStr)) return 'public';
    if (schoolHolidays.some(h => dateStr >= h.start && dateStr <= h.end)) return 'school';
    return false;
  };

  const getHolidayName = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const pub = publicHolidays.find(h => h.date === dateStr);
    if (pub) return pub.name;
    const sch = schoolHolidays.find(h => dateStr >= h.start && dateStr <= h.end);
    if (sch) return sch.name;
    return null;
  };

  const openCreateModal = (date) => { setSelectedDate(date); setSelectedLesson(null); setModalMode('create'); setShowModal(true); };
  const openEditModal = (lesson, e) => { e.stopPropagation(); setSelectedLesson(lesson); setSelectedDate(parseISO(lesson.date)); setModalMode('edit'); setShowModal(true); };

  const handleSaveLesson = async (lessonData) => {
    try {
      if (modalMode === 'create') {
        await onCreateLesson({ ...lessonData, class_subject_id: selectedClass, date: format(selectedDate, 'yyyy-MM-dd') });
        toast.success('Stunde erstellt');
      } else {
        await onUpdateLesson(selectedLesson.id, lessonData);
        toast.success('Stunde aktualisiert');
      }
      setShowModal(false);
    } catch (error) { toast.error('Fehler beim Speichern'); }
  };

  const handleDeleteLesson = async () => {
    if (!selectedLesson) return;
    try { await onDeleteLesson(selectedLesson.id); toast.success('Stunde gelöscht'); setShowModal(false); }
    catch (error) { toast.error('Fehler'); }
  };

  const handleCopyLesson = async () => {
    if (!selectedLesson) return;
    const newDate = prompt('Neues Datum (YYYY-MM-DD):', format(addDays(parseISO(selectedLesson.date), 7), 'yyyy-MM-dd'));
    if (newDate) {
      try { await onCopyLesson(selectedLesson.id, newDate); toast.success('Stunde kopiert'); setShowModal(false); }
      catch (error) { toast.error('Fehler beim Kopieren'); }
    }
  };

  const handleAISuggestion = async () => {
    if (!currentClass) return;
    setAiLoading(true);
    try {
      const existingTopics = filteredLessons.filter(l => l.topic).map(l => l.topic);
      const response = await authAxios.post('/ai/suggestions', {
        subject: currentClass.subject, grade: currentClass.name, curriculum_topic: 'Allgemein', previous_topics: existingTopics.slice(-5)
      });
      if (response.data.suggestions?.length > 0) {
        const s = response.data.suggestions[0];
        setSelectedLesson(prev => ({ ...prev, topic: s.topic || '', objective: s.objective || '', key_terms: s.key_terms || '' }));
        toast.success('KI-Vorschlag eingefügt');
      }
    } catch (error) { toast.error('KI-Vorschlag fehlgeschlagen'); }
    setAiLoading(false);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newDate = destination.droppableId;
    const lesson = filteredLessons.find(l => l.id === draggableId);
    if (!lesson || lesson.date === newDate) return;
    try { await onUpdateLesson(lesson.id, { date: newDate }); toast.success(`Verschoben auf ${format(parseISO(newDate), 'dd.MM.yyyy', { locale: de })}`); }
    catch (error) { toast.error('Fehler'); }
  };

  const navigatePrev = () => setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));
  const navigateNext = () => setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Manrope, sans-serif' }}>Kalender</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="tabs">
            <button className={`tab ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>Monat</button>
            <button className={`tab ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>Woche</button>
          </div>
          <select className="form-input" style={{ width: '250px' }} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} data-testid="class-select">
            <option value="">Klasse wählen</option>
            {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name} - {cls.subject}</option>)}
          </select>
        </div>
      </div>

      {selectedClass && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.5rem 1rem',
          background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <GripVertical size={16} />
          <span>Tipp: Unterrichtsstunden per Drag & Drop verschieben</span>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="calendar-container">
          <div className="calendar-header">
            <div className="calendar-nav">
              <button onClick={navigatePrev} data-testid="prev-month-btn"><ChevronLeft size={18} /></button>
            </div>
            <h3 className="calendar-title">
              {viewMode === 'month' ? format(currentDate, 'MMMM yyyy', { locale: de }) : `KW ${format(currentDate, 'w', { locale: de })} - ${format(currentDate, 'yyyy')}`}
            </h3>
            <div className="calendar-nav">
              <button onClick={navigateNext} data-testid="next-month-btn"><ChevronRight size={18} /></button>
            </div>
          </div>

          <div className="calendar-grid" style={{ gridTemplateColumns: viewMode === 'week' ? 'repeat(7, 1fr)' : 'repeat(7, 1fr)' }}>
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => <div key={day} className="calendar-weekday">{day}</div>)}
            
            {days.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayLessons = getLessonsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isWeekendDay = isWeekend(day);
              const holidayType = isHolidayDay(day);
              const holidayName = getHolidayName(day);

              return (
                <Droppable droppableId={dayStr} key={dayStr}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className={`calendar-day ${!isCurrentMonth && viewMode === 'month' ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isWeekendDay ? 'weekend' : ''} ${holidayType ? 'holiday' : ''} ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                      style={{ minHeight: viewMode === 'week' ? '300px' : '120px' }}
                      onClick={() => selectedClass && openCreateModal(day)} data-testid={`calendar-day-${dayStr}`}>
                      <span className="calendar-day-number">{format(day, 'd')}</span>
                      {holidayName && <div style={{ fontSize: '0.65rem', color: holidayType === 'public' ? 'var(--error)' : 'var(--warning)', marginBottom: '0.25rem' }}>{holidayName}</div>}
                      {dayLessons.map((lesson, index) => (
                        <Draggable key={lesson.id} draggableId={lesson.id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              className={`lesson-item ${lesson.is_cancelled ? 'cancelled' : ''} ${snapshot.isDragging ? 'dragging' : ''}`}
                              onClick={(e) => openEditModal(lesson, e)} style={{ borderLeftColor: currentClass?.color, ...provided.draggableProps.style }}
                              data-testid={`lesson-${lesson.id}`}>
                              <span className="lesson-item-title">{lesson.topic || 'Kein Thema'}</span>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </div>
      </DragDropContext>

      {showModal && (
        <LessonModal lesson={selectedLesson} date={selectedDate} onSave={handleSaveLesson} onDelete={handleDeleteLesson}
          onCopy={handleCopyLesson} onClose={() => setShowModal(false)} onAISuggestion={handleAISuggestion} aiLoading={aiLoading} mode={modalMode} />
      )}
    </div>
  );
};

// Lesson Modal Component
const LessonModal = ({ lesson, date, onSave, onDelete, onCopy, onClose, onAISuggestion, aiLoading, mode }) => {
  const [formData, setFormData] = useState({
    topic: lesson?.topic || '', objective: lesson?.objective || '', curriculum_reference: lesson?.curriculum_reference || '',
    educational_standards: lesson?.educational_standards || '', key_terms: lesson?.key_terms || '', notes: lesson?.notes || '',
    teaching_units: lesson?.teaching_units || 1, is_cancelled: lesson?.is_cancelled || false, cancellation_reason: lesson?.cancellation_reason || ''
  });

  useEffect(() => {
    if (lesson) setFormData({
      topic: lesson.topic || '', objective: lesson.objective || '', curriculum_reference: lesson.curriculum_reference || '',
      educational_standards: lesson.educational_standards || '', key_terms: lesson.key_terms || '', notes: lesson.notes || '',
      teaching_units: lesson.teaching_units || 1, is_cancelled: lesson.is_cancelled || false, cancellation_reason: lesson.cancellation_reason || ''
    });
  }, [lesson]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{mode === 'create' ? 'Neue Stunde' : 'Stunde bearbeiten'} - {date && format(date, 'dd.MM.yyyy', { locale: de })}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onAISuggestion} disabled={aiLoading}>
                {aiLoading ? <span className="spinner" /> : <Sparkles size={18} />} KI-Vorschlag
              </button>
              {mode === 'edit' && (
                <button type="button" className="btn btn-secondary" onClick={onCopy}><Copy size={18} /> Kopieren</button>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Stundenthema</label>
              <input type="text" className="form-input" value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })}
                placeholder="z.B. Einführung Bruchrechnung" data-testid="lesson-topic-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Zielsetzung</label>
              <textarea className="form-input" style={{ height: '80px', resize: 'vertical', padding: '0.75rem' }} value={formData.objective}
                onChange={e => setFormData({ ...formData, objective: e.target.value })} placeholder="Was sollen die Schüler lernen?" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Lehrplanbezug</label>
                <input type="text" className="form-input" value={formData.curriculum_reference}
                  onChange={e => setFormData({ ...formData, curriculum_reference: e.target.value })} placeholder="LP-Verweis" />
              </div>
              <div className="form-group">
                <label className="form-label">Unterrichtseinheiten</label>
                <input type="number" className="form-input" min="1" max="10" value={formData.teaching_units}
                  onChange={e => setFormData({ ...formData, teaching_units: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Schlüsselbegriffe</label>
              <input type="text" className="form-input" value={formData.key_terms} onChange={e => setFormData({ ...formData, key_terms: e.target.value })}
                placeholder="Wichtige Begriffe, kommagetrennt" />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.is_cancelled} onChange={e => setFormData({ ...formData, is_cancelled: e.target.checked })} />
                <span>Unterrichtsausfall</span>
              </label>
            </div>
            {formData.is_cancelled && (
              <div className="form-group">
                <label className="form-label">Grund für Ausfall</label>
                <input type="text" className="form-input" value={formData.cancellation_reason}
                  onChange={e => setFormData({ ...formData, cancellation_reason: e.target.value })} placeholder="z.B. Fortbildung" />
              </div>
            )}
          </div>
          <div className="modal-footer">
            {mode === 'edit' && <button type="button" className="btn btn-danger" onClick={onDelete}><Trash2 size={18} /> Löschen</button>}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
            <button type="submit" className="btn btn-primary">Speichern</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Statistics Page with Charts
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
      } catch (error) { console.error('Error:', error); }
      setLoading(false);
    };
    fetchStats();
  }, [selectedClass, authAxios]);

  const currentClass = classes.find(c => c.id === selectedClass);
  const weekdayData = stats ? Object.entries(stats.hours_by_weekday).filter(([k]) => ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'].includes(k))
    .map(([name, value]) => ({ name: name.substring(0, 2), value })) : [];
  const pieData = stats ? [{ name: 'Geplant', value: stats.used_hours }, { name: 'Verbleibend', value: stats.remaining_hours }, { name: 'Ausgefallen', value: stats.cancelled_hours }] : [];
  const COLORS = ['#10b981', '#3b82f6', '#ef4444'];

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Manrope, sans-serif' }}>Statistik</h2>
        <select className="form-input" style={{ width: '250px' }} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
          <option value="">Klasse wählen</option>
          {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name} - {cls.subject}</option>)}
        </select>
      </div>

      {!selectedClass ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BarChart3 size={40} /></div>
          <h3 className="empty-state-title">Klasse auswählen</h3>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" style={{ width: '40px', height: '40px' }} /></div>
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
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
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
                <div style={{ height: '100%', width: `${stats.completion_percentage}%`, background: 'var(--success)', borderRadius: '4px', transition: 'width 0.5s' }} />
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{stats.topics_covered} Themen behandelt</div>
            </div>
          </div>

          {/* Export */}
          <div className="card bento-item span-2">
            <div className="card-header"><h3 className="card-title">Export</h3></div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <a href={`${API}/export/excel/${selectedClass}`} className="btn btn-secondary" download><FileSpreadsheet size={18} /> Excel</a>
              <a href={`${API}/export/word/${selectedClass}`} className="btn btn-secondary" download><FileText size={18} /> Word</a>
              <a href={`${API}/export/pdf/${selectedClass}`} className="btn btn-secondary" download><File size={18} /> PDF</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Templates Page
const TemplatesPage = ({ classes }) => {
  const { authAxios } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try {
      const response = await authAxios.get('/templates');
      setTemplates(response.data);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Vorlage löschen?')) return;
    try { await authAxios.delete(`/templates/${id}`); setTemplates(templates.filter(t => t.id !== id)); toast.success('Gelöscht'); }
    catch (error) { toast.error('Fehler'); }
  };

  const TemplateModal = ({ onClose }) => {
    const [formData, setFormData] = useState({ name: '', subject: '', topic: '', objective: '', curriculum_reference: '', key_terms: '', teaching_units: 1 });
    const handleSubmit = async (e) => {
      e.preventDefault();
      try { const response = await authAxios.post('/templates', formData); setTemplates([response.data, ...templates]); toast.success('Vorlage erstellt'); onClose(); }
      catch (error) { toast.error('Fehler'); }
    };
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">Neue Vorlage</h3><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button></div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Vorlagenname</label>
                <input type="text" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="z.B. Gedichtanalyse" />
              </div>
              <div className="form-group">
                <label className="form-label">Fach</label>
                <input type="text" className="form-input" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} required placeholder="z.B. Deutsch" />
              </div>
              <div className="form-group">
                <label className="form-label">Thema</label>
                <input type="text" className="form-input" value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })} placeholder="Stundenthema" />
              </div>
              <div className="form-group">
                <label className="form-label">Zielsetzung</label>
                <textarea className="form-input" style={{ height: '80px', padding: '0.75rem' }} value={formData.objective}
                  onChange={e => setFormData({ ...formData, objective: e.target.value })} placeholder="Lernziele" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
              <button type="submit" className="btn btn-primary">Erstellen</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Manrope, sans-serif' }}>Vorlagen</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Neue Vorlage</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" style={{ width: '40px', height: '40px' }} /></div>
      ) : templates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FileCheck size={40} /></div>
          <h3 className="empty-state-title">Keine Vorlagen</h3>
          <p className="empty-state-text">Erstellen Sie Vorlagen für wiederkehrende Unterrichtsinhalte</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Vorlage erstellen</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {templates.map(t => (
            <div key={t.id} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">{t.name}</h3>
                  <span className="card-subtitle">{t.subject}</span>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(t.id)}><Trash2 size={16} /></button>
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.topic}</div>
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="badge badge-secondary">{t.use_count}x verwendet</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && <TemplateModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

// Todos Page
const TodosPage = ({ classes }) => {
  const { authAxios } = useAuth();
  const [todos, setTodos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('pending');

  useEffect(() => { fetchTodos(); }, []);

  const fetchTodos = async () => {
    try { const response = await authAxios.get('/todos'); setTodos(response.data); }
    catch (error) { console.error('Error:', error); }
  };

  const toggleComplete = async (todo) => {
    try {
      await authAxios.put(`/todos/${todo.id}`, { is_completed: !todo.is_completed });
      setTodos(todos.map(t => t.id === todo.id ? { ...t, is_completed: !t.is_completed } : t));
    } catch (error) { toast.error('Fehler'); }
  };

  const handleDelete = async (id) => {
    try { await authAxios.delete(`/todos/${id}`); setTodos(todos.filter(t => t.id !== id)); }
    catch (error) { toast.error('Fehler'); }
  };

  const filteredTodos = filter === 'all' ? todos : filter === 'pending' ? todos.filter(t => !t.is_completed) : todos.filter(t => t.is_completed);

  const TodoModal = ({ onClose }) => {
    const [formData, setFormData] = useState({ title: '', description: '', due_date: '', priority: 'medium', class_subject_id: '' });
    const handleSubmit = async (e) => {
      e.preventDefault();
      try { const response = await authAxios.post('/todos', formData); setTodos([response.data, ...todos]); toast.success('Aufgabe erstellt'); onClose(); }
      catch (error) { toast.error('Fehler'); }
    };
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">Neue Aufgabe</h3><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button></div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Titel</label>
                <input type="text" className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required placeholder="Was ist zu tun?" />
              </div>
              <div className="form-group">
                <label className="form-label">Beschreibung</label>
                <textarea className="form-input" style={{ height: '80px', padding: '0.75rem' }} value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Details..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Fälligkeitsdatum</label>
                  <input type="date" className="form-input" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Priorität</label>
                  <select className="form-input" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                    <option value="low">Niedrig</option><option value="medium">Mittel</option><option value="high">Hoch</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Klasse (optional)</label>
                <select className="form-input" value={formData.class_subject_id} onChange={e => setFormData({ ...formData, class_subject_id: e.target.value })}>
                  <option value="">Keine Klasse</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.subject}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
              <button type="submit" className="btn btn-primary">Erstellen</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Manrope, sans-serif' }}>Aufgaben</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="tabs">
            <button className={`tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Offen</button>
            <button className={`tab ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Erledigt</button>
            <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Alle</button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Neue Aufgabe</button>
        </div>
      </div>

      {filteredTodos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ListTodo size={40} /></div>
          <h3 className="empty-state-title">{filter === 'pending' ? 'Keine offenen Aufgaben' : 'Keine Aufgaben'}</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredTodos.map(todo => {
            const cls = classes.find(c => c.id === todo.class_subject_id);
            return (
              <div key={todo.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                <button className="btn btn-ghost btn-icon" onClick={() => toggleComplete(todo)}>
                  {todo.is_completed ? <CheckSquare size={20} style={{ color: 'var(--success)' }} /> : <Square size={20} />}
                </button>
                <div style={{ flex: 1, textDecoration: todo.is_completed ? 'line-through' : 'none', opacity: todo.is_completed ? 0.6 : 1 }}>
                  <div style={{ fontWeight: '500' }}>{todo.title}</div>
                  {todo.description && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{todo.description}</div>}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {todo.due_date && <span className="badge badge-secondary">{todo.due_date}</span>}
                    {cls && <span className="badge badge-primary">{cls.name}</span>}
                    <span className={`badge ${todo.priority === 'high' ? 'badge-error' : todo.priority === 'medium' ? 'badge-warning' : 'badge-secondary'}`}>
                      {todo.priority === 'high' ? 'Hoch' : todo.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                    </span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(todo.id)}><Trash2 size={16} /></button>
              </div>
            );
          })}
        </div>
      )}
      {showModal && <TodoModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

// History Page
const HistoryPage = () => {
  const { authAxios } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try { const response = await authAxios.get('/history?limit=100'); setHistory(response.data); }
      catch (error) { console.error('Error:', error); }
      setLoading(false);
    };
    fetchHistory();
  }, [authAxios]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return <Plus size={16} style={{ color: 'var(--success)' }} />;
      case 'update': return <Pencil size={16} style={{ color: 'var(--warning)' }} />;
      case 'delete': return <Trash2 size={16} style={{ color: 'var(--error)' }} />;
      default: return <History size={16} />;
    }
  };

  return (
    <div className="page-content">
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.5rem', fontFamily: 'Manrope, sans-serif' }}>Verlauf</h2>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" style={{ width: '40px', height: '40px' }} /></div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><History size={40} /></div>
          <h3 className="empty-state-title">Kein Verlauf</h3>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {history.map(h => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-default)' }}>
                {getActionIcon(h.action)}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem' }}>{h.details}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.user_name}</div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-disabled)' }}>
                  {formatDistanceToNow(parseISO(h.created_at), { addSuffix: true, locale: de })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Classes Page (simplified)
const ClassesPage = ({ schoolYears, classes, onCreateClass, onUpdateClass, onDeleteClass, onCreateSchoolYear }) => {
  const [showClassModal, setShowClassModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

  const ClassModal = ({ cls, onClose }) => {
    const [formData, setFormData] = useState({ name: cls?.name || '', subject: cls?.subject || '', color: cls?.color || '#3b82f6', hours_per_week: cls?.hours_per_week || 4, school_year_id: cls?.school_year_id || (schoolYears[0]?.id || '') });
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        if (cls) { await onUpdateClass(cls.id, formData); toast.success('Aktualisiert'); }
        else { await onCreateClass(formData); toast.success('Erstellt'); }
        onClose();
      } catch (error) { toast.error('Fehler'); }
    };
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">{cls ? 'Klasse bearbeiten' : 'Neue Klasse'}</h3><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button></div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Schuljahr</label>
                <select className="form-input" value={formData.school_year_id} onChange={e => setFormData({ ...formData, school_year_id: e.target.value })} required>
                  <option value="">Schuljahr wählen</option>
                  {schoolYears.map(y => <option key={y.id} value={y.id}>{y.name} - {y.semester}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Klasse</label>
                  <input type="text" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="z.B. 6a" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Fach</label>
                  <input type="text" className="form-input" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="z.B. Deutsch" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Wochenstunden</label>
                <input type="number" className="form-input" min="1" max="10" value={formData.hours_per_week} onChange={e => setFormData({ ...formData, hours_per_week: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="form-group">
                <label className="form-label">Farbe</label>
                <div className="color-picker">
                  {colors.map(color => <div key={color} className={`color-option ${formData.color === color ? 'selected' : ''}`} style={{ backgroundColor: color }} onClick={() => setFormData({ ...formData, color })} />)}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
              <button type="submit" className="btn btn-primary">Speichern</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const SchoolYearModal = ({ onClose }) => {
    const [formData, setFormData] = useState({ name: '2025/2026', semester: '1. Halbjahr', start_date: '2025-08-01', end_date: '2026-01-31' });
    const handleSubmit = async (e) => {
      e.preventDefault();
      try { await onCreateSchoolYear(formData); toast.success('Schuljahr erstellt'); onClose(); }
      catch (error) { toast.error('Fehler'); }
    };
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">Neues Schuljahr</h3><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button></div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Schuljahr</label>
                  <input type="text" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="z.B. 2025/2026" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Halbjahr</label>
                  <select className="form-input" value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })}>
                    <option value="1. Halbjahr">1. Halbjahr</option><option value="2. Halbjahr">2. Halbjahr</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Startdatum</label>
                  <input type="date" className="form-input" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Enddatum</label>
                  <input type="date" className="form-input" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} required />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
              <button type="submit" className="btn btn-primary">Erstellen</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Manrope, sans-serif' }}>Klassen & Fächer</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowYearModal(true)}><Plus size={18} /> Schuljahr</button>
          <button className="btn btn-primary" onClick={() => { setEditingClass(null); setShowClassModal(true); }}><Plus size={18} /> Klasse</button>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={40} /></div>
          <h3 className="empty-state-title">Keine Klassen</h3>
          <p className="empty-state-text">Erstellen Sie zuerst ein Schuljahr und dann Ihre Klassen</p>
          <button className="btn btn-primary" onClick={() => setShowYearModal(true)}><Plus size={18} /> Schuljahr erstellen</button>
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
                    <button className="btn btn-ghost btn-icon" onClick={() => { setEditingClass(cls); setShowClassModal(true); }}><Edit2 size={16} /></button>
                    <button className="btn btn-ghost btn-icon" onClick={async () => { if (window.confirm('Klasse löschen?')) { await onDeleteClass(cls.id); toast.success('Gelöscht'); } }}><Trash2 size={16} /></button>
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}><span className="badge badge-primary">{cls.hours_per_week} Std./Woche</span></div>
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

  useEffect(() => { fetchShares(); }, []);

  const fetchShares = async () => {
    setLoading(true);
    try {
      const [myRes, sharedRes] = await Promise.all([authAxios.get('/shares/my-shares'), authAxios.get('/shares/shared-with-me')]);
      setMyShares(myRes.data);
      setSharedWithMe(sharedRes.data);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const handleRemoveShare = async (id) => {
    if (!window.confirm('Freigabe entfernen?')) return;
    try { await authAxios.delete(`/shares/${id}`); toast.success('Entfernt'); fetchShares(); }
    catch (error) { toast.error('Fehler'); }
  };

  const ShareModal = ({ cls, onClose }) => {
    const [email, setEmail] = useState('');
    const [canEdit, setCanEdit] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const handleShare = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      try { await authAxios.post('/shares', { class_subject_id: cls.id, shared_with_email: email, can_edit: canEdit }); toast.success('Freigegeben'); onClose(); fetchShares(); }
      catch (error) { toast.error(error.response?.data?.detail || 'Fehler'); }
      setSubmitting(false);
    };
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3 className="modal-title">Klasse freigeben</h3><button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button></div>
          <form onSubmit={handleShare}>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Geben Sie <strong>{cls.name} - {cls.subject}</strong> für einen Kollegen frei</p>
              <div className="form-group">
                <label className="form-label">E-Mail des Kollegen</label>
                <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="kollege@schule.de" required />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={canEdit} onChange={e => setCanEdit(e.target.checked)} />
                  <span>Bearbeitung erlauben</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? <span className="spinner" /> : <><Share2 size={18} /> Freigeben</>}</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) return <div className="page-content"><div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" style={{ width: '40px', height: '40px' }} /></div></div>;

  return (
    <div className="page-content">
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '2rem', fontFamily: 'Manrope, sans-serif' }}>Freigaben</h2>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header"><h3 className="card-title">Meine Klassen freigeben</h3></div>
        {classes.length === 0 ? <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Keine Klassen</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {classes.map(cls => (
              <div key={cls.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `4px solid ${cls.color}` }}>
                <div>
                  <div style={{ fontWeight: '500' }}>{cls.name} - {cls.subject}</div>
                  {myShares.filter(s => s.class_subject_id === cls.id).length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Freigegeben für: {myShares.filter(s => s.class_subject_id === cls.id).map(s => s.shared_with_email).join(', ')}
                    </div>
                  )}
                </div>
                <button className="btn btn-secondary" onClick={() => { setSelectedClassToShare(cls); setShowShareModal(true); }}><UserPlus size={16} /> Freigeben</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {sharedWithMe.length > 0 && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Mit mir geteilt</h3></div>
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
                  <span className={`badge ${cls.can_edit ? 'badge-success' : 'badge-primary'}`}>{cls.can_edit ? 'Bearbeiten' : 'Nur Ansicht'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showShareModal && selectedClassToShare && <ShareModal cls={selectedClassToShare} onClose={() => { setShowShareModal(false); setSelectedClassToShare(null); }} />}
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
      } catch (error) { console.error('Error:', error); }
    };
    fetchDocs();
  }, [selectedClass, authAxios]);

  const handleUpload = async (e) => {
    if (!e.target.files?.length || !selectedClass) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    try {
      await authAxios.post(`/documents/upload?class_subject_id=${selectedClass}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Hochgeladen');
      const response = await authAxios.get('/documents', { params: { class_subject_id: selectedClass } });
      setDocuments(response.data);
    } catch (error) { toast.error('Fehler'); }
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Dokument löschen?')) return;
    try { await authAxios.delete(`/documents/${id}`); setDocuments(documents.filter(d => d.id !== id)); toast.success('Gelöscht'); }
    catch (error) { toast.error('Fehler'); }
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Manrope, sans-serif' }}>Dokumente</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select className="form-input" style={{ width: '250px' }} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">Alle Klassen</option>
            {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name} - {cls.subject}</option>)}
          </select>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <input type="file" accept=".docx,.doc,.pdf,.jpg,.jpeg,.png" onChange={handleUpload} style={{ display: 'none' }} disabled={!selectedClass || uploading} />
            {uploading ? <span className="spinner" /> : <Upload size={18} />} Hochladen
          </label>
        </div>
      </div>

      {!selectedClass ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FolderOpen size={40} /></div>
          <h3 className="empty-state-title">Klasse auswählen</h3>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FolderOpen size={40} /></div>
          <h3 className="empty-state-title">Keine Dokumente</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {documents.map(doc => (
            <div key={doc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FileText size={24} color="var(--primary)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.filename}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(doc.size / 1024).toFixed(1)} KB</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a href={`${API}/documents/${doc.id}/download`} className="btn btn-ghost btn-icon" download><Download size={16} /></a>
                <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(doc.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Settings Page
const SettingsPage = () => {
  const { user, logout, authAxios, updateUser } = useAuth();
  const [bundeslaender, setBundeslaender] = useState([]);
  const [settings, setSettings] = useState({ bundesland: user?.bundesland || 'bayern', theme: user?.theme || 'dark' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBundeslaender = async () => {
      try { const response = await authAxios.get('/holidays/bundeslaender'); setBundeslaender(response.data); }
      catch (error) { console.error('Error:', error); }
    };
    fetchBundeslaender();
  }, [authAxios]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await authAxios.put('/auth/settings', settings);
      updateUser(response.data);
      toast.success('Einstellungen gespeichert');
    } catch (error) { toast.error('Fehler'); }
    setSaving(false);
  };

  return (
    <div className="page-content">
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '2rem', fontFamily: 'Manrope, sans-serif' }}>Einstellungen</h2>

      <div className="card" style={{ maxWidth: '600px', marginBottom: '1.5rem' }}>
        <div className="card-header"><h3 className="card-title">Profil</h3></div>
        <div style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input type="text" className="form-input" value={user?.name || ''} readOnly />
          </div>
          <div className="form-group">
            <label className="form-label">E-Mail</label>
            <input type="email" className="form-input" value={user?.email || ''} readOnly />
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px', marginBottom: '1.5rem' }}>
        <div className="card-header"><h3 className="card-title">Schulferien</h3></div>
        <div style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Bundesland</label>
            <select className="form-input" value={settings.bundesland} onChange={e => setSettings({ ...settings, bundesland: e.target.value })}>
              {bundeslaender.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Schulferien werden automatisch im Kalender angezeigt</p>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? <span className="spinner" /> : 'Speichern'}</button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <div className="card-header"><h3 className="card-title">Konto</h3></div>
        <div style={{ marginTop: '1rem' }}>
          <button className="btn btn-danger" onClick={logout}><LogOut size={18} /> Abmelden</button>
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
  const [todos, setTodos] = useState([]);
  const [schoolHolidays, setSchoolHolidays] = useState([]);
  const [publicHolidays, setPublicHolidays] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [runTour, setRunTour] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [yearsRes, classesRes, lessonsRes, holidaysRes, todosRes, pubHolRes] = await Promise.all([
          authAxios.get('/school-years'), authAxios.get('/classes'), authAxios.get('/lessons'),
          authAxios.get('/holidays'), authAxios.get('/todos'), authAxios.get('/holidays/public-holidays')
        ]);
        setSchoolYears(yearsRes.data);
        setClasses(classesRes.data);
        setLessons(lessonsRes.data);
        setHolidays(holidaysRes.data);
        setTodos(todosRes.data);
        setPublicHolidays(pubHolRes.data);
        
        // Fetch school holidays based on user's bundesland
        if (user?.bundesland) {
          const schHolRes = await authAxios.get(`/holidays/school-holidays/${user.bundesland}`);
          setSchoolHolidays(schHolRes.data);
        }
        
        // Show tour for new users
        if (!localStorage.getItem('planed_tour_completed')) {
          setRunTour(true);
        }
      } catch (error) { console.error('Error:', error); }
    };
    fetchData();
  }, [authAxios, user?.bundesland]);

  const handleNavigate = (page, classId = null) => { setCurrentPage(page); if (classId) setSelectedClassId(classId); };
  const handleLogout = () => { logout(); navigate('/login'); };

  // Tour steps
  const tourSteps = [
    { target: '[data-testid="nav-dashboard"]', content: 'Willkommen bei PlanEd! Hier ist Ihr Dashboard mit einer Übersicht aller wichtigen Informationen.', placement: 'right' },
    { target: '[data-testid="nav-calendar"]', content: 'Im Kalender planen Sie Ihre Unterrichtsstunden. Ziehen Sie Stunden per Drag & Drop auf andere Tage.', placement: 'right' },
    { target: '[data-testid="nav-classes"]', content: 'Legen Sie hier Ihre Klassen und Fächer an.', placement: 'right' },
    { target: '[data-testid="nav-templates"]', content: 'Speichern Sie Vorlagen für wiederkehrende Unterrichtsinhalte.', placement: 'right' },
    { target: '[data-testid="nav-sharing"]', content: 'Teilen Sie Arbeitspläne mit Kollegen.', placement: 'right' },
    { target: '[data-testid="notification-bell"]', content: 'Hier sehen Sie Benachrichtigungen, wenn Kollegen geteilte Pläne bearbeiten.', placement: 'bottom' },
  ];

  const handleTourCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem('planed_tour_completed', 'true');
      setRunTour(false);
    }
  };

  // CRUD operations
  const createSchoolYear = async (data) => { const res = await authAxios.post('/school-years', data); setSchoolYears([...schoolYears, res.data]); return res.data; };
  const createClass = async (data) => { const res = await authAxios.post('/classes', data); setClasses([...classes, res.data]); return res.data; };
  const updateClass = async (id, data) => { const res = await authAxios.put(`/classes/${id}`, data); setClasses(classes.map(c => c.id === id ? res.data : c)); return res.data; };
  const deleteClass = async (id) => { await authAxios.delete(`/classes/${id}`); setClasses(classes.filter(c => c.id !== id)); setLessons(lessons.filter(l => l.class_subject_id !== id)); };
  const createLesson = async (data) => { const res = await authAxios.post('/lessons', data); setLessons([...lessons, res.data]); return res.data; };
  const updateLesson = async (id, data) => { const res = await authAxios.put(`/lessons/${id}`, data); setLessons(lessons.map(l => l.id === id ? res.data : l)); return res.data; };
  const deleteLesson = async (id) => { await authAxios.delete(`/lessons/${id}`); setLessons(lessons.filter(l => l.id !== id)); };
  const copyLesson = async (id, newDate) => { const res = await authAxios.post(`/lessons/${id}/copy?new_date=${newDate}`); setLessons([...lessons, res.data]); return res.data; };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage schoolYears={schoolYears} classes={classes} lessons={lessons} todos={todos} onNavigate={handleNavigate} />;
      case 'calendar': return <CalendarPage classes={classes} lessons={lessons} holidays={holidays} schoolHolidays={schoolHolidays} publicHolidays={publicHolidays}
        onCreateLesson={createLesson} onUpdateLesson={updateLesson} onDeleteLesson={deleteLesson} onCopyLesson={copyLesson} selectedClassId={selectedClassId} />;
      case 'statistics': return <StatisticsPage classes={classes} lessons={lessons} />;
      case 'classes': return <ClassesPage schoolYears={schoolYears} classes={classes} onCreateClass={createClass} onUpdateClass={updateClass} onDeleteClass={deleteClass} onCreateSchoolYear={createSchoolYear} />;
      case 'templates': return <TemplatesPage classes={classes} />;
      case 'todos': return <TodosPage classes={classes} />;
      case 'sharing': return <SharingPage classes={classes} />;
      case 'documents': return <DocumentsPage classes={classes} />;
      case 'history': return <HistoryPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage schoolYears={schoolYears} classes={classes} lessons={lessons} todos={todos} onNavigate={handleNavigate} />;
    }
  };

  const pageTitle = { dashboard: 'Dashboard', calendar: 'Kalender', statistics: 'Statistik', classes: 'Klassen', templates: 'Vorlagen',
    todos: 'Aufgaben', sharing: 'Freigaben', documents: 'Dokumente', history: 'Verlauf', settings: 'Einstellungen' };

  return (
    <div className="app-container">
      <Joyride steps={tourSteps} run={runTour} continuous showSkipButton showProgress callback={handleTourCallback}
        styles={{ options: { primaryColor: '#3b82f6', backgroundColor: '#18181b', textColor: '#fafafa', arrowColor: '#18181b' },
          tooltip: { borderRadius: '12px' }, buttonNext: { borderRadius: '8px' }, buttonBack: { marginRight: 10 } }} />
      
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout} user={user} />
      <main className="main-content">
        <header className="main-header">
          <h1 className="main-header-title">{pageTitle[currentPage]}</h1>
          <div className="main-header-actions">
            <GlobalSearch onNavigate={handleNavigate} />
            <button className="btn btn-ghost btn-icon" onClick={() => setRunTour(true)} title="Hilfe"><HelpCircle size={20} /></button>
            <NotificationBell />
          </div>
        </header>
        {renderPage()}
      </main>
    </div>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><span className="spinner" style={{ width: '40px', height: '40px' }} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors theme="dark" toastOptions={{ style: { background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', color: '#fafafa' } }} />
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
