(() => {
  "use strict";

  function readState(){
    try{ return JSON.parse(localStorage.getItem("is_state_v1")||"{}"); }catch{ return {}; }
  }
  function writeState(st){
    localStorage.setItem("is_state_v1", JSON.stringify(st));
  }
  function fmt(n){ return new Intl.NumberFormat("ar-SA").format(n||0); }

  async function loadRubric(){
    const res = await fetch("../data/rubric.json");
    return res.json();
  }

  function qs(name){
    return new URLSearchParams(location.search).get(name);
  }

  function mount(){
    const root = document.getElementById("judging_pro");
    if(!root) return;

    const st = readState();
    const list = st.initiatives || [];
    const selectedId = qs("id") || (list[0]?.id || "");
    const init = list.find(x=>x.id===selectedId) || list[0];
    if(!init) return;

    document.getElementById("jp_title").textContent = `${init.title} — ${init.id}`;
    document.getElementById("jp_stage").textContent = init.stage;
    document.getElementById("jp_status").textContent = init.status;

    loadRubric().then(rub => {
      document.getElementById("jp_rname").textContent = rub.name;

      const box = document.getElementById("jp_criteria");
      const saved = (init.rubricScores || {});

      box.innerHTML = rub.criteria.map(c => {
        const v = saved[c.key] ?? 0;
        return `
          <div class="row cardline" style="align-items:flex-end;">
            <div style="flex:1">
              <div class="row-title">${c.title} <span class="badge muted">وزن ${c.weight}%</span></div>
              <div class="row-sub">${c.notes || ""}</div>
            </div>
            <div style="width:220px">
              <label style="margin:0 0 6px;">الدرجة (0-100)</label>
              <input class="in sm" type="number" min="0" max="100" step="1" data-crit="${c.key}" value="${v}">
            </div>
          </div>
        `;
      }).join("");

      const calc = () => {
        const scores = {};
        rub.criteria.forEach(c => {
          const v = Number(document.querySelector(`[data-crit="${c.key}"]`)?.value || 0);
          scores[c.key] = Math.max(0, Math.min(100, isFinite(v)? v : 0));
        });

        let total = 0;
        rub.criteria.forEach(c => total += (scores[c.key] * (c.weight/100)));
        total = Math.round(total);

        document.getElementById("jp_total").textContent = fmt(total);

        return { total, scores };
      };

      box.querySelectorAll("input[data-crit]").forEach(inp => inp.addEventListener("input", calc));
      calc();

      document.getElementById("jp_save").onclick = () => {
        const { total, scores } = calc();
        init.rubricScores = scores;
        init.score = total;
        if(init.status === "مسودة") init.status = "قيد التحكيم";

        // chain audit
        try{
          const hash = window.AuditChain?.append({ ts:new Date().toISOString(), actor:"Judge", action:"حفظ تقييم Rubric", target:init.id }) || "";
          st.audit = st.audit || [];
          st.audit.unshift({ ts:new Date().toISOString(), actor:"Judge", action:"حفظ تقييم Rubric", target:init.id, hash });
        }catch{}

        writeState(st);
        alert("تم حفظ التقييم ✅");
      };

      document.getElementById("jp_decide").onclick = () => {
        const { total } = calc();
        if(total < 60) { init.status = "مرفوض"; }
        else if(total < 80) { init.status = "قابل للتحسين"; }
        else { init.status = "معتمد"; init.stage = "الاعتماد"; }

        // update KPI
        st.kpis = st.kpis || {innovators:0, governed:0, approved:0};
        st.kpis.approved = (st.initiatives||[]).filter(x=>x.status==="معتمد").length;

        try{
          const hash = window.AuditChain?.append({ ts:new Date().toISOString(), actor:"Committee", action:"قرار اللجنة", target:`${init.id}: ${init.status}` }) || "";
          st.audit = st.audit || [];
          st.audit.unshift({ ts:new Date().toISOString(), actor:"Committee", action:"قرار اللجنة", target:`${init.id}: ${init.status}`, hash });
        }catch{}

        writeState(st);
        document.getElementById("jp_status").textContent = init.status;
        alert("تم تسجيل قرار اللجنة ✅");
      };

      document.getElementById("jp_print").onclick = () => {
        // store last print payload
        localStorage.setItem("is_minutes_payload_v1", JSON.stringify({
          ts: new Date().toISOString(),
          initiative: init
        }));
        window.open("../pro/print-minutes.html", "_blank");
      };
    });
  }

  document.addEventListener("DOMContentLoaded", mount);
})();