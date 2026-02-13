import { getAuthToken } from "./auth-service.js";

const DEFAULT_API_BASE = localStorage.getItem("IS_API_BASE") || "http://127.0.0.1:8080";

export function getApiBase() {
  return localStorage.getItem("IS_API_BASE") || DEFAULT_API_BASE;
}

export function setApiBase(url) {
  if (!url) return;
  localStorage.setItem("IS_API_BASE", url);
}

export async function apiRequest(path, { method = "GET", body, headers = {}, auth = true } = {}) {
  const token = auth ? getAuthToken() : null;
  const res = await fetch(`${getApiBase()}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = payload?.error || payload?.message || `HTTP_${res.status}`;
    throw new Error(msg);
  }

  return payload;
}

export async function isBackendAvailable() {
  try {
    await apiRequest("/health/live", { auth: false });
    return true;
  } catch {
    return false;
  }
}
