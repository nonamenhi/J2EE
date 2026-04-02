const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const apiBase = apiUrl.replace(/\/api\/?$/, '');

export function getImageUrl(imagePath) {
  if (!imagePath) return null;

  const trimmed = imagePath.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/')) {
    return `${apiBase}${trimmed}`;
  }

  if (trimmed.startsWith('uploads/')) {
    return `${apiBase}/${trimmed}`;
  }

  return `${apiBase}/uploads/${trimmed}`;
}
