/**
 * sw.js — RepTrack Service Worker
 * ─────────────────────────────────────────────
 * Strategy:
 *   • App shell (HTML, CSS, local JS) → Cache-first (fast loads)
 *   • MediaPipe CDN assets (WASM, JS, tflite models) → Network-first
 *     then fallback to cache, so the model always stays up to date
 *     but works offline if previously cached.
 *   • Google Fonts → Stale-while-revalidate (text renders immediately,
 *     font updates in background)
 */

const CACHE_VERSION = 'reptrack-v1';

/* Files that make up the app shell — cached on install */
const APP_SHELL = [
  '/',
  '/index.html',
  '/assets/css/style.css',
  '/assets/js/exercises.js',
  '/assets/js/pose.js',
  '/assets/js/ui.js',
  '/assets/icons/icon-192.svg',
  '/assets/icons/icon-512.svg',
  '/manifest.json',
];

/* CDN origins that need a network-first strategy */
const NETWORK_FIRST_ORIGINS = [
  'cdn.jsdelivr.net',   // MediaPipe JS + WASM + TFLite models
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

/* ── Install: pre-cache the app shell ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

/* ── Activate: delete old cache versions ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch: routing ── */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* Network-first for CDN / external resources */
  if (NETWORK_FIRST_ORIGINS.includes(url.hostname)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  /* Cache-first for the app shell */
  event.respondWith(cacheFirst(event.request));
});

/* Cache-first: serve from cache, fall back to network & update cache */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline — RepTrack shell not yet cached.', { status: 503 });
  }
}

/* Network-first: try network, fall back to cache */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline — resource not cached.', { status: 503 });
  }
}
