import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import SEO from '../components/SEO';

const CATEGORIES = [
  { name: 'Scrap', icon: '♻️', slug: 'scrap' },
  { name: 'Textile', icon: '🧵', slug: 'textile' },
  { name: 'Agriculture', icon: '🌾', slug: 'agriculture' },
  { name: 'Machinery', icon: '⚙️', slug: 'machinery' },
  { name: 'Packaging', icon: '📦', slug: 'packaging' },
  { name: 'Raw Materials', icon: '🪨', slug: 'raw-materials' },
  { name: 'Chemicals', icon: '🧪', slug: 'chemicals' },
  { name: 'Electronics', icon: '💡', slug: 'electronics' },
];

export default function Home() {
  const [rfqs, setRfqs] = useState([]);
  const [stats, setStats] = useState({ totalRFQs: 0, totalBuyers: 0, totalSuppliers: 0 });
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Parallel calls — both start at same time
    Promise.all([
      api.get('/rfqs?pageSize=6').catch(() => ({ data: { items: [], total: 0 } })),
      api.get('/admin/stats').catch(() => ({ data: {} })),
    ]).then(([rfqRes, statsRes]) => {
      setRfqs(rfqRes.data.items || []);
      setStats(statsRes.data || {});
    });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/rfqs?search=${encodeURIComponent(search.trim())}`);
    else navigate('/rfqs');
  };

  return (
    <>
      <SEO />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', minHeight: '420px' }}
        className="d-flex align-items-center">
        <div className="container text-center py-5">
          <h1 className="display-4 fw-bold text-white mb-3">
            Pakistan's #1 <span style={{ color: '#e94560' }}>B2B Marketplace</span>
          </h1>
          <p className="lead text-white-50 mb-4">
            Connect with verified buyers &amp; suppliers for scrap, textile, agriculture, machinery and more.
          </p>
          <form onSubmit={handleSearch} className="d-flex justify-content-center gap-2 flex-wrap">
            <input
              className="form-control form-control-lg"
              style={{ maxWidth: '480px' }}
              placeholder="Search RFQs... e.g. scrap batteries, cotton yarn"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-lg px-4 fw-bold" style={{ background: '#e94560', color: '#fff' }}>
              Search
            </button>
          </form>
          <div className="mt-4 d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/register?role=Buyer" className="btn btn-outline-light">Post an RFQ</Link>
            <Link to="/register?role=Supplier" className="btn btn-outline-warning">Join as Supplier</Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div style={{ background: '#e94560' }} className="py-3">
        <div className="container">
          <div className="row text-center text-white g-2">
            {[
              ['8+', 'Categories'],
              [stats.totalRFQs ? `${stats.totalRFQs}+` : '0', 'Active RFQs'],
              [stats.totalSuppliers ? `${stats.totalSuppliers}+` : '0', 'Verified Suppliers'],
              ['Pakistan', 'Nationwide Coverage'],
            ].map(([num, label]) => (
              <div className="col-6 col-md-3" key={label}>
                <div className="fw-bold fs-5">{num}</div>
                <div className="small opacity-75">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories — static, no API wait needed */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="fw-bold mb-4 text-center">Browse by Category</h2>
          <div className="row g-3">
            {CATEGORIES.map(cat => (
              <div className="col-6 col-md-3" key={cat.name}>
                <Link to={`/rfqs?search=${cat.name}`} className="text-decoration-none">
                  <div className="card h-100 text-center border-0 shadow-sm p-3"
                    style={{ transition: 'transform 0.15s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ fontSize: '2.5rem' }}>{cat.icon}</div>
                    <div className="fw-semibold mt-2" style={{ color: '#1a1a2e' }}>{cat.name}</div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest RFQs */}
      <section className="py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold mb-0">Latest RFQs</h2>
            <Link to="/rfqs" className="btn btn-sm btn-outline-danger">View All →</Link>
          </div>
          {rfqs.length > 0 ? (
            <div className="row g-3">
              {rfqs.map(rfq => (
                <div className="col-md-6 col-lg-4" key={rfq.rfqId}>
                  <Link to={`/rfqs/${rfq.rfqId}`} className="text-decoration-none">
                    <div className="card h-100 border-0 shadow-sm"
                      style={{ transition: 'transform 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                      <div className="card-body">
                        {rfq.isFeatured && <span className="badge mb-2" style={{ background: '#e94560' }}>⭐ Featured</span>}
                        <h6 className="fw-bold text-dark">{rfq.title}</h6>
                        <p className="text-muted small mb-2">
                          📦 {rfq.quantity} {rfq.unit} &nbsp;|&nbsp; 📍 {rfq.deliveryCity || 'Pakistan'}
                        </p>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="badge bg-light text-dark border">{rfq.categoryName}</span>
                          <span className="text-muted small">{rfq.quotationCount} quotes</span>
                        </div>
                      </div>
                      <div className="card-footer bg-transparent border-0 small text-muted">
                        🏢 {rfq.buyerCompany} &nbsp;·&nbsp; {new Date(rfq.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted">
              <p>No RFQs yet. <Link to="/register?role=Buyer" style={{ color: '#e94560' }}>Be the first to post one!</Link></p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-5 bg-light">
        <div className="container text-center">
          <h2 className="fw-bold mb-5">How It Works</h2>
          <div className="row g-4">
            {[
              { step: '1', icon: '📝', title: 'Post RFQ', desc: 'Buyer posts a Request for Quotation with product details' },
              { step: '2', icon: '🔍', title: 'Suppliers Respond', desc: 'Verified suppliers browse and send competitive quotes' },
              { step: '3', icon: '🤝', title: 'Connect & Deal', desc: 'Buyer reviews offers and connects with the best supplier' },
            ].map(item => (
              <div className="col-md-4" key={item.step}>
                <div className="p-4">
                  <div style={{ fontSize: '3rem' }}>{item.icon}</div>
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold text-white mb-3"
                    style={{ width: 36, height: 36, background: '#e94560', fontSize: '1rem' }}>
                    {item.step}
                  </div>
                  <h5 className="fw-bold">{item.title}</h5>
                  <p className="text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #e94560, #0f3460)' }} className="py-5 text-white text-center">
        <div className="container">
          <h2 className="fw-bold mb-3">Ready to grow your business?</h2>
          <p className="lead mb-4 opacity-75">Join thousands of Pakistani businesses on Zofa B2B Trading</p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/register?role=Buyer" className="btn btn-light btn-lg fw-bold px-4">Post RFQ Free</Link>
            <Link to="/register?role=Supplier" className="btn btn-outline-light btn-lg px-4">Join as Supplier</Link>
          </div>
        </div>
      </section>
    </>
  );
}
