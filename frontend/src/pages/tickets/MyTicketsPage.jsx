import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import Navbar from '../../components/common/Navbar';
import '../events/Events.css';

/* ─── QR Modal ────────────────────────────────────────────────── */
function QrModal({ ticket, type, onClose }) {
  if (!ticket) return null;

  const title   = ticket.eventTitle || 'Sự kiện';
  const qr      = ticket.qrCodeBase64;
  const status  = ticket.status;
  const isCheckedIn = ticket.checkedIn;

  const handleDownload = () => {
    if (!qr) return;
    const link = document.createElement('a');
    link.href = qr;
    link.download = `ve-${ticket.id?.slice(-6) || 'ticket'}.png`;
    link.click();
  };

  return (
    <div id="qr-modal-overlay" onClick={(e) => e.target.id === 'qr-modal-overlay' && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        border: '1px solid rgba(108,99,255,0.3)',
        borderRadius: '20px', padding: '2rem',
        maxWidth: '420px', width: '100%',
        boxShadow: '0 25px 60px rgba(108,99,255,0.3)',
        position: 'relative',
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'rgba(255,255,255,0.1)', border: 'none',
          borderRadius: '50%', width: '32px', height: '32px',
          color: '#fff', cursor: 'pointer', fontSize: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>&#x2715;</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>&#127915;</div>
          <h3 style={{ margin: 0, color: '#fff', fontWeight: 700 }}>{title}</h3>
          {type === 'paid' && ticket.zoneName && (
            <p style={{ margin: '0.25rem 0 0', color: '#a78bfa', fontSize: '0.9rem', fontWeight: 600 }}>
              Khu: {ticket.zoneName} &middot; {ticket.quantity} vé &middot; {ticket.finalAmount?.toLocaleString('vi-VN')}đ
            </p>
          )}
        </div>

        {/* QR Code */}
        <div style={{
          background: '#fff', borderRadius: '16px',
          padding: '1rem', textAlign: 'center', marginBottom: '1.25rem',
          position: 'relative',
        }}>
          {qr ? (
            <img src={qr} alt="QR Code ve" style={{
              width: '220px', height: '220px', display: 'block', margin: '0 auto',
              opacity: isCheckedIn ? 0.4 : 1,
            }} />
          ) : (
            <div style={{ width: '220px', height: '220px', margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#999', fontSize: '0.85rem' }}>
              Không có QR
            </div>
          )}
          {isCheckedIn && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', borderRadius: '16px',
            }}>
              <div style={{ fontSize: '3rem' }}>&#x2705;</div>
              <div style={{ fontSize: '0.8rem', color: '#4caf50', fontWeight: 700 }}>ĐÃ CHECK-IN</div>
            </div>
          )}
        </div>

        {/* Info row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.05)', borderRadius: '10px',
          padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem',
        }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)' }}>Mã vé</div>
            <div style={{ color: '#e2e8f0', fontFamily: 'monospace', fontWeight: 700 }}>
              #{ticket.id?.slice(-8).toUpperCase()}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)' }}>Trạng thái</div>
            <div style={{
              color: status === 'CONFIRMED' ? '#81c784' : '#ef9a9a',
              fontWeight: 700,
            }}>{status}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)' }}>Ngày đặt</div>
            <div style={{ color: '#e2e8f0' }}>
              {new Date(ticket.registeredAt || ticket.createdAt).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleDownload} disabled={!qr} style={{
            flex: 1, padding: '0.7rem',
            background: qr ? 'linear-gradient(135deg, #6c63ff, #a78bfa)' : 'rgba(255,255,255,0.1)',
            border: 'none', borderRadius: '10px', color: '#fff',
            fontWeight: 700, cursor: qr ? 'pointer' : 'not-allowed',
            fontSize: '0.9rem',
          }}>&#x2B07; Tải QR Code</button>
          <button onClick={onClose} style={{
            flex: 1, padding: '0.7rem',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px', color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer', fontSize: '0.9rem',
          }}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */
export default function MyTicketsPage() {
  const location = useLocation();
  const successMsg = location.state?.message;

  const [regs, setRegs]         = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState(successMsg || '');
  const [tab, setTab]           = useState('all');
  const [qrTicket, setQrTicket] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [regRes, bookRes] = await Promise.all([
        axiosInstance.get('/my-registrations'),
        axiosInstance.get('/my-bookings'),
      ]);
      setRegs(regRes.data || []);
      setBookings(bookRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCancelReg = async (regId) => {
    if (!window.confirm('Bạn có chắc muốn hủy đăng ký không?')) return;
    try {
      await axiosInstance.delete(`/registrations/${regId}`);
      setMsg('Đã hủy đăng ký thành công');
      fetchAll();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Hủy thất bại');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Hủy vé sẽ được hoàn tiền vào số dư. Xác nhận?')) return;
    try {
      await axiosInstance.delete(`/bookings/${bookingId}`);
      setMsg('Đã hủy vé và hoàn tiền thành công');
      fetchAll();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Hủy thất bại');
    }
  };

  const visible = tab === 'all'
    ? { regs, bookings }
    : tab === 'free'
    ? { regs, bookings: [] }
    : { regs: [], bookings };

  const total = visible.regs.length + visible.bookings.length;

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h1 className="page-title">&#127915; Vé &amp; Đặt chỗ của tôi</h1>

        {msg && (
          <div className="msg-box success" style={{ marginBottom: '1.25rem' }}>{msg}</div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[
            { key: 'all',  label: `Tất cả (${regs.length + bookings.length})` },
            { key: 'free', label: `🆓 Miễn phí (${regs.length})` },
            { key: 'paid', label: `💳 Có phí (${bookings.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '0.5rem 1.25rem', borderRadius: '20px',
              border: `1px solid ${tab === t.key ? '#6c63ff' : 'rgba(255,255,255,0.15)'}`,
              background: tab === t.key ? 'rgba(108,99,255,0.2)' : 'transparent',
              color: tab === t.key ? '#a78bfa' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer', fontWeight: tab === t.key ? 700 : 400,
              transition: 'all 0.2s', fontSize: '0.9rem',
            }}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="loading-state">⏳ Đang tải...</div>
        ) : total === 0 ? (
          <div className="empty-state">&#128532; Chưa có vé nào</div>
        ) : (
          <div className="reg-grid">

            {/* Vé miễn phí */}
            {visible.regs.map(r => (
              <div key={r.id} className="reg-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.72rem', padding: '2px 10px', borderRadius: '20px',
                    background: 'rgba(76,175,80,0.15)', color: '#81c784',
                    border: '1px solid rgba(76,175,80,0.3)', fontWeight: 600,
                  }}>🆓 Miễn phí</span>
                  <span className={`reg-status-${r.status?.toLowerCase()}`}>{r.status}</span>
                </div>

                <h4>{r.eventTitle || 'Sự kiện'}</h4>
                <p className="event-meta">&#128205; {r.eventLocation || '—'}</p>
                <p className="event-meta">&#128197; {r.eventStartDate ? new Date(r.eventStartDate).toLocaleDateString('vi-VN') : '—'}</p>
                <p className="event-meta" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                  Đăng ký: {r.registeredAt ? new Date(r.registeredAt).toLocaleDateString('vi-VN') : '—'}
                </p>

                {r.checkedIn && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: 'rgba(76,175,80,0.15)', color: '#81c784',
                    border: '1px solid rgba(76,175,80,0.3)', borderRadius: '20px',
                    padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600,
                  }}>&#x2705; Đã check-in</div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  {r.qrCodeBase64 && (
                    <button
                      id={`btn-qr-free-${r.id}`}
                      className="btn-sm"
                      style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', border: 'none', color: '#fff' }}
                      onClick={() => setQrTicket({ ticket: r, type: 'free' })}
                    >&#127915; Xem vé QR</button>
                  )}
                  {r.status === 'CONFIRMED' && (
                    <button className="btn-sm btn-danger" onClick={() => handleCancelReg(r.id)}>
                      Hủy đăng ký
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Vé có phí */}
            {visible.bookings.map(b => (
              <div key={b.id} className="reg-card" style={{ borderColor: 'rgba(167,139,250,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.72rem', padding: '2px 10px', borderRadius: '20px',
                    background: 'rgba(255,193,7,0.15)', color: '#ffc107',
                    border: '1px solid rgba(255,193,7,0.3)', fontWeight: 600,
                  }}>💳 Có phí</span>
                  <span className={`reg-status-${b.status?.toLowerCase()}`}>{b.status}</span>
                </div>

                <h4>{b.eventTitle || 'Sự kiện'}</h4>
                <p className="event-meta">&#x1FA91; Khu: <strong style={{ color: '#a78bfa' }}>{b.zoneName}</strong></p>
                <p className="event-meta">&#127915; Số lượng: <strong>{b.quantity} vé</strong></p>
                <p className="event-meta" style={{ color: '#a78bfa', fontWeight: 700 }}>
                  &#x1F4B0; {b.finalAmount?.toLocaleString('vi-VN')}đ
                </p>
                <p className="event-meta" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                  Đặt: {b.createdAt ? new Date(b.createdAt).toLocaleDateString('vi-VN') : '—'}
                </p>

                {b.checkedIn && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: 'rgba(76,175,80,0.15)', color: '#81c784',
                    border: '1px solid rgba(76,175,80,0.3)', borderRadius: '20px',
                    padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600,
                  }}>&#x2705; Đã check-in</div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  {b.qrCodeBase64 && (
                    <button
                      id={`btn-qr-paid-${b.id}`}
                      className="btn-sm"
                      style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)', border: 'none', color: '#fff' }}
                      onClick={() => setQrTicket({ ticket: b, type: 'paid' })}
                    >&#127915; Xem vé QR</button>
                  )}
                  {b.status === 'CONFIRMED' && (
                    <button className="btn-sm btn-danger" onClick={() => handleCancelBooking(b.id)}>
                      Hủy &amp; Hoàn tiền
                    </button>
                  )}
                </div>
              </div>
            ))}

          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrTicket && (
        <QrModal
          ticket={qrTicket.ticket}
          type={qrTicket.type}
          onClose={() => setQrTicket(null)}
        />
      )}
    </>
  );
}
