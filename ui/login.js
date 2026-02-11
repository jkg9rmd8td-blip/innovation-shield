import { login } from "../services/auth-service.js";

const names = {
  employee: "موظف الابتكار",
  lead: "قائد الفريق",
  judge: "عضو لجنة التحكيم",
  supervisor: "المشرف التنفيذي",
  executive: "الإدارة العليا",
};

const $ = (s) => document.querySelector(s);
const err = $("#err");

function setError(msg) {
  err.textContent = msg;
  err.style.display = "block";
}

document.querySelectorAll("[data-demo]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const role = btn.getAttribute("data-demo");
    $("#name").value = names[role] || "مستخدم";
    $("#role").value = role;
    $("#identifier").value = `${role}-001`;
    err.style.display = "none";
  });
});

$("#loginBtn").addEventListener("click", () => {
  const name = $("#name").value.trim();
  const role = $("#role").value;
  const identifier = $("#identifier").value.trim();

  if (!name) return setError("يرجى كتابة اسم المستخدم.");

  login({ name, role, identifier });
  location.href = role === "supervisor" || role === "executive" ? "admin/index.html" : "teams.html";
});
