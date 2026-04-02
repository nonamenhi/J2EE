import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import './Auth.css';
import { useState } from 'react';

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLocked(false);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.type === 'ACCOUNT_LOCKED') {
        setIsLocked(true);
      }
      setError(data?.error || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">🎪 EventHub</div>
        <h2>Đăng nhập</h2>
        {error && (
          <div className={`auth-error ${isLocked ? 'auth-locked' : ''}`}>
            {isLocked && <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔒</div>}
            <div>{error}</div>
            {isLocked && (
              <a
                href="mailto:toivaem136317@gmail.com"
                style={{ color: '#e94560', fontWeight: 600, display: 'inline-block', marginTop: '0.5rem' }}
              >
                📧 toivaem136317@gmail.com
              </a>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button className="btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="auth-footer">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
      </div>
    </div>
  );
}
