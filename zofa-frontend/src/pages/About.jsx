import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function About() {
  return (
    <>
      <SEO title="About Us" description="Learn about Zofa B2B Trading — Pakistan's trusted B2B marketplace connecting industrial buyers and suppliers." />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }} className="py-5 text-white text-center">
        <div className="container py-3">
          <h1 className="fw-bold display-5 mb-3">About <span style={{ color: '#e94560' }}>Zofa B2B Trading</span></h1>
          <p className="lead opacity-75" style={{ maxWidth: 600, margin: '0 auto' }}>
            Pakistan's trusted B2B marketplace connecting industrial buyers and suppliers since 2024.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-5">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-md-6">
              <h2 className="fw-bold mb-3">Our Mission</h2>
              <p className="text-muted mb-3">
                Zofa B2B Trading was built to solve a real problem in Pakistan's industrial sector — buyers struggle to find reliable suppliers, and suppliers struggle to reach genuine buyers.
              </p>
              <p className="text-muted mb-3">
                We created a simple, mobile-friendly platform where any business — from a small trader in Faisalabad to a large manufacturer in Karachi — can post requirements and receive competitive quotes within hours.
              </p>
              <p className="text-muted">
                Our goal is to digitize Pakistan's B2B trade and make it as easy as posting on social media.
              </p>
            </div>
            <div className="col-md-6">
              <div className="row g-3">
                {[
                  { icon: '🇵🇰', title: 'Pakistan Focused', desc: 'Built specifically for Pakistani businesses with local payment methods and city-level search.' },
                  { icon: '🔒', title: 'Verified Suppliers', desc: 'Premium suppliers are verified and committed businesses you can trust.' },
                  { icon: '⚡', title: 'Fast Quotes', desc: 'Post an RFQ and receive supplier quotes within hours, not days.' },
                  { icon: '💰', title: 'Free to Start', desc: 'Buyers can post RFQs for free. Suppliers can browse and quote at no cost.' },
                ].map(item => (
                  <div className="col-6" key={item.title}>
                    <div className="card border-0 shadow-sm p-3 h-100">
                      <div style={{ fontSize: '1.8rem' }}>{item.icon}</div>
                      <div className="fw-bold mt-2 mb-1">{item.title}</div>
                      <div className="text-muted small">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-5" style={{ background: '#1a1a2e', color: '#fff' }}>
        <div className="container text-center">
          <div className="row g-4">
            {[
              { num: '10,000+', label: 'Registered Users' },
              { num: '5,000+', label: 'RFQs Posted' },
              { num: '500+', label: 'Verified Suppliers' },
              { num: '50+', label: 'Cities Covered' },
            ].map(s => (
              <div className="col-6 col-md-3" key={s.label}>
                <div className="fw-bold" style={{ fontSize: '2.5rem', color: '#e94560' }}>{s.num}</div>
                <div className="opacity-75">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-5 bg-light">
        <div className="container text-center">
          <h2 className="fw-bold mb-2">Industries We Serve</h2>
          <p className="text-muted mb-4">From raw materials to finished goods — we cover all major sectors</p>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            {['Scrap', 'Textile', 'Agriculture', 'Machinery', 'Packaging', 'Raw Materials', 'Chemicals', 'Electronics', 'Construction', 'Food & Beverages'].map(cat => (
              <span key={cat} className="badge fs-6 fw-normal py-2 px-3"
                style={{ background: '#1a1a2e', color: '#fff' }}>
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-5 text-center">
        <div className="container">
          <h2 className="fw-bold mb-3">Ready to grow your business?</h2>
          <p className="text-muted mb-4">Join thousands of Pakistani businesses on Zofa B2B Trading today.</p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/register?role=Buyer" className="btn btn-lg fw-bold px-4" style={{ background: '#e94560', color: '#fff' }}>
              Post RFQ Free
            </Link>
            <Link to="/register?role=Supplier" className="btn btn-lg btn-outline-dark px-4">
              Join as Supplier
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
