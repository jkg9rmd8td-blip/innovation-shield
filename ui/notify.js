function getHost() {
  let host = document.querySelector("#toastHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "toastHost";
    host.className = "toast-wrap";
    document.body.appendChild(host);
  }
  return host;
}

export function notify(message, type = "success", ttl = 2600) {
  const host = getHost();
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  host.appendChild(el);

  setTimeout(() => {
    el.remove();
  }, ttl);
}

export const notifySuccess = (msg) => notify(msg, "success");
export const notifyError = (msg) => notify(msg, "error", 3400);
