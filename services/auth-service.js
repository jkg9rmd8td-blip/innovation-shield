import { readJson, writeJson, removeKey, nowISO } from "../core/storage.js";
import { ROLES } from "../core/constants.js";

const KEY = "AUTH";

function apiBase() {
  return localStorage.getItem("IS_API_BASE") || "http://127.0.0.1:8080";
}

export function getCurrentUser() {
  return readJson(KEY, null);
}

export function getAuthToken() {
  return getCurrentUser()?.token || null;
}

function saveSession({ user, token = null, mode = "local" }) {
  const session = {
    ...user,
    roleLabel: ROLES[user.role] || user.role,
    department: user.department || "غير محدد",
    loginAt: nowISO(),
    token,
    sessionMode: mode,
  };
  writeJson(KEY, session);
  return session;
}

async function loginViaBackend({ name, role, identifier, passcode, department }) {
  const res = await fetch(`${apiBase()}/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      role,
      id: identifier,
      passcode,
      department,
    }),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || `AUTH_HTTP_${res.status}`);
  }

  const payload = await res.json();
  if (!payload?.token || !payload?.user) {
    throw new Error("INVALID_AUTH_RESPONSE");
  }

  return saveSession({
    user: payload.user,
    token: payload.token,
    mode: "api",
  });
}

export async function login({ name, role, identifier, passcode = "", department = "غير محدد", preferBackend = true }) {
  if (preferBackend) {
    try {
      return await loginViaBackend({ name, role, identifier, passcode, department });
    } catch {
      // Fallback to local session to keep offline mode available.
    }
  }

  return saveSession({
    user: {
      id: identifier || `${role}-${Math.random().toString(16).slice(2, 8)}`,
      name,
      role,
      department,
    },
    token: null,
    mode: "local",
  });
}

export function logout() {
  removeKey(KEY);
}

export function requireUser(redirect = "login.html") {
  const user = getCurrentUser();
  if (!user) {
    location.replace(redirect);
    return null;
  }
  return user;
}
