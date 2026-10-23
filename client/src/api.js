/**
 * Centralized API helper for Text-to-Speech application
 * 
 * Determines the correct endpoint based on environment:
 * 1. If VITE_API_URL is configured (e.g. backend hosted on Render / Railway / Heroku),
 *    routes all requests to that external URL.
 * 2. Otherwise defaults to relative '/api' endpoints:
 *    - In production on Netlify: routed directly to Netlify Functions via netlify.toml
 *    - In local dev (npm run dev): proxied to http://localhost:5000 via vite.config.js
 */

const rawBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

export const getApiUrl = (endpoint = '') => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  if (!rawBase) {
    return `/api/${cleanEndpoint}`;
  }

  if (rawBase.endsWith('/api')) {
    return `${rawBase}/${cleanEndpoint}`;
  }

  return `${rawBase}/api/${cleanEndpoint}`;
};
