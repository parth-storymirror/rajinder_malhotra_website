// Data layer. With server.py running it talks to /api; on static hosting
// (GitHub Pages) it reads data.json and keeps admin edits in this browser only.
const Store = (() => {
  const KEY = "rahilDemoData";
  const DEMO_PASSWORD = "rahil123";
  let mode, token = null;
  const uid = () => Math.random().toString(16).slice(2, 10);

  async function detect() {
    if (mode) return mode;
    try {
      const r = await fetch("api/data");
      mode = r.ok && (r.headers.get("content-type") || "").includes("json") ? "server" : "demo";
    } catch { mode = "demo"; }
    return mode;
  }

  const readLocal = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const writeLocal = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} };

  async function load() {
    if (await detect() === "server") return (await fetch("api/data")).json();
    return readLocal() || (await fetch("data.json")).json();
  }

  async function login(password) {
    if (await detect() === "demo") {
      if (password !== DEMO_PASSWORD) throw new Error("wrong password");
      return true;
    }
    const r = await fetch("api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "login failed");
    token = d.token;
    return true;
  }

  async function server(method, path, body) {
    const r = await fetch(path, { method, headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: body && JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Request failed");
    return d;
  }

  async function add(kind, item) {
    if (await detect() === "server") return server("POST", "api/" + kind, item);
    const d = await load();
    d[kind].push({ ...item, id: uid() });
    writeLocal(d);
    return d;
  }

  async function remove(kind, id) {
    if (await detect() === "server") return server("DELETE", `api/${kind}/${id}`);
    const d = await load();
    d[kind] = d[kind].filter(x => x.id !== id);
    writeLocal(d);
    return d;
  }

  async function reset() { try { localStorage.removeItem(KEY); } catch {} }

  return { detect, load, login, add, remove, reset };
})();
