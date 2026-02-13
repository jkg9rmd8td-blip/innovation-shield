export function redirectTo(url) {
  location.replace(url);
}

export function withLang(url, lang) {
  const u = new URL(url, location.origin);
  u.searchParams.set("lang", lang);
  return `${u.pathname}${u.search}`;
}
