import { useState, useEffect } from 'react';
import { Upload, Download, Trash2, FileText, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
        console.error('Error:', error); 
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
      toast.success('Hochgeladen');
      const response = await authAxios.get('/documents', { params: { class_subject_id: selectedClass } });
      setDocuments(response.data);
    } catch (error) { 
      toast.error('Fehler'); 
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Dokument löschen?')) return;
    try { 
      await authAxios.delete(`/documents/${id}`); 
      setDocuments(documents.filter(d => d.id !== id)); 
      toast.success('Gelöscht'); 
    } catch (error) { 
      toast.error('Fehler'); 
    }
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Manrope, sans-serif' }}>Dokumente</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            className="form-input" 
            style={{ width: '250px' }} 
            value={selectedClass} 
            onChange={e => setSelectedClass(e.target.value)}
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
            />
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
                <div style={{ 
                  fontWeight: '500', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis' 
                }}>
                  {doc.filename}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {(doc.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a 
                  href={`${API}/documents/${doc.id}/download`} 
                  className="btn btn-ghost btn-icon" 
                  download
                >
                  <Download size={16} />
                </a>
                <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(doc.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
