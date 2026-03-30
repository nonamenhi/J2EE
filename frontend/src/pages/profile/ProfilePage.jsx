import { useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: user?.fullName || '' });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axiosInstance.put('/users/me', form);
      updateUser(data.data);
      setMsg({ type: 'success', text: 'Cập nhật thành công!' });
    } catch {
      setMsg({ type: 'error', text: 'Cập nhật thất bại' });
    } finally {
      setLoading(false);
    }
  };

  const roleBadge = {
    ADMIN: { label: 'Admin', color: '#e53e3e' },
    ORGANIZER: { label: 'Organizer', color: '#dd6b20' },
    ATTENDEE: { label: 'Attendee', color: '#805ad5' },
  };

  const role = roleBadge[user?.role] || { label: user?.role, color: '#805ad5' };

  return (

    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 60 }}>

      <div style={{ width: '100%', maxWidth: 520, padding: '0 16px' }}>
          <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 14, marginBottom: 20,
                padding: 0,
              }}
            >
               Về trang chủ
            </button>
        {/* Avatar Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '36px 24px',
          textAlign: 'center',
          marginBottom: 20,
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 700, color: 'white',
            margin: '0 auto 16px',
          }}>
            {user?.fullName?.[0]?.toUpperCase() || 'U'}
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>{user?.fullName}</h2>
          <p style={{ margin: '0 0 12px', color: 'var(--text-muted)', fontSize: 14 }}>{user?.email}</p>
          <span style={{
            display: 'inline-block',
            background: role.color,
            color: 'white',
            borderRadius: 20,
            padding: '3px 14px',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}>
            {role.label}
          </span>
        </div>

        {/* Edit Form Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '28px 24px',
          boxShadow: 'var(--shadow)',
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 17 }}>✏️ Chỉnh sửa hồ sơ</h3>

          {msg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
              background: msg.type === 'success' ? '#22543d33' : '#63171b33',
              color: msg.type === 'success' ? '#68d391' : '#fc8181',
              border: `1px solid ${msg.type === 'success' ? '#68d391' : '#fc8181'}`,
            }}>
              {msg.type === 'success' ? '✅' : '❌'} {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                Họ và tên
              </label>
              <input
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontSize: 14, boxSizing: 'border-box',
                }}
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                Email
              </label>
              <input
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontSize: 14, opacity: 0.5,
                  boxSizing: 'border-box', cursor: 'not-allowed',
                }}
                value={user?.email}
                disabled
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
                padding: '11px',
                borderRadius: 8,
                border: 'none',
                background: loading ? '#555' : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                fontWeight: 600,
                fontSize: 14,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}