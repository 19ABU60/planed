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
  const [selectedClassData, setSelectedClassData] = useState(null);
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
          // Zeige Deutsch-Klassen zuerst, dann alle anderen
          const sortedClasses = [...deutschKlassen, ...res.data.filter(c => !c.subject?.toLowerCase().includes('deutsch'))];
          setClasses(sortedClasses);
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

  // Wenn Klasse gewählt wird, speichere die Klassendaten
  useEffect(() => {
    if (selectedClass) {
      const classData = classes.find(c => c.id === selectedClass);
      setSelectedClassData(classData);
    }
  }, [selectedClass, classes]);

  // Hilfsfunktion: Generiere alle geplanten Unterrichtsstunden ab Startdatum
  const getScheduledSlots = (schedule, start, count) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const slots = [];
    const currentDate = new Date(start);
    
    // Maximal 52 Wochen vorausschauen
    const maxDays = 365;
    let daysChecked = 0;
    
    while (slots.length < count && daysChecked < maxDays) {
      const dayIndex = currentDate.getDay();
      const dayName = days[dayIndex];
      const periods = schedule?.[dayName] || [];
      
      // Füge alle Stunden dieses Tages hinzu
      for (const period of periods) {
        if (slots.length >= count) break;
        slots.push({
          date: currentDate.toISOString().split('T')[0],
          period: period
        });
      }
      
      // Nächster Tag
      currentDate.setDate(currentDate.getDate() + 1);
      daysChecked++;
    }
    
    return slots;
  };

  const handleSubmit = async () => {
    if (!selectedClass || !startDate) {
      toast.error('Bitte Klasse und Startdatum wählen');
      return;
    }

    // Prüfe ob Schedule vorhanden
    if (!selectedClassData?.schedule || Object.keys(selectedClassData.schedule).length === 0) {
      toast.error('Kein Stundenplan für diese Klasse hinterlegt');
      return;
    }

    setLoading(true);
    try {
      // Hole alle geplanten Zeitslots basierend auf dem Stundenplan der Klasse
      const scheduledSlots = getScheduledSlots(selectedClassData.schedule, startDate, stunden.length);
      
      if (scheduledSlots.length < stunden.length) {
        toast.error('Nicht genug Unterrichtsstunden im Stundenplan gefunden');
        setLoading(false);
        return;
      }

      // Erstelle Workplan-Einträge für jede Stunde
      const entries = stunden.map((stunde, index) => {
        const slot = scheduledSlots[index];
        return {
          date: slot.date,
          period: slot.period,
          unterrichtseinheit: unterrichtsreihe?.titel || '',
          lehrplan: `Stunde ${stunde.nummer}: ${stunde.titel}`,
          stundenthema: stunde.inhalt?.substring(0, 200) || ''
        };
      });

      console.log('Sending entries:', entries);
      console.log('Schedule used:', selectedClassData?.schedule);
      console.log('To class:', selectedClass);

      // Speichere alle Einträge
      const response = await axios.post(
        `${API}/api/workplan/${selectedClass}/bulk`,
        { entries },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Response:', response.data);

      toast.success(`${entries.length} Stunden in Arbeitsplan übernommen!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error:', err.response?.data || err);
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
                  {c.name} - {c.subject}
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
  
  // Fach-Auswahl
  const [selectedFach, setSelectedFach] = useState('deutsch');
  
  // Auswahl-State
  const [selectedKlasse, setSelectedKlasse] = useState('');
  const [selectedBereich, setSelectedBereich] = useState('');
  const [selectedThema, setSelectedThema] = useState('');
  const [selectedNiveau, setSelectedNiveau] = useState('M');
  const [stundenAnzahl, setStundenAnzahl] = useState(6);
  
  // Schulbuch-Auswahl
  const [schulbuecher, setSchulbuecher] = useState([]);
  const [selectedSchulbuch, setSelectedSchulbuch] = useState('kein_schulbuch');
  const [loadingSchulbuecher, setLoadingSchulbuecher] = useState(false);
  
  // Thema-Details
  const [themaDetails, setThemaDetails] = useState(null);
  
  // Generierte Inhalte
  const [unterrichtsreihe, setUnterrichtsreihe] = useState(null);
  const [unterrichtsreiheId, setUnterrichtsreiheId] = useState(null);
  const [generatingReihe, setGeneratingReihe] = useState(false);
  const [currentSchulbuch, setCurrentSchulbuch] = useState(null);
  
  // Alternative Unterrichtsreihen (temporär)
  const [alternativen, setAlternativen] = useState([]);
  const [activeAlternativeIndex, setActiveAlternativeIndex] = useState(0);
  const [generatingAlternative, setGeneratingAlternative] = useState(false);
  const [showAlternativeModal, setShowAlternativeModal] = useState(false);
  
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
  
  // Arbeitsplan-Integration Modal
  const [showWorkplanModal, setShowWorkplanModal] = useState(false);

  // API-Pfade basierend auf Fach
  const getApiPath = (endpoint) => {
    const basePath = selectedFach === 'mathe' ? '/api/mathe' : '/api/lehrplan';
    return `${API}${basePath}/${endpoint}`;
  };

  // Lade LP-Struktur basierend auf Fach
  useEffect(() => {
    const fetchStruktur = async () => {
      setLoading(true);
      try {
        const apiPath = selectedFach === 'mathe' ? '/api/mathe/struktur' : '/api/lehrplan/struktur';
        const res = await axios.get(`${API}${apiPath}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStruktur(res.data);
        // Reset selections when changing subject
        setSelectedKlasse('');
        setSelectedBereich('');
        setSelectedThema('');
        setUnterrichtsreihe(null);
        setAlternativen([]);
      } catch (err) {
        toast.error('Fehler beim Laden der Lehrplan-Struktur');
      } finally {
        setLoading(false);
      }
    };
    fetchStruktur();
    // Lade auch gespeicherte Reihen
    fetchSavedReihen();
  }, [token, selectedFach]);

  // Lade Schulbücher wenn Klassenstufe gewählt
  useEffect(() => {
    const fetchSchulbuecher = async () => {
      if (!selectedKlasse) {
        setSchulbuecher([]);
        return;
      }
      setLoadingSchulbuecher(true);
      try {
        const apiPath = selectedFach === 'mathe' ? '/api/mathe/schulbuecher' : '/api/lehrplan/schulbuecher';
        const res = await axios.get(`${API}${apiPath}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { klassenstufe: selectedKlasse }
        });
        setSchulbuecher(res.data.schulbuecher || []);
        setSelectedSchulbuch('kein_schulbuch');
      } catch (err) {
        console.error('Fehler beim Laden der Schulbücher');
      } finally {
        setLoadingSchulbuecher(false);
      }
    };
    fetchSchulbuecher();
  }, [selectedKlasse, selectedFach, token]);

  // Gespeicherte Unterrichtsreihen laden
  const fetchSavedReihen = async () => {
    setLoadingSaved(true);
    try {
      // Lade Reihen von beiden Fächern
      const [deutschRes, matheRes] = await Promise.all([
        axios.get(`${API}/api/lehrplan/unterrichtsreihen`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { unterrichtsreihen: [] } })),
        axios.get(`${API}/api/mathe/unterrichtsreihen`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { unterrichtsreihen: [] } }))
      ]);
      
      // Füge Fach-Info hinzu
      const deutschReihen = (deutschRes.data.unterrichtsreihen || []).map(r => ({ ...r, fach: 'deutsch' }));
      const matheReihen = (matheRes.data.unterrichtsreihen || []).map(r => ({ ...r, fach: 'mathe' }));
      
      setSavedReihen([...deutschReihen, ...matheReihen]);
    } catch (err) {
      console.error('Fehler beim Laden der gespeicherten Reihen');
    } finally {
      setLoadingSaved(false);
    }
  };

  // Gespeicherte Reihe laden
  const loadSavedReihe = (reihe) => {
    // Zuerst das Fach setzen
    const fach = reihe.fach || 'deutsch';
    setSelectedFach(fach);
    
    // Dann die Auswahl setzen (mit kleiner Verzögerung, damit Struktur geladen wird)
    setTimeout(() => {
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
          toast.success(`${fach === 'mathe' ? 'Mathe' : 'Deutsch'}-Unterrichtsreihe geladen`);
        }, 100);
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
      const apiPath = selectedFach === 'mathe' 
        ? '/api/mathe/unterrichtsreihe/generieren' 
        : '/api/lehrplan/unterrichtsreihe/generieren';
      const res = await axios.post(
        `${API}${apiPath}`,
        {
          klassenstufe: selectedKlasse,
          kompetenzbereich: selectedBereich,
          thema_id: selectedThema,
          niveau: selectedNiveau,
          stunden_anzahl: stundenAnzahl,
          schulbuch_id: selectedSchulbuch
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnterrichtsreihe(res.data.unterrichtsreihe);
      setUnterrichtsreiheId(res.data.id);
      setCurrentSchulbuch(res.data.schulbuch);
      setEditedStunden(res.data.unterrichtsreihe.stunden || []);
      // Speichere als erste Alternative
      setAlternativen([{
        id: res.data.id,
        schulbuch: res.data.schulbuch,
        schulbuch_id: selectedSchulbuch,
        unterrichtsreihe: res.data.unterrichtsreihe,
        stunden: res.data.unterrichtsreihe.stunden || []
      }]);
      setActiveAlternativeIndex(0);
      // Aktualisiere gespeicherte Liste
      fetchSavedReihen();
      toast.success('Unterrichtsreihe erstellt und gespeichert!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fehler bei der Generierung');
    } finally {
      setGeneratingReihe(false);
    }
  };

  // Alternative Unterrichtsreihe mit anderem Schulbuch generieren
  const generiereAlternative = async (alternativeSchulbuchId) => {
    if (!selectedKlasse || !selectedBereich || !selectedThema) {
      toast.error('Bitte alle Felder auswählen');
      return;
    }
    
    // Prüfe ob max. 4 Alternativen
    if (alternativen.length >= 4) {
      toast.error('Maximal 4 Alternativen möglich. Bitte eine löschen.');
      return;
    }
    
    // Prüfe ob dieses Schulbuch schon verwendet wurde
    if (alternativen.some(a => a.schulbuch_id === alternativeSchulbuchId)) {
      toast.error('Dieses Schulbuch wurde bereits verwendet');
      return;
    }
    
    setGeneratingAlternative(true);
    setShowAlternativeModal(false);
    
    try {
      const apiPath = selectedFach === 'mathe' 
        ? '/api/mathe/unterrichtsreihe/generieren' 
        : '/api/lehrplan/unterrichtsreihe/generieren';
      const res = await axios.post(
        `${API}${apiPath}`,
        {
          klassenstufe: selectedKlasse,
          kompetenzbereich: selectedBereich,
          thema_id: selectedThema,
          niveau: selectedNiveau,
          stunden_anzahl: stundenAnzahl,
          schulbuch_id: alternativeSchulbuchId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const neueAlternative = {
        id: res.data.id,
        schulbuch: res.data.schulbuch,
        schulbuch_id: alternativeSchulbuchId,
        unterrichtsreihe: res.data.unterrichtsreihe,
        stunden: res.data.unterrichtsreihe.stunden || []
      };
      
      const neueAlternativen = [...alternativen, neueAlternative];
      setAlternativen(neueAlternativen);
      
      // Wechsle zur neuen Alternative
      const neuerIndex = neueAlternativen.length - 1;
      setActiveAlternativeIndex(neuerIndex);
      setUnterrichtsreihe(neueAlternative.unterrichtsreihe);
      setCurrentSchulbuch(neueAlternative.schulbuch);
      setEditedStunden(neueAlternative.stunden);
      
      fetchSavedReihen();
      toast.success(`Alternative mit ${res.data.schulbuch || 'ohne Schulbuch'} erstellt!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fehler bei der Generierung');
    } finally {
      setGeneratingAlternative(false);
    }
  };

  // Zwischen Alternativen wechseln
  const wechsleZuAlternative = (index) => {
    if (index < 0 || index >= alternativen.length) return;
    
    const alt = alternativen[index];
    setActiveAlternativeIndex(index);
    setUnterrichtsreihe(alt.unterrichtsreihe);
    setUnterrichtsreiheId(alt.id);
    setCurrentSchulbuch(alt.schulbuch);
    setEditedStunden(alt.stunden);
    setSelectedSchulbuch(alt.schulbuch_id);
  };

  // Alternative löschen
  const loescheAlternative = (index) => {
    if (alternativen.length <= 1) {
      toast.error('Mindestens eine Version muss erhalten bleiben');
      return;
    }
    
    const neueAlternativen = alternativen.filter((_, i) => i !== index);
    setAlternativen(neueAlternativen);
    
    // Wenn die aktive gelöscht wurde, zur ersten wechseln
    if (index === activeAlternativeIndex) {
      wechsleZuAlternative(0);
    } else if (index < activeAlternativeIndex) {
      setActiveAlternativeIndex(activeAlternativeIndex - 1);
    }
    
    toast.success('Alternative entfernt');
  };

  // Material generieren
  const generiereMaterial = async () => {
    if (!themaDetails && !unterrichtsreihe) {
      toast.error('Bitte zuerst ein Thema auswählen oder eine Unterrichtsreihe laden');
      return;
    }
    
    // Thema-Name ermitteln (aus themaDetails oder unterrichtsreihe)
    const themaName = themaDetails?.thema?.name || unterrichtsreihe?.thema || selectedThema;
    
    if (!themaName) {
      toast.error('Kein Thema gefunden');
      return;
    }
    
    setGeneratingMaterial(true);
    try {
      // API-Pfad je nach Fach
      const apiPath = selectedFach === 'mathe' 
        ? `${API}/api/mathe/material/generieren`
        : `${API}/api/lehrplan/material/generieren`;
      
      const res = await axios.post(
        apiPath,
        {
          thema: themaName,
          niveau: selectedNiveau,
          material_typ: selectedMaterialTyp,
          klassenstufe: selectedKlasse || unterrichtsreihe?.klassenstufe
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
            {selectedFach === 'deutsch' ? 'Deutsch' : 'Mathematik'} RS+ • Rheinland-Pfalz • Lehrplanbasiert
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
          {/* Fach-Auswahl */}
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Fach
            </label>
            <select
              value={selectedFach}
              onChange={(e) => {
                const neuesFach = e.target.value;
                setSelectedFach(neuesFach);
                // Reset alle Auswahlen und generierten Inhalte beim Fach-Wechsel
                setSelectedKlasse('');
                setSelectedBereich('');
                setSelectedThema('');
                setSelectedNiveau('M');
                setSelectedSchulbuch('kein_schulbuch');
                setSchulbuecher([]);
                setThemaDetails(null);
                setUnterrichtsreihe(null);
                setUnterrichtsreiheId(null);
                setAlternativen([]);
                setActiveAlternativeIndex(0);
                setGeneratedMaterial(null);
                setCurrentSchulbuch(null);
              }}
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

            {/* Alternativen-Tabs wenn vorhanden */}
            {alternativen.length > 0 && (
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
            )}

            {/* Modal für Schulbuch-Auswahl bei Alternative */}
            {showAlternativeModal && (
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
                          onMouseOver={(e) => e.target.style.borderColor = 'var(--primary)'}
                          onMouseOut={(e) => e.target.style.borderColor = 'var(--border-default)'}
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
            )}

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
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                    {generatedMaterial.material.titel}
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const authToken = localStorage.getItem('planed_token');
                        const response = await fetch(`${API}/api/lehrplan/material/export/word`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                          },
                          body: JSON.stringify({
                            material_typ: generatedMaterial.typ,
                            titel: generatedMaterial.material.titel || 'Material',
                            inhalt: {
                              ...generatedMaterial.material,
                              klassenstufe: selectedKlasse,
                              niveau: selectedNiveau
                            }
                          })
                        });
                        
                        if (response.ok) {
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${generatedMaterial.material.titel || 'Material'}_${generatedMaterial.typ}.docx`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                          toast.success('Word-Dokument heruntergeladen!');
                        } else {
                          toast.error('Download fehlgeschlagen');
                        }
                      } catch (error) {
                        console.error('Download error:', error);
                        toast.error('Download fehlgeschlagen: ' + error.message);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.75rem',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                    data-testid="download-word-btn"
                  >
                    <Download size={14} />
                    Word
                  </button>
                  
                  {/* QR-Code Button */}
                  <button
                    onClick={async () => {
                      try {
                        // Generiere eine URL für das Material (Placeholder - könnte später auf gespeichertes Material zeigen)
                        const materialUrl = `${window.location.origin}/shared-material/${Date.now()}`;
                        
                        const authToken = localStorage.getItem('planed_token');
                        const response = await fetch(`${API}/api/lehrplan/material/qrcode?url=${encodeURIComponent(materialUrl)}&titel=${encodeURIComponent(generatedMaterial.material.titel || 'Material')}`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${authToken}`
                          }
                        });
                        
                        if (response.ok) {
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `QRCode_${generatedMaterial.material.titel || 'Material'}.png`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                          toast.success('QR-Code heruntergeladen! Fügen Sie ihn in Ihr Material ein.');
                        } else {
                          toast.error('QR-Code Generierung fehlgeschlagen');
                        }
                      } catch (error) {
                        console.error('QR error:', error);
                        toast.error('Fehler: ' + error.message);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.75rem',
                      background: 'var(--bg-default)',
                      color: 'var(--text-default)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                    title="QR-Code für mobile Nutzung (iPad/Tablet)"
                    data-testid="qrcode-btn"
                  >
                    📱 QR-Code
                  </button>
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

      {/* Workplan Integration Modal */}
      <WorkplanModal
        isOpen={showWorkplanModal}
        onClose={() => setShowWorkplanModal(false)}
        unterrichtsreihe={unterrichtsreihe}
        stunden={editedStunden}
        token={token}
        onSuccess={() => {
          toast.success('Unterrichtsreihe wurde in den Arbeitsplan übernommen');
        }}
      />
    </div>
  );
};

export default CurriculumPlannerPage;
