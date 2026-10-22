export const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
  : "http://localhost:5000";

export const API_URL = `${API_BASE}/api`;


/**
 * Helper function for making authenticated API requests.
 */
export async function fetchWithAuth(endpoint, options = {}) {
  const token = JSON.parse(localStorage.getItem("nexthireai_auth"))?.token;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API request failed with status ${response.status}`);
  }

  return response.json();
}
