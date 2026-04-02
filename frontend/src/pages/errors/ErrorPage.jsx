import { Link } from 'react-router-dom';
import './ErrorPages.css';

export default function ErrorPage({ code = 500, message }) {
  return (
    <div className="error-page">
      <div className="error-visual">
        <span className="error-code">{code}</span>
        <span className="error-emoji">⚠️</span>
      </div>
      <h1>Đã xảy ra lỗi</h1>
      <p>{message || 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.'}</p>
      <Link to="/" className="error-btn">← Quay về trang chủ</Link>
    </div>
  );
}
