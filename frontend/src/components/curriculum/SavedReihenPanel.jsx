import { Trash2, RefreshCw, FolderOpen, ChevronUp, ChevronDown } from 'lucide-react';
import { NIVEAU_LABELS } from './constants';

export const SavedReihenPanel = ({ 
  savedReihen, 
  showSavedReihen, 
  setShowSavedReihen, 
  loadingSaved,
  loadSavedReihe,
  deleteSavedReihe
}) => {
  const deutschReihen = savedReihen.filter(r => r.fach === 'deutsch' || !r.fach);
  const matheReihen = savedReihen.filter(r => r.fach === 'mathe');

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setShowSavedReihen(!showSavedReihen)}
        data-testid="saved-reihen-toggle"
        style={{
          padding: '0.4rem 0.75rem',
          fontSize: '0.75rem',
          background: showSavedReihen ? 'var(--primary)' : 'var(--bg-subtle)',
          color: showSavedReihen ? 'white' : 'var(--text-default)',
          border: '1px solid var(--border-default)',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}
      >
        <FolderOpen size={14} />
        Meine Reihen ({savedReihen.length})
        {showSavedReihen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Panel Content */}
      {showSavedReihen && (
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem' }}>
            Gespeicherte Unterrichtsreihen
          </h4>
          {loadingSaved ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <RefreshCw size={20} className="spin" />
            </div>
          ) : savedReihen.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
              Noch keine Unterrichtsreihen gespeichert.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
              {/* Deutsch Reihen */}
              {deutschReihen.length > 0 && (
                <div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600', 
                    color: 'var(--primary)',
                    marginBottom: '0.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    🇩🇪 Deutsch ({deutschReihen.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {deutschReihen.map((reihe) => (
                      <ReiheItem 
                        key={reihe.id} 
                        reihe={reihe} 
                        fach="deutsch"
                        loadSavedReihe={loadSavedReihe}
                        deleteSavedReihe={deleteSavedReihe}
                        bgColor="rgba(59, 130, 246, 0.05)"
                        borderColor="rgba(59, 130, 246, 0.2)"
                        buttonColor="var(--primary)"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Mathematik Reihen */}
              {matheReihen.length > 0 && (
                <div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600', 
                    color: '#22c55e',
                    marginBottom: '0.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    📐 Mathematik ({matheReihen.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {matheReihen.map((reihe) => (
                      <ReiheItem 
                        key={reihe.id} 
                        reihe={reihe} 
                        fach="mathe"
                        loadSavedReihe={loadSavedReihe}
                        deleteSavedReihe={deleteSavedReihe}
                        bgColor="rgba(34, 197, 94, 0.05)"
                        borderColor="rgba(34, 197, 94, 0.2)"
                        buttonColor="#22c55e"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

const ReiheItem = ({ reihe, fach, loadSavedReihe, deleteSavedReihe, bgColor, borderColor, buttonColor }) => (
  <div 
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.5rem 0.75rem',
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '6px',
      fontSize: '0.8rem'
    }}
    data-testid={`saved-reihe-${reihe.id}`}
  >
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: '500', marginBottom: '0.15rem' }}>
        {reihe.unterrichtsreihe?.titel || 'Ohne Titel'}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        Kl. {reihe.klassenstufe} • {NIVEAU_LABELS[reihe.niveau]?.name || reihe.niveau}
        {reihe.created_at && ` • ${new Date(reihe.created_at).toLocaleDateString('de-DE')}`}
      </div>
    </div>
    <div style={{ display: 'flex', gap: '0.35rem' }}>
      <button
        onClick={() => loadSavedReihe({ ...reihe, fach })}
        data-testid={`load-reihe-${reihe.id}`}
        style={{
          padding: '0.25rem 0.5rem',
          fontSize: '0.7rem',
          background: buttonColor,
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Laden
      </button>
      <button
        onClick={() => deleteSavedReihe(reihe.id, fach)}
        data-testid={`delete-reihe-${reihe.id}`}
        style={{
          padding: '0.25rem 0.5rem',
          fontSize: '0.7rem',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  </div>
);
