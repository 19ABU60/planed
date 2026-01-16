import { useState, useMemo } from 'react';
import { 
  ExternalLink, Filter, BookOpen, GraduationCap, Globe, 
  Star, Euro, Sparkles, Search, X, ChevronDown
} from 'lucide-react';

// Lernplattformen Datenbank
const LEARNING_PLATFORMS = [
  // Kostenlose Plattformen
  {
    id: 'anton',
    name: 'Anton',
    description: 'Interaktive Übungen für alle Hauptfächer. Sehr gut gamifiziert mit Belohnungssystem.',
    url: 'https://anton.app',
    subjects: ['mathe', 'deutsch', 'englisch', 'biologie', 'physik', 'chemie', 'geschichte', 'musik'],
    grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free',
    highlight: true
  },
  {
    id: 'learningapps',
    name: 'LearningApps',
    description: 'Interaktive Bausteine zum Lernen. Große Sammlung fertiger Übungen zu allen Themen.',
    url: 'https://learningapps.org',
    subjects: ['mathe', 'deutsch', 'englisch', 'biologie', 'physik', 'chemie', 'geschichte', 'erdkunde', 'musik', 'kunst', 'sport'],
    grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free',
    highlight: true
  },
  {
    id: 'schlaukopf',
    name: 'Schlaukopf',
    description: 'Über 80.000 Quiz-Fragen sortiert nach Schulart, Klasse und Fach.',
    url: 'https://www.schlaukopf.de',
    subjects: ['mathe', 'deutsch', 'englisch', 'biologie', 'physik', 'chemie', 'geschichte', 'erdkunde'],
    grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free'
  },
  {
    id: 'geogebra',
    name: 'GeoGebra',
    description: 'Dynamische Mathematik-Software. Grafischer Taschenrechner, Geometrie, Algebra.',
    url: 'https://www.geogebra.org',
    subjects: ['mathe'],
    grades: [5, 6, 7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free',
    highlight: true
  },
  {
    id: 'duolingo',
    name: 'Duolingo',
    description: 'Spielerisches Sprachenlernen mit täglichen Übungen und Streaks.',
    url: 'https://www.duolingo.com',
    subjects: ['englisch', 'franzoesisch', 'spanisch', 'latein'],
    grades: [5, 6, 7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free'
  },
  {
    id: 'khan-academy',
    name: 'Khan Academy',
    description: 'Kostenlose Kurse mit Videos und Übungen. Besonders stark in Mathe und Naturwissenschaften.',
    url: 'https://de.khanacademy.org',
    subjects: ['mathe', 'biologie', 'physik', 'chemie'],
    grades: [5, 6, 7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free'
  },
  {
    id: 'serlo',
    name: 'Serlo',
    description: 'Freie Lernplattform wie Wikipedia. Erklärungen, Aufgaben und Kurse.',
    url: 'https://de.serlo.org',
    subjects: ['mathe', 'biologie', 'chemie'],
    grades: [5, 6, 7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free'
  },
  {
    id: 'planet-schule',
    name: 'Planet Schule',
    description: 'Lernvideos und Materialien von WDR und SWR für den Unterricht.',
    url: 'https://www.planet-schule.de',
    subjects: ['mathe', 'deutsch', 'englisch', 'biologie', 'physik', 'chemie', 'geschichte', 'erdkunde', 'politik'],
    grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free'
  },
  // Kostenpflichtige Plattformen
  {
    id: 'sofatutor',
    name: 'Sofatutor',
    description: 'Lernvideos, Übungen und Arbeitsblätter für alle Fächer und Klassenstufen.',
    url: 'https://www.sofatutor.com',
    subjects: ['mathe', 'deutsch', 'englisch', 'biologie', 'physik', 'chemie', 'geschichte', 'erdkunde', 'franzoesisch', 'latein'],
    grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'paid',
    highlight: true
  },
  {
    id: 'simpleclub',
    name: 'simpleclub',
    description: 'YouTube-Style Erklärvideos. Sehr beliebt bei Schülern, modern und unterhaltsam.',
    url: 'https://simpleclub.com',
    subjects: ['mathe', 'deutsch', 'englisch', 'biologie', 'physik', 'chemie', 'geschichte', 'erdkunde', 'informatik', 'wirtschaft'],
    grades: [7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'paid',
    highlight: true
  },
  {
    id: 'studysmarter',
    name: 'StudySmarter',
    description: 'KI-gestützte Lernapp mit Karteikarten, Zusammenfassungen und Lernplänen.',
    url: 'https://www.studysmarter.de',
    subjects: ['mathe', 'deutsch', 'englisch', 'biologie', 'physik', 'chemie', 'geschichte'],
    grades: [9, 10, 11, 12, 13],
    schoolTypes: ['gym'],
    cost: 'paid'
  },
  {
    id: 'phase6',
    name: 'Phase6',
    description: 'Der Vokabeltrainer Nr. 1. Mit allen gängigen Schulbüchern kompatibel.',
    url: 'https://www.phase-6.de',
    subjects: ['englisch', 'franzoesisch', 'spanisch', 'latein'],
    grades: [5, 6, 7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'paid'
  },
  {
    id: 'scoyo',
    name: 'Scoyo',
    description: 'Spielerisches Lernen für Klasse 1-7. Besonders für jüngere Schüler geeignet.',
    url: 'https://www.scoyo.de',
    subjects: ['mathe', 'deutsch', 'englisch'],
    grades: [1, 2, 3, 4, 5, 6, 7],
    schoolTypes: ['rs+', 'gym'],
    cost: 'paid'
  }
];

// Schulbuchverlage
const PUBLISHERS = [
  {
    id: 'cornelsen',
    name: 'Cornelsen',
    description: 'Digitale Materialien, Online-Übungen und E-Books.',
    url: 'https://www.cornelsen.de/empfehlungen/lernvideos',
    materialsUrl: 'https://www.cornelsen.de/produkte/suche?schulform=',
    logo: '📘'
  },
  {
    id: 'klett',
    name: 'Ernst Klett Verlag',
    description: 'Digitaler Unterrichtsassistent, Arbeitsblätter und Online-Module.',
    url: 'https://www.klett.de',
    materialsUrl: 'https://www.klett.de/lehrwerk',
    logo: '📗'
  },
  {
    id: 'westermann',
    name: 'Westermann',
    description: 'BiBox, interaktive Übungen und digitale Schulbücher.',
    url: 'https://www.westermann.de',
    materialsUrl: 'https://www.westermann.de/suche?schoolTypes=',
    logo: '📕'
  },
  {
    id: 'ccbuchner',
    name: 'C.C. Buchner',
    description: 'click & teach, digitale Lehrermaterialien und Schülerübungen.',
    url: 'https://www.ccbuchner.de',
    materialsUrl: 'https://www.ccbuchner.de/produkte',
    logo: '📙'
  },
  {
    id: 'stark',
    name: 'Stark Verlag',
    description: 'Prüfungsvorbereitung, Abitur-Training und Übungsaufgaben.',
    url: 'https://www.stark-verlag.de',
    materialsUrl: 'https://www.stark-verlag.de/pruefungsvorbereitung',
    logo: '📓'
  },
  {
    id: 'schroedel',
    name: 'Schroedel / Diesterweg',
    description: 'Teil der Westermann Gruppe. Lehrwerke und digitale Angebote.',
    url: 'https://www.westermann.de/marke/schroedel',
    materialsUrl: 'https://www.westermann.de/marke/schroedel',
    logo: '📔'
  }
];

// Fächer
const SUBJECTS = [
  { id: 'mathe', name: 'Mathematik' },
  { id: 'deutsch', name: 'Deutsch' },
  { id: 'englisch', name: 'Englisch' },
  { id: 'franzoesisch', name: 'Französisch' },
  { id: 'spanisch', name: 'Spanisch' },
  { id: 'latein', name: 'Latein' },
  { id: 'biologie', name: 'Biologie' },
  { id: 'physik', name: 'Physik' },
  { id: 'chemie', name: 'Chemie' },
  { id: 'geschichte', name: 'Geschichte' },
  { id: 'erdkunde', name: 'Erdkunde' },
  { id: 'politik', name: 'Politik/Sozialkunde' },
  { id: 'informatik', name: 'Informatik' },
  { id: 'musik', name: 'Musik' },
  { id: 'kunst', name: 'Kunst' },
  { id: 'sport', name: 'Sport' },
  { id: 'wirtschaft', name: 'Wirtschaft' }
];

const LearningResourcesPage = () => {
  const [filters, setFilters] = useState({
    subject: '',
    grade: '',
    schoolType: '',
    cost: ''
  });
  const [showFilters, setShowFilters] = useState(true);
  const [activeTab, setActiveTab] = useState('platforms');

  // Gefilterte Plattformen
  const filteredPlatforms = useMemo(() => {
    return LEARNING_PLATFORMS.filter(platform => {
      if (filters.subject && !platform.subjects.includes(filters.subject)) return false;
      if (filters.grade && !platform.grades.includes(parseInt(filters.grade))) return false;
      if (filters.schoolType && !platform.schoolTypes.includes(filters.schoolType)) return false;
      if (filters.cost && platform.cost !== filters.cost) return false;
      return true;
    });
  }, [filters]);

  // Grades basierend auf Schulart
  const availableGrades = useMemo(() => {
    if (filters.schoolType === 'rs+') {
      return [5, 6, 7, 8, 9, 10];
    } else if (filters.schoolType === 'gym') {
      return [5, 6, 7, 8, 9, 10, 11, 12, 13];
    }
    return [5, 6, 7, 8, 9, 10, 11, 12, 13];
  }, [filters.schoolType]);

  const clearFilters = () => {
    setFilters({ subject: '', grade: '', schoolType: '', cost: '' });
  };

  const hasActiveFilters = filters.subject || filters.grade || filters.schoolType || filters.cost;

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Manrope, sans-serif', marginBottom: '0.5rem' }}>
          Lernprogramme
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Finden Sie passende Lernplattformen und Übungsmaterialien für Ihre Schülerinnen und Schüler
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1rem' }}>
        <button
          className={`tab ${activeTab === 'platforms' ? 'active' : ''}`}
          onClick={() => setActiveTab('platforms')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Sparkles size={18} />
          Lernplattformen
        </button>
        <button
          className={`tab ${activeTab === 'publishers' ? 'active' : ''}`}
          onClick={() => setActiveTab('publishers')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <BookOpen size={18} />
          Schulbuchverlage
        </button>
      </div>

      {/* Filter Section */}
      {activeTab === 'platforms' && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showFilters ? '1rem' : 0 }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-default)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              <Filter size={16} />
              Filter
              <ChevronDown size={16} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-ghost btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <X size={14} />
                Filter zurücksetzen
              </button>
            )}
          </div>

          {showFilters && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Schulart */}
              <select
                className="form-input"
                value={filters.schoolType}
                onChange={(e) => setFilters({ ...filters, schoolType: e.target.value, grade: '' })}
                style={{ width: '140px', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
              >
                <option value="">Schulart</option>
                <option value="rs+">RS+</option>
                <option value="gym">Gymnasium</option>
              </select>

              {/* Klassenstufe */}
              <select
                className="form-input"
                value={filters.grade}
                onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
                style={{ width: '120px', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
              >
                <option value="">Klasse</option>
                {availableGrades.map(g => (
                  <option key={g} value={g}>Klasse {g}</option>
                ))}
              </select>

              {/* Fach */}
              <select
                className="form-input"
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                style={{ width: '150px', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
              >
                <option value="">Fach</option>
                {SUBJECTS.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              {/* Kosten */}
              <select
                className="form-input"
                value={filters.cost}
                onChange={(e) => setFilters({ ...filters, cost: e.target.value })}
                style={{ width: '140px', padding: '0.4rem 0.5rem', fontSize: '0.85rem' }}
              >
                <option value="">Kosten</option>
                <option value="free">Kostenlos</option>
                <option value="paid">Kostenpflichtig</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Lernplattformen */}
      {activeTab === 'platforms' && (
        <>
          <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {filteredPlatforms.length} Plattform{filteredPlatforms.length !== 1 ? 'en' : ''} gefunden
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '1rem' 
          }}>
            {filteredPlatforms.map(platform => (
              <div 
                key={platform.id} 
                className="card" 
                style={{ 
                  padding: '1.25rem',
                  position: 'relative',
                  borderLeft: platform.highlight ? '3px solid var(--primary)' : undefined
                }}
                data-testid={`platform-${platform.id}`}
              >
                {platform.highlight && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '0.75rem', 
                    right: '0.75rem',
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <Star size={10} /> Empfohlen
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '8px',
                    background: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Globe size={20} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.1rem' }}>
                      {platform.name}
                    </h3>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: platform.cost === 'free' ? 'var(--success)' : 'var(--warning)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {platform.cost === 'free' ? (
                        <><Sparkles size={12} /> Kostenlos</>
                      ) : (
                        <><Euro size={12} /> Kostenpflichtig</>
                      )}
                    </span>
                  </div>
                </div>

                <p style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--text-muted)', 
                  marginBottom: '0.75rem',
                  lineHeight: '1.5'
                }}>
                  {platform.description}
                </p>

                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.35rem', 
                  marginBottom: '1rem' 
                }}>
                  {platform.subjects.slice(0, 5).map(subj => {
                    const subject = SUBJECTS.find(s => s.id === subj);
                    return (
                      <span 
                        key={subj}
                        style={{ 
                          fontSize: '0.7rem', 
                          padding: '0.15rem 0.4rem',
                          background: 'var(--bg-subtle)',
                          borderRadius: '4px',
                          color: 'var(--text-muted)'
                        }}
                      >
                        {subject?.name || subj}
                      </span>
                    );
                  })}
                  {platform.subjects.length > 5 && (
                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '0.15rem 0.4rem',
                      color: 'var(--text-muted)'
                    }}>
                      +{platform.subjects.length - 5} mehr
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  <span>Klasse {Math.min(...platform.grades)}-{Math.max(...platform.grades)}</span>
                  <span>•</span>
                  <span>
                    {platform.schoolTypes.includes('rs+') && platform.schoolTypes.includes('gym') 
                      ? 'RS+ & Gym' 
                      : platform.schoolTypes.includes('rs+') ? 'RS+' : 'Gymnasium'}
                  </span>
                </div>

                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  data-testid={`open-${platform.id}`}
                >
                  <ExternalLink size={14} />
                  Zur Plattform
                </a>
              </div>
            ))}
          </div>

          {filteredPlatforms.length === 0 && (
            <div className="empty-state">
              <Search size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <h3 className="empty-state-title">Keine Treffer</h3>
              <p className="empty-state-text">
                Passen Sie die Filter an, um passende Lernplattformen zu finden.
              </p>
              <button onClick={clearFilters} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                Filter zurücksetzen
              </button>
            </div>
          )}
        </>
      )}

      {/* Schulbuchverlage */}
      {activeTab === 'publishers' && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Digitale Zusatzmaterialien, Online-Übungen und Schülerhilfen direkt von den großen deutschen Schulbuchverlagen.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '1rem' 
          }}>
            {PUBLISHERS.map(publisher => (
              <div 
                key={publisher.id} 
                className="card" 
                style={{ padding: '1.25rem' }}
                data-testid={`publisher-${publisher.id}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '2rem' }}>{publisher.logo}</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                    {publisher.name}
                  </h3>
                </div>

                <p style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--text-muted)', 
                  marginBottom: '1rem',
                  lineHeight: '1.5'
                }}>
                  {publisher.description}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <a
                    href={publisher.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <ExternalLink size={14} />
                    Zur Website
                  </a>
                  <a
                    href={publisher.materialsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <BookOpen size={14} />
                    Materialien
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div style={{ 
            marginTop: '2rem',
            padding: '1rem 1.25rem',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '8px',
            borderLeft: '3px solid var(--primary)'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={18} />
              Tipp für Lehrkräfte
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Die meisten Verlage bieten kostenlose Probezugänge für Lehrkräfte an. 
              Registrieren Sie sich mit Ihrer Schuladresse, um vollen Zugriff auf digitale Lehrermaterialien zu erhalten.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default LearningResourcesPage;
