import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import SEO from '../components/SEO';

const CATEGORY_ICONS = {
  Scrap: '♻️', Textile: '🧵', Agriculture: '🌾', Machinery: '⚙️',
  Packaging: '📦', 'Raw Materials': '🪨', Chemicals: '🧪', Electronics: '💡'
};

const CATEGORY_COLORS = {
  Scrap: '#e74c3c', Textile: '#9b59b6', Agriculture: '#27ae60', Machinery: '#2980b9',
  Packaging: '#f39c12', 'Raw Materials': '#7f8c8d', Chemicals: '#16a085', Electronics: '#2c3e50'
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container py-5">
      <SEO title="Categories" description="Browse B2B categories in Pakistan including scrap, textile, agriculture, machinery, packaging, chemicals and electronics." />
      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="fw-bold">Browse by Category</h2>
        <p className="text-muted">Find RFQs and suppliers across all major industrial sectors in Pakistan</p>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: '#e94560' }} /></div>
      ) : (
        <div className="row g-4">
          {categories.map(cat => (
            <div className="col-md-6 col-lg-3" key={cat.categoryId}>
              <div className="card border-0 shadow-sm h-100 overflow-hidden"
                style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>

                {/* Color Header */}
                <div className="p-4 text-white text-center"
                  style={{ background: `linear-gradient(135deg, ${CATEGORY_COLORS[cat.name] || '#0f3460'}, #1a1a2e)` }}>
                  <div style={{ fontSize: '3rem' }}>{CATEGORY_ICONS[cat.name] || '📋'}</div>
                  <h5 className="fw-bold mt-2 mb-0">{cat.name}</h5>
                </div>

                <div className="card-body p-3">
                  {/* Subcategories */}
                  {cat.subCategories?.length > 0 && (
                    <div className="mb-3">
                      <div className="d-flex flex-wrap gap-1">
                        {cat.subCategories.map(sub => (
                          <Link key={sub.categoryId} to={`/rfqs?categoryId=${sub.categoryId}`}
                            className="badge text-decoration-none"
                            style={{ background: '#f0f0f0', color: '#555', fontSize: '0.7rem' }}>
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <Link to={`/rfqs?categoryId=${cat.categoryId}`}
                      className="btn btn-sm flex-fill fw-semibold"
                      style={{ background: '#e94560', color: '#fff' }}>
                      RFQ Marketplace
                    </Link>
                    <Link to={`/categories?category=${cat.slug}`}
                      className="btn btn-sm btn-outline-secondary flex-fill">
                      Suppliers
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
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
