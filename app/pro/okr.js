(() => {
    "use strict";
    const KEY = "is_employee_okrs_v1";

    function read() { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    function write(v) { localStorage.setItem(KEY, JSON.stringify(v)); }

    function add(obj) {
        const arr = read();
        arr.unshift({ id: `OKR-${Date.now()}`, ...obj, progress: 0 });
        write(arr);
    }

    function update(id, p) {
        const arr = read();
        const o = arr.find(x => x.id === id);
        if (o) o.progress = Math.max(0, Math.min(100, p));
        write(arr);
    }

    window.OKR = { read, add, update };
})();