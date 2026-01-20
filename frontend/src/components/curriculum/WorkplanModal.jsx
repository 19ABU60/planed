import { useState, useEffect } from 'react';
import { Calendar, RefreshCw, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API } from './constants';

export const WorkplanModal = ({ isOpen, onClose, unterrichtsreihe, stunden, token, onSuccess }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedClassData, setSelectedClassData] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchClasses = async () => {
        setLoadingClasses(true);
        try {
          const res = await axios.get(`${API}/api/classes`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const deutschKlassen = res.data.filter(c => 
            c.subject?.toLowerCase().includes('deutsch')
          );
          const sortedClasses = [...deutschKlassen, ...res.data.filter(c => !c.subject?.toLowerCase().includes('deutsch'))];
          setClasses(sortedClasses);
        } catch (err) {
          toast.error('Fehler beim Laden der Klassen');
        } finally {
          setLoadingClasses(false);
        }
      };
      fetchClasses();
      
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      
      if (month === 0 && today.getDate() < 8) {
        setStartDate(`${year}-01-08`);
      } else {
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
        setStartDate(nextMonday.toISOString().split('T')[0]);
      }
    }
  }, [isOpen, token]);

  useEffect(() => {
    if (selectedClass) {
      const classData = classes.find(c => c.id === selectedClass);
      setSelectedClassData(classData);
    }
  }, [selectedClass, classes]);

  const getScheduledSlots = (schedule, start, count) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const slots = [];
    const currentDate = new Date(start);
    const maxDays = 365;
    let daysChecked = 0;
    
    while (slots.length < count && daysChecked < maxDays) {
      const dayIndex = currentDate.getDay();
      const dayName = days[dayIndex];
      const periods = schedule?.[dayName] || [];
      
      for (const period of periods) {
        if (slots.length >= count) break;
        slots.push({
          date: currentDate.toISOString().split('T')[0],
          period: period
        });
      }
      
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

    if (!selectedClassData?.schedule || Object.keys(selectedClassData.schedule).length === 0) {
      toast.error('Kein Stundenplan für diese Klasse hinterlegt');
      return;
    }

    setLoading(true);
    try {
      const scheduledSlots = getScheduledSlots(selectedClassData.schedule, startDate, stunden.length);
      
      if (scheduledSlots.length < stunden.length) {
        toast.error('Nicht genug Unterrichtsstunden im Stundenplan gefunden');
        setLoading(false);
        return;
      }

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
