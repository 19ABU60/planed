import { useState, useEffect } from 'react';
import { Plus, Trash2, FileCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const TemplatesPage = ({ classes }) => {
  const { authAxios } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchTemplates(); 
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await authAxios.get('/templates');
      setTemplates(response.data);
    } catch (error) { 
      console.error('Error:', error); 
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Vorlage löschen?')) return;
    try { 
      await authAxios.delete(`/templates/${id}`); 
      setTemplates(templates.filter(t => t.id !== id)); 
      toast.success('Gelöscht'); 
    } catch (error) { 
      toast.error('Fehler'); 
    }
  };

  const TemplateModal = ({ onClose }) => {
    const [formData, setFormData] = useState({ 
      name: '', 
      subject: '', 
      topic: '', 
      objective: '', 
      curriculum_reference: '', 
      key_terms: '', 
      teaching_units: 1 
    });
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      try { 
        const response = await authAxios.post('/templates', formData); 
        setTemplates([response.data, ...templates]); 
        toast.success('Vorlage erstellt'); 
        onClose(); 
      } catch (error) { 
        toast.error('Fehler'); 
      }
    };
    
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Neue Vorlage</h3>
            <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Vorlagenname</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  required 
                  placeholder="z.B. Gedichtanalyse" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fach</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.subject} 
                  onChange={e => setFormData({ ...formData, subject: e.target.value })} 
                  required 
                  placeholder="z.B. Deutsch" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Thema</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.topic} 
                  onChange={e => setFormData({ ...formData, topic: e.target.value })} 
                  placeholder="Stundenthema" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Zielsetzung</label>
                <textarea 
                  className="form-input" 
                  style={{ height: '80px', padding: '0.75rem' }} 
                  value={formData.objective}
                  onChange={e => setFormData({ ...formData, objective: e.target.value })} 
                  placeholder="Lernziele" 
                />
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
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Neue Vorlage
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <span className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      ) : templates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FileCheck size={40} /></div>
          <h3 className="empty-state-title">Keine Vorlagen</h3>
          <p className="empty-state-text">Erstellen Sie Vorlagen für wiederkehrende Unterrichtsinhalte</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Vorlage erstellen
          </button>
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
                <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(t.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {t.topic}
              </div>
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

export default TemplatesPage;
