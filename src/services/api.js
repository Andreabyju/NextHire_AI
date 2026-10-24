const rawApiUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\s+/g, "");

export const API_BASE = rawApiUrl
  ? rawApiUrl.replace(/(\/api)+\/?$/, "").replace(/\/+$/, "")
  : "http://localhost:5000";

export const API_URL = `${API_BASE}/api`;



/**
 * Safe token extractor: handles objects, JSON strings, or plain token strings
 */
export function getAuthToken() {
  try {
    const raw = localStorage.getItem("nexthireai_auth");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.token && typeof parsed.token === "string") {
          return parsed.token.replace(/^["']|["']$/g, "").trim();
        }
        if (typeof parsed === "string") {
          return parsed.replace(/^["']|["']$/g, "").trim();
        }
      } catch {
        return raw.replace(/^["']|["']$/g, "").trim();
      }
    }
    const directToken = localStorage.getItem("token");
    if (directToken && typeof directToken === "string") {
      return directToken.replace(/^["']|["']$/g, "").trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Helper function for making authenticated API requests.
 */
export async function fetchWithAuth(endpoint, options = {}) {
  const token = getAuthToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.error ||
      errorData.message ||
      `API request failed with status ${response.status}`;

    // If session expired or unauthorized, trigger a custom event
    if (response.status === 401 && (errorData.code === "TOKEN_EXPIRED" || errorData.code === "TOKEN_INVALID")) {
      window.dispatchEvent(new CustomEvent("nexthireai_auth_expired"));
    }

    throw new Error(errorMessage);
  }

  return response.json();
}
