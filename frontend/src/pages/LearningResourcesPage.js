import { useState, useMemo } from 'react';
import { 
  ExternalLink, Filter, BookOpen, Globe, Star, Euro, Search, X, 
  ChevronDown, ChevronRight, Sparkles, Calculator, Languages, FlaskConical, GraduationCap
} from 'lucide-react';

// Kategorien
const CATEGORIES = [
  { id: 'all', name: 'Alle', icon: Globe },
  { id: 'mathe', name: 'Mathe', icon: Calculator },
  { id: 'sprachen', name: 'Sprachen', icon: Languages },
  { id: 'mint', name: 'MINT', icon: FlaskConical },
  { id: 'allgemein', name: 'Allgemein', icon: BookOpen }
];

// Lernplattformen - optimiert für RS+
const LEARNING_PLATFORMS = [
  // RS+ Empfehlungen (oben)
  {
    id: 'anton',
    name: 'Anton',
    shortDesc: 'Interaktive Übungen, spielerisch',
    url: 'https://anton.app',
    category: 'allgemein',
    subjects: ['mathe', 'deutsch', 'englisch', 'bio'],
    grades: [5, 6, 7, 8, 9, 10],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free',
    difficulty: 'leicht',
    rsPlus: true,
    highlight: true
  },
  {
    id: 'schlaukopf',
    name: 'Schlaukopf',
    shortDesc: 'Quiz nach Schulart & Klasse',
    url: 'https://www.schlaukopf.de/realschule/',
    category: 'allgemein',
    subjects: ['mathe', 'deutsch', 'englisch', 'bio', 'physik', 'chemie', 'geschichte'],
    grades: [5, 6, 7, 8, 9, 10],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free',
    difficulty: 'leicht',
    rsPlus: true,
    highlight: true
  },
  {
    id: 'learningapps',
    name: 'LearningApps',
    shortDesc: 'Fertige Übungen zu allen Themen',
    url: 'https://learningapps.org',
    category: 'allgemein',
    subjects: ['mathe', 'deutsch', 'englisch', 'bio', 'physik', 'chemie', 'geschichte', 'erdkunde'],
    grades: [5, 6, 7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free',
    difficulty: 'leicht',
    rsPlus: true,
    highlight: true
  },
  {
    id: 'sofatutor',
    name: 'Sofatutor',
    shortDesc: 'Videos + Arbeitsblätter',
    url: 'https://www.sofatutor.com',
    category: 'allgemein',
    subjects: ['mathe', 'deutsch', 'englisch', 'bio', 'physik', 'chemie'],
    grades: [5, 6, 7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'paid',
    difficulty: 'mittel',
    rsPlus: true
  },
  // Mathe
  {
    id: 'mathepower',
    name: 'Mathepower',
    shortDesc: 'Aufgaben mit Lösungsweg',
    url: 'https://www.mathepower.com',
    category: 'mathe',
    subjects: ['mathe'],
    grades: [5, 6, 7, 8, 9, 10],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free',
    difficulty: 'leicht',
    rsPlus: true
  },
  {
    id: 'mathebibel',
    name: 'Mathebibel',
    shortDesc: 'Erklärungen + Übungen',
    url: 'https://www.mathebibel.de',
    category: 'mathe',
    subjects: ['mathe'],
    grades: [5, 6, 7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free',
    difficulty: 'mittel',
    rsPlus: true
  },
  {
    id: 'geogebra',
    name: 'GeoGebra',
    shortDesc: 'Geometrie & Grafik',
    url: 'https://www.geogebra.org',
    category: 'mathe',
    subjects: ['mathe'],
    grades: [7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free',
    difficulty: 'mittel'
  },
  {
    id: 'serlo-mathe',
    name: 'Serlo Mathe',
    shortDesc: 'Freie Lernplattform',
    url: 'https://de.serlo.org/mathe',
    category: 'mathe',
    subjects: ['mathe'],
    grades: [5, 6, 7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free',
    difficulty: 'mittel'
  },
  // Sprachen
  {
    id: 'duolingo',
    name: 'Duolingo',
    shortDesc: 'Spielerisch Sprachen lernen',
    url: 'https://www.duolingo.com',
    category: 'sprachen',
    subjects: ['englisch', 'franzoesisch', 'spanisch'],
    grades: [5, 6, 7, 8, 9, 10],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free',
    difficulty: 'leicht',
    rsPlus: true,
    highlight: true
  },
  {
    id: 'leo',
    name: 'LEO Wörterbuch',
    shortDesc: 'Vokabeln nachschlagen',
    url: 'https://www.leo.org',
    category: 'sprachen',
    subjects: ['englisch', 'franzoesisch', 'spanisch'],
    grades: [5, 6, 7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free',
    difficulty: 'leicht',
    rsPlus: true
  },
  {
    id: 'englisch-hilfen',
    name: 'Englisch-Hilfen',
    shortDesc: 'Grammatik + Übungen',
    url: 'https://www.englisch-hilfen.de',
    category: 'sprachen',
    subjects: ['englisch'],
    grades: [5, 6, 7, 8, 9, 10],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free',
    difficulty: 'leicht',
    rsPlus: true
  },
  {
    id: 'phase6',
    name: 'Phase6',
    shortDesc: 'Vokabeltrainer',
    url: 'https://www.phase-6.de',
    category: 'sprachen',
    subjects: ['englisch', 'franzoesisch', 'spanisch', 'latein'],
    grades: [5, 6, 7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'paid',
    difficulty: 'leicht'
  },
  // MINT
  {
    id: 'planet-schule',
    name: 'Planet Schule',
    shortDesc: 'Lernvideos WDR/SWR',
    url: 'https://www.planet-schule.de',
    category: 'mint',
    subjects: ['bio', 'physik', 'chemie'],
    grades: [5, 6, 7, 8, 9, 10],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free',
    difficulty: 'leicht',
    rsPlus: true
  },
  {
    id: 'leifiphysik',
    name: 'Leifi Physik',
    shortDesc: 'Physik erklärt',
    url: 'https://www.leifiphysik.de',
    category: 'mint',
    subjects: ['physik'],
    grades: [7, 8, 9, 10, 11, 12, 13],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free',
    difficulty: 'mittel'
  },
  {
    id: 'chemie-lernprogramme',
    name: 'Chemie.de',
    shortDesc: 'Chemie Grundlagen',
    url: 'https://www.chemie.de/lexikon/',
    category: 'mint',
    subjects: ['chemie'],
    grades: [7, 8, 9, 10],
    schoolTypes: ['rs+', 'gym'],
    cost: 'free',
    difficulty: 'mittel',
    rsPlus: true
  },
  // Gymnasium-lastig (unten)
  {
    id: 'simpleclub',
    name: 'simpleclub',
    shortDesc: 'YouTube-Style Videos',
    url: 'https://simpleclub.com',
    category: 'allgemein',
    subjects: ['mathe', 'bio', 'physik', 'chemie', 'geschichte'],
    grades: [8, 9, 10, 11, 12, 13],
    schoolTypes: ['gym'],
    cost: 'paid',
    difficulty: 'mittel'
  },
  {
    id: 'studysmarter',
    name: 'StudySmarter',
    shortDesc: 'KI-Karteikarten',
    url: 'https://www.studysmarter.de',
    category: 'allgemein',
    subjects: ['mathe', 'deutsch', 'englisch', 'bio', 'physik', 'chemie'],
    grades: [10, 11, 12, 13],
    schoolTypes: ['gym'],
    cost: 'paid',
    difficulty: 'schwer'
  },
  {
    id: 'khan-academy',
    name: 'Khan Academy',
    shortDesc: 'Kurse + Videos (DE)',
    url: 'https://de.khanacademy.org',
    category: 'mint',
    subjects: ['mathe', 'bio', 'physik', 'chemie'],
    grades: [9, 10, 11, 12, 13],
    schoolTypes: ['gym'],
    cost: 'free',
    difficulty: 'schwer'
  }
];

// Schulbuchverlage mit Deep-Links
const PUBLISHERS = [
  {
    id: 'cornelsen',
    name: 'Cornelsen',
    rsLink: 'https://www.cornelsen.de/empfehlungen/realschule',
    gymLink: 'https://www.cornelsen.de/empfehlungen/gymnasium'
  },
  {
    id: 'klett',
    name: 'Klett',
    rsLink: 'https://www.klett.de/lehrwerk?schulart=realschule',
    gymLink: 'https://www.klett.de/lehrwerk?schulart=gymnasium'
  },
  {
    id: 'westermann',
    name: 'Westermann',
    rsLink: 'https://www.westermann.de/suche?schulform=Realschule',
    gymLink: 'https://www.westermann.de/suche?schulform=Gymnasium'
  },
  {
    id: 'ccbuchner',
    name: 'C.C.Buchner',
    rsLink: 'https://www.ccbuchner.de/produkte?schulart=realschule',
    gymLink: 'https://www.ccbuchner.de/produkte?schulart=gymnasium'
  },
  {
    id: 'stark',
    name: 'Stark',
    rsLink: 'https://www.stark-verlag.de/realschule',
    gymLink: 'https://www.stark-verlag.de/gymnasium'
  }
];

// Fächer für Filter
const SUBJECTS = [
  { id: 'mathe', name: 'Mathe' },
  { id: 'deutsch', name: 'Deutsch' },
  { id: 'englisch', name: 'Englisch' },
  { id: 'franzoesisch', name: 'Französisch' },
  { id: 'bio', name: 'Biologie' },
  { id: 'physik', name: 'Physik' },
  { id: 'chemie', name: 'Chemie' },
  { id: 'geschichte', name: 'Geschichte' }
];

const DifficultyBadge = ({ level }) => {
  const colors = {
    leicht: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' },
    mittel: { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' },
    schwer: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }
  };
  const c = colors[level] || colors.mittel;
  return (
    <span style={{ 
      fontSize: '0.65rem', 
      padding: '0.1rem 0.35rem',
      background: c.bg,
      color: c.color,
      borderRadius: '3px',
      fontWeight: '500'
    }}>
      {level}
    </span>
  );
};

const LearningResourcesPage = () => {
  const [filters, setFilters] = useState({
    category: 'all',
    schoolType: 'rs+',
    grade: '',
    subject: '',
    cost: ''
  });
  const [activeTab, setActiveTab] = useState('platforms');
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  // Gefilterte Plattformen
  const filteredPlatforms = useMemo(() => {
    let results = LEARNING_PLATFORMS.filter(p => {
      if (filters.category !== 'all' && p.category !== filters.category) return false;
      if (filters.schoolType && !p.schoolTypes.includes(filters.schoolType)) return false;
      if (filters.grade && !p.grades.includes(parseInt(filters.grade))) return false;
      if (filters.subject && !p.subjects.includes(filters.subject)) return false;
      if (filters.cost && p.cost !== filters.cost) return false;
      return true;
    });

    // RS+ priorisieren wenn ausgewählt
    if (filters.schoolType === 'rs+') {
      results.sort((a, b) => {
        if (a.rsPlus && !b.rsPlus) return -1;
        if (!a.rsPlus && b.rsPlus) return 1;
        if (a.highlight && !b.highlight) return -1;
        if (!a.highlight && b.highlight) return 1;
        return 0;
      });
    }

    return results;
  }, [filters]);

  // Angezeigte Plattformen (begrenzt oder alle)
  const displayedPlatforms = showAllPlatforms ? filteredPlatforms : filteredPlatforms.slice(0, 8);

  const availableGrades = filters.schoolType === 'rs+' ? [5,6,7,8,9,10] : [5,6,7,8,9,10,11,12,13];

  return (
    <div className="page-content">
      {/* Header - kompakt */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
          Lernprogramme
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Lernhilfen für Schülerinnen und Schüler
        </p>
      </div>

      {/* Tabs - klein */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setActiveTab('platforms')}
          style={{ 
            padding: '0.35rem 0.75rem', 
            fontSize: '0.8rem',
            background: activeTab === 'platforms' ? 'var(--primary)' : 'var(--bg-subtle)',
            color: activeTab === 'platforms' ? 'white' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Lernplattformen
        </button>
        <button
          onClick={() => setActiveTab('publishers')}
          style={{ 
            padding: '0.35rem 0.75rem', 
            fontSize: '0.8rem',
            background: activeTab === 'publishers' ? 'var(--primary)' : 'var(--bg-subtle)',
            color: activeTab === 'publishers' ? 'white' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Schulbuchverlage
        </button>
      </div>

      {/* Lernplattformen */}
      {activeTab === 'platforms' && (
        <>
          {/* Filter - kompakt in einer Zeile */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginBottom: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            {/* Schulart */}
            <select
              value={filters.schoolType}
              onChange={(e) => setFilters({ ...filters, schoolType: e.target.value, grade: '' })}
              style={{ 
                padding: '0.3rem 0.5rem', 
                fontSize: '0.75rem',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                color: 'var(--text-default)'
              }}
            >
              <option value="rs+">RS+</option>
              <option value="gym">Gymnasium</option>
              <option value="">Alle</option>
            </select>

            {/* Klasse */}
            <select
              value={filters.grade}
              onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
              style={{ 
                padding: '0.3rem 0.5rem', 
                fontSize: '0.75rem',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                color: 'var(--text-default)'
              }}
            >
              <option value="">Klasse</option>
              {availableGrades.map(g => (
                <option key={g} value={g}>Kl. {g}</option>
              ))}
            </select>

            {/* Fach */}
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              style={{ 
                padding: '0.3rem 0.5rem', 
                fontSize: '0.75rem',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                color: 'var(--text-default)'
              }}
            >
              <option value="">Fach</option>
              {SUBJECTS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Kosten */}
            <select
              value={filters.cost}
              onChange={(e) => setFilters({ ...filters, cost: e.target.value })}
              style={{ 
                padding: '0.3rem 0.5rem', 
                fontSize: '0.75rem',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                color: 'var(--text-default)'
              }}
            >
              <option value="">Kosten</option>
              <option value="free">Kostenlos</option>
              <option value="paid">Kostenpflichtig</option>
            </select>

            {/* Kategorie-Buttons */}
            <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilters({ ...filters, category: cat.id })}
                  style={{ 
                    padding: '0.25rem 0.5rem', 
                    fontSize: '0.7rem',
                    background: filters.category === cat.id ? 'var(--primary)' : 'transparent',
                    color: filters.category === cat.id ? 'white' : 'var(--text-muted)',
                    border: filters.category === cat.id ? 'none' : '1px solid var(--border-default)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  <cat.icon size={12} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Ergebnis-Zähler */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            {filteredPlatforms.length} Treffer
            {filters.schoolType === 'rs+' && <span style={{ color: 'var(--success)', marginLeft: '0.5rem' }}>• RS+ priorisiert</span>}
          </div>

          {/* Plattformen Grid - kompakt */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: '0.75rem' 
          }}>
            {displayedPlatforms.map(p => (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <div 
                  style={{ 
                    background: 'var(--bg-subtle)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    border: p.rsPlus && filters.schoolType === 'rs+' ? '1px solid var(--success)' : '1px solid var(--border-default)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  className="hover-card"
                >
                  {/* RS+ Badge */}
                  {p.rsPlus && filters.schoolType === 'rs+' && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '-0.4rem', 
                      right: '0.5rem',
                      background: 'var(--success)',
                      color: 'white',
                      fontSize: '0.6rem',
                      padding: '0.1rem 0.3rem',
                      borderRadius: '3px',
                      fontWeight: '600'
                    }}>
                      RS+ Top
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{p.name}</span>
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                      {p.cost === 'free' ? (
                        <Sparkles size={12} style={{ color: 'var(--success)' }} />
                      ) : (
                        <Euro size={12} style={{ color: 'var(--warning)' }} />
                      )}
                      <DifficultyBadge level={p.difficulty} />
                    </div>
                  </div>

                  {/* Beschreibung */}
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-muted)', 
                    marginBottom: '0.5rem',
                    lineHeight: '1.3'
                  }}>
                    {p.shortDesc}
                  </p>

                  {/* Footer */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span>Kl. {Math.min(...p.grades)}-{Math.max(...p.grades)}</span>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.2rem',
                      color: 'var(--primary)'
                    }}>
                      Öffnen <ExternalLink size={10} />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Mehr anzeigen */}
          {filteredPlatforms.length > 8 && !showAllPlatforms && (
            <button
              onClick={() => setShowAllPlatforms(true)}
              style={{ 
                margin: '1rem auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.4rem 0.75rem',
                fontSize: '0.75rem',
                background: 'transparent',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              +{filteredPlatforms.length - 8} weitere anzeigen <ChevronDown size={12} />
            </button>
          )}

          {filteredPlatforms.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <Search size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.85rem' }}>Keine Treffer. Filter anpassen.</p>
            </div>
          )}
        </>
      )}

      {/* Schulbuchverlage */}
      {activeTab === 'publishers' && (
        <>
          {/* Schulart-Auswahl */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', marginRight: '0.5rem', color: 'var(--text-muted)' }}>Materialien für:</span>
            <select
              value={filters.schoolType || 'rs+'}
              onChange={(e) => setFilters({ ...filters, schoolType: e.target.value })}
              style={{ 
                padding: '0.3rem 0.5rem', 
                fontSize: '0.75rem',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: '4px',
                color: 'var(--text-default)'
              }}
            >
              <option value="rs+">RS+ / Realschule</option>
              <option value="gym">Gymnasium</option>
            </select>
          </div>

          {/* Verlage - kompakt */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
            gap: '0.75rem' 
          }}>
            {PUBLISHERS.map(pub => (
              <a
                key={pub.id}
                href={filters.schoolType === 'gym' ? pub.gymLink : pub.rsLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div style={{ 
                  background: 'var(--bg-subtle)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  border: '1px solid var(--border-default)',
                  textAlign: 'center',
                  transition: 'transform 0.15s',
                  cursor: 'pointer'
                }}
                className="hover-card"
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.3rem', color: 'var(--text-default)' }}>
                    {pub.name}
                  </div>
                  <div style={{ 
                    fontSize: '0.65rem', 
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.2rem'
                  }}>
                    {filters.schoolType === 'gym' ? 'Gym' : 'RS+'}-Materialien <ExternalLink size={10} />
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Info */}
          <div style={{ 
            marginTop: '1.5rem',
            padding: '0.75rem',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <strong>Tipp:</strong> Die Links führen direkt zu den {filters.schoolType === 'gym' ? 'Gymnasium' : 'Realschule'}-Materialien des jeweiligen Verlags.
          </div>
        </>
      )}

      {/* CSS für Hover-Effekt */}
      <style>{`
        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
};

export default LearningResourcesPage;
