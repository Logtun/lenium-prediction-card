(() => {
"use strict";
// My Lenium Prediction: a fan-made share card. No backend, no market data.
// The confidence on the card is the person's own number, not a market price.
const W = 1200, H = 675;
const SITE_URL = location.origin; // this site's own address, wherever it is deployed
const C = {
  bg: "#0f1222", bg2: "#0a0c18", blue: "#6d85ff", yes: "#00e87a", no: "#ff5c5c",
  text: "#f2f4f8", sub: "#9aa3b8", line: "rgba(255,255,255,0.10)", card: "rgba(255,255,255,0.04)"
};
// Lenium's own market categories and example questions, from lenium.capital's homepage.
const CATS = {
  Economics: ["Fed cuts rates at the next meeting?", "CPI inflation below 3% next month?", "US recession declared this year?"],
  Politics: ["Government shutdown this year?", "Approval rating above 45% this month?"],
  Crypto: ["Bitcoin above $150K by year end?", "Ethereum above $5,000 by year end?"],
  Sports: ["Favorite wins tonight’s game?", "Home team makes the playoffs?"],
  Climate: ["Hottest year on record?"],
  Culture: ["Top film opens above $100M?"],
  Tech: ["New frontier AI model this quarter?"]
};

const $ = (id) => document.getElementById(id);
const canvas = $("card"), ctx = canvas.getContext("2d");
const els = { handle: $("handle"), question: $("question"), conf: $("conf"), confOut: $("confOut"), caption: $("caption") };
const state = { avatar: null, avatarUrl: "", xName: "", cat: "Crypto", side: "YES" };

// ---------- persistence ----------
const STORE = "leniumPrediction1";
try {
  const s = JSON.parse(localStorage.getItem(STORE) || "{}");
  if (s.handle) els.handle.value = s.handle;
  if (s.cat && CATS[s.cat]) state.cat = s.cat;
  if (s.side === "YES" || s.side === "NO") state.side = s.side;
  if (typeof s.q === "string" && s.q.trim()) els.question.value = s.q; else els.question.value = CATS[state.cat][0];
  if (s.conf >= 50 && s.conf <= 99) els.conf.value = s.conf;
} catch (e) { els.question.value = CATS[state.cat][0]; }
function persist() {
  try { localStorage.setItem(STORE, JSON.stringify({ handle: els.handle.value, cat: state.cat, side: state.side, q: els.question.value, conf: +els.conf.value })); } catch (e) {}
}

// ---------- assets ----------
function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
const assets = {};
const ready = Promise.all([
  loadImg("assets/mark.png").then((i) => (assets.mark = i)).catch(() => {}),
  loadImg("assets/word.png").then((i) => (assets.word = i)).catch(() => {}),
  document.fonts ? Promise.all([
    document.fonts.load('800 80px "Bricolage Grotesque"'), document.fonts.load('700 40px "Bricolage Grotesque"'),
    document.fonts.load('500 20px "Geist"'), document.fonts.load('600 20px "Geist"'), document.fonts.load('500 18px "Geist Mono"')
  ]).catch(() => {}) : Promise.resolve()
]);

// ---------- helpers ----------
const FB = ', system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const fD = (w, s) => `${w} ${s}px "Bricolage Grotesque"${FB}`;
const fS = (w, s) => `${w} ${s}px "Geist"${FB}`;
const fM = (w, s) => `${w} ${s}px "Geist Mono", ui-monospace, Menlo, monospace`;
function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function setLS(px) { if ("letterSpacing" in ctx) ctx.letterSpacing = px + "px"; }
function wrap(text, width) {
  const words = text.split(/\s+/).filter(Boolean), lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width <= width || !line) line = t; else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines;
}
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "L";
  const a = Array.from(parts[0])[0] || "";
  const b = parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] || "") : (Array.from(parts[0])[1] || "");
  return (a + b).toUpperCase();
}
function cleanHandle(h) { return h.trim().replace(/^@+/, "").replace(/\s+/g, ""); }
function displayName() { return (state.xName || "").trim() || cleanHandle(els.handle.value); }
function question() { return els.question.value.trim().replace(/\s+/g, " "); }
function conf() { return Math.max(50, Math.min(99, Math.round(+els.conf.value || 50))); }

