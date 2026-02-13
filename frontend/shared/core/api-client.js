import { getToken } from "./auth-client.js";

const KEY = "IS_API_BASE";
const DEFAULT_BASE = localStorage.getItem(KEY) || "http://127.0.0.1:8080";

export function getApiBase() {
  return localStorage.getItem(KEY) || DEFAULT_BASE;
}

export function setApiBase(base) {
  if (!base) return;
  localStorage.setItem(KEY, base);
}

export async function api(path, { method = "GET", body, auth = true } = {}) {
  const token = auth ? getToken() : null;
  const response = await fetch(`${getApiBase()}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const msg = payload?.error?.message || payload?.error || `HTTP_${response.status}`;
    throw new Error(msg);
  }

  return payload;
}
