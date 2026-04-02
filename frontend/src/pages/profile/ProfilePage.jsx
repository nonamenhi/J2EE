import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import useAuthStore from '../../store/authStore';
import Navbar from '../../components/common/Navbar';
import { toast } from '../../components/common/Toast';
import './Profile.css';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: user?.fullName || '' });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Load user stats
  useEffect(() => {
    if (user) {
      axiosInstance.get('/users/me/stats').then(r => setStats(r.data)).catch(() => {});
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axiosInstance.put('/users/me', form);
      updateUser(data.data);
      toast('Cập nhật thông tin thành công!', 'success');
    } catch {
      toast('Cập nhật thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const current = fd.get('currentPassword');
    const newPw = fd.get('newPassword');
    const confirm = fd.get('confirmPassword');

    if (newPw !== confirm) {
      toast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    if (newPw.length < 6) {
      toast('Mật khẩu mới phải ít nhất 6 ký tự', 'error');
      return;
    }

    try {
      await axiosInstance.put('/users/me/password', { currentPassword: current, newPassword: newPw });
      toast('Đổi mật khẩu thành công!', 'success');
      e.target.reset();
    } catch (err) {
      toast(err.response?.data?.error || 'Đổi mật khẩu thất bại', 'error');
    }
  };

  const roleMeta = {
    ADMIN: { label: 'Quản trị viên', icon: '🛡️', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    ORGANIZER: { label: 'Ban tổ chức', icon: '🎪', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    ATTENDEE: { label: 'Người tham gia', icon: '🎫', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
  };

  const role = roleMeta[user?.role] || { label: user?.role, icon: '👤', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' };
  const initials = user?.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const quickLinks = [
    user?.role === 'ATTENDEE' && { label: 'Đăng ký của tôi', icon: '🎟️', to: '/my-registrations' },
    user?.role === 'ATTENDEE' && { label: 'Sự kiện đã lưu', icon: '💾', to: '/profile/saved' },
    (user?.role === 'ORGANIZER' || user?.role === 'ADMIN') && { label: 'Sự kiện của tôi', icon: '📋', to: '/organizer/my-events' },
    (user?.role === 'ORGANIZER' || user?.role === 'ADMIN') && { label: 'Tạo sự kiện', icon: '➕', to: '/organizer/events/create' },
    user?.role === 'ADMIN' && { label: 'Bảng điều khiển', icon: '📊', to: '/admin' },
    user?.role === 'ADMIN' && { label: 'Quản lý người dùng', icon: '👥', to: '/admin/users' },
  ].filter(Boolean);

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="profile-container">
        {/* Cover + Avatar Section */}
        <div className="profile-cover" style={{ background: role.gradient }}>
          <div className="profile-cover-overlay" />
        </div>

        <div className="profile-header">
          <div className="profile-avatar" style={{ background: role.gradient }}>
            {initials}
          </div>
          <div className="profile-identity">
            <h1 className="profile-name">{user?.fullName}</h1>
            <p className="profile-email">{user?.email}</p>
            <span className="profile-role-badge" style={{ background: role.gradient }}>
              {role.icon} {role.label}
            </span>
          </div>
        </div>

        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-info">
            <span className="balance-label">💰 Số dư tài khoản</span>
            <span className="balance-value">
              {stats?.balance != null
                ? `${Number(stats.balance).toLocaleString('vi-VN')}đ`
                : '—'}
            </span>
          </div>
          <div className="balance-actions">
            <button className="balance-btn balance-btn-deposit"
              onClick={() => navigate('/deposit')}>
              ➕ Nạp tiền
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="profile-stats">
          <div className="ps-item">
            <span className="ps-value">{stats?.registrations ?? '—'}</span>
            <span className="ps-label">Đăng ký</span>
          </div>
          <div className="ps-item">
            <span className="ps-value">{stats?.bookings ?? '—'}</span>
            <span className="ps-label">Đặt vé</span>
          </div>
          {(user?.role === 'ORGANIZER' || user?.role === 'ADMIN') && (
            <div className="ps-item">
              <span className="ps-value">{stats?.eventsCreated ?? '—'}</span>
              <span className="ps-label">Sự kiện tạo</span>
            </div>
          )}
          <div className="ps-item">
            <span className="ps-value">{stats?.reviews ?? '—'}</span>
            <span className="ps-label">Đánh giá</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="profile-quick-links">
          {quickLinks.map((link, i) => (
            <Link key={i} to={link.to} className="pql-item">
              <span className="pql-icon">{link.icon}</span>
              <span className="pql-label">{link.label}</span>
              <span className="pql-arrow">→</span>
            </Link>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="profile-tabs">
          <button className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}>
            ✏️ Thông tin
          </button>
          <button className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}>
            🔒 Bảo mật
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="profile-card">
            <h3 className="pc-title">Chỉnh sửa hồ sơ</h3>
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="pf-group">
                <label className="pf-label">Họ và tên</label>
                <input className="pf-input" value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  required placeholder="Nhập họ và tên" />
              </div>

              <div className="pf-group">
                <label className="pf-label">Email</label>
                <input className="pf-input disabled" value={user?.email} disabled />
                <span className="pf-hint">Email không thể thay đổi</span>
              </div>

              <div className="pf-group">
                <label className="pf-label">Vai trò</label>
                <input className="pf-input disabled" value={role.label} disabled />
              </div>

              <div className="pf-group">
                <label className="pf-label">Ngày tham gia</label>
                <input className="pf-input disabled"
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                  disabled />
              </div>

              <button type="submit" className="pf-submit" disabled={loading}>
                {loading ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="profile-card">
            <h3 className="pc-title">Đổi mật khẩu</h3>
            <form onSubmit={handleChangePassword} className="profile-form">
              <div className="pf-group">
                <label className="pf-label">Mật khẩu hiện tại</label>
                <input className="pf-input" type="password" name="currentPassword"
                  required placeholder="Nhập mật khẩu hiện tại" />
              </div>
              <div className="pf-group">
                <label className="pf-label">Mật khẩu mới</label>
                <input className="pf-input" type="password" name="newPassword"
                  required minLength={6} placeholder="Ít nhất 6 ký tự" />
              </div>
              <div className="pf-group">
                <label className="pf-label">Xác nhận mật khẩu mới</label>
                <input className="pf-input" type="password" name="confirmPassword"
                  required placeholder="Nhập lại mật khẩu mới" />
              </div>
              <button type="submit" className="pf-submit">
                🔐 Đổi mật khẩu
              </button>
            </form>

            <hr className="pc-divider" />

            <div className="danger-zone">
              <h4 className="dz-title">⚠️ Vùng nguy hiểm</h4>
              <p className="dz-desc">Đăng xuất khỏi tài khoản hiện tại</p>
              <button className="dz-btn" onClick={logout}>
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}