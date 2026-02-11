import { readJson, writeJson, removeKey, nowISO } from "../core/storage.js";
import { ROLES } from "../core/constants.js";

const KEY = "AUTH";

export function getCurrentUser() {
  return readJson(KEY, null);
}

export function login({ name, role, identifier }) {
  const user = {
    id: identifier || `${role}-${Math.random().toString(16).slice(2, 8)}`,
    name,
    role,
    roleLabel: ROLES[role] || role,
    loginAt: nowISO(),
  };
  writeJson(KEY, user);
  return user;
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
