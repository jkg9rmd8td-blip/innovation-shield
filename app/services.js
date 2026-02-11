/* Innovation Shield — Shared Services Layer (Static Demo) */
(function () {
  const KEY_SERVICES = "IS_SERVICES";
  const KEY_REQUESTS = "IS_SERVICE_REQUESTS";

  const DEFAULT_SERVICES = [
    {
      id: "svc-compliance-guard",
      name: "Compliance Guard",
      owner: "إدارة الحوكمة",
      sla: "24 ساعة",
      description: "فحص الالتزام بالسياسات قبل التحكيم.",
      active: true,
    },
    {
      id: "svc-impact-lab",
      name: "Impact Lab",
      owner: "مركز التحول",
      sla: "48 ساعة",
      description: "تحليل الأثر التشغيلي والمالي للمبادرات.",
      active: true,
    },
    {
      id: "svc-priority-engine",
      name: "Priority Engine",
      owner: "مكتب الابتكار",
      sla: "فوري",
      description: "ترتيب الأولويات حسب الجاهزية والمخاطر.",
      active: false,
    },
  ];

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid(prefix) {
    return `${prefix}-${Math.random().toString(16).slice(2, 8)}-${Date.now().toString(16).slice(-4)}`;
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function ensureSeed() {
    const current = read(KEY_SERVICES, null);
    if (!Array.isArray(current) || !current.length) {
      write(KEY_SERVICES, DEFAULT_SERVICES);
      return DEFAULT_SERVICES.slice();
    }
    return current;
  }

  function getCatalog() {
    return read(KEY_SERVICES, DEFAULT_SERVICES);
  }

  function setCatalog(services) {
    write(KEY_SERVICES, services);
  }

  function toggleService(serviceId, actor) {
    const next = getCatalog().map((s) => {
      if (s.id !== serviceId) return s;
      return { ...s, active: !s.active };
    });
    setCatalog(next);
    if (window.ISAuth?.audit) {
      window.ISAuth.audit("SERVICE_TOGGLE", { serviceId, actor: actor || "System" });
    }
    return next;
  }

  function listRequests() {
    return read(KEY_REQUESTS, []);
  }

  function setRequests(requests) {
    write(KEY_REQUESTS, requests);
  }

  function createRequest(payload) {
    const req = {
      id: uid("REQ"),
      serviceId: payload.serviceId,
      serviceName: payload.serviceName,
      title: payload.title || "طلب خدمة",
      description: payload.description || "",
      priority: payload.priority || "متوسط",
      status: "جديد",
      requestedBy: payload.requestedBy || "غير معروف",
      requesterRole: payload.requesterRole || "—",
      requestedAt: nowISO(),
      updatedAt: nowISO(),
    };

    const next = [req, ...listRequests()];
    setRequests(next);

    if (window.ISAuth?.audit) {
      window.ISAuth.audit("SERVICE_REQUEST_CREATE", {
        requestId: req.id,
        serviceId: req.serviceId,
        title: req.title,
      });
    }

    return req;
  }

  function updateRequestStatus(id, status, actor) {
    const next = listRequests().map((r) => {
      if (r.id !== id) return r;
      return { ...r, status, updatedAt: nowISO() };
    });
    setRequests(next);

    if (window.ISAuth?.audit) {
      window.ISAuth.audit("SERVICE_REQUEST_STATUS", { requestId: id, status, actor: actor || "System" });
    }

    return next;
  }

  function summary() {
    const requests = listRequests();
    const openStatuses = new Set(["جديد", "قيد التنفيذ"]);
    return {
      totalServices: getCatalog().length,
      activeServices: getCatalog().filter((s) => s.active).length,
      totalRequests: requests.length,
      openRequests: requests.filter((r) => openStatuses.has(r.status)).length,
    };
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("ar-SA");
  }

  ensureSeed();

  window.ISServices = {
    KEY_SERVICES,
    KEY_REQUESTS,
    ensureSeed,
    getCatalog,
    setCatalog,
    toggleService,
    listRequests,
    createRequest,
    updateRequestStatus,
    summary,
    formatDate,
  };
})();