// ---------- draw ----------
let drawVer = 0;
function draw() {
  drawVer++; if (typeof queuePre === "function") queuePre();
  const handle = cleanHandle(els.handle.value) || "yourhandle";
  const name = displayName() || "Your X name";
  const q = question() || "Your prediction here?";
  const yes = state.side === "YES", V = yes ? C.yes : C.no, n = conf();
  ctx.save(); ctx.clearRect(0, 0, W, H); setLS(0);

  // background: Lenium navy with a soft logo-blue glow and a verdict-coloured glow
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  let g = ctx.createRadialGradient(140, -60, 0, 140, -60, 620);
  g.addColorStop(0, "rgba(109,133,255,0.30)"); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  g = ctx.createRadialGradient(960, 360, 0, 960, 360, 460);
  g.addColorStop(0, hexA(V, 0.16)); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255,255,255,0.035)"; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 0.5; x < W; x += 48) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0.5; y < H; y += 48) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
  g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgba(10,12,24,0)"); g.addColorStop(1, "rgba(10,12,24,0.55)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // top row: avatar + name + handle (left), category chip (right)
  const ax = 64, ay = 56, ad = 84, acx = ax + ad / 2, acy = ay + ad / 2;
  ctx.beginPath(); ctx.arc(acx, acy, ad / 2 + 5, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = C.blue; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(acx, acy, ad / 2, 0, Math.PI * 2); ctx.clip();
  if (state.avatar) {
    const im = state.avatar, s = Math.min(im.width, im.height);
    ctx.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, ax, ay, ad, ad);
  } else {
    const og = ctx.createLinearGradient(ax, ay, ax + ad, ay + ad);
    og.addColorStop(0, "#6d85ff"); og.addColorStop(1, "#3b4bb8"); ctx.fillStyle = og; ctx.fillRect(ax, ay, ad, ad);
    ctx.fillStyle = "#fff"; ctx.font = fD(700, 34); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(initials(name), acx, acy + 2);
  }
  ctx.restore();
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  // category chip first, so the name knows how much room it has
  ctx.font = fM(600, 18); setLS(2);
  const chipTxt = state.cat.toUpperCase(), cw = ctx.measureText(chipTxt).width + 64, chx = W - 64 - cw, chy = 74;
  rr(chx, chy, cw, 48, 24); ctx.fillStyle = "rgba(109,133,255,0.14)"; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(109,133,255,0.55)"; ctx.stroke();
  ctx.beginPath(); ctx.arc(chx + 24, chy + 24, 5, 0, Math.PI * 2); ctx.fillStyle = C.blue; ctx.fill();
  ctx.fillStyle = C.text; ctx.textBaseline = "middle"; ctx.fillText(chipTxt, chx + 38, chy + 25); setLS(0); ctx.textBaseline = "alphabetic";
  const nameMax = chx - 40 - (ax + ad + 24);
  let ns = 36; ctx.font = fD(700, ns);
  while (ns > 22 && ctx.measureText(name).width > nameMax) { ns--; ctx.font = fD(700, ns); }
  let nm = name; while (ctx.measureText(nm).width > nameMax && nm.length > 2) nm = nm.slice(0, -2) + "…";
  ctx.fillStyle = C.text; ctx.fillText(nm, ax + ad + 24, ay + 40);
  ctx.font = fM(500, 20); ctx.fillStyle = C.sub; ctx.fillText("@" + handle, ax + ad + 24, ay + 72);

  // left: label + question
  const lx = 64, lw = 640;
  ctx.font = fM(600, 18); setLS(3); ctx.fillStyle = C.blue; ctx.fillText("MY LENIUM PREDICTION", lx, 222); setLS(0);
  let qs = 60, lines;
  for (; qs >= 30; qs -= 2) { ctx.font = fD(700, qs); lines = wrap(q, lw); if (lines.length <= 4 && lines.length * qs * 1.08 <= 300 && lines.every((l) => ctx.measureText(l).width <= lw)) break; }
  ctx.font = fD(700, qs); lines = wrap(q, lw);
  if (lines.length > 4) { lines = lines.slice(0, 4); let l = lines[3]; while (ctx.measureText(l + "…").width > lw && l.length) l = l.slice(0, -1); lines[3] = l.trimEnd() + "…"; }
  setLS(-1); ctx.fillStyle = C.text;
  const lh = qs * 1.08, qTop = 262 + qs * 0.82;
  lines.forEach((l, i) => ctx.fillText(l, lx, qTop + i * lh));
  setLS(0);

  // right: the call
  const px = 768, py = 168, pw = 368, ph = 352;
  rr(px, py, pw, ph, 28); ctx.fillStyle = hexA(V, 0.08); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = hexA(V, 0.55); ctx.stroke();
  ctx.textAlign = "center"; ctx.font = fM(600, 17); setLS(3); ctx.fillStyle = C.sub; ctx.fillText("MY CALL", px + pw / 2, py + 50); setLS(0);
  ctx.save(); ctx.shadowColor = hexA(V, 0.55); ctx.shadowBlur = 40;
  ctx.font = fD(800, yes ? 150 : 160); setLS(-4); ctx.fillStyle = V; ctx.fillText(state.side, px + pw / 2, py + 196); setLS(0);
  ctx.restore();
  ctx.font = fS(600, 30); ctx.fillStyle = C.text; ctx.fillText(n + "% sure", px + pw / 2, py + 252);
  // confidence bar (the person's own number)
  const bx = px + 44, bw = pw - 88, by = py + 290;
  rr(bx, by, bw, 12, 6); ctx.fillStyle = "rgba(255,255,255,0.10)"; ctx.fill();
  const fw = Math.max(12, bw * (n - 50) / 49);
  rr(bx, by, fw, 12, 6); ctx.fillStyle = V; ctx.fill();
  ctx.font = fM(500, 14); ctx.fillStyle = C.sub; ctx.textAlign = "left"; ctx.fillText("50%", bx, by + 36);
  ctx.textAlign = "right"; ctx.fillText("99%", bx + bw, by + 36);
  ctx.textAlign = "center"; ctx.fillText("CONFIDENCE", px + pw / 2, by + 36);

  // footer: real Lenium mark + wordmark, site, credit
  ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(64, 572.5); ctx.lineTo(W - 64, 572.5); ctx.stroke();
  let fx = 64;
  if (assets.mark) { ctx.drawImage(assets.mark, fx, 594, 44, 44); fx += 54; }
  if (assets.word) { const wh = 30, ww = wh * assets.word.width / assets.word.height; ctx.drawImage(assets.word, fx, 601, ww, wh); fx += ww + 18; }
  ctx.textAlign = "left"; ctx.font = fM(500, 18); ctx.fillStyle = C.sub; ctx.fillText("lenium.capital", fx, 623);
  ctx.textAlign = "right"; ctx.font = fS(500, 17); ctx.fillStyle = "rgba(242,244,248,0.55)";
  ctx.fillText("made by @iamlogtun · not official", W - 64, 623);
  ctx.restore();
  updateCaption();
}
let raf = 0;
function schedule() { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { raf = 0; draw(); persist(); }); }

