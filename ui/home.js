import { mountNav } from "./shared-nav.js";

mountNav({ active: "home", base: "." });

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const fmt = (n) => new Intl.NumberFormat("ar-SA").format(n);

document.querySelectorAll("[data-go]").forEach((el) => {
  el.addEventListener("click", () => {
    const to = el.getAttribute("data-go");
    if (to) location.href = to;
  });
});

document.querySelectorAll(".kpi-number[data-target]").forEach((el) => {
  const target = Number(el.getAttribute("data-target") || 0);
  const start = performance.now();
  const dur = 1100;
  const tick = (t) => {
    const p = clamp((t - start) / dur, 0, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
