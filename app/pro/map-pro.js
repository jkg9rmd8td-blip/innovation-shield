(() => {
  "use strict";

  const STAGES = ["الفكرة","التقييم","الاعتماد","التنفيذ","الأثر"];

  function readState(){
    try{ return JSON.parse(localStorage.getItem("is_state_v1")||"{}"); }catch{ return {}; }
  }
  function writeState(st){
    localStorage.setItem("is_state_v1", JSON.stringify(st));
  }

  function fmt(n){ return new Intl.NumberFormat("ar-SA").format(n||0); }

  function render(){
    const root = document.getElementById("page-map");
    if(!root) return;

    const st = readState();
    const items = (st.initiatives || []);
    const board = document.getElementById("map_board");
    if(!board) return;

    // progress
    const done = items.filter(x => x.stage === "الأثر").length;
    const prog = items.length ? Math.round((done/items.length)*100) : 0;

    const header = document.getElementById("map_pro_header");
    if(header){
      header.querySelector("#mp_total").textContent = fmt(items.length);
      header.querySelector("#mp_done").textContent = fmt(done);
      header.querySelector("#mp_prog").textContent = fmt(prog) + "%";
      header.querySelector("#mp_bar").style.width = prog + "%";
    }

    // filters
    const q = (document.getElementById("mp_q")?.value || "").trim();
    const status = document.getElementById("mp_status")?.value || "all";

    const filtered = items.filter(x => {
      if(status !== "all" && x.status !== status) return false;
      if(q && !(String(x.title||"").includes(q) || String(x.id||"").includes(q))) return false;
      return true;
    });

    board.innerHTML = STAGES.map(stage => {
      const laneItems = filtered.filter(x => x.stage === stage);
      return `
        <div class="lane" data-lane="${stage}">
          <div class="lane-head">
            <div class="lane-title">${stage}</div>
            <div class="lane-count">${fmt(laneItems.length)}</div>
          </div>
          <div class="lane-body" data-drop="${stage}">
            ${laneItems.map(i => `
              <a class="ticket" draggable="true" data-drag="${i.id}" href="initiative.html?id=${encodeURIComponent(i.id)}">
                <div class="ticket-title">${escapeHtml(i.title)}</div>
                <div class="ticket-sub">${escapeHtml(i.id)} • ${escapeHtml(i.status)}${i.score!=null?` • ${fmt(i.score)}`:""}</div>
              </a>
            `).join("")}
            <button class="ticket add" type="button" data-add="${stage}">+ إضافة</button>
          </div>
        </div>
      `;
    }).join("");

    // add
    board.querySelectorAll("[data-add]").forEach(btn => {
      btn.onclick = () => {
        const stage = btn.getAttribute("data-add") || "الفكرة";
        const title = prompt("اسم المبادرة:");
        if(!title) return;

        const id = `I-${Math.floor(3000 + Math.random()*6000)}`;
        st.initiatives = st.initiatives || [];
        st.initiatives.unshift({ id, title:title.trim(), stage, owner: st.teams?.[0]?.id || "T-1001", status:"مسودة", score:null, prizes:[] });

        st.kpis = st.kpis || {innovators:0, governed:0, approved:0};
        st.kpis.governed = st.initiatives.length;

        // audit
        try{
          const hash = window.AuditChain?.append({ ts:new Date().toISOString(), actor:"Employee", action:"تسجيل مبادرة جديدة", target:id }) || "";
          st.audit = st.audit || [];
          st.audit.unshift({ ts:new Date().toISOString(), actor:"Employee", action:"تسجيل مبادرة جديدة", target:id, hash });
        }catch{}

        writeState(st);
        render();
      };
    });

    // drag/drop
    let draggedId = null;

    board.querySelectorAll("[data-drag]").forEach(el => {
      el.addEventListener("dragstart", (e) => {
        draggedId = el.getAttribute("data-drag");
        e.dataTransfer?.setData("text/plain", draggedId);
        e.dataTransfer?.setDragImage(el, 20, 20);
      });
    });

    board.querySelectorAll("[data-drop]").forEach(zone => {
      zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.style.outline = "2px solid rgba(106,228,255,.25)"; });
      zone.addEventListener("dragleave", () => { zone.style.outline = "none"; });
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.style.outline = "none";
        const toStage = zone.getAttribute("data-drop");
        const id = e.dataTransfer?.getData("text/plain") || draggedId;
        if(!id || !toStage) return;

        const it = (st.initiatives||[]).find(x => x.id === id);
        if(!it) return;

        const from = it.stage;
        it.stage = toStage;

        // auto status polish
        if(toStage === "التقييم" && it.status === "مسودة") it.status = "قيد التحكيم";
        if(toStage === "الأثر") it.status = "متابعة أثر";

        // audit
        try{
          const hash = window.AuditChain?.append({ ts:new Date().toISOString(), actor:"Admin", action:"نقل مرحلة المبادرة", target:`${id}: ${from} → ${toStage}` }) || "";
          st.audit = st.audit || [];
          st.audit.unshift({ ts:new Date().toISOString(), actor:"Admin", action:"نقل مرحلة المبادرة", target:`${id}: ${from} → ${toStage}`, hash });
        }catch{}

        writeState(st);
        render();
      });
    });
  }

  function escapeHtml(str){
    return String(str ?? "")
      .replaceAll("&","&amp;").replaceAll("<","&lt;")
      .replaceAll(">","&gt;").replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  document.addEventListener("DOMContentLoaded", () => {
    // mount extra pro header if exists
    render();
    const apply = document.getElementById("mp_apply");
    if(apply) apply.onclick = render;
  });
})();