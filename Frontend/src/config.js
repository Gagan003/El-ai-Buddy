/**
 * API base URL for backend (auth, chat, socket).
 * In dev: use .env with VITE_API_URL=http://localhost:3000 or leave unset for default.
 * In production: set VITE_API_URL to your deployed backend URL (e.g. https://api.yourdomain.com).
 */
const raw = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
	? import.meta.env.VITE_API_URL
	: '';

// Remove trailing slash if present so concatenation doesn't produce "//"
export const API_BASE = raw.replace(/\/$/, '');

