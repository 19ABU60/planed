import { ChevronRight } from 'lucide-react';
import { NIVEAU_LABELS } from './constants';

export const SubjectSelector = ({
  selectedFach,
  setSelectedFach,
  selectedKlasse,
  setSelectedKlasse,
  selectedBereich,
  setSelectedBereich,
  selectedThema,
  setSelectedThema,
  selectedNiveau,
  setSelectedNiveau,
  struktur,
  themaDetails,
  onFachChange
}) => {
  const bereiche = struktur?.struktur?.[selectedKlasse] || {};
  const themen = bereiche[selectedBereich]?.themen || [];

  const handleFachChange = (e) => {
    const neuesFach = e.target.value;
    setSelectedFach(neuesFach);
    onFachChange?.(neuesFach);
  };

  return (
    <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {/* Fach-Auswahl */}
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
            Fach
          </label>
          <select
            value={selectedFach}
            onChange={handleFachChange}
            className="form-input"
            data-testid="fach-select"
            style={{ 
              width: '130px', 
              padding: '0.4rem', 
              fontSize: '0.85rem',
              background: selectedFach === 'deutsch' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
              borderColor: selectedFach === 'deutsch' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(34, 197, 94, 0.5)'
            }}
          >
            <option value="deutsch">🇩🇪 Deutsch</option>
            <option value="mathe">📐 Mathematik</option>
          </select>
        </div>

        <ChevronRight size={16} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />

        {/* Klassenstufe */}
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
            Klassenstufe
          </label>
          <select
            value={selectedKlasse}
            onChange={(e) => setSelectedKlasse(e.target.value)}
            className="form-input"
            data-testid="klassenstufe-select"
            style={{ width: '100px', padding: '0.4rem', fontSize: '0.85rem' }}
          >
            <option value="">Wählen...</option>
            {Object.keys(struktur?.struktur || {}).map(k => (
              <option key={k} value={k}>Kl. {k}</option>
            ))}
          </select>
        </div>

        <ChevronRight size={16} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />

        {/* Kompetenzbereich */}
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
            Kompetenzbereich
          </label>
          <select
            value={selectedBereich}
            onChange={(e) => setSelectedBereich(e.target.value)}
            className="form-input"
            data-testid="bereich-select"
            style={{ width: '160px', padding: '0.4rem', fontSize: '0.85rem' }}
            disabled={!selectedKlasse}
          >
            <option value="">Wählen...</option>
            {Object.entries(bereiche).map(([id, b]) => (
              <option key={id} value={id}>{b.name}</option>
            ))}
          </select>
        </div>

        <ChevronRight size={16} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />

        {/* Thema */}
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
            Thema
          </label>
          <select
            value={selectedThema}
            onChange={(e) => setSelectedThema(e.target.value)}
            className="form-input"
            data-testid="thema-select"
            style={{ width: '200px', padding: '0.4rem', fontSize: '0.85rem' }}
            disabled={!selectedBereich}
          >
            <option value="">Wählen...</option>
            {themen.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <ChevronRight size={16} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />

        {/* Niveau */}
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
            Niveau
          </label>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {Object.entries(NIVEAU_LABELS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setSelectedNiveau(key)}
                data-testid={`niveau-${key}`}
                style={{
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  background: selectedNiveau === key ? val.bg : 'transparent',
                  color: selectedNiveau === key ? val.color : 'var(--text-muted)',
                  border: `1px solid ${selectedNiveau === key ? val.color : 'var(--border-default)'}`,
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Thema-Details */}
      {themaDetails && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          background: 'var(--bg-subtle)', 
          borderRadius: '6px',
          fontSize: '0.8rem'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            {themaDetails.thema.name}
          </div>
          <div style={{ 
            padding: '0.5rem', 
            background: NIVEAU_LABELS[selectedNiveau].bg, 
            borderRadius: '4px',
            borderLeft: `3px solid ${NIVEAU_LABELS[selectedNiveau].color}`
          }}>
            <span style={{ color: NIVEAU_LABELS[selectedNiveau].color, fontWeight: '600' }}>
              {NIVEAU_LABELS[selectedNiveau].name}:
            </span>{' '}
            <span style={{ color: 'var(--text-default)' }}>
              {themaDetails.thema[selectedNiveau]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
