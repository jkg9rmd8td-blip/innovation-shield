const KEY_TOKEN = "IS_AUTH_TOKEN";
const KEY_USER = "IS_AUTH_USER";

export function getToken() {
  return localStorage.getItem(KEY_TOKEN) || "";
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(KEY_USER) || "null");
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(KEY_TOKEN, session?.token || "");
  localStorage.setItem(KEY_USER, JSON.stringify(session?.user || null));
}

export function clearSession() {
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_USER);
}
