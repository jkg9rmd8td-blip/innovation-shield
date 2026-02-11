(() => {
  "use strict";

  // Very small hash (mock) — enough to show tamper-evidence in demo
  function miniHash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ("0000000" + (h >>> 0).toString(16)).slice(-8);
  }

  const CHAIN_KEY = "is_audit_chain_v1";

  function readChain() {
    try { return JSON.parse(localStorage.getItem(CHAIN_KEY) || "[]"); } catch { return []; }
  }
  function writeChain(chain) {
    localStorage.setItem(CHAIN_KEY, JSON.stringify(chain));
  }

  function append(event) {
    const chain = readChain();
    const prev = chain.length ? chain[0].hash : "genesis";
    const payload = JSON.stringify({ prev, ...event });
    const hash = miniHash(payload);

    chain.unshift({ ...event, prev, hash });
    if (chain.length > 300) chain.length = 300;
    writeChain(chain);
    return hash;
  }

  function verify() {
    const chain = readChain();
    for (let i = 0; i < chain.length; i++) {
      const cur = chain[i];
      const prev = i === chain.length - 1 ? "genesis" : chain[i + 1].hash;
      const payload = JSON.stringify({ prev, ts: cur.ts, actor: cur.actor, action: cur.action, target: cur.target });
      const expected = miniHash(payload);
      if (expected !== cur.hash) return { ok: false, at: i, expected, got: cur.hash };
    }
    return { ok: true };
  }

  // Expose globally
  window.AuditChain = { append, verify, readChain };
})();