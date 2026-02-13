import { getState, mutateState } from "../core/state.js";
import { PERMISSIONS } from "../core/constants.js";
import { can } from "../core/permissions.js";
import { pushNotification } from "./notification-service.js";
import { logAudit } from "./audit-service.js";

const OPEN_REQUEST_STATUSES = new Set(["requested", "in_progress"]);

const DEFAULT_CATALOG = [
  {
    id: "svc-prototype-paas",
    name: "Prototype-as-a-Service",
    ownerRole: "support_entity",
    slaHours: 72,
    description: "دعم تصميم وتطوير النماذج الأولية ورفع الجاهزية للتحكيم.",
    active: true,
  },
  {
    id: "svc-governance-fast-track",
    name: "Governance Fast Track",
    ownerRole: "committee",
    slaHours: 24,
    description: "مسار سريع لاعتماد التعهدات والسرية قبل التحكيم.",
    active: true,
  },
  {
    id: "svc-integration-lab",
    name: "Integration Enablement",
    ownerRole: "manager",
    slaHours: 48,
    description: "تجهيز تكاملات الموارد البشرية، التدريب، والتشغيل للمبادرات.",
    active: true,
  },
];

function nextId(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}`;
}

function nowISO() {
  return new Date().toISOString();
}

function requestStatusLabel(status) {
  if (status === "requested") return "جديد";
  if (status === "in_progress") return "قيد التنفيذ";
  if (status === "delivered") return "تم التسليم";
  if (status === "rejected") return "مرفوض";
  return "مغلق";
}

function canCreateRequest(user) {
  if (!user) return false;
  return (
    can(user.role, PERMISSIONS.SERVICE_REQUEST_CREATE) ||
    can(user.role, PERMISSIONS.PROTOTYPE_SUPPORT_REQUEST) ||
    can(user.role, PERMISSIONS.INITIATIVE_CREATE)
  );
}

function canManageRequest(user) {
  if (!user) return false;
  return (
    can(user.role, PERMISSIONS.SERVICE_REQUEST_MANAGE) ||
    can(user.role, PERMISSIONS.PROTOTYPE_SUPPORT_MANAGE) ||
    can(user.role, PERMISSIONS.ADMIN_ACCESS)
  );
}

function ensureHub(state) {
  state.serviceHub = state.serviceHub || {};
  state.serviceHub.catalog = Array.isArray(state.serviceHub.catalog) ? state.serviceHub.catalog : [];
  state.serviceHub.requests = Array.isArray(state.serviceHub.requests) ? state.serviceHub.requests : [];

  if (!state.serviceHub.catalog.length) {
    state.serviceHub.catalog = structuredClone(DEFAULT_CATALOG);
  } else {
    DEFAULT_CATALOG.forEach((svc) => {
      if (!state.serviceHub.catalog.some((x) => x.id === svc.id)) {
        state.serviceHub.catalog.push(structuredClone(svc));
      }
    });
  }

  syncPrototypeSupportRequests(state);
}

function protoSourceKey(item) {
  const support = item?.prototype?.supportRequest;
  if (!support) return "";
  return `proto:${item.id}:${support.id || support.requestedAt || item.createdAt || "legacy"}`;
}

function syncPrototypeSupportRequests(state) {
  const requests = state.serviceHub.requests;
  const catalog = state.serviceHub.catalog;
  if (!catalog.some((x) => x.id === "svc-prototype-paas")) {
    catalog.unshift(structuredClone(DEFAULT_CATALOG[0]));
  }

  (state.initiatives || []).forEach((item) => {
    const support = item.prototype?.supportRequest;
    if (!support) return;

    const sourceKey = protoSourceKey(item);
    const existing = requests.find((x) => x.sourceKey === sourceKey);

    const base = {
      serviceId: "svc-prototype-paas",
      serviceName: "Prototype-as-a-Service",
      initiativeId: item.id,
      initiativeTitle: item.title,
      title: `دعم نموذج أولي - ${item.id}`,
      description: support.note || item.prototype?.scope || "طلب دعم للنموذج الأولي",
      priority: "medium",
      requestedBy: {
        id: support.requestedBy || item.ownerUserId || "unknown",
        name: support.requestedByName || item.owner || "غير معروف",
        role: support.requestedByRole || "innovator",
      },
      assigneeRole: "support_entity",
      slaHours: Number(support.slaHours || 72),
      status: support.status || "requested",
      source: "prototype",
      sourceKey,
    };

    if (!existing) {
      requests.unshift({
        id: nextId("SRV"),
        ...base,
        createdAt: support.requestedAt || nowISO(),
        updatedAt: nowISO(),
        history: [
          {
            at: support.requestedAt || nowISO(),
            by: support.requestedByName || item.owner || "System",
            action: "create",
            note: "تم إنشاء الطلب من وحدة النماذج الأولية",
            status: support.status || "requested",
          },
        ],
      });
      return;
    }

    const normalizedStatus = support.status || "requested";
    if (existing.status !== normalizedStatus) {
      existing.status = normalizedStatus;
      existing.updatedAt = nowISO();
      existing.history = Array.isArray(existing.history) ? existing.history : [];
      existing.history.unshift({
        at: nowISO(),
        by: "Prototype Unit",
        action: "sync_status",
        note: "مزامنة حالة الطلب مع وحدة النماذج الأولية",
        status: normalizedStatus,
      });
      existing.history = existing.history.slice(0, 80);
    }
  });

  requests.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
  state.serviceHub.requests = requests.slice(0, 600);
}

function getInitiativeLabel(state, id) {
  if (!id) return "-";
  const item = (state.initiatives || []).find((x) => x.id === id);
  return item ? `${item.id} - ${item.title}` : id;
}

function visibleRequestsForUser(user, requests) {
  if (!user) return [];
  if (canManageRequest(user)) return requests;
  return requests.filter((row) => {
    if (row.requestedBy?.id === user.id) return true;
    if (row.requestedBy?.role === user.role && OPEN_REQUEST_STATUSES.has(row.status)) return true;
    return false;
  });
}

function writeBackPrototypeSupport(state, request) {
  if (!request?.initiativeId) return;
  const item = (state.initiatives || []).find((x) => x.id === request.initiativeId);
  if (!item?.prototype?.supportRequest) return;
  item.prototype.supportRequest.status = request.status;
  item.prototype.supportRequest.slaHours = Number(request.slaHours || item.prototype.supportRequest.slaHours || 72);
  item.prototype.supportRequest.note = request.description || item.prototype.supportRequest.note || "";
  item.prototype.supportRequest.requestedBy = request.requestedBy?.id || item.prototype.supportRequest.requestedBy;
  item.prototype.supportRequest.requestedByName = request.requestedBy?.name || item.prototype.supportRequest.requestedByName;
}

export function listServiceCatalog() {
  return ensureServiceHubState().serviceHub.catalog || [];
}

export function listServiceRequests({ user = null, status = "", serviceId = "", initiativeId = "", mineOnly = false } = {}) {
  const state = ensureServiceHubState();
  const allRows = state.serviceHub.requests || [];
  const scopedRows = user && !canManageRequest(user) ? visibleRequestsForUser(user, allRows) : allRows;
  const base = mineOnly ? visibleRequestsForUser(user, allRows) : scopedRows;
  return base.filter((row) => {
    if (status && row.status !== status) return false;
    if (serviceId && row.serviceId !== serviceId) return false;
    if (initiativeId && row.initiativeId !== initiativeId) return false;
    return true;
  });
}

export function createServiceRequest(user, payload = {}) {
  if (!canCreateRequest(user)) throw new Error("FORBIDDEN_SERVICE_REQUEST_CREATE");
  if (!payload.serviceId) throw new Error("SERVICE_ID_REQUIRED");

  let created = null;
  mutateState((state) => {
    ensureHub(state);
    const svc = state.serviceHub.catalog.find((x) => x.id === payload.serviceId);
    if (!svc || !svc.active) throw new Error("SERVICE_NOT_AVAILABLE");

    const id = nextId("SRV");
    const now = nowISO();
    const itemTitle = getInitiativeLabel(state, payload.initiativeId);

    created = {
      id,
      serviceId: svc.id,
      serviceName: svc.name,
      initiativeId: payload.initiativeId || null,
      initiativeTitle: itemTitle,
      title: payload.title?.trim() || `طلب خدمة ${svc.name}`,
      description: payload.description?.trim() || "طلب خدمة جديد",
      priority: payload.priority || "medium",
      requestedBy: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      assigneeRole: payload.assigneeRole || svc.ownerRole || "support_entity",
      slaHours: Number(payload.slaHours || svc.slaHours || 72),
      status: "requested",
      source: payload.source || "manual",
      sourceKey: payload.sourceKey || `manual:${id}`,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          at: now,
          by: user.name,
          action: "create",
          note: payload.note?.trim() || "تم إنشاء الطلب",
          status: "requested",
        },
      ],
    };

    state.serviceHub.requests.unshift(created);
    state.serviceHub.requests = state.serviceHub.requests.slice(0, 600);
    writeBackPrototypeSupport(state, created);
    return state;
  });

  pushNotification({
    roleTarget: created.assigneeRole,
    type: "service_request_created",
    message: `طلب خدمة جديد (${created.id}) - ${created.serviceName}`,
    entityId: created.initiativeId || created.id,
  });

  logAudit({
    user,
    action: "SERVICE_REQUEST_CREATE",
    operation: "service_request_create",
    entityId: created.id,
    before: null,
    after: created,
  });

  return created;
}

export function updateServiceRequest(user, requestId, { status, note = "", slaHours = null } = {}) {
  if (!canManageRequest(user)) throw new Error("FORBIDDEN_SERVICE_REQUEST_MANAGE");
  if (!requestId) throw new Error("SERVICE_REQUEST_ID_REQUIRED");

  let before = null;
  let after = null;

  mutateState((state) => {
    ensureHub(state);
    const row = state.serviceHub.requests.find((x) => x.id === requestId);
    if (!row) throw new Error("SERVICE_REQUEST_NOT_FOUND");
    before = structuredClone(row);

    if (status) row.status = status;
    if (slaHours != null) row.slaHours = Math.max(12, Number(slaHours || row.slaHours || 72));
    row.updatedAt = nowISO();
    row.history = Array.isArray(row.history) ? row.history : [];
    row.history.unshift({
      at: row.updatedAt,
      by: user.name,
      action: "status_update",
      note: note || "تحديث حالة الطلب",
      status: row.status,
    });
    row.history = row.history.slice(0, 80);

    writeBackPrototypeSupport(state, row);
    after = structuredClone(row);
    return state;
  });

  pushNotification({
    roleTarget: before?.requestedBy?.role || "innovator",
    type: "service_request_updated",
    message: `تم تحديث طلب الخدمة ${requestId} إلى (${requestStatusLabel(after.status)})`,
    entityId: after.initiativeId || after.id,
  });

  logAudit({
    user,
    action: "SERVICE_REQUEST_UPDATE",
    operation: "service_request_update",
    entityId: requestId,
    before,
    after,
  });

  return after;
}

export function getPlatformPulse(user) {
  const state = ensureServiceHubState();
  const initiatives = state.initiatives || [];
  const notifications = (state.notifications || []).filter((n) => !n.roleTarget || n.roleTarget === user?.role);
  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const visibleRequests = visibleRequestsForUser(user, state.serviceHub.requests || []);
  const openServiceRequests = visibleRequests.filter((x) => OPEN_REQUEST_STATUSES.has(x.status)).length;
  const totalServiceRequests = visibleRequests.length;
  const lockedJudging = initiatives.filter((x) => x.judgingLocked).length;
  const prototypesReady = initiatives.filter((x) => {
    const progress = Number(x.prototype?.progress || 0);
    const quality = Number(x.prototype?.quality?.total || x.prototype?.quality || 0);
    return progress >= 70 && quality >= 70;
  }).length;

  return {
    totals: {
      initiatives: initiatives.length,
      inReview: initiatives.filter((x) => x.status === "قيد التحكيم").length,
      approved: initiatives.filter((x) => x.status === "معتمد" || x.status === "مطلق").length,
      unreadNotifications,
      openServiceRequests,
      totalServiceRequests,
      lockedJudging,
      prototypesReady,
    },
    highlights: [
      { key: "notifications", label: "إشعارات غير مقروءة", value: unreadNotifications },
      { key: "services", label: "طلبات خدمة مفتوحة", value: openServiceRequests },
      { key: "prototypes", label: "نماذج جاهزة للتحكيم", value: prototypesReady },
      { key: "locked", label: "تحكيم مقفل", value: lockedJudging },
    ],
  };
}

export function ensureServiceHubState() {
  return mutateState((state) => {
    ensureHub(state);
    return state;
  });
}

export function serviceStatusLabel(status) {
  return requestStatusLabel(status);
}
