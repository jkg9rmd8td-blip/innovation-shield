(() => {
  "use strict";

  function readState(){
    try{ return JSON.parse(localStorage.getItem("is_state_v1")||"{}"); }catch{ return {}; }
  }

  function drawBars(canvas, data){
    const ctx = canvas.getContext("2d");
    const w = canvas.width = canvas.clientWidth * devicePixelRatio;
    const h = canvas.height = 220 * devicePixelRatio;

    ctx.clearRect(0,0,w,h);

    const max = Math.max(...data.map(d=>d.v), 1);
    const pad = 18 * devicePixelRatio;
    const bw = (w - pad*2) / data.length;

    data.forEach((d, i) => {
      const x = pad + i*bw + (bw*0.18);
      const barW = bw*0.64;
      const barH = (h - pad*2) * (d.v/max);
      const y = h - pad - barH;

      // no fixed colors requested: use default stroke/fill style
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fillRect(x, y, barW, barH);

      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.font = `${12*devicePixelRatio}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(d.k, x + barW/2, h - (8*devicePixelRatio));
    });
  }

  function mount(){
    const c = document.getElementById("ad_chart");
    if(!c) return;

    const st = readState();
    const items = st.initiatives || [];
    const buckets = ["الفكرة","التقييم","الاعتماد","التنفيذ","الأثر"].map(k => ({
      k, v: items.filter(x=>x.stage===k).length
    }));

    drawBars(c, buckets);
    window.addEventListener("resize", () => drawBars(c, buckets));
  }

  document.addEventListener("DOMContentLoaded", mount);
})();