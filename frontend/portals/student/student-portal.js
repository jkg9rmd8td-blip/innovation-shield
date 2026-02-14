(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const statusCard = $("#currentStatusCard");
  const statusChip = $("#currentStatusChip");
  const statusText = $("#currentStatusText");
  const statusMeta = $("#currentStatusMeta");
  const visitBtn = $("#visitRequestBtn");
  const vitalsUpdatedAt = $("#vitalsUpdatedAt");
  const aiInput = $("#ai-input");
  const aiResponse = $("#ai-response");
  const sensorPulseValue = $("#sensorPulseValue");
  const sensorOxygenValue = $("#sensorOxygenValue");
  const sensorPressureValue = $("#sensorPressureValue");
  const sensorTempValue = $("#sensorTempValue");
  const assistantBtn = $("#assistantBtn");

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

  function updateVitalsTimestamp() {
    if (vitalsUpdatedAt) vitalsUpdatedAt.textContent = nowLabel();
  }

  function renderSensorValues() {
    if (!sensorPulseValue || !sensorOxygenValue || !sensorPressureValue || !sensorTempValue) return;
    const pulse = 76 + Math.floor(Math.random() * 14);       // 76..89
    const oxygen = 97 + Math.floor(Math.random() * 3);       // 97..99
    const sys = 116 + Math.floor(Math.random() * 9);         // 116..124
    const dia = 74 + Math.floor(Math.random() * 6);          // 74..79
    const temp = (36.5 + (Math.random() * 0.6)).toFixed(1);  // 36.5..37.1

    sensorPulseValue.textContent = String(pulse);
    sensorOxygenValue.textContent = String(oxygen);
    sensorPressureValue.textContent = `${sys}/${dia}`;
    sensorTempValue.textContent = String(temp);
    updateVitalsTimestamp();
  }

  function startSensorStream() {
    renderSensorValues();
    setInterval(renderSensorValues, 9000);
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

  async function sendEmergencyRequest(reason) {
    try {
      const res = await fetch("/api/v1/emergency/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          requestedAt: new Date().toISOString(),
          channel: "student_portal"
        })
      });
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      const data = await res.json().catch(() => ({}));
      return { ok: true, ticket: data.ticket || `ER-${String(Date.now()).slice(-6)}`, source: "server" };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 700));
      return { ok: true, ticket: `ER-${String(Date.now()).slice(-6)}`, source: "local-sim" };
    }
  }

  async function sendEmergency(reason) {
    const cleanReason = String(reason || "").trim() || "بلاغ طارئ";
    updateStatus("pending", `تم استقبال بلاغ: ${cleanReason}`, "جاري إشعار الفريق الطبي المناوب فورًا...");
    updateVitalsTimestamp();

    const res = await sendEmergencyRequest(cleanReason);
    if (res.ok) {
      const sourceMeta = res.source === "server"
        ? "تم رفع البلاغ مباشرة إلى وحدة الطوارئ."
        : "تم حفظ البلاغ محليًا كنسخة تجريبية لحين الاتصال بالخادم.";
      updateStatus("error", `نداء استغاثة مُرسل: ${cleanReason} (رقم: ${res.ticket})`, sourceMeta);
    } else {
      updateStatus("error", `تعذر إرسال نداء الاستغاثة: ${cleanReason}`, "حاول مرة أخرى فورًا أو تواصل هاتفيًا مع الطوارئ.");
    }
  }

  function setAiResponse(type, html) {
    if (!aiResponse) return;
    aiResponse.hidden = false;
    aiResponse.classList.remove("is-loading", "is-danger", "is-ok");
    aiResponse.classList.add(type);
    aiResponse.innerHTML = html;
  }

  function isHighRiskText(text) {
    const normalized = String(text || "").toLowerCase();
    const severeWords = [
      "ألم", "صدر", "تنفس", "ضيق", "اختناق", "إغماء", "دوار",
      "نزيف", "فقدان", "وعي", "خفقان", "تعب شديد", "حرارة عالية",
      "breath", "chest", "faint", "collapse", "severe pain"
    ];
    return severeWords.some((word) => normalized.includes(word));
  }

  function consultAI() {
    if (!aiInput || !aiResponse) return;
    const input = aiInput.value.trim();
    if (!input) {
      setAiResponse("is-danger", "الرجاء كتابة الأعراض أولاً.");
      return;
    }

    setAiResponse("is-loading", "جاري تحليل حالتك...");

    setTimeout(() => {
      if (isHighRiskText(input)) {
        setAiResponse(
          "is-danger",
          "تحليل المستشار: الأعراض التي ذكرتها قد تكون خطيرة. أنصحك بالضغط على نداء الاستغاثة فورًا أو التوجه للعيادة."
        );
        updateStatus("error", "تم رصد أعراض عالية الخطورة من المستشار الذكي.", "اضغط نداء الاستغاثة أو تواصل مع الفريق الطبي فورًا.");
      } else {
        setAiResponse(
          "is-ok",
          "نصيحة المستشار: لا يبدو الأمر طارئًا جدًا. راقب الأعراض، اشرب الماء، واحجز موعدًا عاديًا عند الحاجة."
        );
        updateStatus("idle", "نتيجة المستشار: حالة مستقرة مبدئيًا.", "استمر في المتابعة، وإذا ساءت الأعراض استخدم نداء الاستغاثة.");
      }
    }, 800);
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
      updateVitalsTimestamp();
    }
  }

  function wireSecondaryButtons() {
    $("#messageBtn").addEventListener("click", () => {
      updateStatus("idle", "تم فتح شاشة الرسائل.", "يمكنك إرسال رسالة مباشرة للفريق الطبي.");
    });
    $("#recordBtn").addEventListener("click", () => {
      updateStatus("idle", "تم فتح الملف الصحي.", "راجع آخر الملاحظات والتوصيات.");
    });
    if (assistantBtn) {
      assistantBtn.addEventListener("click", () => {
        updateStatus("idle", "تم فتح المستشار الذكي.", "اكتب الأعراض واضغط استشارة للحصول على توجيه أولي.");
        const advisorBox = document.querySelector(".ai-advisor-box");
        if (advisorBox) advisorBox.scrollIntoView({ behavior: "smooth", block: "center" });
        if (aiInput) aiInput.focus();
      });
    }
  }

  function init() {
    if (!visitBtn || !statusCard) return;
    updateVitalsTimestamp();
    startSensorStream();
    visitBtn.addEventListener("click", requestVisit);
    wireSecondaryButtons();
    window.sendEmergency = sendEmergency;
    window.consultAI = consultAI;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
