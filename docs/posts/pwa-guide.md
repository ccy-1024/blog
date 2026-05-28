---
title: PWA 实战指南
date: 2024-11-01
---

# PWA 实战指南

## PWA 架构体系

```
┌─────────────────────────────────────────────────────────┐
│                      PWA 架构                         │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Web App    │  │   Service    │  │   Web        │ │
│  │   Manifest   │  │   Worker     │  │   Push       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   离线缓存   │  │   后台同步   │  │   通知推送   │ │
│  │   Cache API  │  │   Background │  │   Notifications││
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└───────────────────────────────────────────────────────┘
```

## Web App Manifest

```json
{
  "name": "我的 PWA 应用",
  "short_name": "PWA",
  "description": "一个功能强大的 PWA 应用",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#07c160",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "shortcuts": [
    {
      "name": "快速开始",
      "short_name": "开始",
      "description": "快速进入应用",
      "url": "/quick-start",
      "icons": [{ "src": "/icons/shortcut.png", "sizes": "96x96" }]
    }
  ],
  "prefer_related_applications": false
}
```

## Service Worker 基础

```javascript
// service-worker.js

// 缓存名称和版本
const CACHE_NAME = 'my-pwa-cache-v1'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/icons/icon-192x192.png'
]

// 安装阶段 - 缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  )
})

// 激活阶段 - 清理旧缓存
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// 拦截请求 - 网络优先策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // 更新缓存
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone())
        })
        return networkResponse
      })
      .catch(() => {
        // 网络失败时返回缓存
        return caches.match(event.request)
      })
  )
})
```

## 高级缓存策略

```javascript
// 缓存优先策略
function cacheFirst(request) {
  return caches.match(request).then((cachedResponse) => {
    if (cachedResponse) {
      return cachedResponse
    }
    
    return fetch(request).then((networkResponse) => {
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, networkResponse.clone())
      })
      return networkResponse
    })
  })
}

// 网络优先策略
function networkFirst(request) {
  return fetch(request).then((networkResponse) => {
    caches.open(CACHE_NAME).then((cache) => {
      cache.put(request, networkResponse.clone())
    })
    return networkResponse
  }).catch(() => {
    return caches.match(request)
  })
}

// 新鲜度优先策略（Stale-While-Revalidate）
function staleWhileRevalidate(request) {
  return caches.match(request).then((cachedResponse) => {
    const fetchPromise = fetch(request).then((networkResponse) => {
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, networkResponse.clone())
      })
      return networkResponse
    })
    
    // 返回缓存的响应，同时在后台更新
    return cachedResponse || fetchPromise
  })
}

// 根据请求类型使用不同策略
self.addEventListener('fetch', (event) => {
  const request = event.request
  
  // 静态资源使用缓存优先
  if (request.url.includes('/static/')) {
    event.respondWith(cacheFirst(request))
    return
  }
  
  // API 请求使用网络优先
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }
  
  // 其他请求使用新鲜度优先
  event.respondWith(staleWhileRevalidate(request))
})
```

## 后台同步

```javascript
// 注册后台同步
function registerSync(tag) {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.sync.register(tag)
        .then(() => console.log('Sync registered:', tag))
        .catch((err) => console.error('Sync registration failed:', err))
    })
  }
}

// 在 Service Worker 中监听同步事件
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData())
  }
})

// 同步数据到服务器
async function syncData() {
  const data = await getPendingData()
  
  if (!data.length) return
  
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.ok) {
      await clearPendingData()
    }
  } catch (error) {
    console.error('Sync failed:', error)
    throw error
  }
}
```

## 推送通知

