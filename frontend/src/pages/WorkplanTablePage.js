import { useState, useEffect, useCallback, useRef } from 'react';
import { Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

// Default column widths
const DEFAULT_WIDTHS = {
  unterrichtseinheit: 120,
  lehrplan: 120,
  stundenthema: 450
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

  // Adjust column width with buttons
  const adjustWidth = (columnKey, delta) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, prev[columnKey] + delta))
    }));
  };

  // Column header with +/- buttons for resizing
  const ColumnHeader = ({ columnKey, label }) => (
    <th 
      style={{ 
        padding: '0.5rem 0.25rem', 
        textAlign: 'center', 
        color: 'white',
        fontWeight: '600',
        borderBottom: '2px solid rgba(255,255,255,0.2)',
        borderLeft: '2px solid rgba(255,255,255,0.2)',
        width: `${columnWidths[columnKey]}px`,
        minWidth: `${columnWidths[columnKey]}px`,
        maxWidth: `${columnWidths[columnKey]}px`,
        position: 'relative',
        userSelect: 'none',
        verticalAlign: 'middle'
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '4px'
      }}>
        {/* Minus button */}
        <button
          onClick={() => adjustWidth(columnKey, -30)}
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            border: 'none',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            padding: 0,
            lineHeight: 1
          }}
          title="Spalte schmaler"
        >
          −
        </button>
        
        <span style={{ 
          fontSize: '0.75rem', 
          flex: 1, 
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          padding: '0 4px'
        }}>
          {label}
        </span>
        
        {/* Plus button */}
        <button
          onClick={() => adjustWidth(columnKey, 30)}
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            border: 'none',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            padding: 0,
            lineHeight: 1
          }}
          title="Spalte breiter"
        >
          +
        </button>
      </div>
    </th>
  );

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
          
          <button 
            className="btn btn-secondary" 
            onClick={resetColumnWidths}
            style={{ fontSize: '0.85rem' }}
            title="Spaltenbreiten auf Standard zurücksetzen"
          >
            ↺ Reset
          </button>
          
          <button className="btn btn-primary" onClick={saveWorkplan} disabled={saving} data-testid="save-workplan-btn">
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
                <ColumnHeader columnKey="lehrplan" label="Lehrplan, Standards, Hinweise" />
                <ColumnHeader columnKey="stundenthema" label="Stundenthema, Zielsetzung, Lernziele" />
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
