import { mountNav } from "./shared-nav.js";
import { getCurrentUser } from "../services/auth-service.js";
import { getState } from "../core/state.js";
import { getPlatformPulse, ensureServiceHubState } from "../services/platform-hub-service.js";

mountNav({ active: "home", base: "." });

const fmt = (n) => new Intl.NumberFormat("ar-SA").format(n);

ensureServiceHubState();

function setDynamicTargets() {
  const state = getState();
  const user = getCurrentUser();
  const pulse = getPlatformPulse(user);
  const initiatives = state.initiatives || [];

  const total = initiatives.length;
  const approved = initiatives.filter((x) => x.status === "معتمد" || x.status === "مطلق").length;
  const acceptanceRatio = total ? Math.round((approved / total) * 100) : 0;
  const prototypeStage = initiatives.filter((x) => ["prototype", "development", "pilot"].includes(x.stage)).length;
  const launched = initiatives.filter((x) => x.status === "مطلق").length;
  const evaluationDays = initiatives
    .filter((x) => x.createdAt && Array.isArray(x.scores) && x.scores.length)
    .map((x) => {
      const start = new Date(x.createdAt).getTime();
      const end = new Date(x.scores[0]?.at || x.createdAt).getTime();
      return Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
    });
  const avgEval = evaluationDays.length ? Math.round(evaluationDays.reduce((a, b) => a + b, 0) / evaluationDays.length) : 0;
  const roi = initiatives.reduce((acc, x) => acc + Number(x.reward?.total || 0), 0) || approved * 185000;

  const targets = [total, acceptanceRatio, avgEval, prototypeStage, launched, roi];
  document.querySelectorAll(".kpi-number[data-target]").forEach((el, idx) => {
    if (targets[idx] != null) {
      el.setAttribute("data-target", String(targets[idx]));
    }
  });

  const noteEl = document.querySelector(".hero-note span:last-child");
  if (noteEl) {
    noteEl.textContent = `نبض المنصة: ${pulse.totals.openServiceRequests} طلب خدمة مفتوح • ${pulse.totals.prototypesReady} نماذج جاهزة للتحكيم.`;
  }
}

setDynamicTargets();

document.querySelectorAll(".kpi-number[data-target]").forEach((el) => {
  const target = Number(el.getAttribute("data-target") || 0);
  const start = performance.now();
  const duration = 1200;

  const tick = (t) => {
    const progress = Math.min(1, (t - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = fmt(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
});
