import { bootPortal } from "../../shared/shell/shell.js";
import { api } from "../../shared/core/api-client.js";

bootPortal({ portal: "admin" });

async function renderAudit() {
  const body = document.getElementById("auditRows");
  if (!body) return;

  try {
    const res = await api("/api/v2/audit", { auth: false });
    const rows = res?.data || [];
    body.innerHTML = rows.length
      ? rows
          .slice(0, 20)
          .map(
            (item) => `
              <tr>
                <td>${item.action}</td>
                <td>${item.operation}</td>
                <td>${item.userName || item.userId || "-"}</td>
                <td>${new Date(item.createdAt).toLocaleString("ar-SA")}</td>
              </tr>
            `
          )
          .join("")
      : '<tr><td colspan="4" class="muted">No audit logs found.</td></tr>';
  } catch {
    body.innerHTML = '<tr><td colspan="4" class="muted">Audit endpoint unavailable.</td></tr>';
  }
}

async function renderRoleMatrix() {
  const root = document.getElementById("roleMatrix");
  if (!root) return;

  try {
    const res = await api("/api/v2/access/role-matrix", { auth: false });
    const data = res?.data || {};
    root.innerHTML = Object.entries(data)
      .map(
        ([role, perms]) => `
          <article class="card" style="margin-bottom:8px;">
            <h3 style="margin:0 0 4px;">${role}</h3>
            <p class="muted" style="margin:0;">${(perms || []).join(" • ")}</p>
          </article>
        `
      )
      .join("");
  } catch {
    root.innerHTML = '<div class="muted">Role matrix unavailable.</div>';
  }
}

renderAudit();
renderRoleMatrix();
