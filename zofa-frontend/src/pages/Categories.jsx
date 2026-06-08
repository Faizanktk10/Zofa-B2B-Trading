import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const CATEGORIES = [
  { categoryId: 1, name: 'Scrap',        slug: 'scrap',        icon: '♻️', color: '#e74c3c' },
  { categoryId: 2, name: 'Textile',      slug: 'textile',      icon: '🧵', color: '#9b59b6' },
  { categoryId: 3, name: 'Agriculture',  slug: 'agriculture',  icon: '🌾', color: '#27ae60' },
  { categoryId: 4, name: 'Machinery',    slug: 'machinery',    icon: '⚙️', color: '#2980b9' },
  { categoryId: 5, name: 'Packaging',    slug: 'packaging',    icon: '📦', color: '#f39c12' },
  { categoryId: 6, name: 'Raw Materials',slug: 'raw-materials', icon: '🪨', color: '#7f8c8d' },
  { categoryId: 7, name: 'Chemicals',    slug: 'chemicals',    icon: '🧪', color: '#16a085' },
  { categoryId: 8, name: 'Electronics',  slug: 'electronics',  icon: '💡', color: '#2c3e50' },
];

export default function Categories() {
  return (
    <div className="container py-5">
      <SEO title="Categories" description="Browse B2B categories in Pakistan including scrap, textile, agriculture, machinery, packaging, chemicals and electronics." />
      <div className="text-center mb-5">
        <h2 className="fw-bold">Browse by Category</h2>
        <p className="text-muted">Find RFQs and suppliers across all major industrial sectors in Pakistan</p>
      </div>

      <div className="row g-4">
        {CATEGORIES.map(cat => (
          <div className="col-md-6 col-lg-3" key={cat.categoryId}>
            <div className="card border-0 shadow-sm h-100 overflow-hidden"
              style={{ transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>

              <div className="p-4 text-white text-center"
                style={{ background: `linear-gradient(135deg, ${cat.color}, #1a1a2e)` }}>
                <div style={{ fontSize: '3rem' }}>{cat.icon}</div>
                <h5 className="fw-bold mt-2 mb-0">{cat.name}</h5>
              </div>

              <div className="card-body p-3">
                <div className="d-flex gap-2">
                  <Link to={`/rfqs?categoryId=${cat.categoryId}`}
                    className="btn btn-sm flex-fill fw-semibold"
                    style={{ background: '#e94560', color: '#fff' }}>
                    RFQ Marketplace
                  </Link>
                  <Link to={`/suppliers?category=${cat.slug}`}
                    className="btn btn-sm btn-outline-secondary flex-fill">
                    Suppliers
                  </Link>

                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-5 p-5 rounded-3"
        style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', color: '#fff' }}>
        <h4 className="fw-bold mb-2">Can't find your category?</h4>
        <p className="opacity-75 mb-3">Post an RFQ anyway — our suppliers cover hundreds of product types.</p>
        <Link to="/dashboard/buyer/post-rfq" className="btn fw-bold px-4"
          style={{ background: '#e94560', color: '#fff' }}>
          Post an RFQ Free
        </Link>
      </div>
    </div>
  );
}
