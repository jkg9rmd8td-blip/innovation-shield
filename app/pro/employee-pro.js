(() => {
  "use strict";

  const TASKS_KEY = "is_tasks_v1";

  function readState(){
    try{ return JSON.parse(localStorage.getItem("is_state_v1")||"{}"); }catch{ return {}; }
  }
  function writeState(st){
    localStorage.setItem("is_state_v1", JSON.stringify(st));
  }
  function readTasks(){
    try{ return JSON.parse(localStorage.getItem(TASKS_KEY)||"[]"); }catch{ return []; }
  }
  function writeTasks(ts){
    localStorage.setItem(TASKS_KEY, JSON.stringify(ts));
  }

  function fmt(n){ return new Intl.NumberFormat("ar-SA").format(n||0); }
  function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }
  function fromEmployeeDir(){
    const p = (window.location && window.location.pathname ? window.location.pathname : "").replace(/\\/g, "/");
    return p.indexOf("/app/employee/") !== -1;
  }
  function componentPath(page){
    return fromEmployeeDir() ? `../components/${page}` : page;
  }

  function calcPoints(initiatives){
    // Simple scoring model (demo):
    // draft: +10, in-review: +25, approved: +60, impact: +90
    let p = 0;
    initiatives.forEach(i => {
      if(i.stage === "الأثر") p += 90;
      else if(i.status === "معتمد") p += 60;
      else if(i.status === "قيد التحكيم") p += 25;
      else p += 10;
      // bonus for high score
      if(i.score != null && i.score >= 85) p += 10;
    });
    return p;
  }

  function render(){
    const root = document.getElementById("page-profile-pro");
    if(!root) return;

    const st = readState();
    st.me = st.me || { displayName:"موظف مبتكر", dept:"إدارة/قسم", role:"موظف" };
    st.org = st.org || { nameAr:"مجمع الملك فيصل الطبي" };

    const inits = (st.initiatives || []);
    const stats = {
      total: inits.length,
      wins: inits.filter(x=>x.status==="معتمد").length,
      review: inits.filter(x=>x.status==="قيد التحكيم").length,
      impact: inits.filter(x=>x.stage==="الأثر").length
    };

    const points = calcPoints(inits);
    const lvl = window.Badges?.levelFrom(points) || { name:"مشارك", next: 100 };
    const badges = window.Badges?.computeBadges({ ...stats, points }) || [];

    document.getElementById("pf_name").textContent = st.me.displayName;
    document.getElementById("pf_org").textContent = st.org.nameAr;
    document.getElementById("pf_dept").textContent = st.me.dept;
    document.getElementById("pf_role").textContent = "موظف مبتكر";
    document.getElementById("pf_level").textContent = lvl.name;

    document.getElementById("pf_total").textContent = fmt(stats.total);
    document.getElementById("pf_wins").textContent = fmt(stats.wins);
    document.getElementById("pf_review").textContent = fmt(stats.review);
    document.getElementById("pf_impact").textContent = fmt(stats.impact);

    document.getElementById("pf_points").textContent = fmt(points);

    const prog = clamp(Math.round((points / (lvl.next || 100)) * 100), 0, 100);
    document.getElementById("pf_bar").style.width = prog + "%";

    // badges UI
    const bWrap = document.getElementById("pf_badges");
    bWrap.innerHTML = badges.length ? badges.map(b => `
      <span class="badge ok" title="${escapeHtml(b.d)}">🏅 ${escapeHtml(b.t)}</span>
    `).join("") : `<span class="badge muted">لا توجد شارات بعد — ابدأ بمبادرتك الأولى.</span>`;

    // initiatives list (pro)
    const list = document.getElementById("pf_list");
    list.innerHTML = inits.map(i => `
      <div class="row cardline">
        <div class="row-main" style="flex:1">
          <div class="row-title">${escapeHtml(i.title)}</div>
          <div class="row-sub">${escapeHtml(i.id)} • ${escapeHtml(i.stage)} • ${escapeHtml(i.status)}${i.score!=null?` • نتيجة: ${fmt(i.score)}`:""}</div>
        </div>
        <div class="row-actions">
          <a class="btn ghost sm" href="${componentPath("initiative.html")}?id=${encodeURIComponent(i.id)}">فتح</a>
        </div>
      </div>
    `).join("") || `<div class="muted">لا توجد مبادرات بعد.</div>`;

    // timeline = from audit chain + state.audit
    const timeline = document.getElementById("pf_timeline");
    const chain = window.AuditChain?.readChain?.() || [];
    const view = chain.slice(0,10);

    timeline.innerHTML = view.length ? view.map(x => `
      <div class="row cardline">
        <div style="flex:1">
          <div class="row-title">${escapeHtml(x.action)}</div>
          <div class="row-sub">${escapeHtml(x.target||"")} • ${escapeHtml(x.actor||"")} • ${escapeHtml(x.ts||"")}</div>
        </div>
        <div class="badge muted" title="Hash">${escapeHtml(x.hash)}</div>
      </div>
    `).join("") : `<div class="muted">لا يوجد سجل حتى الآن.</div>`;

    // tasks
    const tasksBox = document.getElementById("pf_tasks");
    const tasks = readTasks();

    function renderTasks(){
      const items = readTasks();
      tasksBox.innerHTML = items.length ? items.map(t => `
        <div class="row cardline" style="align-items:center;">
          <div style="flex:1">
            <div class="row-title">${escapeHtml(t.title)}</div>
            <div class="row-sub">${escapeHtml(t.note||"")}</div>
          </div>
          <div class="row-actions">
            <button class="btn sm ${t.done ? "ghost":""}" data-done="${t.id}">${t.done ? "منجزة" : "إنجاز"}</button>
            <button class="btn sm ghost" data-del="${t.id}">حذف</button>
          </div>
        </div>
      `).join("") : `<div class="muted">لا توجد مهام.</div>`;

      tasksBox.querySelectorAll("[data-done]").forEach(b => {
        b.onclick = () => {
          const id = b.getAttribute("data-done");
          const arr = readTasks();
          const it = arr.find(x=>x.id===id);
          if(!it) return;
          it.done = !it.done;
          writeTasks(arr);

          // audit
          try{
            const st2 = readState();
            const hash = window.AuditChain?.append({ ts:new Date().toISOString(), actor:"Employee", action:"تحديث مهمة", target:id }) || "";
            st2.audit = st2.audit || [];
            st2.audit.unshift({ ts:new Date().toISOString(), actor:"Employee", action:"تحديث مهمة", target:id, hash });
            writeState(st2);
          }catch{}

          renderTasks();
          render(); // refresh timeline
        };
      });

      tasksBox.querySelectorAll("[data-del]").forEach(b => {
        b.onclick = () => {
          const id = b.getAttribute("data-del");
          let arr = readTasks();
          arr = arr.filter(x=>x.id!==id);
          writeTasks(arr);
          renderTasks();
        };
      });
    }
    renderTasks();

    document.getElementById("pf_add_task").onclick = () => {
      const title = prompt("عنوان المهمة:");
      if(!title) return;
      const note = prompt("ملاحظة (اختياري):") || "";
      const arr = readTasks();
      const id = `TASK-${Math.floor(1000+Math.random()*9000)}`;
      arr.unshift({ id, title:title.trim(), note:note.trim(), done:false, ts:new Date().toISOString() });
      writeTasks(arr);

      try{
        const st2 = readState();
        const hash = window.AuditChain?.append({ ts:new Date().toISOString(), actor:"Employee", action:"إضافة مهمة", target:id }) || "";
        st2.audit = st2.audit || [];
        st2.audit.unshift({ ts:new Date().toISOString(), actor:"Employee", action:"إضافة مهمة", target:id, hash });
        writeState(st2);
      }catch{}

      renderTasks();
      render();
    };

    // buttons
    document.getElementById("pf_new").onclick = () => location.href = componentPath("submit.html");
    document.getElementById("pf_print").onclick = () => {
      localStorage.setItem("is_employee_print_v1", JSON.stringify({
        ts: new Date().toISOString(),
        me: st.me, org: st.org,
        stats, points, level: lvl.name, badges
      }));
      window.open("../pro/print-employee.html", "_blank");
    };
  }

  function escapeHtml(str){
    return String(str ?? "")
      .replaceAll("&","&amp;").replaceAll("<","&lt;")
      .replaceAll(">","&gt;").replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  document.addEventListener("DOMContentLoaded", render);
})();
