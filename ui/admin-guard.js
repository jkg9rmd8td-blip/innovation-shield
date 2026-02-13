import { mountNav } from "./shared-nav.js";
import { requireUser } from "../services/auth-service.js";
import { PERMISSIONS } from "../core/constants.js";
import { can } from "../core/permissions.js";

export function requireAdminPage({ pagePermission = PERMISSIONS.PAGE_ADMIN_OVERVIEW_VIEW, active = "admin" } = {}) {
  const user = requireUser("../login.html");
  if (!user) throw new Error("UNAUTHORIZED");

  if (!can(user.role, pagePermission)) {
    if (can(user.role, PERMISSIONS.PAGE_ADMIN_JUDGING_VIEW)) {
      location.replace("judging.html");
    } else if (can(user.role, PERMISSIONS.PAGE_WORKSPACE_VIEW)) {
      location.replace("../teams.html");
    } else if (can(user.role, PERMISSIONS.PAGE_INITIATIVES_VIEW)) {
      location.replace("../initiatives.html");
    } else {
      location.replace("../index.html");
    }
    throw new Error("FORBIDDEN");
  }

  mountNav({ active, base: ".." });
  return user;
}
