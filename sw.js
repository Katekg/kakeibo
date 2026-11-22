/* 家計予算帳（ホーム画面アプリ）：画面のファイルをiPhoneに覚えておき、次に開く時はそれをすぐ出す。
   同時に裏で新しい版を取りに行き、次に開いた時から新しい版になる（stale-while-revalidate）。
   データ（Apps Script への問い合わせ）は扱わない。
   2026-11-22：裏で取りに行く時はブラウザの控え（最大10分）を使わず、毎回サーバーに確かめる。 */
const CACHE = "kakeibo-v2";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "index.html", "manifest.json"]).catch(() => {}))); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  const key = url.pathname.endsWith("/") ? new Request(url.origin + url.pathname) : new Request(url.origin + url.pathname);
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(key);
    const net = fetch(req, {cache: "no-cache"}).then(r => { if (r && r.ok) c.put(key, r.clone()); return r; }).catch(() => hit);
    if (hit){ e.waitUntil(net); return hit; }
    return net;
  }));
});
