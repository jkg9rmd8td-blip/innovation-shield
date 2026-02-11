const PREFIX = "IS_V3";

export function scopedKey(key) {
  return `${PREFIX}_${key}`;
}

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(scopedKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  localStorage.setItem(scopedKey(key), JSON.stringify(value));
}

export function removeKey(key) {
  localStorage.removeItem(scopedKey(key));
}

export function nowISO() {
  return new Date().toISOString();
}
