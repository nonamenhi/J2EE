import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../utils/getImageUrl';
import './TrendingSection.css';

export default function TrendingSection({ events = [] }) {
  const navigate = useNavigate();
  if (!events.length) return null;

  return (
    <section className="trending-section">
      <div className="trending-header">
        <h2>🔥 Sự Kiện Nổi Bật</h2>
        <p>Những sự kiện được quan tâm nhiều nhất</p>
      </div>
      <div className="trending-grid">
        {events.slice(0, 6).map((event, idx) => {
          const eventImage = getImageUrl(event.bannerImagePath);
          return (
            <div
              key={event.id}
              className="trending-card"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <span className="trending-rank">#{idx + 1}</span>
              <div
                className="trending-image"
                style={{
                  backgroundImage: eventImage
                    ? `linear-gradient(rgba(14,16,40,0.25), rgba(14,16,40,0.25)), url(${eventImage})`
                    : 'linear-gradient(135deg, #6c63ff 0%, #3f3d9e 100%)'
                }}
              />
              <div className="trending-info">
                <h4>{event.title}</h4>
                <span className="trending-meta">📍 {event.location}</span>
                <span className="trending-meta">👥 {event.currentAttendees || 0} người tham gia</span>
                <span className="trending-price">
                  {event.free === false ? '💳 Có phí' : '🆓 Miễn phí'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
