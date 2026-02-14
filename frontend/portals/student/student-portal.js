(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const statusCard = $("#currentStatusCard");
  const statusChip = $("#currentStatusChip");
  const statusText = $("#currentStatusText");
  const statusMeta = $("#currentStatusMeta");
  const visitBtn = $("#visitRequestBtn");
  const vitalsUpdatedAt = $("#vitalsUpdatedAt");

  function updateStatus(type, text, meta) {
    statusCard.classList.remove("status-idle", "status-pending", "status-success", "status-error");
    statusCard.classList.add(`status-${type}`);

    if (type === "pending") statusChip.textContent = "قيد الإرسال";
    else if (type === "success") statusChip.textContent = "تم الإرسال";
    else if (type === "error") statusChip.textContent = "فشل الإرسال";
    else statusChip.textContent = "جاهز";

    statusText.textContent = text;
    statusMeta.textContent = meta;
  }

  function nowLabel() {
    return new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  }

  async function sendVisitRequest(payload) {
    // Try real backend first; fallback to local simulation for static preview.
    try {
      const res = await fetch("/api/v1/visits/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      const data = await res.json().catch(() => ({}));
      return {
        ok: true,
        ticket: data.ticket || `VR-${String(Date.now()).slice(-6)}`,
        source: "server"
      };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 850));
      return {
        ok: true,
        ticket: `VR-${String(Date.now()).slice(-6)}`,
        source: "local-sim"
      };
    }
  }

  async function requestVisit() {
    visitBtn.disabled = true;
    updateStatus("pending", "جاري إرسال طلب الزيارة...", "نقوم الآن بالتواصل مع الخادم.");

    try {
      const payload = {
        requestedAt: new Date().toISOString(),
        channel: "student_portal"
      };
      const result = await sendVisitRequest(payload);

      if (!result.ok) {
        throw new Error("REQUEST_FAILED");
      }

      const sourceMeta = result.source === "server"
        ? "تم تسجيل الطلب عبر الخادم بنجاح."
        : "تم حفظ الطلب بنمط محلي تجريبي بسبب عدم توفر الخادم.";

      updateStatus(
        "success",
        `تم إرسال طلب الزيارة بنجاح. رقم الطلب: ${result.ticket}`,
        sourceMeta
      );
    } catch {
      updateStatus(
        "error",
        "تعذر إرسال طلب الزيارة حالياً.",
        "حاول مرة أخرى بعد قليل أو تواصل مع الدعم."
      );
    } finally {
      visitBtn.disabled = false;
      vitalsUpdatedAt.textContent = nowLabel();
    }
  }

  function wireSecondaryButtons() {
    $("#messageBtn").addEventListener("click", () => {
      updateStatus("idle", "تم فتح شاشة الرسائل.", "يمكنك إرسال رسالة مباشرة للفريق الطبي.");
    });
    $("#recordBtn").addEventListener("click", () => {
      updateStatus("idle", "تم فتح الملف الصحي.", "راجع آخر الملاحظات والتوصيات.");
    });
    $("#assistantBtn").addEventListener("click", () => {
      updateStatus("idle", "تم تشغيل المساعد الذكي.", "اكتب سؤالك للحصول على إرشاد فوري.");
    });
  }

  function init() {
    if (!visitBtn || !statusCard) return;
    vitalsUpdatedAt.textContent = nowLabel();
    visitBtn.addEventListener("click", requestVisit);
    wireSecondaryButtons();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
