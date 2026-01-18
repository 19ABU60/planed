import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Sidebar from './components/Sidebar';
import NotificationBell from './components/NotificationBell';
import GlobalSearch from './components/GlobalSearch';
import PWAInstallBanner from './components/PWAInstallBanner';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import StatisticsPage from './pages/StatisticsPage';
import ClassesPage from './pages/ClassesPage';
import TemplatesPage from './pages/TemplatesPage';
import TodosPage from './pages/TodosPage';
import SharingPage from './pages/SharingPage';
import DocumentsPage from './pages/DocumentsPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import WorkplanTablePage from './pages/WorkplanTablePage';
import ResearchPage from './pages/ResearchPage';
import LearningResourcesPage from './pages/LearningResourcesPage';
import CurriculumPlannerPage from './pages/CurriculumPlannerPage';

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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [yearsRes, classesRes, lessonsRes, holidaysRes, todosRes, pubHolRes] = await Promise.all([
          authAxios.get('/school-years'), 
          authAxios.get('/classes'), 
          authAxios.get('/lessons'),
          authAxios.get('/holidays'), 
          authAxios.get('/todos'), 
          authAxios.get('/holidays/public-holidays')
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
      } catch (error) { 
        console.error('Error:', error); 
      }
    };
    fetchData();
  }, [authAxios, user?.bundesland]);

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
    const res = await authAxios.post('/school-years', data); 
    setSchoolYears([...schoolYears, res.data]); 
    return res.data; 
  };
  
  const createClass = async (data) => { 
    const res = await authAxios.post('/classes', data); 
    setClasses([...classes, res.data]); 
    return res.data; 
  };
  
  const updateClass = async (id, data) => { 
    const res = await authAxios.put(`/classes/${id}`, data); 
    setClasses(classes.map(c => c.id === id ? res.data : c)); 
    return res.data; 
  };
  
  const deleteClass = async (id) => { 
    await authAxios.delete(`/classes/${id}`); 
    setClasses(classes.filter(c => c.id !== id)); 
    setLessons(lessons.filter(l => l.class_subject_id !== id)); 
  };
  
  const createLesson = async (data) => { 
    const res = await authAxios.post('/lessons', data); 
    setLessons([...lessons, res.data]); 
    return res.data; 
  };
  
  const updateLesson = async (id, data) => { 
    const res = await authAxios.put(`/lessons/${id}`, data); 
    setLessons(lessons.map(l => l.id === id ? res.data : l)); 
    return res.data; 
  };
  
  const deleteLesson = async (id) => { 
    await authAxios.delete(`/lessons/${id}`); 
    setLessons(lessons.filter(l => l.id !== id)); 
  };
  
  const copyLesson = async (id, newDate) => { 
    const res = await authAxios.post(`/lessons/${id}/copy?new_date=${newDate}`); 
    setLessons([...lessons, res.data]); 
    return res.data; 
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': 
        return <DashboardPage schoolYears={schoolYears} classes={classes} lessons={lessons} todos={todos} onNavigate={handleNavigate} />;
      case 'workplan':
        return <WorkplanTablePage classes={classes} schoolYears={schoolYears} />;
      case 'calendar': 
        return <CalendarPage 
          classes={classes} 
          lessons={lessons} 
          holidays={holidays} 
          schoolHolidays={schoolHolidays} 
          publicHolidays={publicHolidays}
          onCreateLesson={createLesson} 
          onUpdateLesson={updateLesson} 
          onDeleteLesson={deleteLesson} 
          onCopyLesson={copyLesson} 
          selectedClassId={selectedClassId} 
        />;
      case 'statistics': 
        return <StatisticsPage classes={classes} lessons={lessons} />;
      case 'classes': 
        return <ClassesPage 
          schoolYears={schoolYears} 
          classes={classes} 
          onCreateClass={createClass} 
          onUpdateClass={updateClass} 
          onDeleteClass={deleteClass} 
          onCreateSchoolYear={createSchoolYear} 
        />;
      case 'templates': 
        return <TemplatesPage classes={classes} />;
      case 'todos': 
        return <TodosPage classes={classes} />;
      case 'sharing': 
        return <SharingPage classes={classes} />;
      case 'documents': 
        return <DocumentsPage classes={classes} />;
      case 'research':
        return <ResearchPage />;
      case 'learning':
        return <LearningResourcesPage />;
      case 'history': 
        return <HistoryPage />;
      case 'settings': 
        return <SettingsPage />;
      default: 
        return <DashboardPage schoolYears={schoolYears} classes={classes} lessons={lessons} todos={todos} onNavigate={handleNavigate} />;
    }
  };

  const pageTitle = { 
    dashboard: 'Dashboard', 
    workplan: 'Arbeitsplan',
    calendar: 'Kalender', 
    statistics: 'Statistik', 
    research: 'Recherche',
    learning: 'Lernprogramme',
    classes: 'Klassen', 
    templates: 'Vorlagen',
    todos: 'Aufgaben', 
    sharing: 'Freigaben', 
    documents: 'Dokumente', 
    history: 'Verlauf', 
    settings: 'Einstellungen' 
  };

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout} user={user} />
      <main className="main-content">
        <header className="main-header">
          <h1 className="main-header-title">{pageTitle[currentPage]}</h1>
          <div className="main-header-actions">
            <GlobalSearch onNavigate={handleNavigate} />
            <NotificationBell />
          </div>
        </header>
        {renderPage()}
      </main>
      <PWAInstallBanner />
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
  if (!user) return <Navigate to="/login" replace />;
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