```javascript
// 请求通知权限
function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        subscribeToPush()
      }
    })
  }
}

// 订阅推送
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array('YOUR_PUBLIC_KEY')
  })
  
  // 将订阅信息发送到服务器
  await fetch('/api/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: { 'Content-Type': 'application/json' }
  })
}

// Base64 转换
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

// 在 Service Worker 中监听推送事件
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: '新消息', body: '您有新的通知' }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge.png',
      data: data.data || {},
      actions: data.actions || []
    })
  )
})

// 通知点击处理
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  // 打开应用或特定页面
  event.waitUntil(
    clients.openWindow('/notifications')
  )
})
```

## 离线存储

```javascript
// 离线数据存储工具
class OfflineStorage {
  constructor() {
    this.storage = window.localStorage
  }
  
  // 保存数据
  save(key, data) {
    try {
      this.storage.setItem(key, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Storage error:', error)
      return false
    }
  }
  
  // 获取数据
  get(key) {
    try {
      const data = this.storage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Storage error:', error)
      return null
    }
  }
  
  // 删除数据
  remove(key) {
    this.storage.removeItem(key)
  }
  
  // 清空所有数据
  clear() {
    this.storage.clear()
  }
  
  // 获取所有键
  keys() {
    return Object.keys(this.storage)
  }
}

// 使用示例
const offlineStorage = new OfflineStorage()

// 保存用户数据
offlineStorage.save('user', { id: 1, name: 'John' })

// 获取用户数据
const user = offlineStorage.get('user')

// 删除用户数据
offlineStorage.remove('user')
```

## PWA 检测与安装

```javascript
// PWA 安装提示
class PWAInstallPrompt {
  constructor() {
    this.deferredPrompt = null
    this.init()
  }
  
  init() {
    window.addEventListener('beforeinstallprompt', (event) => {
      // 阻止默认行为
      event.preventDefault()
      
      // 保存事件以便稍后使用
      this.deferredPrompt = event
      
      // 显示安装按钮
      this.showInstallButton()
    })
    
    window.addEventListener('appinstalled', () => {
      // 安装成功后隐藏按钮
      this.hideInstallButton()
      this.deferredPrompt = null
    })
  }
  
  showInstallButton() {
    const installBtn = document.getElementById('install-btn')
    if (installBtn) {
      installBtn.style.display = 'block'
      installBtn.addEventListener('click', () => this.install())
    }
  }
  
  hideInstallButton() {
    const installBtn = document.getElementById('install-btn')
    if (installBtn) {
      installBtn.style.display = 'none'
    }
  }
  
  async install() {
    if (!this.deferredPrompt) return
    
    // 显示安装提示
    this.deferredPrompt.prompt()
    
    // 等待用户选择
    const choiceResult = await this.deferredPrompt.userChoice
    
    if (choiceResult.outcome === 'accepted') {
      console.log('用户安装了应用')
    } else {
      console.log('用户拒绝安装')
    }
    
    this.deferredPrompt = null
  }
}

// 使用示例
new PWAInstallPrompt()
```

## 性能优化

```javascript
// PWA 性能优化策略
const pwaOptimizations = {
  // 预缓存关键资源
  precache: () => {
    // 在 Service Worker 安装时缓存
  },
  
  // 懒加载非关键资源
  lazyLoad: () => {
    const images = document.querySelectorAll('img.lazy')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target
          img.src = img.dataset.src
          observer.unobserve(img)
        }
      })
    })
    
    images.forEach((img) => observer.observe(img))
  },
  
  // 减少首屏加载时间
  optimizeFirstLoad: () => {
    // 代码分割
    // 关键 CSS 内联
    // 资源预加载
  },
  
  // 缓存策略优化
  optimizeCaching: () => {
    // 根据资源类型使用不同策略
    // 设置合理的缓存时间
  }
}
```

## 总结

| PWA 特性 | 说明 |
|----------|------|
| Web App Manifest | 应用配置、图标、启动方式 |
| Service Worker | 离线缓存、请求拦截、后台同步 |
| Push Notifications | 推送通知、用户唤醒 |
| Background Sync | 离线数据同步 |
| Cache API | 资源缓存管理 |
| LocalStorage | 本地数据存储 |