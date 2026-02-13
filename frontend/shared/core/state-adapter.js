const KEY = "is_state_v1";

export function readLegacyState() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function toKpis(state) {
  const initiatives = Array.isArray(state?.initiatives) ? state.initiatives : [];
  const prototypes = initiatives.filter((x) => !!x.prototype);
  const services = Array.isArray(state?.serviceRequests) ? state.serviceRequests : [];
  const audit = Array.isArray(state?.audit) ? state.audit : [];
  return {
    initiatives: initiatives.length,
    prototypes: prototypes.length,
    services: services.length,
    audit: audit.length,
  };
}
