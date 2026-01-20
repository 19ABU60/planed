import { useState, useEffect } from 'react';
import { 
  BookOpen, ChevronRight, Sparkles, FileText, HelpCircle, 
  Puzzle, ListChecks, RefreshCw, Download, Edit3, Trash2,
  Plus, GripVertical, Check, X, Lightbulb, Target, Clock,
  Save, FolderOpen, ChevronDown, ChevronUp, Calendar, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const NIVEAU_LABELS = {
  G: { name: 'Grundlegend', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  M: { name: 'Mittel', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  E: { name: 'Erweitert', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' }
};

const MATERIAL_TYPEN = [
  { id: 'arbeitsblatt', name: 'Arbeitsblatt', icon: FileText },
  { id: 'quiz', name: 'Quiz', icon: HelpCircle },
  { id: 'raetsel', name: 'Kreuzworträtsel', icon: Puzzle },
  { id: 'zuordnung', name: 'Zuordnung', icon: ListChecks },
  { id: 'lueckentext', name: 'Lückentext', icon: Edit3 }
];

// Modal für Arbeitsplan-Integration
const WorkplanModal = ({ isOpen, onClose, unterrichtsreihe, stunden, token, onSuccess }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [startDate, setStartDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Lade Klassen
      const fetchClasses = async () => {
        setLoadingClasses(true);
        try {
          const res = await axios.get(`${API}/api/classes`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Filter nur Deutsch-Klassen
          const deutschKlassen = res.data.filter(c => 
            c.subject?.toLowerCase().includes('deutsch')
          );
          setClasses(deutschKlassen.length > 0 ? deutschKlassen : res.data);
        } catch (err) {
          toast.error('Fehler beim Laden der Klassen');
        } finally {
          setLoadingClasses(false);
        }
      };
      fetchClasses();
      
      // Setze Standard-Startdatum (nächster Montag oder 08.01.2026 für 2. Halbjahr)
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      
      // Wenn wir im Januar sind und vor dem 08., setze auf 08.01.
      if (month === 0 && today.getDate() < 8) {
        setStartDate(`${year}-01-08`);
      } else {
        // Nächster Montag
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
        setStartDate(nextMonday.toISOString().split('T')[0]);
      }
    }
  }, [isOpen, token]);

  const handleSubmit = async () => {
    if (!selectedClass || !startDate) {
      toast.error('Bitte Klasse und Startdatum wählen');
      return;
    }

    setLoading(true);
    try {
      // Erstelle Workplan-Einträge für jede Stunde
      const entries = stunden.map((stunde, index) => {
        // Berechne Datum (eine Woche pro Stunde als Vereinfachung)
        const date = new Date(startDate);
        date.setDate(date.getDate() + (index * 7));
        
        return {
          date: date.toISOString().split('T')[0],
          period: 1, // Standard: 1. Stunde
          unterrichtseinheit: unterrichtsreihe?.titel || '',
          lehrplan: `Stunde ${stunde.nummer}: ${stunde.titel}`,
          stundenthema: stunde.inhalt?.substring(0, 200) || '',
          class_subject_id: selectedClass
        };
      });

      // Speichere alle Einträge
      await axios.post(
        `${API}/api/workplan/${selectedClass}/bulk`,
        { entries },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`${entries.length} Stunden in Arbeitsplan übernommen!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fehler beim Übernehmen');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
        maxWidth: '450px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} />
          In Arbeitsplan übernehmen
        </h3>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ 
            padding: '0.75rem', 
            background: 'var(--bg-subtle)', 
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.85rem'
          }}>
            <strong>{unterrichtsreihe?.titel}</strong>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {stunden.length} Stunden werden übernommen
            </div>
          </div>

          <label style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '0.35rem' }}>
            Klasse / Fach
          </label>
          {loadingClasses ? (
            <div style={{ padding: '0.5rem', textAlign: 'center' }}>
              <RefreshCw size={16} className="spin" />
            </div>
          ) : (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="form-input"
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem' }}
            >
              <option value="">Klasse wählen...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.class_name} - {c.subject}
                </option>
              ))}
            </select>
          )}

          <label style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '0.35rem' }}>
            Startdatum
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="form-input"
            style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
          />
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Stunden werden wöchentlich ab diesem Datum eingetragen
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedClass}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            {loading ? <RefreshCw size={14} className="spin" /> : <ArrowRight size={14} />}
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
};

const CurriculumPlannerPage = () => {
  const { token } = useAuth();
  const [struktur, setStruktur] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Auswahl-State
  const [selectedKlasse, setSelectedKlasse] = useState('');
  const [selectedBereich, setSelectedBereich] = useState('');
  const [selectedThema, setSelectedThema] = useState('');
  const [selectedNiveau, setSelectedNiveau] = useState('M');
  const [stundenAnzahl, setStundenAnzahl] = useState(6);
  
  // Thema-Details
  const [themaDetails, setThemaDetails] = useState(null);
  
  // Generierte Inhalte
  const [unterrichtsreihe, setUnterrichtsreihe] = useState(null);
  const [unterrichtsreiheId, setUnterrichtsreiheId] = useState(null);
  const [generatingReihe, setGeneratingReihe] = useState(false);
  
  // Material
  const [selectedMaterialTyp, setSelectedMaterialTyp] = useState('arbeitsblatt');
  const [generatedMaterial, setGeneratedMaterial] = useState(null);
  const [generatingMaterial, setGeneratingMaterial] = useState(false);
  
  // Bearbeitungsmodus
  const [editMode, setEditMode] = useState(false);
  const [editedStunden, setEditedStunden] = useState([]);
  
  // Gespeicherte Unterrichtsreihen
  const [savedReihen, setSavedReihen] = useState([]);
  const [showSavedReihen, setShowSavedReihen] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Lade LP-Struktur
  useEffect(() => {
    const fetchStruktur = async () => {
      try {
        const res = await axios.get(`${API}/api/lehrplan/struktur`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStruktur(res.data);
      } catch (err) {
        toast.error('Fehler beim Laden der Lehrplan-Struktur');
      } finally {
        setLoading(false);
      }
    };
    fetchStruktur();
    // Lade auch gespeicherte Reihen
    fetchSavedReihen();
  }, [token]);

  // Gespeicherte Unterrichtsreihen laden
  const fetchSavedReihen = async () => {
    setLoadingSaved(true);
    try {
      const res = await axios.get(`${API}/api/lehrplan/unterrichtsreihen`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedReihen(res.data.unterrichtsreihen || []);
    } catch (err) {
      console.error('Fehler beim Laden der gespeicherten Reihen');
    } finally {
      setLoadingSaved(false);
    }
  };

  // Gespeicherte Reihe laden
  const loadSavedReihe = (reihe) => {
    setSelectedKlasse(reihe.klassenstufe);
    setTimeout(() => {
      setSelectedBereich(reihe.kompetenzbereich);
      setTimeout(() => {
        setSelectedThema(reihe.thema_id);
        setSelectedNiveau(reihe.niveau);
        setUnterrichtsreihe(reihe.unterrichtsreihe);
        setUnterrichtsreiheId(reihe.id);
        setEditedStunden(reihe.unterrichtsreihe?.stunden || []);
        setShowSavedReihen(false);
        toast.success('Unterrichtsreihe geladen');
      }, 100);
    }, 100);
  };

  // Unterrichtsreihe löschen
  const deleteSavedReihe = async (reiheId) => {
    if (!window.confirm('Unterrichtsreihe wirklich löschen?')) return;
    try {
      await axios.delete(`${API}/api/lehrplan/unterrichtsreihe/${reiheId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedReihen(savedReihen.filter(r => r.id !== reiheId));
      if (unterrichtsreiheId === reiheId) {
        setUnterrichtsreihe(null);
        setUnterrichtsreiheId(null);
      }
      toast.success('Unterrichtsreihe gelöscht');
    } catch (err) {
      toast.error('Fehler beim Löschen');
    }
  };

  // Lade Thema-Details wenn ausgewählt
  useEffect(() => {
    if (selectedKlasse && selectedBereich && selectedThema) {
      const fetchDetails = async () => {
        try {
          const res = await axios.get(
            `${API}/api/lehrplan/thema`,
            { 
              headers: { Authorization: `Bearer ${token}` },
              params: {
                klassenstufe: selectedKlasse,
                kompetenzbereich: selectedBereich,
                thema_id: selectedThema
              }
            }
          );
          setThemaDetails(res.data);
        } catch (err) {
          console.error('Fehler beim Laden der Thema-Details');
        }
      };
      fetchDetails();
    } else {
      setThemaDetails(null);
    }
  }, [selectedKlasse, selectedBereich, selectedThema, token]);

  // Reset bei Änderung
  useEffect(() => {
    setSelectedBereich('');
    setSelectedThema('');
    setThemaDetails(null);
    setUnterrichtsreihe(null);
  }, [selectedKlasse]);

  useEffect(() => {
    setSelectedThema('');
    setThemaDetails(null);
    setUnterrichtsreihe(null);
  }, [selectedBereich]);

  // Unterrichtsreihe generieren
  const generiereUnterrichtsreihe = async () => {
    if (!selectedKlasse || !selectedBereich || !selectedThema) {
      toast.error('Bitte alle Felder auswählen');
      return;
    }
    
    setGeneratingReihe(true);
    try {
      const res = await axios.post(
        `${API}/api/lehrplan/unterrichtsreihe/generieren`,
        {
          klassenstufe: selectedKlasse,
          kompetenzbereich: selectedBereich,
          thema_id: selectedThema,
          niveau: selectedNiveau,
          stunden_anzahl: stundenAnzahl
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnterrichtsreihe(res.data.unterrichtsreihe);
      setUnterrichtsreiheId(res.data.id);
      setEditedStunden(res.data.unterrichtsreihe.stunden || []);
      // Aktualisiere gespeicherte Liste
      fetchSavedReihen();
      toast.success('Unterrichtsreihe erstellt und gespeichert!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fehler bei der Generierung');
    } finally {
      setGeneratingReihe(false);
    }
  };

  // Material generieren
  const generiereMaterial = async () => {
    if (!themaDetails) {
      toast.error('Bitte zuerst ein Thema auswählen');
      return;
    }
    
    setGeneratingMaterial(true);
    try {
      const res = await axios.post(
        `${API}/api/lehrplan/material/generieren`,
        {
          thema: themaDetails.thema.name,
          niveau: selectedNiveau,
          material_typ: selectedMaterialTyp,
          klassenstufe: selectedKlasse
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGeneratedMaterial(res.data);
      toast.success(`${MATERIAL_TYPEN.find(m => m.id === selectedMaterialTyp)?.name} erstellt!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fehler bei der Generierung');
    } finally {
      setGeneratingMaterial(false);
    }
  };

  // Stunde löschen
  const deleteStunde = (index) => {
    const updated = editedStunden.filter((_, i) => i !== index);
    setEditedStunden(updated.map((s, i) => ({ ...s, nummer: i + 1 })));
  };

  // Stunde hinzufügen
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

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <RefreshCw className="spin" size={32} />
      </div>
    );
  }

  const bereiche = struktur?.struktur?.[selectedKlasse] || {};
  const themen = bereiche[selectedBereich]?.themen || [];

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
            Unterrichtsplanung
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Deutsch RS+ • Rheinland-Pfalz • Lehrplanbasiert
          </p>
        </div>
        {/* Gespeicherte Reihen Button */}
        <button
          onClick={() => setShowSavedReihen(!showSavedReihen)}
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
      </div>

      {/* Gespeicherte Unterrichtsreihen (aufklappbar) */}
      {showSavedReihen && (
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
              {savedReihen.map((reihe) => (
                <div 
                  key={reihe.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-subtle)',
                    borderRadius: '6px',
                    fontSize: '0.8rem'
                  }}
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
                      onClick={() => loadSavedReihe(reihe)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.7rem',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Laden
                    </button>
                    <button
                      onClick={() => deleteSavedReihe(reihe.id)}
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auswahl-Bereich */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Klassenstufe */}
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Klassenstufe
            </label>
            <select
              value={selectedKlasse}
              onChange={(e) => setSelectedKlasse(e.target.value)}
              className="form-input"
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

      {/* Zwei Spalten: Unterrichtsreihe & Material */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Linke Spalte: Unterrichtsreihe */}
        <div>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={18} />
                Unterrichtsreihe
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                <button
                  onClick={generiereUnterrichtsreihe}
                  disabled={!selectedThema || generatingReihe}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                >
                  {generatingReihe ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
                  Generieren
                </button>
              </div>
            </div>

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
              </div>
            )}

            {!unterrichtsreihe && !generatingReihe && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <BookOpen size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.8rem' }}>Wählen Sie ein Thema und klicken Sie auf "Generieren"</p>
              </div>
            )}
          </div>
        </div>

        {/* Rechte Spalte: Material */}
        <div>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} />
                Material erstellen
              </h3>
              <button
                onClick={generiereMaterial}
                disabled={!selectedThema || generatingMaterial}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
              >
                {generatingMaterial ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
                Erstellen
              </button>
            </div>

            {/* Material-Typ Auswahl */}
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {MATERIAL_TYPEN.map(typ => (
                <button
                  key={typ.id}
                  onClick={() => setSelectedMaterialTyp(typ.id)}
                  style={{
                    padding: '0.3rem 0.5rem',
                    fontSize: '0.7rem',
                    background: selectedMaterialTyp === typ.id ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: selectedMaterialTyp === typ.id ? 'white' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <typ.icon size={12} />
                  {typ.name}
                </button>
              ))}
            </div>

            {/* Generiertes Material */}
            {generatedMaterial && (
              <div style={{ 
                background: 'var(--bg-subtle)', 
                borderRadius: '6px', 
                padding: '1rem',
                maxHeight: '500px',
                overflowY: 'auto'
              }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  {generatedMaterial.material.titel}
                </div>

                {/* Arbeitsblatt */}
                {generatedMaterial.typ === 'arbeitsblatt' && generatedMaterial.material.aufgaben && (
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      {generatedMaterial.material.einleitung}
                    </p>
                    {generatedMaterial.material.aufgaben.map((a, i) => (
                      <div key={i} style={{ marginBottom: '0.75rem', padding: '0.5rem', background: 'var(--bg-default)', borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                          Aufgabe {a.nummer} ({a.punkte}P)
                        </div>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                          {a.aufgabenstellung}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quiz */}
                {generatedMaterial.typ === 'quiz' && generatedMaterial.material.fragen && (
                  <div>
                    {generatedMaterial.material.fragen.map((f, i) => (
                      <div key={i} style={{ marginBottom: '0.75rem', padding: '0.5rem', background: 'var(--bg-default)', borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                          {f.nummer}. {f.frage}
                        </div>
                        <div style={{ fontSize: '0.75rem' }}>
                          {f.optionen?.map((o, j) => (
                            <div key={j} style={{ 
                              padding: '0.2rem 0',
                              color: o.startsWith(f.richtig) ? 'var(--success)' : 'var(--text-muted)'
                            }}>
                              {o} {o.startsWith(f.richtig) && '✓'}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Kreuzworträtsel */}
                {generatedMaterial.typ === 'raetsel' && generatedMaterial.material.begriffe && (
                  <div>
                    {generatedMaterial.material.begriffe.map((b, i) => (
                      <div key={i} style={{ 
                        display: 'flex', 
                        gap: '0.5rem', 
                        marginBottom: '0.35rem',
                        fontSize: '0.75rem',
                        padding: '0.3rem',
                        background: 'var(--bg-default)',
                        borderRadius: '4px'
                      }}>
                        <span style={{ fontWeight: '600', minWidth: '20px' }}>{b.nummer}.</span>
                        <span style={{ color: 'var(--text-muted)' }}>({b.richtung})</span>
                        <span>{b.hinweis}</span>
                        <span style={{ marginLeft: 'auto', color: 'var(--success)', fontFamily: 'monospace' }}>
                          {b.wort}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Zuordnung */}
                {generatedMaterial.typ === 'zuordnung' && generatedMaterial.material.paare && (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      {generatedMaterial.material.anleitung}
                    </p>
                    {generatedMaterial.material.paare.map((p, i) => (
                      <div key={i} style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: '0.5rem', 
                        marginBottom: '0.35rem',
                        fontSize: '0.75rem'
                      }}>
                        <span style={{ 
                          flex: 1, 
                          padding: '0.3rem',
                          background: 'var(--bg-default)',
                          borderRadius: '4px'
                        }}>
                          {p.links}
                        </span>
                        <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ 
                          flex: 1, 
                          padding: '0.3rem',
                          background: 'rgba(34, 197, 94, 0.1)',
                          borderRadius: '4px'
                        }}>
                          {p.rechts}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lückentext */}
                {generatedMaterial.typ === 'lueckentext' && generatedMaterial.material.text && (
                  <div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      lineHeight: '1.6',
                      padding: '0.75rem',
                      background: 'var(--bg-default)',
                      borderRadius: '4px',
                      marginBottom: '0.75rem'
                    }}>
                      {generatedMaterial.material.text}
                    </div>
                    {generatedMaterial.material.woerter_box && (
                      <div style={{ 
                        padding: '0.5rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        <strong>Wörter:</strong> {generatedMaterial.material.woerter_box.join(' • ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!generatedMaterial && !generatingMaterial && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <FileText size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.8rem' }}>Wählen Sie einen Material-Typ und klicken Sie auf "Erstellen"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurriculumPlannerPage;
