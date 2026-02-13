import { can } from "../core/permissions.js";

export function applySubnavAccess(user, root = document) {
  root.querySelectorAll(".subnav [data-perm]").forEach((link) => {
    const perm = link.getAttribute("data-perm");
    if (!perm) return;
    if (!can(user.role, perm)) {
      link.classList.add("is-disabled");
      link.style.pointerEvents = "none";
      link.title = "غير متاح لهذا الدور";
    } else {
      link.classList.remove("is-disabled");
      link.style.pointerEvents = "";
      link.removeAttribute("title");
    }
  });
}
