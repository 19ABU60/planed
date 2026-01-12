import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckSquare, Square, ListTodo, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const TodosPage = ({ classes }) => {
  const { authAxios } = useAuth();
  const [todos, setTodos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('pending');

  useEffect(() => { 
    fetchTodos(); 
  }, []);

  const fetchTodos = async () => {
    try { 
      const response = await authAxios.get('/todos'); 
      setTodos(response.data); 
    } catch (error) { 
      console.error('Error:', error); 
    }
  };

  const toggleComplete = async (todo) => {
    try {
      await authAxios.put(`/todos/${todo.id}`, { is_completed: !todo.is_completed });
      setTodos(todos.map(t => t.id === todo.id ? { ...t, is_completed: !t.is_completed } : t));
    } catch (error) { 
      toast.error('Fehler'); 
    }
  };

  const handleDelete = async (id) => {
    try { 
      await authAxios.delete(`/todos/${id}`); 
      setTodos(todos.filter(t => t.id !== id)); 
    } catch (error) { 
      toast.error('Fehler'); 
    }
  };

  const filteredTodos = filter === 'all' 
    ? todos 
    : filter === 'pending' 
      ? todos.filter(t => !t.is_completed) 
      : todos.filter(t => t.is_completed);

  const TodoModal = ({ onClose }) => {
    const [formData, setFormData] = useState({ 
      title: '', 
      description: '', 
      due_date: '', 
      priority: 'medium', 
      class_subject_id: '' 
    });
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      try { 
        const response = await authAxios.post('/todos', formData); 
        setTodos([response.data, ...todos]); 
        toast.success('Aufgabe erstellt'); 
        onClose(); 
      } catch (error) { 
        toast.error('Fehler'); 
      }
    };
    
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Neue Aufgabe</h3>
            <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Titel</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  required 
                  placeholder="Was ist zu tun?" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Beschreibung</label>
                <textarea 
                  className="form-input" 
                  style={{ height: '80px', padding: '0.75rem' }} 
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  placeholder="Details..." 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Fälligkeitsdatum</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formData.due_date} 
                    onChange={e => setFormData({ ...formData, due_date: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Priorität</label>
                  <select 
                    className="form-input" 
                    value={formData.priority} 
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Klasse (optional)</label>
                <select 
                  className="form-input" 
                  value={formData.class_subject_id} 
                  onChange={e => setFormData({ ...formData, class_subject_id: e.target.value })}
                >
                  <option value="">Keine Klasse</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.subject}</option>
                  ))}
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
            <button className={`tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
              Offen
            </button>
            <button className={`tab ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>
              Erledigt
            </button>
            <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              Alle
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Neue Aufgabe
          </button>
        </div>
      </div>

      {filteredTodos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ListTodo size={40} /></div>
          <h3 className="empty-state-title">
            {filter === 'pending' ? 'Keine offenen Aufgaben' : 'Keine Aufgaben'}
          </h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredTodos.map(todo => {
            const cls = classes.find(c => c.id === todo.class_subject_id);
            return (
              <div 
                key={todo.id} 
                className="card" 
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}
              >
                <button className="btn btn-ghost btn-icon" onClick={() => toggleComplete(todo)}>
                  {todo.is_completed 
                    ? <CheckSquare size={20} style={{ color: 'var(--success)' }} /> 
                    : <Square size={20} />
                  }
                </button>
                <div style={{ 
                  flex: 1, 
                  textDecoration: todo.is_completed ? 'line-through' : 'none', 
                  opacity: todo.is_completed ? 0.6 : 1 
                }}>
                  <div style={{ fontWeight: '500' }}>{todo.title}</div>
                  {todo.description && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{todo.description}</div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {todo.due_date && <span className="badge badge-secondary">{todo.due_date}</span>}
                    {cls && <span className="badge badge-primary">{cls.name}</span>}
                    <span className={`badge ${
                      todo.priority === 'high' ? 'badge-error' : 
                      todo.priority === 'medium' ? 'badge-warning' : 'badge-secondary'
                    }`}>
                      {todo.priority === 'high' ? 'Hoch' : todo.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                    </span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(todo.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {showModal && <TodoModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default TodosPage;
