import { useState } from 'react';
import { Search, Image, Video, BookOpen, ExternalLink, Download, RefreshCw, Languages, GraduationCap, Copy, Check, ImageOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

// Image component with error fallback
const ImageWithFallback = ({ src, alt, source }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError || !src) {
    return (
      <div style={{ 
        width: '100%', 
        height: '180px', 
        background: 'var(--bg-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '0.5rem',
        color: 'var(--text-muted)'
      }}>
        <ImageOff size={32} />
        <span style={{ fontSize: '0.8rem' }}>{source || 'Bild nicht verfügbar'}</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '180px', background: 'var(--bg-subtle)' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <RefreshCw size={24} className="spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      )}
      <img 
        src={src} 
        alt={alt}
        style={{ 
          width: '100%', 
          height: '180px', 
          objectFit: 'cover',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};

const ResearchPage = () => {
  const { authAxios } = useAuth();
  const [activeTab, setActiveTab] = useState('images');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [academicSource, setAcademicSource] = useState('openalex');
  const [translatingId, setTranslatingId] = useState(null);
  const [translations, setTranslations] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Bitte Suchbegriff eingeben');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      let endpoint = '';
      if (activeTab === 'images') {
        endpoint = `/research/images?query=${encodeURIComponent(searchQuery)}`;
      } else if (activeTab === 'videos') {
        endpoint = `/research/videos?query=${encodeURIComponent(searchQuery)}`;
      } else if (activeTab === 'papers') {
        endpoint = `/research/papers?query=${encodeURIComponent(searchQuery)}&source=${academicSource}`;
      }

      const response = await authAxios.get(endpoint);
      
      if (response.data.error && !response.data.search_url) {
        toast.error(response.data.error);
      }
      
      setResults(response.data.results || []);
      
      // Store search URL for videos fallback
      if (response.data.search_url) {
        setResults([{ type: 'youtube_fallback', search_url: response.data.search_url }]);
      }
      
      if (response.data.results?.length === 0 && !response.data.search_url) {
        toast.info('Keine Ergebnisse gefunden');
      }
    } catch (error) {
      toast.error('Fehler bei der Suche');
      console.error(error);
    }

    setLoading(false);
  };

  const handleTranslate = async (id, text) => {
    if (translations[id]) {
      // Already translated, just toggle visibility
      return;
    }

    setTranslatingId(id);

    try {
      const response = await authAxios.post(`/research/translate?text=${encodeURIComponent(text)}&target_lang=de`);
      
      if (response.data.translated) {
        setTranslations(prev => ({ ...prev, [id]: response.data.translated }));
        toast.success('Übersetzung erstellt');
      } else if (response.data.error) {
        toast.error('Übersetzung fehlgeschlagen');
      }
    } catch (error) {
      toast.error('Übersetzungsfehler');
      console.error(error);
    }

    setTranslatingId(null);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('In Zwischenablage kopiert');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tabs = [
    { id: 'images', label: 'Bilder', icon: Image },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'papers', label: 'Fachtexte', icon: GraduationCap }
  ];

  return (
    <div className="page-content">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Manrope, sans-serif', marginBottom: '0.5rem' }}>
          Recherche
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Suchen Sie nach Unterrichtsmaterialien, Videos und wissenschaftlichen Texten
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setResults([]); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label className="form-label">
              {activeTab === 'images' && 'Bildsuche (z.B. "Zelle Biologie", "Mittelalter Burg")'}
              {activeTab === 'videos' && 'Videosuche (z.B. "Bruchrechnung erklärt", "Fotosynthese")'}
              {activeTab === 'papers' && 'Fachtextsuche (z.B. "climate change education", "mathematics learning")'}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder={activeTab === 'papers' ? 'Englische Suchbegriffe empfohlen...' : 'Suchbegriff eingeben...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1 }}
              />
              <button 
                className="btn btn-primary" 
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? <RefreshCw size={18} className="spin" /> : <Search size={18} />}
                Suchen
              </button>
            </div>
          </div>

          {/* Academic source selector */}
          {activeTab === 'papers' && (
            <div style={{ minWidth: '200px' }}>
              <label className="form-label">Datenbank</label>
              <select
                className="form-input"
                value={academicSource}
                onChange={(e) => setAcademicSource(e.target.value)}
              >
                <option value="semantic_scholar">Semantic Scholar</option>
                <option value="openalex">OpenAlex</option>
              </select>
            </div>
          )}
        </div>

        {activeTab === 'papers' && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            background: 'rgba(59, 130, 246, 0.1)', 
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}>
            <strong>Tipp:</strong> Wissenschaftliche Datenbanken enthalten meist englische Texte. 
            Nutzen Sie die <Languages size={14} style={{ display: 'inline', margin: '0 4px' }} />Übersetzen-Funktion für deutsche Zusammenfassungen.
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <span className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      ) : results.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-muted)' }}>
            {results.length} Ergebnisse gefunden
          </h3>

          {/* Image Results */}
          {activeTab === 'images' && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '1rem' 
            }}>
              {results.map(image => (
                <div key={image.id} className="card" style={{ overflow: 'hidden', padding: 0 }} data-testid={`image-card-${image.id}`}>
                  {image.is_link ? (
                    // Link to external image search
                    <a href={image.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }} data-testid="image-search-link">
                      <div style={{ 
                        width: '100%', 
                        height: '180px', 
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--bg-subtle) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}>
                        <Search size={48} style={{ color: 'white', opacity: 0.9 }} />
                        <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 500 }}>
                          {image.source}
                        </span>
                      </div>
                    </a>
                  ) : (
                    <ImageWithFallback 
                      src={image.thumb || image.url} 
                      alt={image.description || 'Bild'}
                      source={image.source}
                    />
                  )}
                  <div style={{ padding: '1rem' }}>
                    <p style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--text-default)',
                      marginBottom: '0.5rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {image.description || 'Kein Titel'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      {image.author} • {image.source}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a 
                        href={image.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                        data-testid="view-image-btn"
                      >
                        <ExternalLink size={14} /> {image.is_link ? 'Suchen' : 'Ansehen'}
                      </a>
                      {!image.is_link && image.download_url && (
                        <a 
                          href={image.download_url} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1 }}
                          data-testid="download-image-btn"
                        >
                          <Download size={14} /> Download
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Video Results */}
          {activeTab === 'videos' && (
            <>
              {results.length > 0 && !results[0]?.type ? (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                  gap: '1rem' 
                }}>
                  {results.map(video => (
                    <div key={video.id} className="card" style={{ overflow: 'hidden', padding: 0 }}>
                      <a href={video.url} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={video.thumbnail}
                          alt={video.title}
                          style={{ 
                            width: '100%', 
                            height: '180px', 
                            objectFit: 'cover',
                            background: 'var(--bg-subtle)'
                          }}
                          loading="lazy"
                        />
                      </a>
                      <div style={{ padding: '1rem' }}>
                        <h4 style={{ 
                          fontSize: '0.95rem', 
                          fontWeight: '600',
                          marginBottom: '0.5rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {video.title}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                          {video.channel}
                        </p>
                        <a 
                          href={video.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ width: '100%' }}
                        >
                          <Video size={14} /> Auf YouTube ansehen
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                  <Video size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <h3 style={{ marginBottom: '1rem' }}>YouTube-Suche</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Klicken Sie den Button, um direkt auf YouTube nach "{searchQuery || 'Ihrem Thema'}" zu suchen:
                  </p>
                  <a 
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent((searchQuery || '') + ' Unterricht Schule')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    <ExternalLink size={18} /> Auf YouTube suchen
                  </a>
                  <div style={{ marginTop: '2rem', textAlign: 'left' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                      Empfohlene Bildungskanäle:
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {[
                        { name: 'simpleclub', topic: 'MINT' },
                        { name: 'MrWissen2go', topic: 'Geschichte' },
                        { name: 'Duden Learnattack', topic: 'Alle Fächer' },
                        { name: 'musstewissen', topic: 'Deutsch/Mathe' }
                      ].map(channel => (
                        <a 
                          key={channel.name}
                          href={`https://www.youtube.com/results?search_query=${channel.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          {channel.name} ({channel.topic})
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Academic Paper Results */}
          {activeTab === 'papers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {results.map(paper => (
                <div key={paper.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        {paper.title}
                      </h4>
                      <div style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        fontSize: '0.8rem', 
                        color: 'var(--text-muted)',
                        marginBottom: '0.75rem',
                        flexWrap: 'wrap'
                      }}>
                        <span>{paper.authors}</span>
                        {paper.year && <span>• {paper.year}</span>}
                        <span>• {paper.citations} Zitierungen</span>
                        <span style={{ 
                          background: paper.source === 'Semantic Scholar' ? '#6366f1' : '#10b981',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem'
                        }}>
                          {paper.source}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Abstract */}
                  {paper.abstract && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: 'var(--text-default)',
                        lineHeight: '1.6',
                        padding: '0.75rem',
                        background: 'var(--bg-subtle)',
                        borderRadius: '8px',
                        borderLeft: '3px solid var(--primary)'
                      }}>
                        <strong style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>
                          Abstract (Original):
                        </strong>
                        {paper.abstract}...
                      </div>

                      {/* Translation */}
                      {translations[paper.id] && (
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: 'var(--text-default)',
                          lineHeight: '1.6',
                          padding: '0.75rem',
                          background: 'rgba(34, 197, 94, 0.1)',
                          borderRadius: '8px',
                          borderLeft: '3px solid var(--success)',
                          marginTop: '0.5rem'
                        }}>
                          <strong style={{ color: 'var(--success)', fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>
                            🇩🇪 Deutsche Übersetzung:
                          </strong>
                          {translations[paper.id]}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {paper.url && (
                      <a 
                        href={paper.url.startsWith('http') ? paper.url : `https://doi.org/${paper.url}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                      >
                        <ExternalLink size={14} /> Artikel öffnen
                      </a>
                    )}
                    {paper.pdf_url && (
                      <a 
                        href={paper.pdf_url}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                      >
                        <Download size={14} /> PDF (Open Access)
                      </a>
                    )}
                    {paper.abstract && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleTranslate(paper.id, paper.abstract)}
                        disabled={translatingId === paper.id}
                      >
                        {translatingId === paper.id ? (
                          <RefreshCw size={14} className="spin" />
                        ) : (
                          <Languages size={14} />
                        )}
                        {translations[paper.id] ? 'Übersetzt' : 'Übersetzen'}
                      </button>
                    )}
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleCopy(
                        `${paper.title}\n${paper.authors} (${paper.year})\n${paper.url || ''}`,
                        paper.id
                      )}
                    >
                      {copiedId === paper.id ? <Check size={14} /> : <Copy size={14} />}
                      Zitieren
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && searchQuery && (
        <div className="empty-state">
          <Search size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h3 className="empty-state-title">Keine Ergebnisse</h3>
          <p className="empty-state-text">
            Versuchen Sie andere Suchbegriffe oder wechseln Sie die Datenbank.
          </p>
        </div>
      )}

      {/* Initial State */}
      {!loading && results.length === 0 && !searchQuery && (
        <div className="empty-state">
          <div style={{ 
            display: 'flex', 
            gap: '2rem', 
            justifyContent: 'center',
            marginBottom: '2rem',
            opacity: 0.5
          }}>
            <Image size={48} />
            <Video size={48} />
            <GraduationCap size={48} />
          </div>
          <h3 className="empty-state-title">Recherche starten</h3>
          <p className="empty-state-text">
            Geben Sie einen Suchbegriff ein, um Bilder, Videos oder wissenschaftliche Texte zu finden.
          </p>
        </div>
      )}
    </div>
  );
};

export default ResearchPage;
