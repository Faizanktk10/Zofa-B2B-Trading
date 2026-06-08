import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { TableSkeleton } from '../../components/PageSkeleton';

export default function AdminPayments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/admin/payments?status=${filter}`).then(r => setPayments(r.data.items ?? r.data)).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    if (!user || user.role !== 'Admin') { navigate('/admin/login'); return; }
    load();
  }, [user, navigate, load]);

  const confirm = async (id) => {
    await api.patch(`/admin/payments/${id}/confirm`);
    setPayments(payments.filter(p => p.paymentId !== id));
  };

  const reject = async (id) => {
    await api.patch(`/admin/payments/${id}/reject`);
    setPayments(payments.filter(p => p.paymentId !== id));
  };

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">💰 Payment Management</h5>
        <div className="d-flex gap-2">
          {['Pending', 'Confirmed', 'Rejected'].map(s => (
            <button key={s} className={`btn btn-sm ${filter === s ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setFilter(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && payments.length === 0 ? (
        <TableSkeleton rows={6} cols={9} />
      ) : (
        <div className={`table-responsive ${loading ? 'opacity-50' : ''}`} style={{ transition: 'opacity 0.2s' }}>
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr><th>User</th><th>Plan</th><th>Amount</th><th>Method</th><th>Reference</th><th>Proof</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.paymentId}>
                  <td>
                    <div className="fw-semibold small">{p.userName}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{p.userEmail}</div>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border">{p.plan || p.type}</span>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{p.userPlan || 'Free'}</div>
                  </td>
                  <td className="fw-semibold">PKR {p.amount?.toLocaleString()}</td>
                  <td className="small">{p.method}</td>
                  <td className="text-muted small">{p.referenceNo || '—'}</td>
                  <td>
                    {p.proofImage
                      ? <a href={p.proofImage} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary">View</a>
                      : <span className="text-muted small">No image</span>}
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'Confirmed' ? 'bg-success' : p.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="text-muted small">{new Date(p.createdAt).toLocaleDateString('en-PK')}</td>
                  <td>
                    {p.status === 'Pending' && (
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-success fw-semibold" onClick={() => confirm(p.paymentId)}>
                          ✓ Approve
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => reject(p.paymentId)}>
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <div className="text-center text-muted py-4">No {filter.toLowerCase()} payments.</div>}
        </div>
      )}
    </div>
  );
}
