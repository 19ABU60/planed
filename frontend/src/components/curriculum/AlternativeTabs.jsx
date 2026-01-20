import { BookOpen, Plus, X, RefreshCw } from 'lucide-react';

export const AlternativeTabs = ({
  alternativen,
  activeAlternativeIndex,
  wechsleZuAlternative,
  loescheAlternative,
  setShowAlternativeModal,
  generatingAlternative
}) => {
  if (alternativen.length === 0) return null;

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem', 
        marginBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
          Versionen:
        </span>
        {alternativen.map((alt, idx) => (
          <button
            key={idx}
            onClick={() => wechsleZuAlternative(idx)}
            style={{
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              border: activeAlternativeIndex === idx ? '2px solid var(--primary)' : '1px solid var(--border-default)',
              background: activeAlternativeIndex === idx ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-subtle)',
              color: activeAlternativeIndex === idx ? 'var(--primary)' : 'var(--text-default)',
              fontSize: '0.7rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: activeAlternativeIndex === idx ? '600' : '400'
            }}
            data-testid={`alternative-tab-${idx}`}
          >
            <BookOpen size={12} />
            {alt.schulbuch || 'Ohne Buch'}
            {alternativen.length > 1 && (
              <X 
                size={12} 
                onClick={(e) => { e.stopPropagation(); loescheAlternative(idx); }}
                style={{ marginLeft: '0.25rem', opacity: 0.6 }}
              />
            )}
          </button>
        ))}
        
        {/* Button für neue Alternative */}
        {alternativen.length < 4 && (
          <button
            onClick={() => setShowAlternativeModal(true)}
            disabled={generatingAlternative}
            style={{
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              border: '1px dashed var(--primary)',
              background: 'transparent',
              color: 'var(--primary)',
              fontSize: '0.7rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            data-testid="add-alternative-btn"
          >
            {generatingAlternative ? (
              <RefreshCw size={12} className="spin" />
            ) : (
              <Plus size={12} />
            )}
            Alternative
          </button>
        )}
      </div>
      
      {generatingAlternative && (
        <div style={{ 
          fontSize: '0.75rem', 
          color: 'var(--primary)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          padding: '0.5rem',
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: '6px'
        }}>
          <RefreshCw size={14} className="spin" />
          Generiere Alternative...
        </div>
      )}
    </div>
  );
};

export const AlternativeModal = ({
  showAlternativeModal,
  setShowAlternativeModal,
  schulbuecher,
  alternativen,
  generiereAlternative
}) => {
  if (!showAlternativeModal) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-default)',
        borderRadius: '12px',
        padding: '1.5rem',
        width: '90%',
        maxWidth: '400px',
        maxHeight: '70vh',
        overflow: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} />
            Alternative mit anderem Schulbuch
          </h3>
          <button
            onClick={() => setShowAlternativeModal(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>
        
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Wählen Sie ein Schulbuch für die alternative Unterrichtsreihe:
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {schulbuecher
            .filter(b => b.id !== 'kein_schulbuch' && !alternativen.some(a => a.schulbuch_id === b.id))
            .map(buch => (
              <button
                key={buch.id}
                onClick={() => generiereAlternative(buch.id)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-subtle)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
              >
                <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{buch.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{buch.verlag}</div>
              </button>
            ))}
          
          {/* Option ohne Schulbuch */}
          {!alternativen.some(a => a.schulbuch_id === 'kein_schulbuch') && (
            <button
              onClick={() => generiereAlternative('kein_schulbuch')}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px dashed var(--border-default)',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Ohne Schulbuchbezug
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