// ---------- caption ----------
function shareText() {
  let q = question() || "Your prediction here?";
  if (q.length > 140) q = q.slice(0, 139) + "…";
  return `My call: ${q} → ${state.side} (${conf()}% sure).\n\nThink you can trade predictions better? Lenium funds traders who prove their edge 👉 lenium.capital @Lenium_Capital\n\nMake yours → ${SITE_URL}`;
}
function updateCaption() { if (els.caption) els.caption.value = shareText(); }

// ---------- inputs ----------
function renderStarters() {
  const box = $("starters"); box.textContent = "";
  CATS[state.cat].forEach((t) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "starter"; b.textContent = t;
    b.addEventListener("click", () => { els.question.value = t; schedule(); });
    box.append(b);
  });
}
function setCat(c) {
  state.cat = c;
  document.querySelectorAll('input[name="cat"]').forEach((r) => (r.checked = r.value === c));
  renderStarters(); schedule();
}
function setSide(s) {
  state.side = s;
  document.querySelectorAll(".side-btn").forEach((b) => { const on = b.dataset.side === s; b.setAttribute("aria-pressed", on ? "true" : "false"); });
  document.documentElement.dataset.side = s; schedule();
}
(function buildCats() {
  const box = $("cats");
  Object.keys(CATS).forEach((c) => {
    const l = document.createElement("label"); l.className = "cat";
    l.innerHTML = `<input type="radio" name="cat" value="${c}"><span>${c}</span>`;
    l.querySelector("input").addEventListener("change", () => setCat(c));
    box.append(l);
  });
})();
document.querySelectorAll(".side-btn").forEach((b) => b.addEventListener("click", () => setSide(b.dataset.side)));
els.question.addEventListener("input", schedule);
els.conf.addEventListener("input", () => { els.confOut.textContent = conf() + "%"; schedule(); });
$("btnRandomQ").addEventListener("click", () => {
  const list = CATS[state.cat], cur = els.question.value; let next = cur, i = 0;
  while (next === cur && i++ < 10) next = list[Math.floor(Math.random() * list.length)];
  els.question.value = next; schedule();
});
$("btnCopyCaption").addEventListener("click", async () => {
  const t = shareText();
  try { await navigator.clipboard.writeText(t); toast("Caption copied ✓"); }
  catch (e) { els.caption.focus(); els.caption.select(); toast("Select the caption and copy it."); }
});

