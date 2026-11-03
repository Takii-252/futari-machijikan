// ===== サービスワーカー：一度開いたら、電波がなくても遊べるようにする =====
// ファイルを変えて公開するときは、CACHE の番号を上げる（js/save.js の APP_VER と同じ番号にそろえる）。
// 番号が変わると、次にネットにつながって開いたときに新しいファイルを取りに行き、その次に開いたときから新しい版になる。
const CACHE = "futari-12.0";
const FILES = [
  "./", "index.html", "manifest.webmanifest", "css/style.css",
  "icons/icon.svg", "icons/favicon-32.png", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png",
  "js/data/lenses.js", "js/data/meter.js", "js/data/words.js", "js/data/similo.js", "js/data/rank.js", "js/data/icons.js",
  "js/core.js", "js/save.js", "js/device.js",
  "js/games/ito.js", "js/games/meter.js", "js/games/words.js", "js/games/similo.js", "js/games/rank.js",
  "js/records.js", "js/main.js"
];

self.addEventListener("install", e => {
  // ブラウザの一時保存を使わず、公開先から取り直す
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache:"reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("futari-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // 保存してあるファイルを先に使う（版の切り替えは CACHE の番号で行う）
    e.respondWith(caches.match(req, { ignoreSearch:true }).then(hit => hit || fetch(req).catch(() =>
      req.mode === "navigate" ? caches.match("index.html") : Response.error())));
    return;
  }
  // Google Fonts の CSS：毎回ネットに取りに行き、電波がないときは空の CSS を返して端末のフォントで表示する
  // （ブラウザの一時保存の CSS を使うと、電波がないのにフォント本体を読みに行ってしまうため）
  if (url.hostname === "fonts.googleapis.com") {
    e.respondWith(fetch(req, { cache:"no-store" }).catch(() => new Response("", { headers:{ "Content-Type":"text/css" } })));
  }
});
