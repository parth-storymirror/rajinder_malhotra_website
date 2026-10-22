const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let token = sessionStorage.getItem("token");

async function api(method, path, body) {
  const r = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: body && JSON.stringify(body),
  });
  const data = await r.json();
  if (r.status === 401) { sessionStorage.removeItem("token"); token = null; show(false); }
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data;
}

function show(on) { $("login").hidden = on; $("panel").hidden = !on; if (on) refresh(); }

function list(el, kind, items, label) {
  el.innerHTML = items.map(i => `<div class="row"><span>${esc(label(i))}</span><button data-kind="${kind}" data-id="${i.id}">Delete</button></div>`).join("") || '<div class="msg">None yet.</div>';
}

function refresh() {
  fetch("/api/data").then(r => r.json()).then(d => {
    list($("v-list"), "videos", d.videos, v => v.title);
    list($("b-list"), "books", d.books, b => b.title);
  });
}

function say(t) { $("msg").textContent = t; }

$("login-btn").onclick = async () => {
  const r = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: $("pw").value }) });
  const d = await r.json();
  if (!r.ok) { $("login-msg").textContent = d.error; return; }
  token = d.token; sessionStorage.setItem("token", token); show(true);
};

$("v-add").onclick = async () => {
  const title = $("v-title").value.trim(), url = $("v-url").value.trim();
  if (!/youtu\.?be/.test(url) || !title) return say("Enter a title and a valid YouTube link.");
  try { await api("POST", "/api/videos", { title, url }); $("v-title").value = $("v-url").value = ""; say("Video added."); refresh(); } catch (e) { say(e.message); }
};

$("b-add").onclick = async () => {
  const links = $("b-links").value.split("\n").map(l => l.split("|").map(s => s.trim())).filter(p => p[1]).map(([label, url]) => ({ label, url }));
  const book = { title: $("b-title").value.trim(), hindiTitle: $("b-hindi").value.trim(), subtitle: $("b-sub").value.trim(), cover: $("b-cover").value.trim(), description: $("b-desc").value.trim(), publisher: $("b-pub").value.trim(), isbn: $("b-isbn").value.trim(), price: $("b-price").value.trim(), links };
  if (!book.title) return say("Title is required.");
  try { await api("POST", "/api/books", book); document.querySelectorAll("#panel input,#panel textarea").forEach(e => e.value = ""); say("Book added."); refresh(); } catch (e) { say(e.message); }
};

document.addEventListener("click", async e => {
  const b = e.target.closest("button[data-id]");
  if (!b || !confirm("Delete this item?")) return;
  try { await api("DELETE", `/api/${b.dataset.kind}/${b.dataset.id}`); refresh(); } catch (err) { say(err.message); }
});

show(!!token);
