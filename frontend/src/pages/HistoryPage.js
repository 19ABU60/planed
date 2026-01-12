import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, History } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';

const HistoryPage = () => {
  const { authAxios } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try { 
        const response = await authAxios.get('/history?limit=100'); 
        setHistory(response.data); 
      } catch (error) { 
        console.error('Error:', error); 
      }
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
      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.5rem', fontFamily: 'Manrope, sans-serif' }}>
        Verlauf
      </h2>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <span className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><History size={40} /></div>
          <h3 className="empty-state-title">Kein Verlauf</h3>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {history.map(h => (
              <div 
                key={h.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  padding: '0.75rem 1rem', 
                  borderBottom: '1px solid var(--border-default)' 
                }}
              >
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

export default HistoryPage;
