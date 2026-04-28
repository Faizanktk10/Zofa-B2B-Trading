import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function SupplierProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/suppliers/${id}`).then(r => setSupplier(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-5"><div className="spinner-border" style={{ color: '#e94560' }} /></div>;
  if (!supplier) return <div className="container py-5 text-center text-muted">Supplier not found.</div>;

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/categories">Suppliers</Link></li>
          <li className="breadcrumb-item active">{supplier.companyName || supplier.fullName}</li>
        </ol>
      </nav>

      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 text-center sticky-top" style={{ top: '80px' }}>
            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white mx-auto mb-3"
              style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', fontSize: '2rem' }}>
              {(supplier.companyName || supplier.fullName)[0]}
            </div>
            <h5 className="fw-bold mb-1">{supplier.companyName || supplier.fullName}</h5>
            <p className="text-muted small mb-2">{supplier.fullName}</p>

            <div className="d-flex justify-content-center gap-2 flex-wrap mb-3">
              {supplier.isPremium && <span className="badge bg-warning text-dark">⭐ Premium Supplier</span>}
              {supplier.isFeatured && <span className="badge" style={{ background: '#e94560' }}>Featured</span>}
            </div>

            <div className="text-start mb-3">
              {supplier.city && (
                <p className="small mb-1"><span className="text-muted">📍 Location:</span> <strong>{supplier.city}</strong></p>
              )}
              {supplier.businessType && (
                <p className="small mb-1"><span className="text-muted">🏭 Business:</span> <strong>{supplier.businessType}</strong></p>
              )}
              {supplier.yearsInBusiness > 0 && (
                <p className="small mb-1"><span className="text-muted">📅 Experience:</span> <strong>{supplier.yearsInBusiness} years</strong></p>
              )}
              {supplier.website && (
                <p className="small mb-1">
                  <span className="text-muted">🌐 Website:</span>{' '}
                  <a href={supplier.website} target="_blank" rel="noreferrer" style={{ color: '#e94560' }}>{supplier.website}</a>
                </p>
              )}
              {supplier.rating > 0 && (
                <p className="small mb-1">
                  <span className="text-muted">⭐ Rating:</span>{' '}
                  <strong>{supplier.rating.toFixed(1)} / 5.0</strong>
                </p>
              )}
            </div>

            {/* Message Button */}
            {user && user.role === 'Buyer' && (
              <button className="btn w-100 fw-semibold mb-2"
                style={{ background: '#e94560', color: '#fff' }}
                onClick={() => navigate(`/messages?with=${supplier.userId}`)}>
                💬 Send Message
              </button>
            )}
            {!user && (
              <Link to="/login" className="btn w-100 btn-outline-secondary">
                Login to Contact
              </Link>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="col-lg-8">
          {/* About */}
          {supplier.description && (
            <div className="card border-0 shadow-sm p-4 mb-4">
              <h6 className="fw-bold mb-3">About the Company</h6>
              <p className="text-muted mb-0" style={{ lineHeight: 1.8 }}>{supplier.description}</p>
            </div>
          )}

          {/* Premium Badge Info */}
          {supplier.isPremium ? (
            <div className="card border-0 shadow-sm p-4 mb-4" style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', color: '#fff' }}>
              <div className="d-flex align-items-center gap-3">
                <div style={{ fontSize: '2.5rem' }}>⭐</div>
                <div>
                  <h6 className="fw-bold mb-1">Verified Premium Supplier</h6>
                  <p className="mb-0 small opacity-75">
                    This supplier has an active premium subscription on Zofa B2B Trading, indicating a committed and verified business.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm p-4 mb-4 bg-light">
              <div className="d-flex align-items-center gap-3">
                <div style={{ fontSize: '2rem' }}>🔓</div>
                <div>
                  <h6 className="fw-bold mb-1">Free Plan Supplier</h6>
                  <p className="mb-0 small text-muted">This supplier is on the free plan.</p>
                </div>
              </div>
            </div>
          )}

          {/* Why Contact */}
          <div className="card border-0 shadow-sm p-4">
            <h6 className="fw-bold mb-3">How to Work with This Supplier</h6>
            <div className="row g-3">
              {[
                { icon: '📋', title: 'Post an RFQ', desc: 'Post your requirement and this supplier can send you a quotation.' },
                { icon: '💬', title: 'Send a Message', desc: 'Directly message the supplier about your needs.' },
                { icon: '📊', title: 'Compare Quotes', desc: 'Receive multiple quotes and choose the best offer.' },
              ].map(item => (
                <div className="col-md-4" key={item.title}>
                  <div className="text-center p-3 bg-light rounded">
                    <div style={{ fontSize: '1.8rem' }}>{item.icon}</div>
                    <div className="fw-semibold small mt-1">{item.title}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            {user?.role === 'Buyer' && (
              <div className="mt-3 d-flex gap-2">
                <Link to="/dashboard/buyer/post-rfq" className="btn btn-sm fw-semibold" style={{ background: '#e94560', color: '#fff' }}>
                  + Post RFQ
                </Link>
                <button className="btn btn-sm btn-outline-secondary"
                  onClick={() => navigate(`/messages?with=${supplier.userId}`)}>
                  💬 Message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
