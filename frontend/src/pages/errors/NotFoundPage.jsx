import { Link } from 'react-router-dom';
import './ErrorPages.css';

export default function NotFoundPage() {
  return (
    <div className="error-page">
      <div className="error-visual">
        <span className="error-code">404</span>
        <span className="error-emoji">🔍</span>
      </div>
      <h1>Trang không tồn tại</h1>
      <p>Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
      <Link to="/" className="error-btn">← Quay về trang chủ</Link>
    </div>
  );
}
