import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Importiere alle Komponenten aus dem curriculum-Ordner
import {
  API,
  WorkplanModal,
  SavedReihenPanel,
  SubjectSelector,
  UnterrichtsreiheView,
  MaterialGenerator
} from '../components/curriculum';

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
  
  // Alternative Unterrichtsreihen
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
      const [deutschRes, matheRes] = await Promise.all([
        axios.get(`${API}/api/lehrplan/unterrichtsreihen`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { unterrichtsreihen: [] } })),
        axios.get(`${API}/api/mathe/unterrichtsreihen`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { unterrichtsreihen: [] } }))
      ]);
      
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
    const fach = reihe.fach || 'deutsch';
    setSelectedFach(fach);
    
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
  const deleteSavedReihe = async (reiheId, fach = 'deutsch') => {
    if (!window.confirm('Unterrichtsreihe wirklich löschen?')) return;
    try {
      const apiPath = fach === 'mathe' ? '/api/mathe/unterrichtsreihe' : '/api/lehrplan/unterrichtsreihe';
      await axios.delete(`${API}${apiPath}/${reiheId}`, {
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

  // Lade Thema-Details
  useEffect(() => {
    if (selectedKlasse && selectedBereich && selectedThema) {
      const fetchDetails = async () => {
        try {
          const res = await axios.get(`${API}/api/lehrplan/thema`, { 
            headers: { Authorization: `Bearer ${token}` },
            params: {
              klassenstufe: selectedKlasse,
              kompetenzbereich: selectedBereich,
              thema_id: selectedThema
            }
          });
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
      const res = await axios.post(`${API}${apiPath}`, {
        klassenstufe: selectedKlasse,
        kompetenzbereich: selectedBereich,
        thema_id: selectedThema,
        niveau: selectedNiveau,
        stunden_anzahl: stundenAnzahl,
        schulbuch_id: selectedSchulbuch
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setUnterrichtsreihe(res.data.unterrichtsreihe);
      setUnterrichtsreiheId(res.data.id);
      setCurrentSchulbuch(res.data.schulbuch);
      setEditedStunden(res.data.unterrichtsreihe.stunden || []);
      setAlternativen([{
        id: res.data.id,
        schulbuch: res.data.schulbuch,
        schulbuch_id: selectedSchulbuch,
        unterrichtsreihe: res.data.unterrichtsreihe,
        stunden: res.data.unterrichtsreihe.stunden || []
      }]);
      setActiveAlternativeIndex(0);
      fetchSavedReihen();
      toast.success('Unterrichtsreihe erstellt und gespeichert!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fehler bei der Generierung');
    } finally {
      setGeneratingReihe(false);
    }
  };

  // Alternative Unterrichtsreihe generieren
  const generiereAlternative = async (alternativeSchulbuchId) => {
    if (!selectedKlasse || !selectedBereich || !selectedThema) {
      toast.error('Bitte alle Felder auswählen');
      return;
    }
    
    if (alternativen.length >= 4) {
      toast.error('Maximal 4 Alternativen möglich. Bitte eine löschen.');
      return;
    }
    
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
      const res = await axios.post(`${API}${apiPath}`, {
        klassenstufe: selectedKlasse,
        kompetenzbereich: selectedBereich,
        thema_id: selectedThema,
        niveau: selectedNiveau,
        stunden_anzahl: stundenAnzahl,
        schulbuch_id: alternativeSchulbuchId
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      const neueAlternative = {
        id: res.data.id,
        schulbuch: res.data.schulbuch,
        schulbuch_id: alternativeSchulbuchId,
        unterrichtsreihe: res.data.unterrichtsreihe,
        stunden: res.data.unterrichtsreihe.stunden || []
      };
      
      const neueAlternativen = [...alternativen, neueAlternative];
      setAlternativen(neueAlternativen);
      
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
    
    const themaName = themaDetails?.thema?.name || unterrichtsreihe?.thema || selectedThema;
    
    if (!themaName) {
      toast.error('Kein Thema gefunden');
      return;
    }
    
    setGeneratingMaterial(true);
    try {
      const apiPath = selectedFach === 'mathe' 
        ? `${API}/api/mathe/material/generieren`
        : `${API}/api/lehrplan/material/generieren`;
      
      const res = await axios.post(apiPath, {
        thema: themaName,
        niveau: selectedNiveau,
        material_typ: selectedMaterialTyp,
        klassenstufe: selectedKlasse || unterrichtsreihe?.klassenstufe
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setGeneratedMaterial(res.data);
      toast.success('Material erstellt!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fehler bei der Generierung');
    } finally {
      setGeneratingMaterial(false);
    }
  };

  // Handler für Fach-Wechsel
  const handleFachChange = () => {
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
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <RefreshCw className="spin" size={32} />
      </div>
    );
  }

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
        
        {/* Gespeicherte Reihen Panel */}
        <SavedReihenPanel
          savedReihen={savedReihen}
          showSavedReihen={showSavedReihen}
          setShowSavedReihen={setShowSavedReihen}
          loadingSaved={loadingSaved}
          loadSavedReihe={loadSavedReihe}
          deleteSavedReihe={deleteSavedReihe}
        />
      </div>

      {/* Auswahl-Bereich */}
      <SubjectSelector
        selectedFach={selectedFach}
        setSelectedFach={setSelectedFach}
        selectedKlasse={selectedKlasse}
        setSelectedKlasse={setSelectedKlasse}
        selectedBereich={selectedBereich}
        setSelectedBereich={setSelectedBereich}
        selectedThema={selectedThema}
        setSelectedThema={setSelectedThema}
        selectedNiveau={selectedNiveau}
        setSelectedNiveau={setSelectedNiveau}
        struktur={struktur}
        themaDetails={themaDetails}
        onFachChange={handleFachChange}
      />

      {/* Zwei Spalten: Unterrichtsreihe & Material */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Linke Spalte: Unterrichtsreihe */}
        <div>
          <UnterrichtsreiheView
            unterrichtsreihe={unterrichtsreihe}
            currentSchulbuch={currentSchulbuch}
            editedStunden={editedStunden}
            setEditedStunden={setEditedStunden}
            editMode={editMode}
            setEditMode={setEditMode}
            stundenAnzahl={stundenAnzahl}
            setStundenAnzahl={setStundenAnzahl}
            selectedSchulbuch={selectedSchulbuch}
            setSelectedSchulbuch={setSelectedSchulbuch}
            schulbuecher={schulbuecher}
            loadingSchulbuecher={loadingSchulbuecher}
            selectedThema={selectedThema}
            generatingReihe={generatingReihe}
            generiereUnterrichtsreihe={generiereUnterrichtsreihe}
            alternativen={alternativen}
            activeAlternativeIndex={activeAlternativeIndex}
            wechsleZuAlternative={wechsleZuAlternative}
            loescheAlternative={loescheAlternative}
            showAlternativeModal={showAlternativeModal}
            setShowAlternativeModal={setShowAlternativeModal}
            generatingAlternative={generatingAlternative}
            generiereAlternative={generiereAlternative}
            setShowWorkplanModal={setShowWorkplanModal}
          />
        </div>

        {/* Rechte Spalte: Material */}
        <div>
          <MaterialGenerator
            selectedThema={selectedThema}
            selectedMaterialTyp={selectedMaterialTyp}
            setSelectedMaterialTyp={setSelectedMaterialTyp}
            generatedMaterial={generatedMaterial}
            generatingMaterial={generatingMaterial}
            generiereMaterial={generiereMaterial}
            selectedKlasse={selectedKlasse}
            selectedNiveau={selectedNiveau}
          />
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
