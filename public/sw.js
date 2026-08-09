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
  if (requestUrl.origin !== self.location.origin || requestUrl.pathname.endsWith('/version.json')) return

  const updateCache = fetch(event.request).then((response) => {
    if (response.ok) {
      event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone())))
    }
    return response
  })

  event.respondWith(
    caches.match(event.request).then((cached) => cached || updateCache).catch(() => updateCache)
  )
})
