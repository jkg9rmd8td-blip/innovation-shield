import { mutateState, getState } from "../core/state.js";
import { requirePermission } from "../guards/permission-guard.js";
import { PERMISSIONS } from "../core/constants.js";

function nextId() {
  return `MK-${Math.random().toString(16).slice(2, 8)}`;
}

export function listMarketplaceItems() {
  const state = getState();
  const candidates = (state.initiatives || []).filter((x) => ["قيد التطوير", "مرحلة التجربة", "معتمد", "مطلق"].includes(x.status));
  const offers = state.marketplace?.offers || [];

  return candidates.map((item) => ({
    ...item,
    offers: offers.filter((o) => o.initiativeId === item.id),
  }));
}

export function submitMarketplaceOffer(user, initiativeId, roleType, note) {
  const guard = requirePermission(user, PERMISSIONS.PAGE_MARKETPLACE_VIEW);
  if (!guard.ok) throw new Error("FORBIDDEN_MARKETPLACE_OFFER");

  let after = null;
  mutateState((state) => {
    state.marketplace = state.marketplace || { offers: [] };
    const row = {
      id: nextId(),
      initiativeId,
      byUserId: user.id,
      byUserName: user.name,
      byRole: user.role,
      roleType,
      note: note || "عرض دعم",
      at: new Date().toISOString(),
    };
    state.marketplace.offers.unshift(row);
    after = row;
    return state;
  });
  return after;
}
