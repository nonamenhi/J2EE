import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">🎪 EventHub</Link>

        <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu">
          <span className={`hamburger ${menuOpen ? 'open' : ''}`}>
            <span></span><span></span><span></span>
          </span>
        </button>

        <div className={`navbar-menu ${menuOpen ? 'show' : ''}`}>
          <div className="navbar-links">
            <Link to="/" className={isActive('/')} onClick={() => setMenuOpen(false)}>Sự kiện</Link>
            {user && (
              <>
                {(user.role === 'ATTENDEE') && (
                  <Link to="/my-registrations" className={isActive('/my-registrations')}
                    onClick={() => setMenuOpen(false)}>Đăng ký của tôi</Link>
                )}
                {(user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
                  <Link to="/organizer/my-events" className={isActive('/organizer/my-events')}
                    onClick={() => setMenuOpen(false)}>Sự kiện của tôi</Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className={isActive('/admin')}
                    onClick={() => setMenuOpen(false)}>Quản trị</Link>
                )}
              </>
            )}
          </div>
          <div className="navbar-auth">
            {user ? (
              <div className="navbar-user">
                <span className="user-name" onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                  style={{ cursor: 'pointer' }}>👤 {user.fullName}</span>
                <span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role}</span>
                <button className="btn-logout" onClick={logout}>Đăng xuất</button>
              </div>
            ) : (
              <div className="navbar-guest">
                <Link to="/login" className="btn-nav-login" onClick={() => setMenuOpen(false)}>Đăng nhập</Link>
                <Link to="/register" className="btn-nav-register" onClick={() => setMenuOpen(false)}>Đăng ký</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
