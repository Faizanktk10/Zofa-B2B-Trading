import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [inbox, setInbox] = useState([]);
  const [thread, setThread] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadThread = useCallback(async (userId) => {
    const { data } = await api.get(`/messages/${userId}`);
    setThread(data);
    data
      .filter(m => !m.isRead && m.senderId !== user?.userId)
      .forEach(m => api.patch(`/messages/${m.messageId}/read`).catch(() => {}));
  }, [user]);

  const openThread = useCallback((contact) => {
    setActiveContact(contact);
    loadThread(contact.userId);
    setContacts(prev => prev.map(c => c.userId === contact.userId ? { ...c, unread: false } : c));
  }, [loadThread]);

  const loadInbox = useCallback(async () => {
    const { data } = await api.get('/messages/inbox');
    setInbox(data);
    const seen = new Set();
    const unique = [];
    data.forEach(m => {
      if (!seen.has(m.senderId)) {
        seen.add(m.senderId);
        unique.push({ userId: m.senderId, name: m.senderName, lastMsg: m.body, unread: !m.isRead });
      }
    });
    setContacts(unique);
  }, []);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadInbox();
  }, [user, navigate, loadInbox]);

  useEffect(() => {
    const withId = params.get('with');
    if (!withId) return;
    if (contacts.length > 0) {
      const contact = contacts.find(c => c.userId === parseInt(withId));
      if (contact) openThread(contact);
    } else {
      setActiveContact({ userId: parseInt(withId), name: 'New Conversation' });
      loadThread(parseInt(withId));
    }
  }, [contacts, params, openThread, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!body.trim() || !activeContact) return;
    setSending(true);
    try {
      await api.post('/messages', { receiverId: activeContact.userId, body });
      setBody('');
      loadThread(activeContact.userId);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container py-4">
      <h4 className="fw-bold mb-4">💬 Messages</h4>
      <div className="card border-0 shadow-sm overflow-hidden" style={{ height: '70vh' }}>
        <div className="row g-0 h-100">
          {/* Contacts Sidebar */}
          <div className="col-md-4 border-end h-100 d-flex flex-column">
            <div className="p-3 border-bottom bg-light">
              <span className="fw-semibold">Inbox</span>
              {inbox.filter(m => !m.isRead).length > 0 && (
                <span className="badge bg-danger ms-2">{inbox.filter(m => !m.isRead).length}</span>
              )}
            </div>
            <div className="overflow-auto flex-grow-1">
              {contacts.length === 0 ? (
                <div className="text-center text-muted p-4 small">No messages yet.</div>
              ) : (
                contacts.map(c => (
                  <div key={c.userId}
                    className={`p-3 border-bottom d-flex align-items-center gap-2 ${activeContact?.userId === c.userId ? 'bg-light' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openThread(c)}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                      style={{ width: 40, height: 40, background: '#0f3460', fontSize: '1rem' }}>
                      {c.name[0]}
                    </div>
                    <div className="overflow-hidden flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <span className={`fw-semibold small ${c.unread ? 'text-dark' : 'text-muted'}`}>{c.name}</span>
                        {c.unread && <span className="badge rounded-pill" style={{ background: '#e94560', fontSize: '0.6rem' }}>New</span>}
                      </div>
                      <div className="text-muted small text-truncate">{c.lastMsg}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Thread Panel */}
          <div className="col-md-8 h-100 d-flex flex-column">
            {activeContact ? (
              <>
                <div className="p-3 border-bottom bg-light d-flex align-items-center gap-2">
                  <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                    style={{ width: 36, height: 36, background: '#e94560', fontSize: '0.9rem' }}>
                    {activeContact.name[0]}
                  </div>
                  <span className="fw-semibold">{activeContact.name}</span>
                </div>
                <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-2">
                  {thread.length === 0 && (
                    <div className="text-center text-muted small mt-4">No messages yet. Say hello!</div>
                  )}
                  {thread.map(m => {
                    const isMine = m.senderId === user?.userId;
                    return (
                      <div key={m.messageId} className={`d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
                        <div className="px-3 py-2 rounded-3 small"
                          style={{
                            maxWidth: '70%',
                            background: isMine ? '#e94560' : '#f0f0f0',
                            color: isMine ? '#fff' : '#1a1a2e',
                            borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px'
                          }}>
                          <div>{m.body}</div>
                          <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: 2 }}>
                            {new Date(m.sentAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <form onSubmit={sendMessage} className="p-3 border-top d-flex gap-2">
                  <input className="form-control" placeholder="Type a message..."
                    value={body} onChange={e => setBody(e.target.value)} />
                  <button type="submit" className="btn fw-semibold px-3" disabled={sending || !body.trim()}
                    style={{ background: '#e94560', color: '#fff' }}>
                    {sending ? '...' : '➤'}
                  </button>
                </form>
              </>
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100 text-muted flex-column gap-2">
                <div style={{ fontSize: '3rem' }}>💬</div>
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
