import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../utils/getImageUrl';
import './HeroBanner.css';

export default function HeroBanner({ events = [] }) {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const slides = events.slice(0, 5);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  return (
    <div className="hero-banner">
      <div className="hero-slides" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((event, i) => {
          const eventImage = getImageUrl(event.bannerImagePath);
          return (
            <div
              key={event.id}
              className="hero-slide"
              onClick={() => navigate(`/events/${event.id}`)}
              style={{
                backgroundImage: eventImage
                  ? `linear-gradient(to right, rgba(15,12,41,0.85), rgba(15,12,41,0.4)), url(${eventImage})`
                  : 'linear-gradient(135deg, #6c63ff 0%, #3f3d9e 100%)'
              }}
            >
              <div className="hero-slide-content">
                <span className="hero-badge">{event.free === false ? '💳 Có phí' : '🆓 Miễn phí'}</span>
                <h2>{event.title}</h2>
                <div className="hero-meta">
                  <span>📍 {event.location}</span>
                  <span>📅 {event.startDate ? new Date(event.startDate).toLocaleDateString('vi-VN') : '—'}</span>
                </div>
                <button className="hero-cta">Xem chi tiết →</button>
              </div>
            </div>
          );
        })}
      </div>
      {slides.length > 1 && (
        <div className="hero-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`hero-dot ${i === current ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
            />
          ))}
        </div>
      )}
      {slides.length > 1 && (
        <>
          <button
            className="hero-arrow hero-arrow-left"
            onClick={(e) => { e.stopPropagation(); setCurrent(c => (c - 1 + slides.length) % slides.length); }}
          >
            ‹
          </button>
          <button
            className="hero-arrow hero-arrow-right"
            onClick={(e) => { e.stopPropagation(); setCurrent(c => (c + 1) % slides.length); }}
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
