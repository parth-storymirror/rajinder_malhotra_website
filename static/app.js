document.documentElement.classList.add("js");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

// Accepts watch, youtu.be, shorts and embed URLs; returns null if not YouTube.
function youtubeId(url) {
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

function render({ books, videos }) {
  document.getElementById("books-list").innerHTML = books.map(b => `
    <article class="book reveal">
      <div class="cover"><img src="${esc(b.cover)}" alt="${esc(b.title)} cover" loading="lazy"></div>
      <div>
        ${b.hindiTitle ? `<div class="hi hindi">${esc(b.hindiTitle)}</div>` : ""}
        <h3>${esc(b.title)}</h3>
        <div class="eyebrow">${esc(b.subtitle)}</div>
        <p class="desc">${esc(b.description)}</p>
        ${[["Publisher", b.publisher], ["ISBN", b.isbn], ["Price", b.price]].filter(x => x[1]).length
          ? `<dl class="meta">${[["Publisher", b.publisher], ["ISBN", b.isbn], ["Price", b.price]].filter(x => x[1]).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
        ${(b.images || []).length ? `<div class="thumbs">${b.images.map(i => `<img src="${esc(i)}" alt="${esc(b.title)} back cover" loading="lazy">`).join("")}</div>` : ""}
        ${(b.links || []).length
          ? `<div class="buy"><div class="eyebrow">Available now on</div><div class="links">${b.links.map(l => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener"><small>Buy on</small><strong>${esc(l.label)}</strong></a>`).join("")}</div></div>`
          : '<p class="soon">Purchase links coming soon.</p>'}
      </div>
    </article>`).join("") || '<p class="empty">Books coming soon.</p>';

  const valid = videos.filter(v => youtubeId(v.url));
  document.getElementById("videos-list").dataset.count = Math.min(valid.length, 3);
  document.getElementById("videos-list").innerHTML = valid.map(v => `
    <div class="video reveal">
      <div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${youtubeId(v.url)}" title="${esc(v.title)}" loading="lazy" allowfullscreen></iframe></div>
      <h4>${esc(v.title)}</h4>
    </div>`).join("") || '<p class="empty">Videos will appear here soon.</p>';

  observe();
}

// scroll-reveal
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
const observe = () => document.querySelectorAll(".reveal:not(.in)").forEach(el => io.observe(el));
observe();

// lightbox for covers
const lb = document.getElementById("lightbox");
document.addEventListener("click", e => {
  const img = e.target.closest(".cover img, .thumbs img");
  if (img) { lb.querySelector("img").src = img.src; lb.hidden = false; }
  else if (!lb.hidden) lb.hidden = true;
});
document.addEventListener("keydown", e => { if (e.key === "Escape") lb.hidden = true; });

document.getElementById("yr").textContent = new Date().getFullYear();
fetch("/api/data").then(r => r.json()).then(render);

