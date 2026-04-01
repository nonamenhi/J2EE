import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import AdminLayout from '../../components/admin/AdminLayout';
import useAuthStore from '../../store/authStore';
import { Lock, Unlock } from 'lucide-react';
import './Admin.css';

export default function UserManagePage() {
  const currentUser = useAuthStore((s) => s.user);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [filters, setFilters] = useState({ keyword: '', role: '', page: 0 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [detailUser, setDetailUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchUsers = async (f = filters) => {
    setLoading(true);
    try {
      const params = { ...f };
      Object.keys(params).forEach(k => !params[k] && params[k] !== 0 && delete params[k]);
      const { data: res } = await axiosInstance.get('/admin/users', { params });
      setData(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const isSelfOrAdmin = (user) => {
    return user.id === currentUser?.id || user.role === 'ADMIN';
  };

  const handleToggle = async (user) => {
    if (isSelfOrAdmin(user)) return;
    try {
      await axiosInstance.post(`/admin/users/${user.id}/toggle`);
      showMsg('Đã cập nhật trạng thái tài khoản');
      fetchUsers();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Thao tác thất bại', 'error');
    }
  };

  const handleRole = async (id, role, user) => {
    if (isSelfOrAdmin(user)) return;
    try {
      await axiosInstance.post(`/admin/users/${id}/role`, null, { params: { role } });
      showMsg('Đã đổi quyền thành công');
      fetchUsers();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Thao tác thất bại', 'error');
    }
  };

  const handleViewDetail = async (userId) => {
    setDetailLoading(true);
    try {
      const { data: res } = await axiosInstance.get(`/admin/users/${userId}`);
      setDetailUser(res);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  const search = (e) => {
    e.preventDefault();
    const nf = { ...filters, page: 0 };
    setFilters(nf);
    fetchUsers(nf);
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  return (
    <AdminLayout title="👥 Quản lý người dùng" subtitle={`Tổng cộng ${data.totalElements || 0} người dùng`}>
      {/* Message */}
      {msg.text && <div className={`admin-msg ${msg.type}`}>{msg.type === 'success' ? '✅' : '❌'} {msg.text}</div>}

      {/* Filter Bar */}
      <form className="admin-filter-bar" onSubmit={search}>
        <input
          className="admin-search-input"
          placeholder="🔍 Tìm theo tên hoặc email..."
          value={filters.keyword}
          onChange={e => setFilters({ ...filters, keyword: e.target.value })}
        />
        <select
          className="admin-filter-select"
          value={filters.role}
          onChange={e => { const nf = { ...filters, role: e.target.value, page: 0 }; setFilters(nf); fetchUsers(nf); }}
        >
          <option value="">Tất cả vai trò</option>
          <option value="ATTENDEE">ATTENDEE</option>
          <option value="ORGANIZER">ORGANIZER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button className="admin-filter-btn" type="submit">Tìm kiếm</button>
      </form>

      {/* Users Table */}
      {loading ? (
        <div className="admin-loading">⏳ Đang tải...</div>
      ) : data.content.length === 0 ? (
        <div className="admin-empty-state">😔 Không tìm thấy người dùng nào</div>
      ) : (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className={`admin-avatar ${u.role?.toLowerCase()}`}>
                        {getInitial(u.fullName)}
                      </div>
                      <strong style={{ color: '#fff' }}>{u.fullName}</strong>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    {isSelfOrAdmin(u) ? (
                      <span className={`admin-role-badge ${u.role?.toLowerCase()}`}>{u.role}</span>
                    ) : (
                      <select
                        className="admin-filter-select"
                        style={{ padding: '0.3rem 0.5rem', minWidth: '120px', fontSize: '0.8rem' }}
                        value={u.role}
                        onChange={e => handleRole(u.id, e.target.value, u)}
                      >
                        <option value="ATTENDEE">ATTENDEE</option>
                        <option value="ORGANIZER">ORGANIZER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    )}
                  </td>
                  <td>
                    {isSelfOrAdmin(u) ? (
                      <span style={{ color: '#86efac', fontWeight: 600, fontSize: '0.82rem' }}>✅ Hoạt động</span>
                    ) : (
                      <button
                        className={`admin-btn ${u.enabled ? 'admin-btn-danger' : 'admin-btn-success'}`}
                        onClick={() => handleToggle(u)}
                        title={u.enabled ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', minWidth: 'auto' }}
                      >
                        {u.enabled ? <Lock size={14} /> : <Unlock size={14} />}
                        <span style={{ marginLeft: '0.3rem' }}>
                          {u.enabled ? 'Khóa' : 'Mở khóa'}
                        </span>
                      </button>
                    )}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td>
                    <button className="admin-btn admin-btn-info" onClick={() => handleViewDetail(u.id)}>
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="admin-page-btn"
            disabled={filters.page === 0}
            onClick={() => { const nf = { ...filters, page: 0 }; setFilters(nf); fetchUsers(nf); }}
          >«</button>
          <button
            className="admin-page-btn"
            disabled={filters.page === 0}
            onClick={() => { const nf = { ...filters, page: filters.page - 1 }; setFilters(nf); fetchUsers(nf); }}
          >‹</button>
          {Array.from({ length: Math.min(data.totalPages, 7) }, (_, i) => {
            const start = Math.max(0, Math.min(filters.page - 3, data.totalPages - 7));
            const pageNum = start + i;
            if (pageNum >= data.totalPages) return null;
            return (
              <button
                key={pageNum}
                className={`admin-page-btn ${pageNum === filters.page ? 'active' : ''}`}
                onClick={() => { const nf = { ...filters, page: pageNum }; setFilters(nf); fetchUsers(nf); }}
              >
                {pageNum + 1}
              </button>
            );
          })}
          <button
            className="admin-page-btn"
            disabled={filters.page >= data.totalPages - 1}
            onClick={() => { const nf = { ...filters, page: filters.page + 1 }; setFilters(nf); fetchUsers(nf); }}
          >›</button>
          <button
            className="admin-page-btn"
            disabled={filters.page >= data.totalPages - 1}
            onClick={() => { const nf = { ...filters, page: data.totalPages - 1 }; setFilters(nf); fetchUsers(nf); }}
          >»</button>
        </div>
      )}

      {/* User Detail Modal */}
      {detailUser && (
        <div className="admin-modal-overlay" onClick={() => setDetailUser(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>👤 Chi tiết người dùng</h2>
              <button className="admin-modal-close" onClick={() => setDetailUser(null)}>✕</button>
            </div>

            {detailLoading ? (
              <div className="admin-loading">⏳ Đang tải...</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className={`admin-avatar ${detailUser.user?.role?.toLowerCase()}`} style={{ width: 56, height: 56, fontSize: '1.4rem' }}>
                    {getInitial(detailUser.user?.fullName)}
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>{detailUser.user?.fullName}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{detailUser.user?.email}</div>
                  </div>
                </div>
                <div className="admin-info-row">
                  <span className="admin-info-label">Vai trò</span>
                  <span className={`admin-role-badge ${detailUser.user?.role?.toLowerCase()}`}>{detailUser.user?.role}</span>
                </div>
                <div className="admin-info-row">
                  <span className="admin-info-label">Trạng thái</span>
                  <span className="admin-info-value" style={{ color: detailUser.user?.enabled ? '#86efac' : '#fca5a5' }}>
                    {detailUser.user?.enabled ? '✅ Hoạt động' : '🔒 Bị khóa'}
                  </span>
                </div>
                <div className="admin-info-row">
                  <span className="admin-info-label">Sự kiện đã tạo</span>
                  <span className="admin-info-value">{detailUser.eventsCreated ?? 0}</span>
                </div>
                <div className="admin-info-row">
                  <span className="admin-info-label">Lần đăng ký tham dự</span>
                  <span className="admin-info-value">{detailUser.registrations ?? 0}</span>
                </div>
                <div className="admin-info-row" style={{ border: 'none' }}>
                  <span className="admin-info-label">Ngày tạo tài khoản</span>
                  <span className="admin-info-value">
                    {detailUser.user?.createdAt ? new Date(detailUser.user.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
