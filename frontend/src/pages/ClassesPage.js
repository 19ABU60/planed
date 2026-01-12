import { useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen, X } from 'lucide-react';
import { toast } from 'sonner';

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
          toast.success('Aktualisiert'); 
        } else { 
          await onCreateClass(formData); 
          toast.success('Erstellt'); 
        }
        onClose();
      } catch (error) { 
        toast.error('Fehler'); 
      }
    };
    
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">{cls ? 'Klasse bearbeiten' : 'Neue Klasse'}</h3>
            <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
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
                >
                  <option value="">Schuljahr wählen</option>
                  {schoolYears.map(y => (
                    <option key={y.id} value={y.id}>{y.name} - {y.semester}</option>
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
                    />
                  ))}
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
        toast.error('Fehler'); 
      }
    };
    
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Neues Schuljahr</h3>
            <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
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
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Halbjahr</label>
                  <select 
                    className="form-input" 
                    value={formData.semester} 
                    onChange={e => setFormData({ ...formData, semester: e.target.value })}
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
                  />
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
          <button className="btn btn-secondary" onClick={() => setShowYearModal(true)}>
            <Plus size={18} /> Schuljahr
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingClass(null); setShowClassModal(true); }}>
            <Plus size={18} /> Klasse
          </button>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={40} /></div>
          <h3 className="empty-state-title">Keine Klassen</h3>
          <p className="empty-state-text">Erstellen Sie zuerst ein Schuljahr und dann Ihre Klassen</p>
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
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn btn-ghost btn-icon" 
                      onClick={async () => { 
                        if (window.confirm('Klasse löschen?')) { 
                          await onDeleteClass(cls.id); 
                          toast.success('Gelöscht'); 
                        } 
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
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

export default ClassesPage;
