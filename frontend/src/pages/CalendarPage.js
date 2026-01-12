import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Sparkles, Copy, Trash2, GripVertical } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, 
  addMonths, subMonths, isWeekend, startOfWeek, endOfWeek, parseISO,
  startOfWeek as getStartOfWeek, endOfWeek as getEndOfWeek, addWeeks, subWeeks, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

// Lesson Modal Component
const LessonModal = ({ lesson, date, onSave, onDelete, onCopy, onClose, onAISuggestion, aiLoading, mode, availablePeriods, initialPeriod }) => {
  const [formData, setFormData] = useState({
    topic: lesson?.topic || '', 
    objective: lesson?.objective || '', 
    curriculum_reference: lesson?.curriculum_reference || '',
    educational_standards: lesson?.educational_standards || '', 
    key_terms: lesson?.key_terms || '', 
    notes: lesson?.notes || '',
    teaching_units: lesson?.teaching_units || 1, 
    is_cancelled: lesson?.is_cancelled || false, 
    cancellation_reason: lesson?.cancellation_reason || '',
    period: lesson?.period || initialPeriod || null
  });

  useEffect(() => {
    if (lesson) setFormData({
      topic: lesson.topic || '', 
      objective: lesson.objective || '', 
      curriculum_reference: lesson.curriculum_reference || '',
      educational_standards: lesson.educational_standards || '', 
      key_terms: lesson.key_terms || '', 
      notes: lesson.notes || '',
      teaching_units: lesson.teaching_units || 1, 
      is_cancelled: lesson.is_cancelled || false, 
      cancellation_reason: lesson.cancellation_reason || '',
      period: lesson.period || initialPeriod || null
    });
  }, [lesson, initialPeriod]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3 className="modal-title">
            {mode === 'create' ? 'Neue Stunde' : 'Stunde bearbeiten'} - {date && format(date, 'dd.MM.yyyy', { locale: de })}
          </h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onAISuggestion} disabled={aiLoading}>
                {aiLoading ? <span className="spinner" /> : <Sparkles size={18} />} KI-Vorschlag
              </button>
              {mode === 'edit' && (
                <button type="button" className="btn btn-secondary" onClick={onCopy}>
                  <Copy size={18} /> Kopieren
                </button>
              )}
            </div>
            
            {/* Period Selection */}
            {availablePeriods && availablePeriods.length > 0 && (
              <div className="form-group">
                <label className="form-label">Unterrichtsstunde</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {availablePeriods.map(period => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setFormData({ ...formData, period })}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        border: formData.period === period ? '2px solid var(--primary)' : '1px solid var(--border-default)',
                        background: formData.period === period ? 'var(--primary)' : 'var(--bg-subtle)',
                        color: formData.period === period ? 'white' : 'var(--text-default)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {period}.
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Stundenthema</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.topic} 
                onChange={e => setFormData({ ...formData, topic: e.target.value })}
                placeholder="z.B. Einführung Bruchrechnung" 
                data-testid="lesson-topic-input" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lernziele</label>
              <textarea 
                className="form-input" 
                style={{ height: '80px', resize: 'vertical', padding: '0.75rem' }} 
                value={formData.objective}
                onChange={e => setFormData({ ...formData, objective: e.target.value })} 
                placeholder="Was sollen die Schüler lernen?" 
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Lehrplanbezug</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.curriculum_reference}
                  onChange={e => setFormData({ ...formData, curriculum_reference: e.target.value })} 
                  placeholder="LP-Verweis" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unterrichtseinheiten</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min="1" 
                  max="10" 
                  value={formData.teaching_units}
                  onChange={e => setFormData({ ...formData, teaching_units: parseInt(e.target.value) || 1 })} 
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Schlüsselbegriffe</label>
              <textarea 
                className="form-input" 
                style={{ height: '80px', resize: 'vertical', padding: '0.75rem' }} 
                value={formData.key_terms} 
                onChange={e => setFormData({ ...formData, key_terms: e.target.value })}
                placeholder="Wichtige Begriffe (z.B. Zähler, Nenner, Bruchstrich...)" 
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.is_cancelled} 
                  onChange={e => setFormData({ ...formData, is_cancelled: e.target.checked })} 
                />
                <span>Unterrichtsausfall</span>
              </label>
            </div>
            {formData.is_cancelled && (
              <div className="form-group">
                <label className="form-label">Grund für Ausfall</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.cancellation_reason}
                  onChange={e => setFormData({ ...formData, cancellation_reason: e.target.value })} 
                  placeholder="z.B. Fortbildung" 
                />
              </div>
            )}
          </div>
          <div className="modal-footer">
            {mode === 'edit' && (
              <button type="button" className="btn btn-danger" onClick={onDelete}>
                <Trash2 size={18} /> Löschen
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Abbrechen</button>
            <button type="submit" className="btn btn-primary">Speichern</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CalendarPage = ({ classes, lessons, holidays, schoolHolidays, publicHolidays, onCreateLesson, onUpdateLesson, onDeleteLesson, selectedClassId, onCopyLesson }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState(selectedClassId || (classes[0]?.id || ''));
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month');
  const { authAxios } = useAuth();
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { 
    if (selectedClassId) setSelectedClass(selectedClassId); 
  }, [selectedClassId]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = viewMode === 'month' 
    ? eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    : eachDayOfInterval({ start: getStartOfWeek(currentDate, { weekStartsOn: 1 }), end: getEndOfWeek(currentDate, { weekStartsOn: 1 }) });

  const filteredLessons = lessons.filter(l => l.class_subject_id === selectedClass);
  const currentClass = classes.find(c => c.id === selectedClass);

  const getLessonsForDay = (date) => filteredLessons.filter(l => l.date === format(date, 'yyyy-MM-dd'));

  const isHolidayDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (publicHolidays.some(h => h.date === dateStr)) return 'public';
    if (schoolHolidays.some(h => dateStr >= h.start && dateStr <= h.end)) return 'school';
    return false;
  };

  const getHolidayName = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const pub = publicHolidays.find(h => h.date === dateStr);
    if (pub) return pub.name;
    const sch = schoolHolidays.find(h => dateStr >= h.start && dateStr <= h.end);
    if (sch) return sch.name;
    return null;
  };

  const openCreateModal = (date) => { 
    setSelectedDate(date); 
    setSelectedLesson(null); 
    setModalMode('create'); 
    setShowModal(true); 
  };
  
  const openEditModal = (lesson, e) => { 
    e.stopPropagation(); 
    setSelectedLesson(lesson); 
    setSelectedDate(parseISO(lesson.date)); 
    setModalMode('edit'); 
    setShowModal(true); 
  };

  const handleSaveLesson = async (lessonData) => {
    try {
      if (modalMode === 'create') {
        await onCreateLesson({ ...lessonData, class_subject_id: selectedClass, date: format(selectedDate, 'yyyy-MM-dd') });
        toast.success('Stunde erstellt');
      } else {
        await onUpdateLesson(selectedLesson.id, lessonData);
        toast.success('Stunde aktualisiert');
      }
      setShowModal(false);
    } catch (error) { 
      toast.error('Fehler beim Speichern'); 
    }
  };

  const handleDeleteLesson = async () => {
    if (!selectedLesson) return;
    try { 
      await onDeleteLesson(selectedLesson.id); 
      toast.success('Stunde gelöscht'); 
      setShowModal(false); 
    } catch (error) { 
      toast.error('Fehler'); 
    }
  };

  const handleCopyLesson = async () => {
    if (!selectedLesson) return;
    const newDate = prompt('Neues Datum (YYYY-MM-DD):', format(addDays(parseISO(selectedLesson.date), 7), 'yyyy-MM-dd'));
    if (newDate) {
      try { 
        await onCopyLesson(selectedLesson.id, newDate); 
        toast.success('Stunde kopiert'); 
        setShowModal(false); 
      } catch (error) { 
        toast.error('Fehler beim Kopieren'); 
      }
    }
  };

  const handleAISuggestion = async () => {
    if (!currentClass) return;
    setAiLoading(true);
    try {
      const existingTopics = filteredLessons.filter(l => l.topic).map(l => l.topic);
      const response = await authAxios.post('/ai/suggestions', {
        subject: currentClass.subject, 
        grade: currentClass.name, 
        curriculum_topic: 'Allgemein', 
        previous_topics: existingTopics.slice(-5)
      });
      if (response.data.suggestions?.length > 0) {
        const s = response.data.suggestions[0];
        setSelectedLesson(prev => ({ 
          ...prev, 
          topic: s.topic || '', 
          objective: s.objective || '', 
          key_terms: s.key_terms || '' 
        }));
        toast.success('KI-Vorschlag eingefügt');
      }
    } catch (error) { 
      toast.error('KI-Vorschlag fehlgeschlagen'); 
    }
    setAiLoading(false);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newDate = destination.droppableId;
    const lesson = filteredLessons.find(l => l.id === draggableId);
    if (!lesson || lesson.date === newDate) return;
    try { 
      await onUpdateLesson(lesson.id, { date: newDate }); 
      toast.success(`Verschoben auf ${format(parseISO(newDate), 'dd.MM.yyyy', { locale: de })}`); 
    } catch (error) { 
      toast.error('Fehler'); 
    }
  };

  const navigatePrev = () => setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));
  const navigateNext = () => setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', fontFamily: 'Manrope, sans-serif' }}>Kalender</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="tabs">
            <button className={`tab ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>Monat</button>
            <button className={`tab ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>Woche</button>
          </div>
          <select 
            className="form-input" 
            style={{ width: '250px' }} 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)} 
            data-testid="class-select"
          >
            <option value="">Klasse wählen</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name} - {cls.subject}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedClass && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          marginBottom: '1rem', 
          padding: '0.5rem 1rem',
          background: 'rgba(59, 130, 246, 0.1)', 
          borderRadius: '8px', 
          fontSize: '0.85rem', 
          color: 'var(--text-muted)' 
        }}>
          <GripVertical size={16} />
          <span>Tipp: Unterrichtsstunden per Drag & Drop verschieben</span>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="calendar-container">
          <div className="calendar-header">
            <div className="calendar-nav">
              <button onClick={navigatePrev} data-testid="prev-month-btn">
                <ChevronLeft size={18} />
              </button>
            </div>
            <h3 className="calendar-title">
              {viewMode === 'month' 
                ? format(currentDate, 'MMMM yyyy', { locale: de }) 
                : `KW ${format(currentDate, 'w', { locale: de })} - ${format(currentDate, 'yyyy')}`
              }
            </h3>
            <div className="calendar-nav">
              <button onClick={navigateNext} data-testid="next-month-btn">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="calendar-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
            
            {days.map(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayLessons = getLessonsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isWeekendDay = isWeekend(day);
              const holidayType = isHolidayDay(day);
              const holidayName = getHolidayName(day);

              return (
                <Droppable droppableId={dayStr} key={dayStr}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                      className={`calendar-day ${!isCurrentMonth && viewMode === 'month' ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isWeekendDay ? 'weekend' : ''} ${holidayType ? 'holiday' : ''} ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                      style={{ minHeight: viewMode === 'week' ? '300px' : '120px' }}
                      onClick={() => selectedClass && openCreateModal(day)} 
                      data-testid={`calendar-day-${dayStr}`}
                    >
                      <span className="calendar-day-number">{format(day, 'd')}</span>
                      {holidayName && (
                        <div style={{ 
                          fontSize: '0.65rem', 
                          color: holidayType === 'public' ? 'var(--error)' : 'var(--warning)', 
                          marginBottom: '0.25rem' 
                        }}>
                          {holidayName}
                        </div>
                      )}
                      {dayLessons.map((lesson, index) => (
                        <Draggable key={lesson.id} draggableId={lesson.id} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              {...provided.dragHandleProps}
                              className={`lesson-item ${lesson.is_cancelled ? 'cancelled' : ''} ${snapshot.isDragging ? 'dragging' : ''}`}
                              onClick={(e) => openEditModal(lesson, e)} 
                              style={{ borderLeftColor: currentClass?.color, ...provided.draggableProps.style }}
                              data-testid={`lesson-${lesson.id}`}
                            >
                              <span className="lesson-item-title">{lesson.topic || 'Kein Thema'}</span>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </div>
      </DragDropContext>

      {showModal && (
        <LessonModal 
          lesson={selectedLesson} 
          date={selectedDate} 
          onSave={handleSaveLesson} 
          onDelete={handleDeleteLesson}
          onCopy={handleCopyLesson} 
          onClose={() => setShowModal(false)} 
          onAISuggestion={handleAISuggestion} 
          aiLoading={aiLoading} 
          mode={modalMode} 
        />
      )}
    </div>
  );
};

export default CalendarPage;
