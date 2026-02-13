import { requireAdminPage } from "./admin-guard.js";
import { PERMISSIONS } from "../core/constants.js";
import { can } from "../core/permissions.js";
import { applySubnavAccess } from "./subnav-access.js";
import { listAuditLogs } from "../services/audit-service.js";
import { notifySuccess, notifyError } from "./notify.js";

const user = requireAdminPage({
  pagePermission: PERMISSIONS.PAGE_ADMIN_AUDIT_VIEW,
  active: "admin",
});

const $ = (s) => document.querySelector(s);
$("#who").textContent = `${user.name} - ${user.roleLabel}`;
applySubnavAccess(user);

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildOperationFilter(rows) {
  const ops = [...new Set(rows.map((x) => x.operation).filter(Boolean))];
  $("#auditOpFilter").innerHTML = `<option value="">كل العمليات</option>${ops
    .map((op) => `<option value="${op}">${op}</option>`)
    .join("")}`;
}

function getFilteredRows(rows) {
  const q = $("#auditSearch").value.trim().toLowerCase();
  const op = $("#auditOpFilter").value;

  return rows.filter((row) => {
    const text = `${row.user?.name || ""} ${row.operation || ""} ${row.entityId || ""}`.toLowerCase();
    if (q && !text.includes(q)) return false;
    if (op && row.operation !== op) return false;
    return true;
  });
}

if (!can(user.role, PERMISSIONS.AUDIT_READ)) {
  $("#auditHint").textContent = "لا تملك صلاحية قراءة سجل التدقيق.";
  $("#audit").innerHTML = '<tr><td colspan="7" class="muted">غير مصرح.</td></tr>';
} else {
  const sourceRows = listAuditLogs(300);
  buildOperationFilter(sourceRows);

  const render = () => {
    const rows = getFilteredRows(sourceRows);
    $("#audit").innerHTML = rows
      .map(
        (log) => `
      <tr>
        <td>${new Date(log.at).toLocaleString("ar-SA")}</td>
        <td>${log.user?.name || "system"}</td>
        <td>${log.user?.roleLabel || log.user?.role || "-"}</td>
        <td>${log.operation}</td>
        <td>${log.entityId || "-"}</td>
        <td><code class="code-scroll">${JSON.stringify(log.before)}</code></td>
        <td><code class="code-scroll">${JSON.stringify(log.after)}</code></td>
      </tr>
    `
      )
      .join("");

    if (!rows.length) {
      $("#audit").innerHTML = '<tr><td colspan="7" class="muted">لا توجد نتائج مطابقة.</td></tr>';
    }
  };

  $("#auditSearch").addEventListener("input", render);
  $("#auditOpFilter").addEventListener("change", render);

  $("#exportAuditBtn").addEventListener("click", () => {
    try {
      const rows = getFilteredRows(sourceRows);
      downloadJson(`audit-export-${Date.now()}.json`, rows);
      notifySuccess("تم تصدير سجل التدقيق.");
    } catch (e) {
      notifyError("تعذر تصدير السجل: " + e.message);
    }
  });

  render();
}
