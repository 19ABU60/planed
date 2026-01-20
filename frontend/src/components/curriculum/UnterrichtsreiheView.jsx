import { 
  BookOpen, Sparkles, RefreshCw, Edit3, Trash2, Plus,
  Lightbulb, Target, Calendar
} from 'lucide-react';
import { AlternativeTabs, AlternativeModal } from './AlternativeTabs';

export const UnterrichtsreiheView = ({
  unterrichtsreihe,
  currentSchulbuch,
  editedStunden,
  setEditedStunden,
  editMode,
  setEditMode,
  stundenAnzahl,
  setStundenAnzahl,
  selectedSchulbuch,
  setSelectedSchulbuch,
  schulbuecher,
  loadingSchulbuecher,
  selectedThema,
  generatingReihe,
  generiereUnterrichtsreihe,
  // Alternativen
  alternativen,
  activeAlternativeIndex,
  wechsleZuAlternative,
  loescheAlternative,
  showAlternativeModal,
  setShowAlternativeModal,
  generatingAlternative,
  generiereAlternative,
  // Workplan
  setShowWorkplanModal
}) => {
  const deleteStunde = (index) => {
    const updated = editedStunden.filter((_, i) => i !== index);
    setEditedStunden(updated.map((s, i) => ({ ...s, nummer: i + 1 })));
  };

  const addStunde = () => {
    setEditedStunden([
      ...editedStunden,
      {
        nummer: editedStunden.length + 1,
        titel: 'Neue Stunde',
        phase: 'Erarbeitung',
        dauer: '45 min',
        inhalt: 'Inhalt hier eingeben...',
        methoden: [],
        material: []
      }
    ]);
  };

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={18} />
          Unterrichtsreihe
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Stunden:</label>
          <select
            value={stundenAnzahl}
            onChange={(e) => setStundenAnzahl(parseInt(e.target.value))}
            style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-default)', background: 'var(--bg-subtle)' }}
          >
            {[4, 5, 6, 7, 8, 10, 12].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          
          {/* Schulbuch-Dropdown */}
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Schulbuch:</label>
          <select
            value={selectedSchulbuch}
            onChange={(e) => setSelectedSchulbuch(e.target.value)}
            disabled={loadingSchulbuecher}
            style={{ 
              padding: '0.25rem 0.4rem', 
              fontSize: '0.75rem', 
              borderRadius: '4px', 
              border: '1px solid var(--border-default)', 
              background: selectedSchulbuch !== 'kein_schulbuch' ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-subtle)',
              color: selectedSchulbuch !== 'kein_schulbuch' ? 'var(--primary)' : 'inherit',
              maxWidth: '180px'
            }}
            data-testid="schulbuch-dropdown"
          >
            <option value="kein_schulbuch">Ohne Schulbuch</option>
            {schulbuecher.filter(b => b.id !== 'kein_schulbuch').map(buch => (
              <option key={buch.id} value={buch.id}>
                {buch.name} ({buch.verlag})
              </option>
            ))}
          </select>
          
          <button
            onClick={generiereUnterrichtsreihe}
            disabled={!selectedThema || generatingReihe}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
            data-testid="generate-reihe-btn"
          >
            {generatingReihe ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
            Generieren
          </button>
        </div>
      </div>

      {/* Schulbuch-Info wenn gewählt */}
      {selectedSchulbuch !== 'kein_schulbuch' && schulbuecher.find(b => b.id === selectedSchulbuch) && (
        <div style={{ 
          marginBottom: '0.75rem', 
          padding: '0.5rem 0.75rem', 
          background: 'rgba(139, 92, 246, 0.1)', 
          borderRadius: '6px',
          fontSize: '0.75rem',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <BookOpen size={14} />
          Mit Seitenverweisen zu: <strong>{schulbuecher.find(b => b.id === selectedSchulbuch)?.name}</strong>
        </div>
      )}

      {/* Alternativen-Tabs */}
      <AlternativeTabs
        alternativen={alternativen}
        activeAlternativeIndex={activeAlternativeIndex}
        wechsleZuAlternative={wechsleZuAlternative}
        loescheAlternative={loescheAlternative}
        setShowAlternativeModal={setShowAlternativeModal}
        generatingAlternative={generatingAlternative}
      />

      {/* Modal für Schulbuch-Auswahl bei Alternative */}
      <AlternativeModal
        showAlternativeModal={showAlternativeModal}
        setShowAlternativeModal={setShowAlternativeModal}
        schulbuecher={schulbuecher}
        alternativen={alternativen}
        generiereAlternative={generiereAlternative}
      />

      {/* Generierte Unterrichtsreihe */}
      {unterrichtsreihe && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.25rem' }}>
              {unterrichtsreihe.titel}
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {unterrichtsreihe.ueberblick}
            </p>
            {/* Schulbuch-Badge wenn vorhanden */}
            {(unterrichtsreihe.schulbuch || currentSchulbuch) && (
              <div style={{ 
                marginTop: '0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.2rem 0.5rem',
                background: 'rgba(139, 92, 246, 0.15)',
                borderRadius: '4px',
                fontSize: '0.7rem',
                color: 'var(--primary)'
              }}>
                <BookOpen size={12} />
                {unterrichtsreihe.schulbuch || currentSchulbuch}
              </div>
            )}
          </div>

          {/* Lernziele */}
          {unterrichtsreihe.lernziele && (
            <div style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--success)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Target size={12} /> Lernziele
              </div>
              <ul style={{ fontSize: '0.75rem', margin: 0, paddingLeft: '1rem' }}>
                {unterrichtsreihe.lernziele.map((z, i) => (
                  <li key={i} style={{ marginBottom: '0.15rem' }}>{z}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Bearbeitungs-Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {editedStunden.length} Stunden
            </span>
            <button
              onClick={() => setEditMode(!editMode)}
              style={{
                fontSize: '0.7rem',
                padding: '0.2rem 0.5rem',
                background: editMode ? 'var(--primary)' : 'transparent',
                color: editMode ? 'white' : 'var(--text-muted)',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <Edit3 size={10} style={{ marginRight: '0.25rem' }} />
              {editMode ? 'Fertig' : 'Bearbeiten'}
            </button>
          </div>

          {/* Stunden-Liste */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {editedStunden.map((stunde, idx) => (
              <div 
                key={idx}
                style={{ 
                  padding: '0.6rem',
                  marginBottom: '0.5rem',
                  background: 'var(--bg-subtle)',
                  borderRadius: '6px',
                  borderLeft: '3px solid var(--primary)',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      <span style={{ 
                        background: 'var(--primary)', 
                        color: 'white', 
                        padding: '0.1rem 0.4rem', 
                        borderRadius: '3px',
                        fontSize: '0.7rem',
                        marginRight: '0.5rem'
                      }}>
                        {stunde.nummer}
                      </span>
                      {stunde.titel}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.25rem 0' }}>
                      {stunde.inhalt?.substring(0, 150)}...
                    </p>
                    {/* Schulbuch-Seiten anzeigen */}
                    {stunde.schulbuch_seiten && (
                      <div style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.15rem 0.4rem',
                        background: 'rgba(139, 92, 246, 0.15)',
                        borderRadius: '3px',
                        fontSize: '0.65rem',
                        color: 'var(--primary)',
                        marginBottom: '0.25rem'
                      }}>
                        <BookOpen size={10} />
                        {stunde.schulbuch_seiten}
                      </div>
                    )}
                    {stunde.methoden?.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                        {stunde.methoden.map((m, i) => (
                          <span key={i} style={{ 
                            fontSize: '0.65rem', 
                            padding: '0.1rem 0.3rem',
                            background: 'var(--bg-default)',
                            borderRadius: '3px'
                          }}>
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {editMode && (
                    <button
                      onClick={() => deleteStunde(idx)}
                      style={{ 
                        padding: '0.25rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#ef4444'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Stunde hinzufügen */}
          {editMode && (
            <button
              onClick={addStunde}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.5rem',
                background: 'transparent',
                border: '1px dashed var(--border-default)',
                borderRadius: '6px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}
            >
              <Plus size={14} /> Stunde hinzufügen
            </button>
          )}

          {/* Differenzierung */}
          {unterrichtsreihe.differenzierung && (
            <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#8b5cf6', marginBottom: '0.25rem' }}>
                <Lightbulb size={12} style={{ marginRight: '0.25rem' }} />
                Differenzierung
              </div>
              <div style={{ fontSize: '0.7rem' }}>
                <strong>Fördern:</strong> {unterrichtsreihe.differenzierung.foerdern}
              </div>
              <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                <strong>Fordern:</strong> {unterrichtsreihe.differenzierung.fordern}
              </div>
            </div>
          )}

          {/* Button: In Arbeitsplan übernehmen */}
          <button
            onClick={() => setShowWorkplanModal(true)}
            data-testid="workplan-btn"
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '0.6rem',
              fontSize: '0.8rem',
              fontWeight: '600',
              background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Calendar size={16} />
            In Arbeitsplan übernehmen
          </button>
        </div>
      )}

      {!unterrichtsreihe && !generatingReihe && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          <BookOpen size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
          <p style={{ fontSize: '0.8rem' }}>Wählen Sie ein Thema und klicken Sie auf "Generieren"</p>
        </div>
      )}
    </div>
  );
};
