import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RFQList from './pages/RFQList';
import RFQDetail from './pages/RFQDetail';
import BuyerDashboard from './pages/BuyerDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import PostRFQ from './pages/PostRFQ';
import Pricing from './pages/Pricing';
import Upgrade from './pages/Upgrade';
import Suppliers from './pages/Suppliers';
import SupplierProfile from './pages/SupplierProfile';
import Messages from './pages/Messages';
import EditProfile from './pages/EditProfile';
import Categories from './pages/Categories';
import BuyerPage from './pages/BuyerPage';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import About from './pages/About';
import Contact from './pages/Contact';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRFQs from './pages/admin/AdminRFQs';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPayments from './pages/admin/AdminPayments';
import AdminSuppliers from './pages/admin/AdminSuppliers';
import AdminLogin from './pages/admin/AdminLogin';
import AdminProtectedRoute from './components/AdminProtectedRoute';

function Layout({ children, noFooter }) {
  return (
    <>
      <Navbar />
      <main className="app-main" style={{ minHeight: '70vh' }}>{children}</main>
      {!noFooter && <Footer />}
    </>
  );
}

function AdminRoute({ children }) {
  return (
    <AdminProtectedRoute>
      <AdminLayout>{children}</AdminLayout>
    </AdminProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/login" element={<Layout noFooter><Login /></Layout>} />
          <Route path="/register" element={<Layout noFooter><Register /></Layout>} />
          <Route path="/forgot-password" element={<Layout noFooter><ForgotPassword /></Layout>} />
          <Route path="/reset-password" element={<Layout noFooter><ResetPassword /></Layout>} />
          <Route path="/rfqs" element={<Layout><RFQList /></Layout>} />
          <Route path="/rfqs/:id" element={<Layout><RFQDetail /></Layout>} />
          <Route path="/suppliers" element={<Layout><Categories /></Layout>} />
          <Route path="/suppliers/:id" element={<Layout><SupplierProfile /></Layout>} />
          <Route path="/buyers" element={<Layout><BuyerPage /></Layout>} />
          <Route path="/categories" element={<Layout><Suppliers /></Layout>} />
          <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
          <Route path="/upgrade" element={<Layout><Upgrade /></Layout>} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />
          <Route path="/terms" element={<Layout><Terms /></Layout>} />
          <Route path="/privacy" element={<Layout><Privacy /></Layout>} />

          {/* Authenticated */}
          <Route path="/messages" element={<Layout noFooter><Messages /></Layout>} />
          <Route path="/profile/edit" element={<Layout><EditProfile /></Layout>} />

          {/* Buyer */}
          <Route path="/dashboard/buyer" element={<Layout><BuyerDashboard /></Layout>} />
          <Route path="/dashboard/buyer/post-rfq" element={<Layout><PostRFQ /></Layout>} />

          {/* Supplier */}
          <Route path="/dashboard/supplier" element={<Layout><SupplierDashboard /></Layout>} />

          {/* Admin */}
          <Route path="/admin/login" element={<Layout noFooter><AdminLogin /></Layout>} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/rfqs" element={<AdminRoute><AdminRFQs /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
          <Route path="/admin/suppliers" element={<AdminRoute><AdminSuppliers /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={
            <Layout>
              <div className="container py-5 text-center">
                <div style={{ fontSize: '4rem' }}>🔍</div>
                <h2 className="fw-bold">404 — Page Not Found</h2>
                <p className="text-muted">The page you're looking for doesn't exist.</p>
                <Link to="/" className="btn fw-semibold" style={{ background: '#e94560', color: '#fff' }}>Go Home</Link>
              </div>
            </Layout>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
