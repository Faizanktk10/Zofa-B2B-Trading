import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function AdminRFQs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const q = status ? `?status=${status}` : '';
    api.get(`/admin/rfqs${q}`).then(r => setRfqs(r.data)).finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    if (!user || user.role !== 'Admin') { navigate('/admin/login'); return; }
    load();
  }, [user, navigate, load]);

  const toggleFeature = async (id, current) => {
    await api.patch(`/admin/rfqs/${id}/feature`, !current, { headers: { 'Content-Type': 'application/json' } });
    setRfqs(rfqs.map(r => r.rfqId === id ? { ...r, isFeatured: !current } : r));
  };

  const deleteRFQ = async (id) => {
    if (!window.confirm('Delete this RFQ?')) return;
    await api.delete(`/rfqs/${id}`);
    setRfqs(rfqs.filter(r => r.rfqId !== id));
  };

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">📋 RFQ Management</h5>
        <div className="d-flex gap-2">
          {['', 'Open', 'Closed', 'Awarded'].map(s => (
            <button key={s} className={`btn btn-sm ${status === s ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setStatus(s)}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: '#e94560' }} /></div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th><th>Title</th><th>Category</th><th>Buyer</th>
                <th>Status</th><th>Featured</th><th>Views</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map(r => (
                <tr key={r.rfqId}>
                  <td className="text-muted small">{r.rfqId}</td>
                  <td className="fw-semibold" style={{ maxWidth: 200 }}>
                    <div className="text-truncate">{r.title}</div>
                  </td>
                  <td><span className="badge bg-light text-dark border">{r.category}</span></td>
                  <td>
                    <div className="small fw-semibold">{r.buyer}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{r.buyerEmail}</div>
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'Open' ? 'bg-success' : r.status === 'Awarded' ? 'bg-primary' : 'bg-secondary'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div className="form-check form-switch mb-0">
                      <input className="form-check-input" type="checkbox" checked={r.isFeatured}
                        onChange={() => toggleFeature(r.rfqId, r.isFeatured)} />
                    </div>
                  </td>
                  <td className="text-muted small">{r.viewCount}</td>
                  <td className="text-muted small">{new Date(r.createdAt).toLocaleDateString('en-PK')}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <a href={`/rfqs/${r.rfqId}`} target="_blank" rel="noreferrer"
                        className="btn btn-sm btn-outline-secondary">View</a>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRFQ(r.rfqId)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rfqs.length === 0 && <div className="text-center text-muted py-4">No RFQs found.</div>}
        </div>
      )}
    </div>
  );
}
