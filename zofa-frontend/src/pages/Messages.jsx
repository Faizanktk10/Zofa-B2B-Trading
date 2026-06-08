import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [thread, setThread] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data);
      return data;
    } catch { return []; }
  }, []);

  const loadThread = useCallback(async (userId) => {
    try {
      const { data } = await api.get(`/messages/${userId}`);
      setThread(data);
      await api.patch(`/messages/read-all/${userId}`).catch(() => {});
      setConversations(prev =>
        prev.map(c => c.contactUserId === userId ? { ...c, unreadCount: 0 } : c)
      );
    } catch { /* ignore */ }
  }, []);

  const openThread = useCallback((contact) => {
    setActiveContact(contact);
    loadThread(contact.contactUserId);
  }, [loadThread]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadConversations();
  }, [user, navigate, loadConversations]);

  // Handle ?with= query param — open thread directly
  useEffect(() => {
    const withId = parseInt(params.get('with'));
    if (!withId) return;
    const existing = conversations.find(c => c.contactUserId === withId);
    if (existing) {
      openThread(existing);
    } else if (!activeContact || activeContact.contactUserId !== withId) {
      // New conversation — no prior messages
      setActiveContact({ contactUserId: withId, contactName: 'New Conversation', unreadCount: 0 });
      loadThread(withId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, conversations.length]);

  // Poll for new messages every 8 seconds when a thread is open
  useEffect(() => {
    if (!activeContact) return;
    pollRef.current = setInterval(() => {
      loadThread(activeContact.contactUserId);
      loadConversations();
    }, 8000);
    return () => clearInterval(pollRef.current);
  }, [activeContact, loadThread, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!body.trim() || !activeContact) return;
    setSending(true);
    try {
      await api.post('/messages', { receiverId: activeContact.contactUserId, body });
      setBody('');
      await loadThread(activeContact.contactUserId);
      await loadConversations();
    } finally {
      setSending(false);
    }
  };

  const totalUnread = conversations.reduce((a, c) => a + c.unreadCount, 0);

  return (
    <div className="container py-4">
      <h4 className="fw-bold mb-4">
        💬 Messages
        {totalUnread > 0 && <span className="badge bg-danger ms-2">{totalUnread}</span>}
      </h4>
      <div className="card border-0 shadow-sm overflow-hidden" style={{ height: '72vh' }}>
        <div className="row g-0 h-100">
          {/* Conversations Sidebar */}
          <div className="col-md-4 border-end h-100 d-flex flex-column">
            <div className="p-3 border-bottom bg-light">
              <span className="fw-semibold small text-muted text-uppercase">Conversations</span>
            </div>
            <div className="overflow-auto flex-grow-1">
              {conversations.length === 0 ? (
                <div className="text-center text-muted p-4 small">
                  No conversations yet.<br />
                  Message a supplier or buyer to start.
                </div>
              ) : (
                conversations.map(c => (
                  <div key={c.contactUserId}
                    className={`p-3 border-bottom d-flex align-items-center gap-2 ${activeContact?.contactUserId === c.contactUserId ? 'bg-light' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openThread(c)}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                      style={{ width: 40, height: 40, background: '#0f3460', fontSize: '1rem' }}>
                      {(c.contactName || '?')[0].toUpperCase()}
                    </div>
                    <div className="overflow-hidden flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className={`fw-semibold small ${c.unreadCount > 0 ? 'text-dark' : 'text-muted'}`}>
                          {c.contactName}
                        </span>
                        {c.unreadCount > 0 && (
                          <span className="badge rounded-pill" style={{ background: '#e94560', fontSize: '0.6rem' }}>
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="text-muted small text-truncate">{c.lastMessage}</div>
                      <div style={{ fontSize: '0.65rem', color: '#aaa' }}>
                        {new Date(c.lastMessageAt).toLocaleDateString('en-PK')}
                      </div>
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
                    {(activeContact.contactName || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="fw-semibold">{activeContact.contactName}</div>
                    {activeContact.contactCompany && (
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{activeContact.contactCompany}</div>
                    )}
                  </div>
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
