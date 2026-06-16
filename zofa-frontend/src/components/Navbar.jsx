import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile navbar dropdown on navigation (fix: menu staying open on mobile)
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const dashboardLink = user?.role === 'Buyer'
    ? '/dashboard/buyer'
    : user?.role === 'Supplier'
    ? '/dashboard/supplier'
    : '/admin';

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark app-navbar"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    >
      <div className="container">
        <Link className="navbar-brand fw-bold fs-4" to="/">
          <span style={{ color: '#e94560' }}>ZOFA</span>{' '}
          <span className="text-white">B2B TRADING</span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navMenu"
          aria-expanded={mobileMenuOpen ? 'true' : 'false'}
          aria-controls="navMenu"
          onClick={() => setMobileMenuOpen(v => !v)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div
          className="collapse navbar-collapse"
          id="navMenu"
          onTransitionEnd={() => { /* no-op */ }}
        >
          <ul className="navbar-nav me-auto">
            <li className="nav-item"><Link className="nav-link" to="/rfqs" onClick={() => setMobileMenuOpen(false)}>RFQ Marketplace</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/buyers" onClick={() => setMobileMenuOpen(false)}>Buyers</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/suppliers" onClick={() => setMobileMenuOpen(false)}>Suppliers</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/categories" onClick={() => setMobileMenuOpen(false)}>Categories</Link></li>

            <li className="nav-item"><Link className="nav-link" to="/pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link></li>
          </ul>
          <div className="d-flex gap-2 align-items-center">
            {user ? (
              <>
                <NotificationBell />
                <Link to="/messages" className="btn btn-sm btn-outline-light">💬</Link>
                <div className="dropdown">
                  <button className="btn btn-sm btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
                    {user.fullName.split(' ')[0]}
                    {user.plan === 'Premium' && <span className="badge bg-warning text-dark ms-1" style={{ fontSize: '0.6rem' }}>PRO</span>}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                    <li><Link className="dropdown-item" to={dashboardLink}>📊 Dashboard</Link></li>
                    <li><Link className="dropdown-item" to="/messages">💬 Messages</Link></li>
                    {user.role === 'Supplier' && (
                      <li><Link className="dropdown-item" to="/pricing">⭐ Upgrade Plan</Link></li>
                    )}
                    {user.role === 'Admin' && (
                      <li><Link className="dropdown-item" to="/admin">⚙️ Admin Panel</Link></li>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item text-danger" onClick={handleLogout}>🚪 Logout</button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-sm btn-outline-light">Login</Link>
                <Link to="/register" className="btn btn-sm fw-semibold" style={{ background: '#e94560', color: '#fff' }}>
                  Register Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
