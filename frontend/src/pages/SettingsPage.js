import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
  const { user, logout, authAxios, updateUser } = useAuth();
  const [bundeslaender, setBundeslaender] = useState([]);
  const [settings, setSettings] = useState({ 
    bundesland: user?.bundesland || 'rheinland-pfalz', 
    theme: user?.theme || 'dark' 
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBundeslaender = async () => {
      try { 
        const response = await authAxios.get('/holidays/bundeslaender'); 
        setBundeslaender(response.data); 
      } catch (error) { 
        console.error('Error:', error); 
      }
    };
    fetchBundeslaender();
  }, [authAxios]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await authAxios.put('/auth/settings', settings);
      updateUser(response.data);
      toast.success('Einstellungen gespeichert');
    } catch (error) { 
      toast.error('Fehler'); 
    }
    setSaving(false);
  };

  return (
    <div className="page-content">
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '2rem', fontFamily: 'Manrope, sans-serif' }}>
        Einstellungen
      </h2>

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
            <select 
              className="form-input" 
              value={settings.bundesland} 
              onChange={e => setSettings({ ...settings, bundesland: e.target.value })}
            >
              {bundeslaender.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Schulferien werden automatisch im Kalender angezeigt
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : 'Speichern'}
          </button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <div className="card-header"><h3 className="card-title">Konto</h3></div>
        <div style={{ marginTop: '1rem' }}>
          <button className="btn btn-danger" onClick={logout}>
            <LogOut size={18} /> Abmelden
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
