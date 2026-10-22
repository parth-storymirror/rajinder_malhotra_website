const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const say = t => { $("msg").textContent = t; };

function show(on) {
  $("login").hidden = on;
  $("panel").hidden = !on;
  if (on) { refresh(); Store.detect().then(m => { $("demo-note").hidden = m !== "demo"; }); }
}

function list(el, kind, items, label) {
  el.innerHTML = items.map(i => `<div class="row"><span>${esc(label(i))}</span><button data-kind="${kind}" data-id="${i.id}">Delete</button></div>`).join("") || '<div class="msg">None yet.</div>';
}

function refresh() {
  Store.load().then(d => {
    list($("v-list"), "videos", d.videos, v => v.title);
    list($("b-list"), "books", d.books, b => b.title);
  });
}

async function doLogin() {
  try { await Store.login($("pw").value); show(true); } catch (e) { $("login-msg").textContent = e.message; }
}
$("login-btn").onclick = doLogin;
$("pw").addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });

$("v-add").onclick = async () => {
  const title = $("v-title").value.trim(), url = $("v-url").value.trim();
  if (!/youtu\.?be/.test(url) || !title) return say("Enter a title and a valid YouTube link.");
  try { await Store.add("videos", { title, url }); $("v-title").value = $("v-url").value = ""; say("Video added."); refresh(); } catch (e) { say(e.message); }
};

$("b-add").onclick = async () => {
  const links = $("b-links").value.split("\n").map(l => l.split("|").map(s => s.trim())).filter(p => p[1]).map(([label, url]) => ({ label, url }));
  const book = { title: $("b-title").value.trim(), hindiTitle: $("b-hindi").value.trim(), subtitle: $("b-sub").value.trim(), cover: $("b-cover").value.trim(), description: $("b-desc").value.trim(), publisher: $("b-pub").value.trim(), isbn: $("b-isbn").value.trim(), links };
  if (!book.title) return say("Title is required.");
  try { await Store.add("books", book); document.querySelectorAll("#panel input,#panel textarea").forEach(e => e.value = ""); say("Book added."); refresh(); } catch (e) { say(e.message); }
};

document.addEventListener("click", async e => {
  if (e.target.id === "reset") { e.preventDefault(); await Store.reset(); say("Demo data reset."); refresh(); return; }
  const b = e.target.closest("button[data-id]");
  if (!b || !confirm("Delete this item?")) return;
  try { await Store.remove(b.dataset.kind, b.dataset.id); refresh(); } catch (err) { say(err.message); }
});

show(false);
