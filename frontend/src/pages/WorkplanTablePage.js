import { useState, useEffect, useCallback, useRef } from 'react';
import { Save, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

// Default column widths
const DEFAULT_WIDTHS = {
  unterrichtseinheit: 180,
  lehrplan: 320,
  stundenthema: 280
};

const MIN_WIDTH = 100;
const MAX_WIDTH = 600;

const WorkplanTablePage = ({ classes, schoolYears }) => {
  const { authAxios } = useAuth();
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workplanData, setWorkplanData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Column resize state
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem('workplanColumnWidths');
    return saved ? JSON.parse(saved) : DEFAULT_WIDTHS;
  });
  const [resizingColumn, setResizingColumn] = useState(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

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
      } catch (error) {
        console.error('Error fetching workplan:', error);
      }
      setLoading(false);
    };
    
    fetchWorkplan();
  }, [selectedClass, currentMonth, authAxios]);

  // Save column widths to localStorage
  useEffect(() => {
    localStorage.setItem('workplanColumnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e) => {
    if (!resizingColumn) return;
    
    const diff = e.clientX - startXRef.current;
    const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidthRef.current + diff));
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }));
  }, [resizingColumn]);

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setResizingColumn(null);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, handleMouseMove, handleMouseUp]);

  // Start resizing
  const startResize = (columnKey, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[columnKey];
  };

  // Update cell data
  const updateCell = (dateStr, period, field, value) => {
    const key = `${dateStr}-${period}`;
    setWorkplanData(prev => {
      const existing = prev[key] || { 
        date: dateStr, 
        period,
        unterrichtseinheit: '',
        lehrplan: '',
        stundenthema: ''
      };
      
      return {
        ...prev,
        [key]: { ...existing, [field]: value }
      };
    });
  };

  // Save all changes
  const saveWorkplan = async () => {
    setSaving(true);
    try {
      const entries = Object.values(workplanData).map(item => ({
        ...item,
        class_subject_id: selectedClass
      }));
      
      await authAxios.post(`/workplan/${selectedClass}/bulk`, { entries });
      toast.success('Arbeitsplan gespeichert!');
    } catch (error) {
      toast.error('Fehler beim Speichern');
      console.error(error);
    }
    setSaving(false);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // Reset column widths
  const resetColumnWidths = () => {
    setColumnWidths(DEFAULT_WIDTHS);
    toast.success('Spaltenbreiten zurückgesetzt');
  };

  // Column header with resize handle
  const ColumnHeader = ({ columnKey, label }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <th 
        style={{ 
          padding: '0.75rem 0.5rem', 
          textAlign: 'center', 
          color: 'white',
          fontWeight: '600',
          borderBottom: '2px solid rgba(255,255,255,0.2)',
          borderLeft: '2px solid rgba(255,255,255,0.2)',
          width: `${columnWidths[columnKey]}px`,
          minWidth: `${columnWidths[columnKey]}px`,
          maxWidth: `${columnWidths[columnKey]}px`,
          position: 'relative',
          userSelect: 'none'
        }}
      >
        <span style={{ fontSize: '0.8rem', paddingRight: '20px' }}>{label}</span>
        {/* Resize Handle - larger clickable area */}
        <div
          onMouseDown={(e) => startResize(columnKey, e)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            position: 'absolute',
            right: '-8px',
            top: '0px',
            bottom: '0px',
            width: '16px',
            background: 'transparent',
            cursor: 'col-resize',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="← → Ziehen zum Anpassen"
        >
          {/* Visual indicator - wider and more visible */}
          <div style={{
            width: '6px',
            height: '100%',
            background: (resizingColumn === columnKey || isHovered) 
              ? 'rgba(255,255,255,0.8)' 
              : 'rgba(255,255,255,0.4)',
            borderRadius: '3px',
            transition: 'background 0.15s, width 0.15s',
            boxShadow: (resizingColumn === columnKey || isHovered) 
              ? '0 0 8px rgba(255,255,255,0.5)' 
              : 'none'
          }} />
        </div>
      </th>
    );
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
            data-testid="workplan-class-select"
          >
            <option value="">Klasse wählen...</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name} - {cls.subject}</option>
            ))}
          </select>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-ghost btn-icon" onClick={() => navigateMonth(-1)} data-testid="prev-month-btn">
              <ChevronLeft size={20} />
            </button>
            <span style={{ fontWeight: '600', minWidth: '140px', textAlign: 'center' }}>
              {format(currentMonth, 'MMMM yyyy', { locale: de })}
            </span>
            <button className="btn btn-ghost btn-icon" onClick={() => navigateMonth(1)} data-testid="next-month-btn">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <button className="btn btn-primary" onClick={saveWorkplan} disabled={saving} data-testid="save-workplan-btn">
            {saving ? <span className="spinner" /> : <Save size={18} />} Speichern
          </button>
        </div>
      </div>

      {/* Resize hint */}
      {selectedClass && scheduledDays.length > 0 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '0.5rem', 
          marginBottom: '0.75rem', 
          padding: '0.5rem 1rem',
          background: 'rgba(59, 130, 246, 0.1)', 
          borderRadius: '8px', 
          fontSize: '0.85rem', 
          color: 'var(--text-muted)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GripVertical size={16} />
            <span>Tipp: Ziehen Sie die weißen Balken zwischen den Spaltenüberschriften, um die Breite anzupassen</span>
          </div>
          <button 
            className="btn btn-ghost" 
            style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
            onClick={resetColumnWidths}
          >
            Zurücksetzen
          </button>
        </div>
      )}

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
            width: 'max-content',
            minWidth: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.85rem',
            tableLayout: 'fixed'
          }}>
            <thead>
              <tr style={{ background: currentClass?.color || '#3b82f6' }}>
                <th style={{ 
                  padding: '0.75rem 0.5rem', 
                  textAlign: 'center', 
                  color: 'white',
                  fontWeight: '600',
                  width: '80px',
                  minWidth: '80px',
                  borderBottom: '2px solid rgba(255,255,255,0.2)'
                }}>
                  Datum
                </th>
                <th style={{ 
                  padding: '0.75rem 0.25rem', 
                  textAlign: 'center', 
                  color: 'white',
                  fontWeight: '600',
                  width: '45px',
                  minWidth: '45px',
                  borderBottom: '2px solid rgba(255,255,255,0.2)'
                }}>
                  Tag
                </th>
                <th style={{ 
                  padding: '0.75rem 0.25rem', 
                  textAlign: 'center', 
                  color: 'white',
                  fontWeight: '600',
                  width: '45px',
                  minWidth: '45px',
                  borderBottom: '2px solid rgba(255,255,255,0.2)'
                }}>
                  Std.
                </th>
                <ColumnHeader columnKey="unterrichtseinheit" label="Unterrichtseinheit" />
                <ColumnHeader columnKey="lehrplan" label="Lehrplan, Bildungsstandards, Begriffe, Hinweise" />
                <ColumnHeader columnKey="stundenthema" label="Stundenthema, Zielsetzung" />
              </tr>
            </thead>
            <tbody>
              {scheduledDays.map((day, dayIndex) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const periods = getPeriodsForDay(day);
                const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                
                return periods.map((period, periodIndex) => {
                  const key = `${dateStr}-${period}`;
                  const rowData = workplanData[key] || {};
                  
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
                            padding: '0.4rem 0.5rem', 
                            fontWeight: '500',
                            verticalAlign: 'top',
                            borderRight: '1px solid var(--border-default)',
                            fontSize: '0.8rem',
                            textAlign: 'center',
                            width: '80px'
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
                            padding: '0.4rem 0.25rem', 
                            textAlign: 'center',
                            fontWeight: '600',
                            verticalAlign: 'top',
                            color: isWeekend ? 'var(--text-muted)' : 'var(--text-default)',
                            borderRight: '1px solid var(--border-default)',
                            fontSize: '0.8rem',
                            width: '45px'
                          }}
                        >
                          {WEEKDAYS[getDay(day)]}
                        </td>
                      ) : null}
                      
                      {/* Period */}
                      <td style={{ 
                        padding: '0.4rem 0.25rem', 
                        textAlign: 'center',
                        fontWeight: '600',
                        background: 'rgba(59, 130, 246, 0.05)',
                        borderRight: '1px solid var(--border-default)',
                        fontSize: '0.8rem',
                        width: '45px'
                      }}>
                        {period}.
                      </td>
                      
                      {/* Unterrichtseinheit */}
                      <td style={{ 
                        padding: '0.25rem',
                        borderLeft: '2px solid var(--border-default)',
                        width: `${columnWidths.unterrichtseinheit}px`,
                        minWidth: `${columnWidths.unterrichtseinheit}px`,
                        maxWidth: `${columnWidths.unterrichtseinheit}px`
                      }}>
                        <textarea
                          value={rowData.unterrichtseinheit || ''}
                          onChange={(e) => updateCell(dateStr, period, 'unterrichtseinheit', e.target.value)}
                          placeholder=""
                          data-testid={`cell-unterrichtseinheit-${dateStr}-${period}`}
                          style={{
                            width: '100%',
                            minHeight: '45px',
                            padding: '0.4rem',
                            border: '1px solid transparent',
                            borderRadius: '4px',
                            background: 'transparent',
                            color: 'var(--text-default)',
                            fontSize: '0.85rem',
                            resize: 'vertical',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                          onBlur={(e) => e.target.style.borderColor = 'transparent'}
                        />
                      </td>
                      
                      {/* Lehrplan, Bildungsstandards, Begriffe, Hinweise */}
                      <td style={{ 
                        padding: '0.25rem',
                        borderLeft: '2px solid var(--border-default)',
                        width: `${columnWidths.lehrplan}px`,
                        minWidth: `${columnWidths.lehrplan}px`,
                        maxWidth: `${columnWidths.lehrplan}px`
                      }}>
                        <textarea
                          value={rowData.lehrplan || ''}
                          onChange={(e) => updateCell(dateStr, period, 'lehrplan', e.target.value)}
                          placeholder=""
                          data-testid={`cell-lehrplan-${dateStr}-${period}`}
                          style={{
                            width: '100%',
                            minHeight: '45px',
                            padding: '0.4rem',
                            border: '1px solid transparent',
                            borderRadius: '4px',
                            background: 'transparent',
                            color: 'var(--text-default)',
                            fontSize: '0.85rem',
                            resize: 'vertical',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                          onBlur={(e) => e.target.style.borderColor = 'transparent'}
                        />
                      </td>
                      
                      {/* Stundenthema, Zielsetzung */}
                      <td style={{ 
                        padding: '0.25rem',
                        borderLeft: '2px solid var(--border-default)',
                        width: `${columnWidths.stundenthema}px`,
                        minWidth: `${columnWidths.stundenthema}px`,
                        maxWidth: `${columnWidths.stundenthema}px`
                      }}>
                        <textarea
                          value={rowData.stundenthema || ''}
                          onChange={(e) => updateCell(dateStr, period, 'stundenthema', e.target.value)}
                          placeholder=""
                          data-testid={`cell-stundenthema-${dateStr}-${period}`}
                          style={{
                            width: '100%',
                            minHeight: '45px',
                            padding: '0.4rem',
                            border: '1px solid transparent',
                            borderRadius: '4px',
                            background: 'transparent',
                            color: 'var(--text-default)',
                            fontSize: '0.85rem',
                            resize: 'vertical',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                          onBlur={(e) => e.target.style.borderColor = 'transparent'}
                        />
                      </td>
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
