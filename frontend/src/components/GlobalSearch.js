import { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, BookOpen, FileCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GlobalSearch = ({ onNavigate }) => {
  const { authAxios } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = useCallback(async (q) => {
    if (q.length < 2) { 
      setResults(null); 
      return; 
    }
    try {
      const response = await authAxios.get(`/search?q=${encodeURIComponent(q)}`);
      setResults(response.data);
      setShowResults(true);
    } catch (error) { 
      console.error('Search error:', error); 
    }
  }, [authAxios]);

  useEffect(() => {
    const timer = setTimeout(() => { 
      if (query) handleSearch(query); 
    }, 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const totalResults = results ? 
    results.lessons.length + results.classes.length + results.templates.length + results.todos.length : 0;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: 'var(--bg-subtle)', 
        borderRadius: '8px', 
        padding: '0 0.75rem' 
      }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Suchen... (Strg+K)" 
          value={query}
          onChange={(e) => setQuery(e.target.value)} 
          onFocus={() => query && setShowResults(true)}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            padding: '0.5rem', 
            color: 'var(--text-default)', 
            width: '200px', 
            outline: 'none' 
          }}
          data-testid="global-search-input" 
        />
      </div>
      
      {showResults && results && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 29 }} 
            onClick={() => setShowResults(false)} 
          />
          <div className="dropdown-menu" style={{ 
            width: '400px', 
            maxHeight: '400px', 
            overflow: 'auto', 
            left: 0, 
            right: 'auto' 
          }}>
            {totalResults === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Keine Ergebnisse
              </div>
            ) : (
              <>
                {results.lessons.length > 0 && (
                  <div>
                    <div style={{ 
                      padding: '0.5rem 1rem', 
                      fontSize: '0.7rem', 
                      fontWeight: '600', 
                      color: 'var(--text-disabled)', 
                      textTransform: 'uppercase' 
                    }}>
                      Stunden
                    </div>
                    {results.lessons.map(l => (
                      <div 
                        key={l.id} 
                        className="dropdown-item" 
                        onClick={() => { onNavigate('calendar'); setShowResults(false); }}
                      >
                        <Calendar size={14} /> 
                        <span>{l.topic || 'Ohne Thema'}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {l.date}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {results.classes.length > 0 && (
                  <div>
                    <div style={{ 
                      padding: '0.5rem 1rem', 
                      fontSize: '0.7rem', 
                      fontWeight: '600', 
                      color: 'var(--text-disabled)', 
                      textTransform: 'uppercase' 
                    }}>
                      Klassen
                    </div>
                    {results.classes.map(c => (
                      <div 
                        key={c.id} 
                        className="dropdown-item" 
                        onClick={() => { onNavigate('classes'); setShowResults(false); }}
                      >
                        <BookOpen size={14} /> 
                        <span>{c.name} - {c.subject}</span>
                      </div>
                    ))}
                  </div>
                )}
                {results.templates.length > 0 && (
                  <div>
                    <div style={{ 
                      padding: '0.5rem 1rem', 
                      fontSize: '0.7rem', 
                      fontWeight: '600', 
                      color: 'var(--text-disabled)', 
                      textTransform: 'uppercase' 
                    }}>
                      Vorlagen
                    </div>
                    {results.templates.map(t => (
                      <div 
                        key={t.id} 
                        className="dropdown-item" 
                        onClick={() => { onNavigate('templates'); setShowResults(false); }}
                      >
                        <FileCheck size={14} /> 
                        <span>{t.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GlobalSearch;
