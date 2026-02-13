(() => {
  "use strict";

  const KEY = "is_employee_print_v1";

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function readRows() {
    try {
      const raw = localStorage.getItem(KEY);
      const data = raw ? JSON.parse(raw) : null;
      return Array.isArray(data?.prototypes) ? data.prototypes : [];
    } catch {
      return [];
    }
  }

  function render() {
    const root = document.getElementById("protoHubList");
    if (!root) return;

    const rows = readRows();
    if (!rows.length) {
      root.innerHTML = '<div class="proto-empty">لا توجد نماذج محفوظة في هذا المتصفح حاليًا. افتح بوابة الموظف وابدأ توليد نموذج جديد.</div>';
      return;
    }

    root.innerHTML = rows
      .slice(0, 6)
      .map((item) => {
        const status = item.status || "غير محدد";
        return `
          <article class="proto-item">
            <h4>${escapeHtml(item.title || item.id || "نموذج")}</h4>
            <p>المعرف: ${escapeHtml(item.id || "—")}</p>
            <p>الدعم: ${escapeHtml(item.support || "—")}</p>
            <span class="proto-status">${escapeHtml(status)}</span>
          </article>
        `;
      })
      .join("");
  }

  document.addEventListener("DOMContentLoaded", render);
})();
