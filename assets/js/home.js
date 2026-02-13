(() => {
  "use strict";

  const KEY = "is_employee_print_v1";

  function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function text(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function readSnapshot() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { mode: "Demo", total: 0, wins: 0, protos: 0 };
      const data = JSON.parse(raw);
      return {
        mode: "Live",
        total: toNumber(data?.stats?.total),
        wins: toNumber(data?.stats?.wins),
        protos: toNumber(data?.stats?.protos),
      };
    } catch {
      return { mode: "Demo", total: 0, wins: 0, protos: 0 };
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const snapshot = readSnapshot();
    text("homeTotal", new Intl.NumberFormat("ar-SA").format(snapshot.total));
    text("homeWins", new Intl.NumberFormat("ar-SA").format(snapshot.wins));
    text("homeProtos", new Intl.NumberFormat("ar-SA").format(snapshot.protos));
    text("homeDataMode", snapshot.mode);
  });
})();
