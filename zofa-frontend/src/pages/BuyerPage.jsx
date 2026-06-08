import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function BuyerPage() {
  return (
    <div style={{ background: '#f4f6fb', minHeight: '80vh' }} className="d-flex align-items-center">
      <SEO title="For Buyers — Zofa B2B Trading" description="Post RFQs and receive quotes from verified Pakistani suppliers on Zofa B2B Trading." />
      <div className="container py-5 text-center">
        <div style={{ fontSize: '4rem' }}>🛒</div>
        <h2 className="fw-bold mt-3 mb-2">Are You a Buyer?</h2>
        <p className="text-muted mb-4" style={{ maxWidth: 480, margin: '0 auto' }}>
          Post your RFQ for free and receive competitive quotes from verified Pakistani suppliers within hours.
        </p>
        <div className="d-flex justify-content-center gap-3 flex-wrap">
          <Link to="/register?role=Buyer" className="btn btn-lg fw-bold px-5" style={{ background: '#e94560', color: '#fff' }}>
            Register as Buyer — Free
          </Link>
          <Link to="/rfqs" className="btn btn-lg btn-outline-secondary px-5">
            Browse RFQs
          </Link>
        </div>

        <div className="row g-4 mt-5" style={{ maxWidth: 700, margin: '0 auto' }}>
          {[
            { icon: '📋', title: 'Post RFQ Free', desc: 'Describe your requirement in minutes' },
            { icon: '💬', title: 'Get Quotes Fast', desc: 'Suppliers respond within hours' },
            { icon: '🤝', title: 'Close the Deal', desc: 'Compare and accept the best offer' },
          ].map(s => (
            <div className="col-md-4" key={s.title}>
              <div className="card border-0 shadow-sm p-4 h-100 text-center">
                <div style={{ fontSize: '2rem' }}>{s.icon}</div>
                <div className="fw-bold mt-2">{s.title}</div>
                <div className="text-muted small">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