// ---------- X lookup: display name + photo from the handle ----------
const xl = { box: $("xLookup"), av: $("xlAv"), text: $("xlText") };
let avatarSource = "none"; // "x" | "none"
let lookupTimer = 0, lookupSeq = 0, lookupCtl = null, lastLooked = "";
const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;
function setLookup(st, html, avUrl) {
  xl.box.dataset.state = st; xl.text.innerHTML = html;
  xl.av.style.backgroundImage = avUrl ? `url("${avUrl}")` : "";
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function withTimeout(ms, outer) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  if (outer) outer.addEventListener("abort", () => c.abort());
  return { signal: c.signal, done: () => clearTimeout(t) };
}
// Fetch an image as a blob (CORS) and copy it onto our own canvas, so the card canvas
// never gets tainted and Download / Share / Copy keep working.
async function blobAvatar(url, outer) {
  const to = withTimeout(8000, outer);
  try {
    const r = await fetch(url, { mode: "cors", signal: to.signal, credentials: "omit" });
    if (!r.ok) throw new Error("img " + r.status);
    const b = await r.blob();
    if (!/^image\//.test(b.type) || b.size < 200) throw new Error("not an image");
    const u = URL.createObjectURL(b);
    try {
      const im = await loadImg(u);
      const s = Math.min(im.naturalWidth, im.naturalHeight), size = Math.min(s, 400);
      const c = document.createElement("canvas"); c.width = c.height = size;
      c.getContext("2d").drawImage(im, (im.naturalWidth - s) / 2, (im.naturalHeight - s) / 2, s, s, 0, 0, size, size);
      return { canvas: c, thumb: c.toDataURL("image/jpeg", 0.8) };
    } finally { URL.revokeObjectURL(u); }
  } finally { to.done(); }
}
async function fetchProfile(handle, outer) {
  const to = withTimeout(7000, outer);
  try {
    const r = await fetch("https://api.fxtwitter.com/" + encodeURIComponent(handle), { signal: to.signal, credentials: "omit" });
    const j = await r.json().catch(() => null);
    if (!j || !j.user) return { notFound: r.status === 404 || (j && j.code === 404) };
    return { name: j.user.name, screen: j.user.screen_name, avatar: j.user.avatar_url };
  } finally { to.done(); }
}
async function lookup(handle) {
  const seq = ++lookupSeq;
  if (lookupCtl) lookupCtl.abort();
  const ctl = (lookupCtl = new AbortController());
  lastLooked = handle.toLowerCase();
  setLookup("loading", `Looking up @${esc(handle)} on X…`);
  let prof = null;
  // the name service sometimes answers "not found" for real accounts; ask up to 3 times
  for (let i = 0; i < 3; i++) {
    try { prof = await fetchProfile(handle, ctl.signal); } catch (e) { prof = null; }
    if (seq !== lookupSeq || (prof && prof.name)) break;
    await new Promise((r) => setTimeout(r, 700 + i * 600));
    if (seq !== lookupSeq) return;
  }
  if (seq !== lookupSeq) return;
  if (prof && prof.name) {
    state.xName = prof.name;
    if (prof.screen && prof.screen.toLowerCase() === handle.toLowerCase() && prof.screen !== els.handle.value && document.activeElement !== els.handle) els.handle.value = prof.screen;
    schedule();
  }
  // photo: X's own image first (full size), then unavatar as a fallback
  let av = null;
  {
    const urls = [];
    if (prof && prof.avatar) urls.push(prof.avatar.replace(/_normal(\.[a-z]+)$/i, "_400x400$1"), prof.avatar);
    urls.push("https://unavatar.io/x/" + encodeURIComponent(handle) + "?fallback=false");
    for (const u of urls) {
      try { av = await blobAvatar(u, ctl.signal); av.url = u; break; } catch (e) { if (seq !== lookupSeq) return; }
    }
    if (seq !== lookupSeq) return;
    if (av) { state.avatar = av.canvas; state.avatarUrl = av.url; avatarSource = "x"; schedule(); }
  }
  if (prof && prof.name) {
    setLookup("found", `✓ <b>${esc(prof.name)}</b>${av ? "" : " <span class=\"muted\">(no photo, using initials)</span>"}`, av ? av.thumb : "");
  } else if (prof && prof.notFound) {
    setLookup("error", `Couldn’t find @${esc(handle)} on X. Check the spelling. Your handle will show as your name for now.`, av ? av.thumb : "");
  } else {
    setLookup("error", `Couldn’t reach X right now. Your handle will show as your name${av ? "" : ", with initials for the photo"}.`, av ? av.thumb : "");
  }
}
function onHandleInput(immediate) {
  clearTimeout(lookupTimer);
  const h = cleanHandle(els.handle.value);
  if (!h) {
    lookupSeq++; if (lookupCtl) lookupCtl.abort(); lastLooked = "";
    state.xName = "";
    if (avatarSource === "x") { state.avatar = null; state.avatarUrl = ""; avatarSource = "none"; }
    setLookup("idle", "Enter your handle and we’ll pull your X name and photo.");
    schedule(); return;
  }
  if (!HANDLE_RE.test(h)) { setLookup("error", "X handles are letters, numbers and _ only (max 15)."); schedule(); return; }
  if (h.toLowerCase() === lastLooked) return;
  // a different person: don't keep the previous person's auto-filled name/photo
  state.xName = "";
  if (avatarSource === "x") { state.avatar = null; state.avatarUrl = ""; avatarSource = "none"; }
  schedule();
  setLookup("loading", `Looking up @${esc(h)} on X…`);
  lookupTimer = setTimeout(() => lookup(h), immediate ? 0 : 650);
}
els.handle.addEventListener("input", () => { schedule(); onHandleInput(false); });
els.handle.addEventListener("change", () => onHandleInput(true));

// ---------- output ----------
function fileName() {
  const h = cleanHandle(els.handle.value).replace(/[^A-Za-z0-9_]/g, "");
  return `lenium-prediction${h ? "-" + h : ""}.png`;
}
function getBlob() { draw(); return new Promise((res) => canvas.toBlob((b) => res(b), "image/png")); }
const isIOS = /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isInApp = /FBAN|FBAV|Instagram|Line\/|WhatsApp|Twitter|; wv\)/i.test(navigator.userAgent);

