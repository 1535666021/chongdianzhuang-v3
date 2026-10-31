const CACHE_NAME = `cdz-v3-cache-${__APP_VERSION__}`
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
]
const PRECACHE_ASSETS = (self.__WB_MANIFEST || []).map((entry) => entry.url)

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([...new Set([...STATIC_ASSETS, ...PRECACHE_ASSETS])]))
  )
  // P0-099 autoUpdate：新 SW 安装完成立即激活，配合 activate 清旧缓存，重部署后打开即新版
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('cdz-v3-cache-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const requestUrl = new URL(event.request.url)
  // version.json 维持不拦截（现状对）
  if (requestUrl.origin !== self.location.origin || requestUrl.pathname.endsWith('/version.json')) return

  // P0-217 G2a：导航请求 network-first——3s 超时/失败→缓存兜底→再退离线 index.html，永远拿到新 HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      Promise.race([
        fetch(event.request).then((res) => {
          if (res.ok) event.waitUntil(caches.open(CACHE_NAME).then((c) => c.put(event.request, res.clone())))
          return res
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('network timeout')), 3000)),
      ])
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    )
    return
  }

  // P0-217 G2b：静态资源 stale-while-revalidate——立即返回缓存，后台静默更新；未命中才等网络
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const refresh = fetch(event.request).then((res) => {
        if (res.ok) event.waitUntil(caches.open(CACHE_NAME).then((c) => c.put(event.request, res.clone())))
        return res
      }).catch(() => cached)
      return cached || refresh
    })
  )
})
