import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: '#1a1a2e', color: '#aaa' }} className="pt-5 pb-3 mt-5">
      <div className="container">
        <div className="row g-4">
          <div className="col-md-4">
            <h5 className="fw-bold mb-3">
              <span style={{ color: '#e94560' }}>ZOFA</span>{' '}
              <span className="text-white">B2B TRADING</span>
            </h5>
            <p className="small mb-3">
              Pakistan's trusted B2B marketplace connecting buyers and suppliers for industrial goods across all major sectors.
            </p>
            <div className="d-flex gap-2 flex-wrap">
              <Link to="/register?role=Buyer" className="btn btn-sm fw-semibold"
                style={{ background: '#e94560', color: '#fff' }}>Post RFQ Free</Link>
              <Link to="/register?role=Supplier" className="btn btn-sm btn-outline-light">Join as Supplier</Link>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <h6 className="text-white mb-3">Marketplace</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2">
              <li><Link to="/rfqs" className="text-secondary text-decoration-none">RFQ Marketplace</Link></li>
              <li><Link to="/categories" className="text-secondary text-decoration-none">Find Suppliers</Link></li>
              <li><Link to="/suppliers" className="text-secondary text-decoration-none">Categories</Link></li>
              <li><Link to="/pricing" className="text-secondary text-decoration-none">Pricing</Link></li>
            </ul>
          </div>

          <div className="col-6 col-md-2">
            <h6 className="text-white mb-3">Company</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2">
              <li><Link to="/about" className="text-secondary text-decoration-none">About Us</Link></li>
              <li><Link to="/contact" className="text-secondary text-decoration-none">Contact Us</Link></li>
              <li><Link to="/contact#support-help" className="text-secondary text-decoration-none">Support / Help</Link></li>
              <li><Link to="/terms" className="text-secondary text-decoration-none">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-secondary text-decoration-none">Privacy Policy</Link></li>
            </ul>
          </div>

          <div className="col-md-4">
            <h6 className="text-white mb-3">Contact Us</h6>
            <div className="d-flex flex-column gap-2 small">
              <div>📧 <a href="mailto:faizanktk2006@gmail.com" className="text-secondary text-decoration-none">faizanktk2006@gmail.com</a></div>
              <div>📞 <a href="tel:+923371256673" className="text-secondary text-decoration-none">+92-3371256673</a></div>
              <div>📍 Karachi, Sindh, Pakistan</div>
              <div>🕐 Mon–Sat: 9am – 6pm PKT</div>
            </div>
            <div className="mt-3">
              <h6 className="text-white mb-2 small">Payment Methods</h6>
              <div className="d-flex gap-2 flex-wrap">
                {['JazzCash', 'EasyPaisa', 'Bank Transfer'].map(m => (
                  <span key={m} className="badge" style={{ background: '#0f3460', fontSize: '0.7rem' }}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <hr style={{ borderColor: '#2a2a4a' }} className="mt-4" />

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <p className="small mb-0 text-secondary">© 2024 Zofa B2B Trading. All rights reserved. Made in Pakistan 🇵🇰</p>
          <div className="d-flex gap-3 small">
            <Link to="/terms" className="text-secondary text-decoration-none">Terms</Link>
            <Link to="/privacy" className="text-secondary text-decoration-none">Privacy</Link>
            <Link to="/contact" className="text-secondary text-decoration-none">Contact Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