let lastUrl = null;
function showModal(url, withX) {
  $("modalImg").src = url;
  $("modalTitle").textContent = withX ? "Save your card, then post" : "Save your card";
  $("modalSteps").innerHTML = withX
    ? "Press and hold the image, tap <strong>Save to Photos</strong>, then tap <strong>Open X</strong> and attach it to your post."
    : "Press and hold the image, then tap <strong>Save to Photos</strong>.";
  const ox = $("modalOpenX"); ox.hidden = !withX; if (withX) ox.href = intentUrl();
  $("modal").hidden = false;
}
$("btnDownload").addEventListener("click", async () => {
  const blob = await getBlob();
  if (!blob) return toast("Something went wrong. Try again.");
  if (lastUrl) URL.revokeObjectURL(lastUrl);
  lastUrl = URL.createObjectURL(blob);
  if (isIOS || isInApp) {
    // iOS saves downloads to Files and in-app browsers often block them: show the image to long-press instead
    showModal(lastUrl, false);
    
    return;
  }
  const a = document.createElement("a");
  a.href = lastUrl; a.download = fileName(); document.body.append(a); a.click(); a.remove();
  toast("Card downloaded. Now attach it to your post on X.");
  
});

// ---------- Share on X ----------
// (X web intents can't attach images, and a second link only adds a second preview card.)
function intentUrl() { return "https://x.com/intent/tweet?text=" + encodeURIComponent(shareText()); }

