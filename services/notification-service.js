import { mutateState, getState } from "../core/state.js";

function nextId() {
  return `NT-${Math.random().toString(16).slice(2, 8)}`;
}

export function listNotifications(role = null) {
  const rows = getState().notifications || [];
  if (!role) return rows;
  return rows.filter((n) => !n.roleTarget || n.roleTarget === role);
}

export function pushNotification({ roleTarget = null, type = "info", message, entityId = null }) {
  mutateState((state) => {
    state.notifications = state.notifications || [];
    state.notifications.unshift({
      id: nextId(),
      roleTarget,
      type,
      message,
      entityId,
      at: new Date().toISOString(),
      read: false,
    });
    state.notifications = state.notifications.slice(0, 500);
    return state;
  });
}

export function markNotificationRead(id) {
  mutateState((state) => {
    state.notifications = (state.notifications || []).map((n) => (n.id === id ? { ...n, read: true } : n));
    return state;
  });
}

export function markAllNotificationsRead(role) {
  mutateState((state) => {
    state.notifications = (state.notifications || []).map((n) => (
      !role || n.roleTarget === role || !n.roleTarget ? { ...n, read: true } : n
    ));
    return state;
  });
}
