import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data.slice(0, 5));
      setUnread(data.reduce((a, c) => a + c.unreadCount, 0));
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  if (!user) return null;

  return (
    <div className="position-relative">
      <button
        className="btn btn-sm btn-outline-light position-relative"
        onClick={() => setOpen(!open)}
        style={{ borderRadius: '50%', width: 36, height: 36, padding: 0 }}>
        🔔
        {unread > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.6rem' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 999 }}
            onClick={() => setOpen(false)} />
          <div className="position-absolute end-0 mt-2 card border-0 shadow-lg"
            style={{ width: 320, zIndex: 1000, borderRadius: 12 }}>
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
              <span className="fw-semibold">Messages</span>
              {unread > 0 && <span className="badge bg-danger">{unread} unread</span>}
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {conversations.length === 0 ? (
                <div className="text-center text-muted p-4 small">No messages yet.</div>
              ) : (
                conversations.map(c => (
                  <div key={c.contactUserId}
                    className={`p-3 border-bottom d-flex gap-2 align-items-start ${c.unreadCount > 0 ? 'bg-light' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => { setOpen(false); navigate(`/messages?with=${c.contactUserId}`); }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                      style={{ width: 34, height: 34, background: '#e94560', fontSize: '0.8rem' }}>
                      {(c.contactName || '?')[0].toUpperCase()}
                    </div>
                    <div className="overflow-hidden flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-semibold small">{c.contactName}</span>
                        {c.unreadCount > 0 && (
                          <span className="badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>{c.unreadCount}</span>
                        )}
                      </div>
                      <div className="text-muted small text-truncate">{c.lastMessage}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-2 text-center border-top">
              <button className="btn btn-sm btn-link text-decoration-none" style={{ color: '#e94560' }}
                onClick={() => { setOpen(false); navigate('/messages'); }}>
                View all messages →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
