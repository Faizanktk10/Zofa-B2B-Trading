import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/admin/rfqs', label: 'RFQs', icon: '📋' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/payments', label: 'Payments', icon: '💰' },
  { path: '/admin/suppliers', label: 'Suppliers', icon: '🏭' },
];

export default function AdminLayout({ children }) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className="d-flex flex-column p-3"
        style={{ width: 220, background: 'linear-gradient(180deg, #1a1a2e 0%, #0f3460 100%)', flexShrink: 0 }}>
        <Link to="/" className="text-decoration-none mb-4 mt-1">
          <div className="fw-bold fs-5">
            <span style={{ color: '#e94560' }}>ZOFA</span>
            <span className="text-white"> Admin</span>
          </div>
        </Link>
        <nav className="d-flex flex-column gap-1 flex-grow-1">
          {NAV.map(item => (
            <Link key={item.path} to={item.path}
              className={`text-decoration-none px-3 py-2 rounded d-flex align-items-center gap-2 small fw-semibold ${pathname === item.path ? 'text-white' : 'text-white-50'}`}
              style={pathname === item.path ? { background: '#e94560' } : { transition: 'background 0.2s' }}
              onMouseEnter={e => { if (pathname !== item.path) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { if (pathname !== item.path) e.currentTarget.style.background = 'transparent'; }}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
        <button className="btn btn-sm btn-outline-danger mt-3"
          onClick={() => { logout(); navigate('/'); }}>
          🚪 Logout
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow-1 d-flex flex-column" style={{ background: '#f8f9fa', minWidth: 0 }}>
        <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom bg-white">
          <div>
            <div className="fw-bold">Admin Control Center</div>
            <div className="text-muted small">Manage users, payments, and RFQs</div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge text-bg-light border">Role: Admin</span>
            <Link to="/" className="btn btn-sm btn-outline-secondary">View Site</Link>
          </div>
        </div>
        <div className="overflow-auto flex-grow-1">
          {children}
        </div>
      </div>
    </div>
  );
}
