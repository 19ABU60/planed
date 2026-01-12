import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Share2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
  const { authAxios } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await authAxios.get('/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.is_read).length);
    } catch (error) { 
      console.error('Error:', error); 
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await authAxios.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) { 
      console.error('Error:', error); 
    }
  };

  const markAsRead = async (id) => {
    try {
      await authAxios.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) { 
      console.error('Error:', error); 
    }
  };

  const markAllAsRead = async () => {
    try {
      await authAxios.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) { 
      toast.error('Fehler'); 
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="btn btn-ghost btn-icon" 
        onClick={() => setShowDropdown(!showDropdown)} 
        data-testid="notification-bell"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', 
            top: '4px', 
            right: '4px', 
            width: '18px', 
            height: '18px', 
            background: 'var(--error)',
            borderRadius: '50%', 
            fontSize: '0.7rem', 
            fontWeight: '600', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'white' 
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {showDropdown && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 29 }} 
            onClick={() => setShowDropdown(false)} 
          />
          <div className="dropdown-menu" style={{ 
            width: '360px', 
            maxHeight: '400px', 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '0.75rem 1rem', 
              borderBottom: '1px solid var(--border-default)' 
            }}>
              <span style={{ fontWeight: '600' }}>Benachrichtigungen</span>
              {unreadCount > 0 && (
                <button 
                  className="btn btn-ghost" 
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} 
                  onClick={markAllAsRead}
                >
                  <CheckCheck size={14} /> Alle gelesen
                </button>
              )}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Bell size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <p>Keine Benachrichtigungen</p>
                </div>
              ) : notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => !n.is_read && markAsRead(n.id)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '0.75rem', 
                    padding: '0.75rem 1rem',
                    background: n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.1)', 
                    borderBottom: '1px solid var(--border-default)', 
                    cursor: 'pointer' 
                  }}
                >
                  <Share2 size={16} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', fontSize: '0.85rem' }}>{n.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.message}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-disabled)', marginTop: '0.25rem' }}>
                      {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true, locale: de })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
