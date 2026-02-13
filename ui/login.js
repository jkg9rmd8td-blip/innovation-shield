import { login } from "../services/auth-service.js";
import { can } from "../core/permissions.js";
import { PERMISSIONS } from "../core/constants.js";
import { notifyError } from "./notify.js";

const names = {
  innovator: "مبتكر المنصة",
  evaluator: "المقيّم المعتمد",
  committee: "عضو لجنة الابتكار",
  manager: "مدير الابتكار",
  support_entity: "ممثل الجهة الداعمة",
  executive_entity: "ممثل الجهة التنفيذية",
};

const $ = (s) => document.querySelector(s);
const err = $("#err");
const loginBtn = $("#loginBtn");
const applyRoleBtn = $("#applyRoleBtn");

function applyRolePreset(role) {
  $("#name").value = names[role] || "مستخدم";
  $("#role").value = role;
  $("#identifier").value = `${role}-001`;
  $("#department").value = role === "innovator" ? "التحول الرقمي" : role === "evaluator" ? "الجودة وسلامة المرضى" : "الإدارة العليا";
}

function setError(msg) {
  err.textContent = msg;
  err.style.display = "block";
}

applyRoleBtn?.addEventListener("click", () => {
  applyRolePreset($("#role").value);
  err.style.display = "none";
});

$("#role").addEventListener("change", () => {
  err.style.display = "none";
});

// Start with sensible defaults for the initially selected role.
applyRolePreset($("#role").value);

async function handleLogin() {
  const name = $("#name").value.trim();
  const role = $("#role").value;
  const identifier = $("#identifier").value.trim();
  const passcode = $("#passcode").value;
  const apiBase = $("#apiBase").value.trim();
  const department = $("#department").value;

  if (!name) {
    setError("اكتب اسم المستخدم.");
    return;
  }

  if (apiBase) {
    localStorage.setItem("IS_API_BASE", apiBase);
  }

  const original = loginBtn.textContent;
  loginBtn.disabled = true;
  loginBtn.textContent = "جاري الدخول...";

  try {
    const session = await login({ name, role, identifier, passcode, department });

    if (session.sessionMode === "local") {
      setError("تم الدخول بوضع محلي (offline). لتفعيل API شغّل backend على 8080.");
    }

    if (can(role, PERMISSIONS.PAGE_ADMIN_OVERVIEW_VIEW)) {
      location.href = "admin/index.html";
      return;
    }
    if (can(role, PERMISSIONS.PAGE_ADMIN_JUDGING_VIEW)) {
      location.href = "admin/judging.html";
      return;
    }
    if (can(role, PERMISSIONS.PAGE_WORKSPACE_VIEW)) {
      location.href = "teams.html";
      return;
    }
    if (can(role, PERMISSIONS.PAGE_INITIATIVES_VIEW)) {
      location.href = "initiatives.html";
      return;
    }
    if (can(role, PERMISSIONS.PAGE_JOURNEY_VIEW)) {
      location.href = "journey.html";
      return;
    }
    location.href = "index.html";
  } catch (e) {
    notifyError("فشل تسجيل الدخول: " + e.message);
    setError("فشل تسجيل الدخول: " + e.message);
    loginBtn.disabled = false;
    loginBtn.textContent = original;
  }
}

loginBtn.addEventListener("click", handleLogin);

document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === "textarea") return;
  e.preventDefault();
  if (!loginBtn.disabled) handleLogin();
});
