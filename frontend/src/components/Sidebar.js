import { 
  LayoutDashboard, Calendar, BarChart3, BookOpen, FolderOpen, 
  Settings, LogOut, GraduationCap, FileCheck, ListTodo, Share2, History, Table, Search, Lightbulb
} from 'lucide-react';

const Sidebar = ({ currentPage, onNavigate, onLogout, user }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workplan', label: 'Arbeitsplan', icon: Table },
    { id: 'calendar', label: 'Kalender', icon: Calendar },
    { id: 'statistics', label: 'Statistik', icon: BarChart3 },
    { id: 'research', label: 'Recherche', icon: Search },
    { id: 'learning', label: 'Lernprogramme', icon: Lightbulb },
    { id: 'classes', label: 'Klassen', icon: BookOpen },
    { id: 'templates', label: 'Vorlagen', icon: FileCheck },
    { id: 'todos', label: 'Aufgaben', icon: ListTodo },
    { id: 'sharing', label: 'Freigaben', icon: Share2 },
    { id: 'documents', label: 'Dokumente', icon: FolderOpen },
    // { id: 'history', label: 'Verlauf', icon: History }, // Ausgeblendet - bei Bedarf wieder aktivieren
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
            <button 
              key={item.id} 
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)} 
              data-testid={`nav-${item.id}`}
            >
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

export default Sidebar;
