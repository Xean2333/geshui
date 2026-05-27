// Service Worker — 注入 Cross-Origin-Isolation headers
// GitHub Pages 默认不返回 COOP/COEP 头，导致 SharedArrayBuffer 不可用
// MediaPipe Hands WASM 需要 SharedArrayBuffer 才能运行
// 这个 SW 在每个 HTTP 响应上添加必需的 headers

const COOP = 'Cross-Origin-Opener-Policy';
const COEP = 'Cross-Origin-Embedder-Policy';
const CORP = 'Cross-Origin-Resource-Policy';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  // Notify all clients to reload
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'CROSS_ORIGIN_ISOLATION_READY' });
    });
  });
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).then(response => {
      const headers = new Headers(response.headers);
      headers.set(COOP, 'same-origin');
      headers.set(COEP, 'require-corp');

      // For mediapipe WASM/CDN resources, add CORP header
      if (
        event.request.url.includes('mediapipe') ||
        event.request.url.includes('jsdelivr') ||
        event.request.url.includes('unpkg')
      ) {
        headers.set(CORP, 'cross-origin');
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    })
  );
});
