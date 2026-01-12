import { useState, useEffect, useCallback } from 'react';
import { Save, Plus, Trash2, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const WorkplanTablePage = ({ classes, schoolYears }) => {
  const { authAxios } = useAuth();
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workplanData, setWorkplanData] = useState({});
  const [collaborators, setCollaborators] = useState(['Lehrer 1', 'Lehrer 2']);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentClass = classes.find(c => c.id === selectedClass);
  
  // Get days in current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Filter to only show days that have lessons according to schedule
  const getScheduledDays = useCallback(() => {
    if (!currentClass?.schedule) return daysInMonth;
    
    const dayMapping = {
      0: 'sunday', 1: 'monday', 2: 'tuesday', 
      3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday'
    };
    
    return daysInMonth.filter(day => {
      const dayName = dayMapping[getDay(day)];
      return currentClass.schedule[dayName]?.length > 0;
    });
  }, [currentClass, daysInMonth]);

  const scheduledDays = getScheduledDays();

  // Get periods for a specific day
  const getPeriodsForDay = (date) => {
    if (!currentClass?.schedule) return [];
    const dayMapping = {
      0: 'sunday', 1: 'monday', 2: 'tuesday', 
      3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday'
    };
    const dayName = dayMapping[getDay(date)];
    return currentClass.schedule[dayName] || [];
  };

  // Fetch existing workplan data
  useEffect(() => {
    if (!selectedClass) return;
    
    const fetchWorkplan = async () => {
      setLoading(true);
      try {
        const startDate = format(monthStart, 'yyyy-MM-dd');
        const endDate = format(monthEnd, 'yyyy-MM-dd');
        const response = await authAxios.get(`/workplan/${selectedClass}?start=${startDate}&end=${endDate}`);
        
        // Convert array to object keyed by date-period
        const dataMap = {};
        response.data.forEach(item => {
          const key = `${item.date}-${item.period}`;
          dataMap[key] = item;
        });
        setWorkplanData(dataMap);
        
        // Load collaborators from class or use defaults
        if (response.data.length > 0 && response.data[0].collaborators) {
          setCollaborators(response.data[0].collaborators);
        }
      } catch (error) {
        console.error('Error fetching workplan:', error);
      }
      setLoading(false);
    };
    
    fetchWorkplan();
  }, [selectedClass, currentMonth, authAxios]);

  // Update cell data
  const updateCell = (dateStr, period, collaboratorIndex, field, value) => {
    const key = `${dateStr}-${period}`;
    setWorkplanData(prev => {
      const existing = prev[key] || { 
        date: dateStr, 
        period, 
        entries: collaborators.map(() => ({ topic: '', objective: '' }))
      };
      
      const newEntries = [...(existing.entries || collaborators.map(() => ({ topic: '', objective: '' })))];
      if (!newEntries[collaboratorIndex]) {
        newEntries[collaboratorIndex] = { topic: '', objective: '' };
      }
      newEntries[collaboratorIndex] = {
        ...newEntries[collaboratorIndex],
        [field]: value
      };
      
      return {
        ...prev,
        [key]: { ...existing, entries: newEntries }
      };
    });
  };

  // Save all changes
  const saveWorkplan = async () => {
    setSaving(true);
    try {
      const entries = Object.values(workplanData).map(item => ({
        ...item,
        class_subject_id: selectedClass,
        collaborators: collaborators
      }));
      
      await authAxios.post(`/workplan/${selectedClass}/bulk`, { entries });
      toast.success('Arbeitsplan gespeichert!');
    } catch (error) {
      toast.error('Fehler beim Speichern');
      console.error(error);
    }
    setSaving(false);
  };

  // Add collaborator column
  const addCollaborator = () => {
    const name = prompt('Name des neuen Bearbeiters:', `Lehrer ${collaborators.length + 1}`);
    if (name) {
      setCollaborators([...collaborators, name]);
    }
  };

  // Remove collaborator column
  const removeCollaborator = (index) => {
    if (collaborators.length <= 1) {
      toast.error('Mindestens ein Bearbeiter erforderlich');
      return;
    }
    if (window.confirm(`"${collaborators[index]}" entfernen?`)) {
      setCollaborators(collaborators.filter((_, i) => i !== index));
    }
  };

  // Rename collaborator
  const renameCollaborator = (index) => {
    const newName = prompt('Neuer Name:', collaborators[index]);
    if (newName) {
      const updated = [...collaborators];
      updated[index] = newName;
      setCollaborators(updated);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  return (
    <div className="page-content" style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'Manrope, sans-serif', margin: 0 }}>
          Arbeitsplan-Tabelle
        </h2>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            className="form-input" 
            style={{ width: '220px' }} 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">Klasse wählen...</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name} - {cls.subject}</option>
            ))}
          </select>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-ghost btn-icon" onClick={() => navigateMonth(-1)}>
              <ChevronLeft size={20} />
            </button>
            <span style={{ fontWeight: '600', minWidth: '140px', textAlign: 'center' }}>
              {format(currentMonth, 'MMMM yyyy', { locale: de })}
            </span>
            <button className="btn btn-ghost btn-icon" onClick={() => navigateMonth(1)}>
              <ChevronRight size={20} />
            </button>
          </div>
          
          <button className="btn btn-secondary" onClick={addCollaborator}>
            <Users size={18} /> Spalte hinzufügen
          </button>
          
          <button className="btn btn-primary" onClick={saveWorkplan} disabled={saving}>
            {saving ? <span className="spinner" /> : <Save size={18} />} Speichern
          </button>
        </div>
      </div>

      {!selectedClass ? (
        <div className="empty-state">
          <h3 className="empty-state-title">Bitte wählen Sie eine Klasse</h3>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <span className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      ) : scheduledDays.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-state-title">Kein Stundenplan hinterlegt</h3>
          <p className="empty-state-text">
            Bitte legen Sie zuerst unter "Klassen" einen Stundenplan für diese Klasse an.
          </p>
        </div>
      ) : (
        <div style={{ 
          overflowX: 'auto', 
          border: '1px solid var(--border-default)', 
          borderRadius: '12px',
          background: 'var(--bg-paper)'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '0.85rem'
          }}>
            <thead>
              <tr style={{ background: currentClass?.color || '#3b82f6' }}>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  color: 'white',
                  fontWeight: '600',
                  minWidth: '100px',
                  borderBottom: '2px solid rgba(255,255,255,0.2)'
                }}>
                  Datum
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'center', 
                  color: 'white',
                  fontWeight: '600',
                  minWidth: '50px',
                  borderBottom: '2px solid rgba(255,255,255,0.2)'
                }}>
                  Tag
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'center', 
                  color: 'white',
                  fontWeight: '600',
                  minWidth: '50px',
                  borderBottom: '2px solid rgba(255,255,255,0.2)'
                }}>
                  Std.
                </th>
                {collaborators.map((collab, idx) => (
                  <th 
                    key={idx} 
                    colSpan={2}
                    style={{ 
                      padding: '0.5rem', 
                      textAlign: 'center', 
                      color: 'white',
                      fontWeight: '600',
                      minWidth: '300px',
                      borderBottom: '2px solid rgba(255,255,255,0.2)',
                      borderLeft: '2px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span 
                        onClick={() => renameCollaborator(idx)} 
                        style={{ cursor: 'pointer' }}
                        title="Klicken zum Umbenennen"
                      >
                        {collab}
                      </span>
                      {collaborators.length > 1 && (
                        <button 
                          onClick={() => removeCollaborator(idx)}
                          style={{ 
                            background: 'rgba(255,255,255,0.2)', 
                            border: 'none', 
                            borderRadius: '4px',
                            padding: '2px 6px',
                            cursor: 'pointer',
                            color: 'white',
                            fontSize: '0.7rem'
                          }}
                          title="Spalte entfernen"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
              <tr style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <th colSpan={3}></th>
                {collaborators.map((_, idx) => (
                  <>
                    <th 
                      key={`topic-${idx}`}
                      style={{ 
                        padding: '0.5rem', 
                        textAlign: 'center', 
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: 'var(--text-muted)',
                        borderLeft: idx === 0 ? 'none' : '2px solid var(--border-default)'
                      }}
                    >
                      Stundenthema
                    </th>
                    <th 
                      key={`obj-${idx}`}
                      style={{ 
                        padding: '0.5rem', 
                        textAlign: 'center', 
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: 'var(--text-muted)'
                      }}
                    >
                      Lernziele
                    </th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduledDays.map((day, dayIndex) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const periods = getPeriodsForDay(day);
                const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                
                return periods.map((period, periodIndex) => {
                  const key = `${dateStr}-${period}`;
                  const rowData = workplanData[key] || { entries: [] };
                  
                  return (
                    <tr 
                      key={key}
                      style={{ 
                        background: isWeekend ? 'rgba(255,255,255,0.02)' : 'transparent',
                        borderBottom: periodIndex === periods.length - 1 ? '2px solid var(--border-default)' : '1px solid var(--border-default)'
                      }}
                    >
                      {/* Date - only show on first period of day */}
                      {periodIndex === 0 ? (
                        <td 
                          rowSpan={periods.length}
                          style={{ 
                            padding: '0.5rem 0.75rem', 
                            fontWeight: '500',
                            verticalAlign: 'top',
                            borderRight: '1px solid var(--border-default)'
                          }}
                        >
                          {format(day, 'dd.MM.yy')}
                        </td>
                      ) : null}
                      
                      {/* Weekday - only show on first period of day */}
                      {periodIndex === 0 ? (
                        <td 
                          rowSpan={periods.length}
                          style={{ 
                            padding: '0.5rem', 
                            textAlign: 'center',
                            fontWeight: '600',
                            verticalAlign: 'top',
                            color: isWeekend ? 'var(--text-muted)' : 'var(--text-default)',
                            borderRight: '1px solid var(--border-default)'
                          }}
                        >
                          {WEEKDAYS[getDay(day)]}
                        </td>
                      ) : null}
                      
                      {/* Period */}
                      <td style={{ 
                        padding: '0.5rem', 
                        textAlign: 'center',
                        fontWeight: '600',
                        background: 'rgba(59, 130, 246, 0.05)',
                        borderRight: '1px solid var(--border-default)'
                      }}>
                        {period}.
                      </td>
                      
                      {/* Collaborator columns */}
                      {collaborators.map((_, collabIdx) => {
                        const entry = rowData.entries?.[collabIdx] || { topic: '', objective: '' };
                        return (
                          <>
                            <td 
                              key={`${key}-topic-${collabIdx}`}
                              style={{ 
                                padding: '0.25rem',
                                borderLeft: collabIdx > 0 ? '2px solid var(--border-default)' : 'none',
                                minWidth: '150px'
                              }}
                            >
                              <textarea
                                value={entry.topic || ''}
                                onChange={(e) => updateCell(dateStr, period, collabIdx, 'topic', e.target.value)}
                                placeholder="Thema..."
                                style={{
                                  width: '100%',
                                  minHeight: '50px',
                                  padding: '0.5rem',
                                  border: '1px solid transparent',
                                  borderRadius: '4px',
                                  background: 'transparent',
                                  color: 'var(--text-default)',
                                  fontSize: '0.85rem',
                                  resize: 'vertical',
                                  outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'transparent'}
                              />
                            </td>
                            <td 
                              key={`${key}-obj-${collabIdx}`}
                              style={{ 
                                padding: '0.25rem',
                                borderRight: '1px solid var(--border-default)',
                                minWidth: '150px'
                              }}
                            >
                              <textarea
                                value={entry.objective || ''}
                                onChange={(e) => updateCell(dateStr, period, collabIdx, 'objective', e.target.value)}
                                placeholder="Lernziele..."
                                style={{
                                  width: '100%',
                                  minHeight: '50px',
                                  padding: '0.5rem',
                                  border: '1px solid transparent',
                                  borderRadius: '4px',
                                  background: 'transparent',
                                  color: 'var(--text-default)',
                                  fontSize: '0.85rem',
                                  resize: 'vertical',
                                  outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'transparent'}
                              />
                            </td>
                          </>
                        );
                      })}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WorkplanTablePage;
