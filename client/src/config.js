// API base URL — uses proxy in dev, env var in production
const API_BASE = process.env.REACT_APP_API_URL || '';

export default API_BASE;
