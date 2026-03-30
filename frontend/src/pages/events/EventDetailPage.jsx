import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import useAuthStore from '../../store/authStore';
import Navbar from '../../components/common/Navbar';
import './Events.css';

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    axiosInstance.get(`/events/${id}`)
      .then(r => setData(r.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));

    // Fetch reviews
    axiosInstance.get(`/events/${id}/reviews`)
      .then(r => setReviews(r.data.data))
      .catch(err => console.error('Failed to load reviews', err));
  }, [id]);

  const handleRegister = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const { data: res } = await axiosInstance.post(`/events/${id}/register`);
      setMessage(res.message);
      setMsgType('success');
      setData(prev => ({
        ...prev,
        alreadyRegistered: true,
        event: { ...prev.event, currentAttendees: prev.event.currentAttendees + 1 }
      }));
    } catch (err) {
      setMessage(err.response?.data?.error || 'Đăng ký thất bại');
      setMsgType('error');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setReviewMsg({ text: 'Đang gửi đánh giá...', type: 'info' });
    try {
      const { data: res } = await axiosInstance.post(`/events/${id}/reviews`, { rating, comment });
      setReviewMsg({ text: res.message, type: 'success' });
      setReviews([res.data, ...reviews]);
      setComment('');
      setRating(5);
    } catch (err) {
      setReviewMsg({ text: err.response?.data?.error || 'Đánh giá thất bại', type: 'error' });
    }
  };

  if (loading) return <><Navbar /><div className="loading-state">⏳ Đang tải...</div></>;
  if (!data) return null;
  const { event, spotsLeft, alreadyRegistered } = data;
  const isPaid = !event.free;

  // Tổng ghế còn lại cho sự kiện có phí
  const totalAvailablePaid = isPaid
    ? (event.seatZones || []).reduce((sum, z) => sum + Math.max(0, z.totalSeats - z.soldSeats), 0)
    : 0;

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="event-detail">
          {event.bannerImagePath && (
            <img className="event-detail-banner"
              src={`http://localhost:8080/uploads/${event.bannerImagePath}`} alt={event.title} />
          )}
          <div className="event-detail-content">
            <div className="event-detail-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className={`event-status-tag status-${event.status?.toLowerCase()}`}>{event.status}</span>
                  {isPaid
                    ? <span className="event-status-tag" style={{ background: 'rgba(255,193,7,0.15)', color: '#ffc107', border: '1px solid rgba(255,193,7,0.3)' }}>💳 Có phí</span>
                    : <span className="event-status-tag" style={{ background: 'rgba(76,175,80,0.15)', color: '#81c784', border: '1px solid rgba(76,175,80,0.3)' }}>🆓 Miễn phí</span>
                  }
                </div>
                <h1>{event.title}</h1>
                <p className="event-meta">📍 {event.location}</p>
                <p className="event-meta">
                  📅 {new Date(event.startDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  {event.endDate && ` → ${new Date(event.endDate).toLocaleDateString('vi-VN')}`}
                </p>
                <p className="event-meta">👤 Tổ chức: <strong>{event.organizerName}</strong></p>
              </div>

              <div className="event-detail-sidebar">
                {/* Spots box */}
                {!isPaid ? (
                  <div className="spots-box">
                    <div className="spots-number">{spotsLeft === 2147483647 ? '∞' : spotsLeft}</div>
                    <div className="spots-label">Chỗ còn trống</div>
                  </div>
                ) : (
                  <div className="spots-box">
                    <div className="spots-number">{totalAvailablePaid}</div>
                    <div className="spots-label">Tổng ghế còn</div>
                  </div>
                )}

                {message && <div className={`msg-box ${msgType}`}>{message}</div>}

                {event.status === 'PUBLISHED' && user?.role === 'ATTENDEE' && (
                  <>
                    {/* Sự kiện MIỄN PHÍ */}
                    {!isPaid && !alreadyRegistered && (
                      <button className="btn-register" onClick={handleRegister} disabled={spotsLeft === 0}>
                        {spotsLeft === 0 ? '❌ Hết chỗ' : '🎟 Đặt chỗ miễn phí'}
                      </button>
                    )}
                    {!isPaid && alreadyRegistered && (
                      <div className="msg-box success">✅ Bạn đã đặt chỗ sự kiện này</div>
                    )}

                    {/* Sự kiện CÓ PHÍ */}
                    {isPaid && totalAvailablePaid > 0 && (
                      <button className="btn-register btn-paid"
                        onClick={() => navigate(`/events/${id}/book`)}>
                        🪑 Chọn chỗ ngồi & Đặt vé
                      </button>
                    )}
                    {isPaid && totalAvailablePaid === 0 && (
                      <button className="btn-register" disabled>❌ Hết vé</button>
                    )}
                  </>
                )}

                {!user && event.status === 'PUBLISHED' && (
                  <button className="btn-register" onClick={() => navigate('/login')}>
                    🔐 Đăng nhập để {isPaid ? 'mua vé' : 'đăng ký'}
                  </button>
                )}
              </div>
            </div>

            {/* Zones info cho sự kiện có phí */}
            {isPaid && event.seatZones?.length > 0 && (
              <div style={{ margin: '1.5rem 0' }}>
                <h3 style={{ marginBottom: '1rem' }}>🗺️ Khu vực & Giá vé</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {event.seatZones.map(zone => {
                    const available = Math.max(0, zone.totalSeats - zone.soldSeats);
                    const pct = zone.totalSeats > 0 ? (zone.soldSeats / zone.totalSeats) * 100 : 0;
                    return (
                      <div key={zone.id} style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1rem',
                        borderLeft: `4px solid ${zone.color || '#6c63ff'}`
                      }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: zone.color || '#fff' }}>{zone.name}</div>
                        {zone.description && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: '0.25rem 0' }}>{zone.description}</div>}
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a78bfa', margin: '0.5rem 0' }}>
                          {zone.price === 0 ? 'Miễn phí' : `${zone.price.toLocaleString('vi-VN')}đ`}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>
                          Còn {available} / {zone.totalSeats} ghế
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? '#ef4444' : zone.color || '#6c63ff', transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="event-detail-desc">
              <h3>Mô tả sự kiện</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{event.description}</p>
            </div>
            {event.tags?.length > 0 && (
              <div className="event-tags">
                {event.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            )}

            {/* Mục Đánh giá và Phản hồi */}
            <hr style={{ margin: '3rem 0 2rem 0', borderColor: 'rgba(255,255,255,0.1)' }} />
            <div className="event-reviews">
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⭐ Đánh giá & Phản hồi
                <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'rgba(255,255,255,0.6)' }}>
                  ({reviews.length} đánh giá)
                </span>
              </h3>

              {/* Form Gửi Đánh Giá (hiển thị khi event kết thúc) */}
              {event.endDate && new Date(event.endDate) < new Date() && user?.role === 'ATTENDEE' && (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Viết đánh giá của bạn</h4>
                  {reviewMsg.text && (
                    <div className={`msg-box ${reviewMsg.type}`} style={{ marginBottom: '1rem' }}>{reviewMsg.text}</div>
                  )}
                  <form onSubmit={handleReviewSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>Số sao:</label>
                      <select 
                        value={rating} 
                        onChange={e => setRating(parseInt(e.target.value))}
                        style={{ padding: '0.5rem', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', width: '120px' }}>
                        <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                        <option value={4}>⭐⭐⭐⭐ (4)</option>
                        <option value={3}>⭐⭐⭐ (3)</option>
                        <option value={2}>⭐⭐ (2)</option>
                        <option value={1}>⭐ (1)</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>Bình luận:</label>
                      <textarea 
                        required
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Chia sẻ trải nghiệm của bạn về sự kiện này..."
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', minHeight: '100px' }}
                      />
                    </div>
                    <button type="submit" className="btn-register" style={{ width: 'auto', padding: '0.75rem 2rem' }}>
                      Gửi đánh giá
                    </button>
                  </form>
                </div>
              )}

              {/* Danh sách Đánh Giá */}
              {reviews.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>Chưa có đánh giá nào cho sự kiện này.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reviews.map(rev => (
                    <div key={rev.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem 1.5rem', borderRadius: '8px', borderLeft: '3px solid #6c63ff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#fff' }}>{rev.userFullName}</strong>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                          {new Date(rev.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div style={{ color: '#facc15', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        {'⭐'.repeat(rev.rating)}
                      </div>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap' }}>{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
