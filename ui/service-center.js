import { mountNav } from "./shared-nav.js";
import { requireUser } from "../services/auth-service.js";
import { can } from "../core/permissions.js";
import { PERMISSIONS } from "../core/constants.js";
import { listInitiativesFlow } from "../modules/initiative-module.js";
import {
  listServiceCatalog,
  listServiceRequests,
  createServiceRequest,
  updateServiceRequest,
  getPlatformPulse,
  serviceStatusLabel,
} from "../services/platform-hub-service.js";
import { applySubnavAccess } from "./subnav-access.js";
import { notifySuccess, notifyError } from "./notify.js";

const user = requireUser("login.html");
if (!user) throw new Error("UNAUTHORIZED");

if (!can(user.role, PERMISSIONS.PAGE_SERVICE_CENTER_VIEW)) {
  location.replace("teams.html");
  throw new Error("FORBIDDEN_SERVICE_CENTER_PAGE");
}

mountNav({ active: "services", base: "." });

const $ = (s) => document.querySelector(s);
const fmt = (n) => new Intl.NumberFormat("ar-SA").format(Number(n || 0));

const canCreateRequest =
  can(user.role, PERMISSIONS.SERVICE_REQUEST_CREATE) ||
  can(user.role, PERMISSIONS.PROTOTYPE_SUPPORT_REQUEST) ||
  can(user.role, PERMISSIONS.INITIATIVE_CREATE);

const canManageRequest =
  can(user.role, PERMISSIONS.SERVICE_REQUEST_MANAGE) ||
  can(user.role, PERMISSIONS.PROTOTYPE_SUPPORT_MANAGE) ||
  can(user.role, PERMISSIONS.ADMIN_ACCESS);

$("#who").textContent = `${user.name} - ${user.roleLabel}`;
applySubnavAccess(user);

if (canManageRequest) {
  $("#requestScopeFilter").value = "all";
}

function statusClass(status) {
  if (status === "delivered") return "good";
  if (status === "rejected") return "bad";
  if (status === "in_progress") return "warn";
  return "muted";
}

function pulseCards() {
  const pulse = getPlatformPulse(user);
  $("#pulseCards").innerHTML = pulse.highlights
    .map(
      (item) => `
      <article class="info-card">
        <h4>${item.label}</h4>
        <span class="kpi-number">${fmt(item.value)}</span>
      </article>
    `
    )
    .join("");

  $("#opsSummary").innerHTML = `
    <div class="split-item"><div><b>إجمالي المبادرات</b><div class="tiny muted">المحفظة الابتكارية الحالية</div></div><div>${fmt(
      pulse.totals.initiatives
    )}</div></div>
    <div class="split-item"><div><b>طلبات خدمة مفتوحة</b><div class="tiny muted">جديد + قيد التنفيذ</div></div><div>${fmt(
      pulse.totals.openServiceRequests
    )}</div></div>
    <div class="split-item"><div><b>نماذج جاهزة للتحكيم</b><div class="tiny muted">جودة وتقدم فوق 70%</div></div><div>${fmt(
      pulse.totals.prototypesReady
    )}</div></div>
    <div class="split-item"><div><b>إشعارات غير مقروءة</b><div class="tiny muted">حسب دورك الحالي</div></div><div>${fmt(
      pulse.totals.unreadNotifications
    )}</div></div>
  `;
}

function fillCatalog() {
  const catalog = listServiceCatalog();
  $("#serviceId").innerHTML = catalog
    .map(
      (svc) => `<option value="${svc.id}">${svc.name} - SLA ${svc.slaHours} ساعة${svc.active ? "" : " (غير مفعلة)"}</option>`
    )
    .join("");
}

function fillInitiatives() {
  const initiatives = listInitiativesFlow();
  const select = $("#initiativeId");
  const base = '<option value="">بدون ربط مباشر</option>';
  select.innerHTML =
    base +
    initiatives
      .map((item) => `<option value="${item.id}">${item.id} - ${item.title}</option>`)
      .join("");

  const qs = new URLSearchParams(location.search);
  const initId = qs.get("initiative");
  if (initId && initiatives.some((x) => x.id === initId)) {
    select.value = initId;
    $("#requestTitle").value = `طلب خدمة للمبادرة ${initId}`;
  }
}

