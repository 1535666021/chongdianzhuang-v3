// 缓存版本号：修改本文件内容时必须递增，旧缓存才会被清理
const CACHE_NAME = 'cdz-v3-cache-v2'
// 注意：全部使用相对路径，GitHub Pages子目录部署下根路径'/'会缓存到错误位置
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
]

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// 拦截请求，优先读缓存（Cache First）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      return fetch(event.request)
        .then((fetchResponse) => {
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse
          }
          const responseToCache = fetchResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
          return fetchResponse
        })
        .catch(() => {
          // 离线且缓存未命中时，返回离线页面（如有）
          return new Response('离线中，请检查网络', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          })
        })
    })
  )
})
