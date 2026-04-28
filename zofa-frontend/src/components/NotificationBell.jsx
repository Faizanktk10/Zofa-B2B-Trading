import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/inbox');
      setUnread(data.filter(m => !m.isRead).length);
      setMessages(data.slice(0, 5));
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
              <span className="fw-semibold">Notifications</span>
              {unread > 0 && <span className="badge bg-danger">{unread} unread</span>}
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {messages.length === 0 ? (
                <div className="text-center text-muted p-4 small">No messages yet.</div>
              ) : (
                messages.map(m => (
                  <div key={m.messageId}
                    className={`p-3 border-bottom d-flex gap-2 align-items-start ${!m.isRead ? 'bg-light' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => { setOpen(false); navigate(`/messages?with=${m.senderId}`); }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                      style={{ width: 34, height: 34, background: '#e94560', fontSize: '0.8rem' }}>
                      {m.senderName[0]}
                    </div>
                    <div className="overflow-hidden">
                      <div className="d-flex justify-content-between">
                        <span className="fw-semibold small">{m.senderName}</span>
                        {!m.isRead && <span className="rounded-circle bg-danger d-inline-block" style={{ width: 8, height: 8, marginTop: 4 }} />}
                      </div>
                      <div className="text-muted small text-truncate">{m.body}</div>
                      <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                        {new Date(m.sentAt).toLocaleString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
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
