export function getApiBaseUrl() {
  return (
    import.meta.env.VITE_API_BASE_URL ||
    'http://127.0.0.1/SUPPLIER-RELATIONSHIP-MANAGEMENT-main/SRM_PROJECT/backend/api'
  ).replace(/\/$/, '');
}
