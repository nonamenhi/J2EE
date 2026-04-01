import './CategoryBar.css';

// Keys are lowercase tag values matching what's stored in the DB tags array
const CATEGORIES = [
  { key: 'music', label: 'Âm nhạc', icon: '🎵', gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)' },
  { key: 'sports', label: 'Thể thao', icon: '⚽', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  { key: 'art', label: 'Nghệ thuật', icon: '🎨', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  { key: 'workshop', label: 'Workshop', icon: '🛠️', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  { key: 'conference', label: 'Hội thảo', icon: '🎤', gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
  { key: 'food', label: 'Ẩm thực', icon: '🍜', gradient: 'linear-gradient(135deg, #f97316, #eab308)' },
  { key: 'community', label: 'Cộng đồng', icon: '🤝', gradient: 'linear-gradient(135deg, #14b8a6, #22d3ee)' },
  { key: 'technology', label: 'Công nghệ', icon: '💻', gradient: 'linear-gradient(135deg, #6366f1, #3b82f6)' },
];

export { CATEGORIES };

export function getCategoryLabel(tagKey) {
  const cat = CATEGORIES.find(c => c.key === tagKey?.toLowerCase());
  return cat ? `${cat.icon} ${cat.label}` : tagKey;
}

export function getCategoryInfo(tagKey) {
  return CATEGORIES.find(c => c.key === tagKey?.toLowerCase()) || null;
}

export default function CategoryBar({ selected, onSelect }) {
  return (
    <div className="category-bar-wrapper">
      <div className="category-bar">
        <button
          className={`category-chip ${!selected ? 'active' : ''}`}
          onClick={() => onSelect(null)}>
          <span className="cat-icon">🌐</span>
          <span className="cat-label">Tất cả</span>
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            className={`category-chip ${selected?.toLowerCase() === c.key ? 'active' : ''}`}
            onClick={() => onSelect(c.key)}
            style={selected?.toLowerCase() === c.key ? { background: c.gradient } : {}}>
            <span className="cat-icon">{c.icon}</span>
            <span className="cat-label">{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
