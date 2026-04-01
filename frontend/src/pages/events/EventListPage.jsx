import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { getImageUrl } from '../../utils/getImageUrl';
import Navbar from '../../components/common/Navbar';
import HeroBanner from '../../components/common/HeroBanner';
import CategoryBar, { getCategoryInfo } from '../../components/common/CategoryBar';
import TrendingSection from '../../components/common/TrendingSection';
import { SkeletonList } from '../../components/common/Skeleton';
import './Events.css';

export default function EventListPage() {
  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [tags, setTags] = useState([]);
  const [locations, setLocations] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const keyword = searchParams.get('keyword') || '';
  const tag = searchParams.get('tag') || '';
  const location = searchParams.get('location') || '';
  const timeFilter = searchParams.get('time') || '';
  const page = parseInt(searchParams.get('page') || '0');

  // Load trending + featured once
  useEffect(() => {
    axiosInstance.get('/events/trending').then(r => setTrending(r.data)).catch(() => {});
    axiosInstance.get('/events/featured').then(r => setFeatured(r.data)).catch(() => {});
    axiosInstance.get('/events/tags').then(r => setTags(r.data)).catch(() => {});
    axiosInstance.get('/events/locations').then(r => setLocations(r.data)).catch(() => {});
  }, []);

  // Load events with filters
  useEffect(() => {
    setLoading(true);
    const params = { page, size: 9 };
    if (keyword) params.keyword = keyword;
    if (tag) params.tag = tag;
    if (location) params.location = location;

    // Quick time filters
    if (timeFilter === 'today') {
      const today = new Date().toISOString().slice(0, 10);
      params.dateFrom = today;
      params.dateTo = today;
    } else if (timeFilter === 'weekend') {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const saturday = new Date(now);
      saturday.setDate(now.getDate() + (6 - dayOfWeek));
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      params.dateFrom = saturday.toISOString().slice(0, 10);
      params.dateTo = sunday.toISOString().slice(0, 10);
    } else if (timeFilter === 'month') {
      const now = new Date();
      params.dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      params.dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    }

    axiosInstance.get('/events', { params })
      .then(r => {
        setEvents(r.data.content || []);
        setTotalPages(r.data.totalPages || 0);
        setTotalElements(r.data.totalElements || 0);
      })
      .finally(() => setLoading(false));
  }, [keyword, tag, location, page, timeFilter]);

  const updateFilter = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  const getMinPrice = (event) => {
    if (event.free !== false) return null;
    if (!event.seatZones || event.seatZones.length === 0) return 0;
    return Math.min(...event.seatZones.map(z => z.price));
  };

  const isHot = (event) =>
    event.maxCapacity > 0 && event.currentAttendees / event.maxCapacity >= 0.8;

  const hasActiveFilters = keyword || tag || location || timeFilter;
  const tagCategoryInfo = tag ? getCategoryInfo(tag) : null;

  // Countdown helper
  const getCountdown = (startDate) => {
    if (!startDate) return null;
    const diff = new Date(startDate) - new Date();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 30) return null;
    if (days === 0) return 'Hôm nay';
    if (days === 1) return 'Ngày mai';
    return `Còn ${days} ngày`;
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="events-container">
        {/* Hero */}
        <HeroBanner events={featured.length ? featured : trending} />

        {/* Category Bar — filters by tag */}
        <CategoryBar selected={tag}
          onSelect={(t) => updateFilter('tag', t)} />

        {/* Quick Time Filters */}
        <div className="quick-filters">
          <button className={`qf-btn ${timeFilter === '' ? 'active' : ''}`}
            onClick={() => updateFilter('time', '')}>📋 Tất cả</button>
          <button className={`qf-btn ${timeFilter === 'today' ? 'active' : ''}`}
            onClick={() => updateFilter('time', 'today')}>📅 Hôm nay</button>
          <button className={`qf-btn ${timeFilter === 'weekend' ? 'active' : ''}`}
            onClick={() => updateFilter('time', 'weekend')}>🌙 Cuối tuần</button>
          <button className={`qf-btn ${timeFilter === 'month' ? 'active' : ''}`}
            onClick={() => updateFilter('time', 'month')}>📆 Tháng này</button>
        </div>

        {/* Search & Filter Bar */}
        <div className="filter-bar">
          <input type="text" placeholder="🔍 Tìm kiếm sự kiện..."
            defaultValue={keyword}
            onKeyDown={e => { if (e.key === 'Enter') updateFilter('keyword', e.target.value); }} />
          <select value={location} onChange={e => updateFilter('location', e.target.value)}>
            <option value="">📍 Tất cả địa điểm</option>
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="active-filters">
            <span className="af-label">Bộ lọc:</span>
            {keyword && (
              <span className="af-chip" onClick={() => updateFilter('keyword', '')}>
                🔍 "{keyword}" ×
              </span>
            )}
            {tag && (
              tagCategoryInfo ? (
                <span className="af-chip af-chip-cat" onClick={() => updateFilter('tag', '')}
                  style={{ background: tagCategoryInfo.gradient }}>
                  {tagCategoryInfo.icon} {tagCategoryInfo.label} ×
                </span>
              ) : (
                <span className="af-chip" onClick={() => updateFilter('tag', '')}>
                  🏷️ {tag} ×
                </span>
              )
            )}
            {location && (
              <span className="af-chip" onClick={() => updateFilter('location', '')}>
                📍 {location} ×
              </span>
            )}
            {timeFilter && (
              <span className="af-chip" onClick={() => updateFilter('time', '')}>
                📅 {timeFilter === 'today' ? 'Hôm nay' : timeFilter === 'weekend' ? 'Cuối tuần' : 'Tháng này'} ×
              </span>
            )}
            <button className="af-clear" onClick={clearAllFilters}>Xóa tất cả</button>
          </div>
        )}

        {/* Trending Section */}
        {!keyword && !tag && page === 0 && <TrendingSection events={trending} />}

        {/* Event Grid */}
        <div className="section-header">
          <h3 className="section-title">
            {tag && tagCategoryInfo
              ? `${tagCategoryInfo.icon} ${tagCategoryInfo.label}`
              : tag
                ? `🏷️ ${tag}`
                : '🎫 Tất cả sự kiện'}
          </h3>
          {!loading && <span className="section-count">{totalElements} sự kiện</span>}
        </div>

        {loading ? <SkeletonList count={6} /> : (
          events.length === 0 ? (
            <div className="empty-state">
              <span className="empty-emoji">🎭</span>
              <p>Không tìm thấy sự kiện nào</p>
              {hasActiveFilters && (
                <button className="empty-clear" onClick={clearAllFilters}>
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="events-grid">
              {events.map(event => {
                const minPrice = getMinPrice(event);
                const eventImage = getImageUrl(event.bannerImagePath);
                const countdown = getCountdown(event.startDate);
                // Show tag category info on card
                const firstTag = event.tags?.[0];
                const firstTagInfo = firstTag ? getCategoryInfo(firstTag) : null;
                return (
                  <div key={event.id} className="event-card"
                    onClick={() => navigate(`/events/${event.id}`)}>
                    {isHot(event) && <span className="hot-badge">🔥 HOT</span>}
                    <div className="event-img"
                      style={{
                        backgroundImage: eventImage
                          ? `linear-gradient(rgba(8,8,20,0.15), rgba(8,8,20,0.35)), url(${eventImage})`
                          : 'linear-gradient(135deg, #6c63ff 0%, #3f3d9e 100%)'
                      }}>
                      <span className="event-date-badge">
                        {event.startDate
                          ? new Date(event.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })
                          : '—'}
                      </span>
                      {countdown && <span className="event-countdown">{countdown}</span>}
                    </div>
                    <div className="event-body">
                      <h4 className="event-title">{event.title}</h4>
                      <div className="event-meta">
                        <span>📍 {event.location}</span>
                        <span>👥 {event.currentAttendees || 0}</span>
                      </div>
                      <div className="event-footer">
                        <span className="event-price">
                          {minPrice === null ? '🆓 Miễn phí' : `💳 Từ ${minPrice.toLocaleString('vi-VN')}đ`}
                        </span>
                        {firstTagInfo ? (
                          <span className="event-cat-badge" style={{ background: firstTagInfo.gradient }}>
                            {firstTagInfo.icon} {firstTagInfo.label}
                          </span>
                        ) : firstTag ? (
                          <span className="event-tag">{firstTag}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 0}
              onClick={() => updateFilter('page', String(page - 1))}>‹</button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i}
                className={`page-btn ${i === page ? 'active' : ''}`}
                onClick={() => updateFilter('page', i === 0 ? '' : String(i))}>
                {i + 1}
              </button>
            ))}
            <button className="page-btn" disabled={page >= totalPages - 1}
              onClick={() => updateFilter('page', String(page + 1))}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}
