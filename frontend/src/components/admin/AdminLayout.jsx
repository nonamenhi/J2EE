import { NavLink, useLocation } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import '../../pages/admin/Admin.css';

const sidebarItems = [
  { label: 'Quản trị', isSection: true },
  { path: '/admin', icon: '📊', label: 'Tổng quan', end: true },
  { path: '/admin/users', icon: '👥', label: 'Người dùng' },
  { path: '/admin/events', icon: '🎪', label: 'Sự kiện' },
  { path: '/admin/reports', icon: '📈', label: 'Báo cáo' },
];

export default function AdminLayout({ children, title, subtitle }) {
  const location = useLocation();

  return (
    <>
      <Navbar />
      <div className="admin-wrapper">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="sidebar-header">
            <h2>🛡️ Admin Panel</h2>
            <p>Quản lý hệ thống EventHub</p>
          </div>

          <nav>
            {sidebarItems.map((item, i) => {
              if (item.isSection) {
                return <div key={i} className="sidebar-section-label">{item.label}</div>;
              }
              const isActive = item.end
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  end={item.end}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="admin-content">
          {title && (
            <div className="admin-page-header">
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </>
  );
}
