import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import AdminLayout from '../../components/admin/AdminLayout';
import './Admin.css';

export default function AdminEventManagePage() {
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [filters, setFilters] = useState({ keyword: '', status: '', page: 0 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [regModal, setRegModal] = useState(null); // { eventId, eventTitle }
  const [regData, setRegData] = useState({ registrations: [], bookings: [] });
  const [regLoading, setRegLoading] = useState(false);

  const fetchEvents = async (f = filters) => {
    setLoading(true);
    try {
      const params = { ...f };
      Object.keys(params).forEach(k => !params[k] && params[k] !== 0 && delete params[k]);
      const { data: res } = await axiosInstance.get('/admin/events', { params });
      setData(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Bạn có chắc muốn hủy/xóa sự kiện "${title}"?`)) return;
    try {
      await axiosInstance.delete(`/admin/events/${id}`);
      showMsg('Đã hủy/xóa sự kiện thành công');
      fetchEvents();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Thao tác thất bại', 'error');
    }
  };

  const handleViewRegistrations = async (eventId, eventTitle) => {
    setRegModal({ eventId, eventTitle });
    setRegLoading(true);
    try {
      const { data: res } = await axiosInstance.get(`/admin/events/${eventId}/registrations`);
      setRegData(res);
    } catch (err) { console.error(err); }
    finally { setRegLoading(false); }
  };

  const search = (e) => {
    e.preventDefault();
    const nf = { ...filters, page: 0 };
    setFilters(nf);
    fetchEvents(nf);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }) : '—';

  return (
    <AdminLayout title="🎪 Quản lý sự kiện" subtitle={`Tổng cộng ${data.totalElements || 0} sự kiện`}>
      {/* Message */}
      {msg.text && <div className={`admin-msg ${msg.type}`}>{msg.type === 'success' ? '✅' : '❌'} {msg.text}</div>}

      {/* Filter Bar */}
      <form className="admin-filter-bar" onSubmit={search}>
        <input
          className="admin-search-input"
          placeholder="🔍 Tìm theo tên sự kiện..."
          value={filters.keyword}
          onChange={e => setFilters({ ...filters, keyword: e.target.value })}
        />
        <select
          className="admin-filter-select"
          value={filters.status}
          onChange={e => { const nf = { ...filters, status: e.target.value, page: 0 }; setFilters(nf); fetchEvents(nf); }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="DRAFT">DRAFT</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <button className="admin-filter-btn" type="submit">Tìm kiếm</button>
      </form>

      {/* Events Table */}
      {loading ? (
        <div className="admin-loading">⏳ Đang tải...</div>
      ) : data.content.length === 0 ? (
        <div className="admin-empty-state">😔 Không tìm thấy sự kiện nào</div>
      ) : (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tên sự kiện</th>
                <th>Người tạo</th>
                <th>Ngày bắt đầu</th>
                <th>Địa điểm</th>
                <th>Tham dự</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map(e => (
                <tr key={e.id}>
                  <td>
                    <strong style={{ color: '#fff' }}>{e.title}</strong>
                    {!e.isFree && e.free === false && (
                      <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#fde047', background: 'rgba(234,179,8,0.15)', padding: '0.15rem 0.4rem', borderRadius: 10, border: '1px solid rgba(234,179,8,0.3)' }}>
                        💰 Có phí
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.6)' }}>{e.organizerName || '—'}</td>
                  <td style={{ fontSize: '0.82rem' }}>{formatDate(e.startDate)}</td>
                  <td style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>{e.location || '—'}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{e.currentAttendees}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}> / {e.maxCapacity || '∞'}</span>
                  </td>
                  <td>
                    <span className={`admin-status-badge ${e.status?.toLowerCase()}`}>{e.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="admin-btn admin-btn-info" onClick={() => handleViewRegistrations(e.id, e.title)}>
                        👥
                      </button>
                      {e.status !== 'CANCELLED' && (
                        <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(e.id, e.title)}>
                          🗑️
                        </button>
                      )}
                    </div>
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
            onClick={() => { const nf = { ...filters, page: 0 }; setFilters(nf); fetchEvents(nf); }}
          >«</button>
          <button
            className="admin-page-btn"
            disabled={filters.page === 0}
            onClick={() => { const nf = { ...filters, page: filters.page - 1 }; setFilters(nf); fetchEvents(nf); }}
          >‹</button>
          {Array.from({ length: Math.min(data.totalPages, 7) }, (_, i) => {
            const start = Math.max(0, Math.min(filters.page - 3, data.totalPages - 7));
            const pageNum = start + i;
            if (pageNum >= data.totalPages) return null;
            return (
              <button
                key={pageNum}
                className={`admin-page-btn ${pageNum === filters.page ? 'active' : ''}`}
                onClick={() => { const nf = { ...filters, page: pageNum }; setFilters(nf); fetchEvents(nf); }}
              >
                {pageNum + 1}
              </button>
            );
          })}
          <button
            className="admin-page-btn"
            disabled={filters.page >= data.totalPages - 1}
            onClick={() => { const nf = { ...filters, page: filters.page + 1 }; setFilters(nf); fetchEvents(nf); }}
          >›</button>
          <button
            className="admin-page-btn"
            disabled={filters.page >= data.totalPages - 1}
            onClick={() => { const nf = { ...filters, page: data.totalPages - 1 }; setFilters(nf); fetchEvents(nf); }}
          >»</button>
        </div>
      )}

      {/* Registrations Modal */}
      {regModal && (
        <div className="admin-modal-overlay" onClick={() => setRegModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0 }}>👥 Danh sách đăng ký</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{regModal.eventTitle}</p>
              </div>
              <button className="admin-modal-close" onClick={() => setRegModal(null)}>✕</button>
            </div>

            {regLoading ? (
              <div className="admin-loading">⏳ Đang tải...</div>
            ) : (
              <>
                {/* Free registrations */}
                {regData.registrations?.length > 0 && (
                  <>
                    <h3 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.75rem' }}>🎟️ Đăng ký miễn phí ({regData.registrations.length})</h3>
                    <table className="admin-table" style={{ marginBottom: '1.5rem' }}>
                      <thead>
                        <tr><th>Họ tên</th><th>Email</th><th>Trạng thái</th><th>Ngày đăng ký</th></tr>
                      </thead>
                      <tbody>
                        {regData.registrations.map(r => (
                          <tr key={r.id}>
                            <td><strong style={{ color: '#fff' }}>{r.userFullName}</strong></td>
                            <td>{r.userEmail}</td>
                            <td>
                              <span className={`admin-status-badge ${r.status === 'CONFIRMED' ? 'published' : 'cancelled'}`}>
                                {r.status}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.82rem' }}>{formatDate(r.registeredAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* Paid bookings */}
                {regData.bookings?.length > 0 && (
                  <>
                    <h3 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.75rem' }}>💰 Đặt vé ({regData.bookings.length})</h3>
                    <table className="admin-table">
                      <thead>
                        <tr><th>Họ tên</th><th>Khu vực</th><th>SL</th><th>Tổng tiền</th><th>Trạng thái</th></tr>
                      </thead>
                      <tbody>
                        {regData.bookings.map(b => (
                          <tr key={b.id}>
                            <td><strong style={{ color: '#fff' }}>{b.userFullName}</strong></td>
                            <td>{b.zoneName}</td>
                            <td>{b.quantity}</td>
                            <td style={{ color: '#a78bfa', fontWeight: 600 }}>
                              {b.finalAmount?.toLocaleString('vi-VN')}đ
                            </td>
                            <td>
                              <span className={`admin-status-badge ${b.status === 'CONFIRMED' ? 'published' : 'cancelled'}`}>
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {!regData.registrations?.length && !regData.bookings?.length && (
                  <div className="admin-empty-state">😔 Chưa có ai đăng ký sự kiện này</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
