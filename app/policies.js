/* Innovation Shield — Policies Binding (Static Demo)
   - Policy summary rendered in UI
   - Acceptance stored in localStorage
   - Download policy as text
*/
(function () {
    const KEY_ACCEPT = "IS_POLICY_ACCEPT";
    const KEY_ACCEPT_LOG = "IS_POLICY_ACCEPT_LOG";

    const $ = (s) => document.querySelector(s);

    const user = window.ISAuth?.getUser?.();
    if (!user) return;

    // Policy content (internal operational)
    const POLICY = {
        id: "IS-POL-001",
        version: "1.0",
        title: "Saudi Innovation Protection — Internal Operational Policy",
        updatedAt: new Date().toISOString().slice(0, 10),
        clauses: [
            {
                h: "1) السرية (Confidentiality)",
                t: "أي محتوى ابتكاري يُشارك داخل المبادرة يُعامل كمعلومات داخلية. يمنع مشاركته خارج نطاق المبادرة أو تصويره/نسخه إلا بإذن إداري موثّق."
            },
            {
                h: "2) إثبات الأثر (Evidence of Contribution)",
                t: "كل مبادرة/مستند/مرفق يُسجّل بختم وقت وسجل أحداث. الهدف: حفظ الأثر والتسلسل، وتجنب النزاعات."
            },
            {
                h: "3) نسب المساهمة (Contribution Shares)",
                t: "تُدار نسب المساهمة وفق سجل المهام والمخرجات والاعتماد. وعند وجود خلاف: تُرفع للجنة/إدارة الابتكار للفصل وفق المعايير المعتمدة."
            },
            {
                h: "4) التعارض والنزاهة (Conflict of Interest)",
                t: "يجب الإفصاح عن أي تعارض مصالح. لا يحق للمحكّم أو صاحب صلاحية اعتماد أن يقيّم أو يقر ابتكارًا له مصلحة مباشرة فيه."
            },
            {
                h: "5) حماية البيانات والسيادة (Data Sovereignty)",
                t: "بيانات المبادرة تبقى داخل نطاق الجهة وبما يتوافق مع الأنظمة الداخلية. أي نقل/نسخ خارجي يحتاج مسار موافقة رسمي."
            },
            {
                h: "6) مسار التصعيد (Escalation Path)",
                t: "عند الاشتباه بانتهاك أو تسريب: يُوقف الوصول مؤقتًا، يُوثّق البلاغ، وتُرفع الحالة لإدارة الابتكار لاتخاذ الإجراء."
            },
            {
                h: "7) استمرار الدعم بعد الفوز",
                t: "فوز المبادرة لا يعني انتهاء الحماية: تُفتح مرحلة ما بعد الفوز لتوثيق التطوير، طلب الموارد، والمتابعة حتى الإغلاق الرسمي."
            }
        ]
    };

    function loadJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
        catch { return fallback; }
    }

    function saveJSON(key, val) {
        localStorage.setItem(key, JSON.stringify(val));
    }

    function formatDate(ts) {
        if (!ts) return "—";
        try {
            const d = new Date(ts);
            return d.toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" });
        } catch {
            return ts;
        }
    }

    function renderPolicy() {
        $("#policyVersion").textContent = POLICY.version;

        const wrap = $("#policyList");
        wrap.innerHTML = "";
        POLICY.clauses.forEach(c => {
            const el = document.createElement("div");
            el.className = "item";
            el.innerHTML = `<b>${c.h}</b><div class="t">${c.t}</div>`;
            wrap.appendChild(el);
        });
    }

    function updateStats() {
        const accepted = loadJSON(KEY_ACCEPT, {});
        const log = loadJSON(KEY_ACCEPT_LOG, []);

        const isAccepted = !!accepted?.acceptedAt;

        $("#acceptedCount").textContent = log.length;
        $("#lastAccepted").textContent = log.length ? formatDate(log[0].acceptedAt) : "—";

        const badge = $("#statusBadge");
        if (isAccepted) {
            badge.textContent = "حالة الاعتماد: معتمد";
            badge.style.background = "rgba(0,255,170,.10)";
            badge.style.borderColor = "rgba(0,255,170,.20)";
        } else {
            badge.textContent = "حالة الاعتماد: غير معتمد";
            badge.style.background = "rgba(255,255,255,.06)";
            badge.style.borderColor = "rgba(255,255,255,.16)";
        }
    }

    function renderLog() {
        const log = loadJSON(KEY_ACCEPT_LOG, []);
        if (!log.length) {
            $("#logBox").textContent = "لا يوجد سجلات اعتماد حتى الآن.";
            return;
        }
        $("#logBox").textContent = log.map(x => {
            return `• ${formatDate(x.acceptedAt)} — ${x.name} — (${x.role}) — نسخة ${x.version}\n  ${x.note ? "إقرار: " + x.note : ""}`;
        }).join("\n\n");
    }

    function acceptPolicy() {
        const name = $("#approverName").value.trim();
        const note = $("#extraAck").value.trim();

        if (!name) return alert("اكتب اسم المعتمد.");

        const entry = {
            name,
            role: user.roleName || user.role,
            roleKey: user.role,
            version: POLICY.version,
            policyId: POLICY.id,
            acceptedAt: new Date().toISOString(),
            note
        };

        // store current acceptance
        saveJSON(KEY_ACCEPT, entry);

        // append log
        const log = loadJSON(KEY_ACCEPT_LOG, []);
        log.unshift(entry);
        saveJSON(KEY_ACCEPT_LOG, log.slice(0, 200));

        // audit
        if (window.ISAuth?.audit) ISAuth.audit("POLICY_ACCEPT", { version: POLICY.version, policyId: POLICY.id });

        const ok = $("#okBox");
        ok.style.display = "block";
        ok.innerHTML = `<b>تم الاعتماد ✅</b><div class="small muted">تم تسجيل اعتماد السياسة باسم: <b style="color:#fff">${name}</b> — (${entry.role})</div>`;

        updateStats();
        renderLog();
    }

    function downloadText() {
        const lines = [];
        lines.push("=== Innovation Shield — Policy (Internal) ===");
        lines.push(`Policy ID: ${POLICY.id}`);
        lines.push(`Version: ${POLICY.version}`);
        lines.push(`Updated: ${POLICY.updatedAt}`);
        lines.push("");
        lines.push("Clauses:");
        POLICY.clauses.forEach((c, i) => {
            lines.push(`${i + 1}. ${c.h}`);
            lines.push(`   ${c.t}`);
            lines.push("");
        });

        const accepted = loadJSON(KEY_ACCEPT, {});
        if (accepted?.acceptedAt) {
            lines.push("Acceptance:");
            lines.push(`- Name: ${accepted.name}`);
            lines.push(`- Role: ${accepted.role}`);
            lines.push(`- Accepted At: ${accepted.acceptedAt}`);
            if (accepted.note) lines.push(`- Note: ${accepted.note}`);
            lines.push("");
        }

        const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `InnovationShield_Policy_${POLICY.version}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    // Init UI
    $("#approverName").value = user.displayName || "مستخدم";
    $("#approverRole").value = user.roleName || user.role;

    renderPolicy();
    updateStats();
    renderLog();

    $("#acceptBtn").addEventListener("click", acceptPolicy);
    $("#downloadBtn").addEventListener("click", downloadText);
    $("#viewLogBtn").addEventListener("click", renderLog);
    $("#clearLogBtn").addEventListener("click", () => {
        if (confirm("مسح سجل الاعتمادات؟ (تجربة)")) {
            localStorage.removeItem(KEY_ACCEPT);
            localStorage.removeItem(KEY_ACCEPT_LOG);
            if (window.ISAuth?.audit) ISAuth.audit("POLICY_LOG_CLEAR");
            updateStats();
            renderLog();
            alert("تم ✅");
        }
    });
})();