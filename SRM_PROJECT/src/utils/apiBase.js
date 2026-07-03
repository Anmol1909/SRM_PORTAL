export function getApiBaseUrl() {
  return (
    import.meta.env.VITE_API_BASE_URL ||
    'https://srm-backend-zw9h.onrender.com/api'
  ).replace(/\/$/, '');
}