function renderRequests() {
  const scope = $("#requestScopeFilter").value;
  const status = $("#requestStatusFilter").value;
  const q = $("#requestSearch").value.trim().toLowerCase();

  const rows = listServiceRequests({ user, status, mineOnly: scope === "mine" });
  const filtered = rows.filter((row) => {
    if (!q) return true;
    const text = `${row.id} ${row.serviceName} ${row.initiativeTitle || ""} ${row.title || ""}`.toLowerCase();
    return text.includes(q);
  });

  $("#requestRows").innerHTML = filtered
    .map((row) => {
      const statusLabel = serviceStatusLabel(row.status);
      const canEdit = canManageRequest;

      return `
        <tr>
          <td>${row.id}</td>
          <td>
            <b>${row.serviceName}</b>
            <div class="tiny muted">${row.title || "-"}</div>
          </td>
          <td>${row.initiativeTitle || "-"}</td>
          <td><span class="stage-label ${statusClass(row.status)}">${statusLabel}</span></td>
          <td>${fmt(row.slaHours || 0)} ساعة</td>
          <td>${new Date(row.updatedAt || row.createdAt).toLocaleString("ar-SA")}</td>
          <td>
            ${
              canEdit
                ? `<div class="inline-actions">
                    <select data-status-id="${row.id}">
                      <option value="requested" ${row.status === "requested" ? "selected" : ""}>جديد</option>
                      <option value="in_progress" ${row.status === "in_progress" ? "selected" : ""}>قيد التنفيذ</option>
                      <option value="delivered" ${row.status === "delivered" ? "selected" : ""}>تم التسليم</option>
                      <option value="rejected" ${row.status === "rejected" ? "selected" : ""}>مرفوض</option>
                      <option value="closed" ${row.status === "closed" ? "selected" : ""}>مغلق</option>
                    </select>
                    <button class="btn sm" data-update-id="${row.id}">تحديث</button>
                  </div>`
                : `<span class="tiny muted">${row.requestedBy?.name || "-"}</span>`
            }
          </td>
        </tr>
      `;
    })
    .join("");

  if (!filtered.length) {
    $("#requestRows").innerHTML = '<tr><td colspan="7" class="muted">لا توجد طلبات مطابقة.</td></tr>';
  }

  document.querySelectorAll("[data-update-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-update-id");
      const statusEl = document.querySelector(`[data-status-id="${id}"]`);
      const nextStatus = statusEl?.value;
      const note = prompt("ملاحظة التحديث (اختياري)", "") || "";

      try {
        await updateServiceRequest(user, id, { status: nextStatus, note });
        notifySuccess("تم تحديث طلب الخدمة.");
        pulseCards();
        renderRequests();
      } catch (e) {
        notifyError("تعذر تحديث الطلب: " + e.message);
      }
    });
  });
}

async function handleCreateRequest() {
  if (!canCreateRequest) return;

  const serviceId = $("#serviceId").value;
  const initiativeId = $("#initiativeId").value;
  const title = $("#requestTitle").value.trim();
  const description = $("#requestDescription").value.trim();
  const priority = $("#requestPriority").value;

  if (!description) {
    notifyError("اكتب وصفًا واضحًا للطلب.");
    return;
  }

  try {
    const created = await createServiceRequest(user, {
      serviceId,
      initiativeId: initiativeId || null,
      title,
      description,
      priority,
      source: "service_center",
      note: "طلب من مركز الخدمات",
    });

    $("#requestTitle").value = "";
    $("#requestDescription").value = "";
    notifySuccess(`تم إنشاء الطلب ${created.id}`);
    pulseCards();
    renderRequests();
  } catch (e) {
    notifyError("تعذر إنشاء الطلب: " + e.message);
  }
}

$("#createRequestBtn").addEventListener("click", handleCreateRequest);

if (!canCreateRequest) {
  ["#serviceId", "#initiativeId", "#requestTitle", "#requestPriority", "#requestDescription", "#createRequestBtn"].forEach((sel) => {
    const el = $(sel);
    if (el) el.disabled = true;
  });
  $("#createHint").textContent = "إنشاء الطلبات غير متاح لهذا الدور.";
}

if (!canManageRequest) {
  $("#requestScopeFilter").innerHTML = '<option value="mine" selected>طلباتي</option>';
}

["#requestSearch", "#requestStatusFilter", "#requestScopeFilter"].forEach((sel) => {
  $(sel).addEventListener("input", renderRequests);
  $(sel).addEventListener("change", renderRequests);
});

fillCatalog();
fillInitiatives();
pulseCards();
renderRequests();
