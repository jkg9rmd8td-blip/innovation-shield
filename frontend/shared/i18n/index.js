import ar from "./ar.js";
import en from "./en.js";

const DICTS = { ar, en };
const KEY = "IS_UI_LANG";

export function getLang() {
  return localStorage.getItem(KEY) || "ar";
}

export function setLang(lang) {
  if (!DICTS[lang]) return;
  localStorage.setItem(KEY, lang);
}

export function dirForLang(lang) {
  return lang === "ar" ? "rtl" : "ltr";
}

export function t(key, lang = getLang()) {
  return DICTS[lang]?.[key] || key;
}

export function toggleLang() {
  const next = getLang() === "ar" ? "en" : "ar";
  setLang(next);
  return next;
}
