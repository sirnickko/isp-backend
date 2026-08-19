// Single source of truth for the API base URL.
// Set VITE_API_URL in .env (local) and Vercel Environment Variables (production).
// e.g. VITE_API_URL=https://isp-backend-dhkl.onrender.com/api
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default API_BASE;
