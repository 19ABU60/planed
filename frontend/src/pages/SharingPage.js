import { useState, useEffect } from 'react';
import { Share2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

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
      const [myRes, sharedRes] = await Promise.all([
        authAxios.get('/shares/my-shares'), 
        authAxios.get('/shares/shared-with-me')
      ]);
      setMyShares(myRes.data);
      setSharedWithMe(sharedRes.data);
    } catch (error) { 
      console.error('Error:', error); 
    }
    setLoading(false);
  };

  const handleRemoveShare = async (id) => {
    if (!window.confirm('Freigabe entfernen?')) return;
    try { 
      await authAxios.delete(`/shares/${id}`); 
      toast.success('Entfernt'); 
      fetchShares(); 
    } catch (error) { 
      toast.error('Fehler'); 
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
        toast.success('Freigegeben'); 
        onClose(); 
        fetchShares(); 
      } catch (error) { 
        toast.error(error.response?.data?.detail || 'Fehler'); 
      }
      setSubmitting(false);
    };
    
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Klasse freigeben</h3>
            <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
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
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={canEdit} 
                    onChange={e => setCanEdit(e.target.checked)} 
                  />
                  <span>Bearbeitung erlauben</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
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

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header"><h3 className="card-title">Meine Klassen freigeben</h3></div>
        {classes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Keine Klassen</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {classes.map(cls => (
              <div 
                key={cls.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '0.75rem', 
                  background: 'rgba(255,255,255,0.02)', 
                  borderRadius: '8px', 
                  borderLeft: `4px solid ${cls.color}` 
                }}
              >
                <div>
                  <div style={{ fontWeight: '500' }}>{cls.name} - {cls.subject}</div>
                  {myShares.filter(s => s.class_subject_id === cls.id).length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Freigegeben für: {myShares.filter(s => s.class_subject_id === cls.id).map(s => s.shared_with_email).join(', ')}
                    </div>
                  )}
                </div>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => { setSelectedClassToShare(cls); setShowShareModal(true); }}
                >
                  <UserPlus size={16} /> Freigeben
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {sharedWithMe.length > 0 && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Mit mir geteilt</h3></div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '1rem', 
            marginTop: '1rem' 
          }}>
            {sharedWithMe.map(cls => (
              <div 
                key={cls.id} 
                className="card" 
                style={{ borderLeft: `4px solid ${cls.color}`, background: 'rgba(139, 92, 246, 0.05)' }}
              >
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{cls.name} - {cls.subject}</h3>
                    <span className="card-subtitle">Von: {cls.owner_name}</span>
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <span className={`badge ${cls.can_edit ? 'badge-success' : 'badge-primary'}`}>
                    {cls.can_edit ? 'Bearbeiten' : 'Nur Ansicht'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showShareModal && selectedClassToShare && (
        <ShareModal 
          cls={selectedClassToShare} 
          onClose={() => { setShowShareModal(false); setSelectedClassToShare(null); }} 
        />
      )}
    </div>
  );
};

export default SharingPage;
