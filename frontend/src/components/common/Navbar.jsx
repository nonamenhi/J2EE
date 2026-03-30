import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">🎪 EventHub</Link>
        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>Sự kiện</Link>
          {user && (
            <>
              {(user.role === 'ATTENDEE') && (
                <Link to="/my-registrations" className={isActive('/my-registrations')}>Đăng ký của tôi</Link>
              )}
              {(user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
                <Link to="/organizer/my-events" className={isActive('/organizer/my-events')}>Sự kiện của tôi</Link>
              )}
              {user.role === 'ADMIN' && (
                <Link to="/admin" className={isActive('/admin')}>Quản trị</Link>
              )}
            </>
          )}
        </div>
        <div className="navbar-auth">
          {user ? (
            <div className="navbar-user">
              <span className="user-name"onClick={() => navigate('/profile')}style={{ cursor: 'pointer' }}>👤 {user.fullName}</span>
              <span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role}</span>
              <button className="btn-logout" onClick={logout}>Đăng xuất</button>
            </div>
          ) : (
            <div className="navbar-guest">
              <Link to="/login" className="btn-nav-login">Đăng nhập</Link>
              <Link to="/register" className="btn-nav-register">Đăng ký</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
