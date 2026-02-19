import { useState } from 'react';
import { FileText, Sparkles, RefreshCw, Download, ChevronRight, Target } from 'lucide-react';
import { toast } from 'sonner';
import { API, MATERIAL_TYPEN } from './constants';

export const MaterialGenerator = ({
  selectedThema,
  selectedMaterialTyp,
  setSelectedMaterialTyp,
  generatedMaterial,
  generatingMaterial,
  generiereMaterial,
  selectedKlasse,
  selectedNiveau,
  // NEU: Stunden für Auswahl
  stunden = [],
  unterrichtsreihe = null
}) => {
  // Gewählte Stunde (0 = alle/Überblick, 1-n = spezifische Stunde)
  const [selectedStunde, setSelectedStunde] = useState(0);

  const handleGeneriereMaterial = () => {
    // Stunden-Info an generiereMaterial übergeben
    const stundeInfo = selectedStunde > 0 ? stunden[selectedStunde - 1] : null;
    generiereMaterial(stundeInfo);
  };

  const downloadWord = async () => {
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
  };

  const downloadQRCode = async () => {
    try {
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
  };

  // Info zur gewählten Stunde
  const selectedStundeInfo = selectedStunde > 0 ? stunden[selectedStunde - 1] : null;

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} />
          Material erstellen
        </h3>
        <button
          onClick={handleGeneriereMaterial}
          disabled={!selectedThema || generatingMaterial}
          className="btn btn-primary btn-sm"
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
          data-testid="generate-material-btn"
        >
          {generatingMaterial ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
          Erstellen
        </button>
      </div>

      {/* NEU: Stunden-Auswahl wenn Unterrichtsreihe vorhanden */}
      {stunden.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)', 
            display: 'block', 
            marginBottom: '0.35rem' 
          }}>
            Für welche Stunde?
          </label>
          <select
            value={selectedStunde}
            onChange={(e) => setSelectedStunde(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '0.8rem',
              borderRadius: '6px',
              border: '1px solid var(--border-default)',
              background: selectedStunde > 0 ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-subtle)',
              color: 'var(--text-default)'
            }}
            data-testid="stunde-select"
          >
            <option value={0}>Gesamte Unterrichtsreihe (Überblick)</option>
            {stunden.map((stunde, idx) => (
              <option key={idx} value={idx + 1}>
                Stunde {stunde.nummer}: {stunde.titel}
              </option>
            ))}
          </select>
          
          {/* Info zur gewählten Stunde */}
          {selectedStundeInfo && (
            <div style={{ 
              marginTop: '0.5rem', 
              padding: '0.5rem', 
              background: 'rgba(139, 92, 246, 0.1)', 
              borderRadius: '6px',
              fontSize: '0.75rem'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: 'var(--primary)' }}>
                Stunde {selectedStundeInfo.nummer}: {selectedStundeInfo.titel}
              </div>
              {selectedStundeInfo.lernziel && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.25rem',
                  color: '#22c55e',
                  fontSize: '0.7rem'
                }}>
                  <Target size={12} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                  {selectedStundeInfo.lernziel}
                </div>
              )}
              {selectedStundeInfo.inhalt && (
                <div style={{ 
                  marginTop: '0.25rem', 
                  color: 'var(--text-muted)',
                  fontSize: '0.7rem'
                }}>
                  {selectedStundeInfo.inhalt?.substring(0, 100)}...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Material-Typ Auswahl */}
      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {MATERIAL_TYPEN.map(typ => (
          <button
            key={typ.id}
            onClick={() => setSelectedMaterialTyp(typ.id)}
            data-testid={`material-type-${typ.id}`}
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
            marginBottom: '0.75rem',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
              {generatedMaterial.material.titel}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={downloadWord}
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
                onClick={downloadQRCode}
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
          </div>

          {/* Stunden-Badge wenn für spezifische Stunde */}
          {generatedMaterial.stunde_nummer && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.5rem',
              background: 'rgba(139, 92, 246, 0.15)',
              borderRadius: '4px',
              fontSize: '0.7rem',
              color: 'var(--primary)',
              marginBottom: '0.75rem'
            }}>
              <Target size={12} />
              Material für Stunde {generatedMaterial.stunde_nummer}
            </div>
          )}

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
          <p style={{ fontSize: '0.8rem' }}>
            {stunden.length > 0 
              ? 'Wählen Sie eine Stunde und Material-Typ, dann klicken Sie auf "Erstellen"'
              : 'Wählen Sie einen Material-Typ und klicken Sie auf "Erstellen"'
            }
          </p>
        </div>
      )}
    </div>
  );
};
