// API base URL — uses proxy in dev, env var in production
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Smart image URL — handles both Cloudinary (full URL) and local uploads
export const imgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path; // Cloudinary or external URL
  return `${API_BASE}${path}`; // local /uploads/... path
};

export default API_BASE;