// Phones: share the card PNG + text through the native share sheet (pick X → image attached).
// The PNG is pre-rendered after every change so navigator.share() runs straight inside the tap.
var canShareFiles = false;
try {
  const probe = new File([new Blob(["x"], { type: "image/png" })], "probe.png", { type: "image/png" });
  canShareFiles = !!(navigator.share && navigator.canShare && navigator.canShare({ files: [probe] }));
} catch (e) {}
var pre = { ver: -1, blob: null, file: null };
var preTimer = 0;
function queuePre() {
  clearTimeout(preTimer);
  preTimer = setTimeout(() => {
    const v = drawVer;
    canvas.toBlob((b) => { if (b && v === drawVer) pre = { ver: v, blob: b, file: new File([b], fileName(), { type: "image/png" }) }; }, "image/png");
  }, 250);
}
// synchronous fallback when the tap lands before the pre-render caught up
function blobNowSync() {
  const d = canvas.toDataURL("image/png"), bin = atob(d.split(",")[1]), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Blob([u], { type: "image/png" });
}
function currentFile() {
  if (raf) { cancelAnimationFrame(raf); raf = 0; draw(); persist(); }
  if (pre.file && pre.ver === drawVer && pre.file.name === fileName()) return pre.file;
  const b = blobNowSync();
  pre = { ver: drawVer, blob: b, file: new File([b], fileName(), { type: "image/png" }) };
  return pre.file;
}
const shareDbg = (window.__shareDbg = { branch: "", intent: "", text: "" });

function fallbackShare(blob) {
  shareDbg.intent = intentUrl();
  
  if (lastUrl) URL.revokeObjectURL(lastUrl);
  lastUrl = URL.createObjectURL(blob);
  if (isIOS || isInApp) { shareDbg.branch = "modal"; showModal(lastUrl, true); return; }
  shareDbg.branch = "download";
  const a = document.createElement("a");
  a.href = lastUrl; a.download = fileName(); document.body.append(a); a.click(); a.remove();
  let copy = Promise.resolve(false);
  try {
    if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write && !isIOS)
      copy = navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(() => true, () => false);
  } catch (e) {}
  const late = new Promise((r) => setTimeout(() => r(false), 700));
  Promise.race([copy, late]).then((copied) => {
    shareDbg.copied = copied;
    toast(copied ? "Card saved, attach it to your post 📎 (on desktop you can paste with Ctrl/Cmd+V)"
                 : "Card saved, attach it to your post 📎", null, 9000);
    setTimeout(() => {
      const w = window.open(shareDbg.intent, "_blank");
      if (w) { try { w.opener = null; } catch (e) {} }
      shareDbg.opened = !!w;
      if (!w) toast("Card saved 📎 Now open X and attach it.", { label: "Open X →", href: shareDbg.intent }, 12000);
    }, 600);
  });
}

$("btnShareX").addEventListener("click", () => {
  const file = currentFile();
  shareDbg.text = shareText();
  if (canShareFiles) {
    shareDbg.branch = "share";
    let p;
    try { p = navigator.share({ files: [file], text: shareDbg.text }); }
    catch (e) { return fallbackShare(file); }
    p.then(() => {}, (e) => { if (!e || e.name !== "AbortError") fallbackShare(file); });
    return;
  }
  fallbackShare(file);
});

(function setupCopy() {
  if (!(window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) || isIOS) return;
  const btn = $("btnCopy"); btn.hidden = false;
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": getBlob() })]);
      toast("Copied! Paste it straight into your post.");
    } catch (e) { toast("Your browser blocked copying. Use Download instead."); }
  });
})();

$("modalClose").addEventListener("click", () => ($("modal").hidden = true));
$("modal").addEventListener("click", (e) => { if (e.target.id === "modal") $("modal").hidden = true; });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("modal").hidden = true; });


let tt = 0;
function toast(msg, action, ms) {
  const t = $("toast"); t.textContent = msg;
  if (action) { const a = document.createElement("a"); a.href = action.href; a.target = "_blank"; a.rel = "noopener"; a.textContent = action.label; a.className = "toast-act"; t.append(" ", a); }
  t.classList.toggle("act", !!action); t.classList.add("show");
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), ms || 3200);
}

els.handle.addEventListener("blur", () => { els.handle.value = cleanHandle(els.handle.value); schedule(); });
setCat(state.cat); setSide(state.side); els.confOut.textContent = conf() + "%";
draw();
ready.then(() => { draw(); document.documentElement.dataset.ready = "1"; });
// test hook
window.__lenium = { draw, getBlob, state, lookup, intentUrl, shareText, setSide, setCat, canShareFiles: () => canShareFiles };
if (cleanHandle(els.handle.value)) onHandleInput(true);
})();
