import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-col">
          <h4>🎪 EventHub</h4>
          <p>Nền tảng quản lý và khám phá sự kiện hàng đầu. Tìm kiếm, đặt vé và trải nghiệm những sự kiện tuyệt vời.</p>
        </div>
        <div className="footer-col">
          <h4>Khám phá</h4>
          <ul>
            <li><a href="/">Tất cả sự kiện</a></li>
            <li><a href="/?tag=Music">Âm nhạc</a></li>
            <li><a href="/?tag=Sports">Thể thao</a></li>
            <li><a href="/?tag=Workshop">Workshop</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Hỗ trợ</h4>
          <ul>
            <li><a href="#">Câu hỏi thường gặp</a></li>
            <li><a href="#">Chính sách hoàn vé</a></li>
            <li><a href="#">Điều khoản sử dụng</a></li>
            <li><a href="#">Liên hệ</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Kết nối</h4>
          <div className="footer-socials">
            <a href="#" title="Facebook">📘</a>
            <a href="#" title="Instagram">📸</a>
            <a href="#" title="TikTok">🎵</a>
            <a href="#" title="Email">📧</a>
          </div>
          <p className="footer-hours">Hỗ trợ: 8:00 – 22:00 hàng ngày</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} EventHub. All rights reserved.</p>
      </div>
    </footer>
  );
}
