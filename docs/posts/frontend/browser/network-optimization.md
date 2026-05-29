---
title: 网络请求优化
date: 2024-09-20
---

# 网络请求优化

## 网络优化架构

```
┌─────────────────────────────────────────────────────────┐
│                    网络优化体系                        │
├─────────────────────────────────────────────────────────┤
│  请求优化 ──> 缓存策略 ──> 压缩优化 ──> CDN 加速     │
│      │             │             │             │       │
│      ▼             ▼             ▼             ▼       │
│  请求合并      HTTP缓存       Gzip/Brotli     静态资源  │
│  请求优先级    Service Worker   图片优化       边缘节点  │
│  请求重试      本地存储        资源内联       负载均衡  │
└─────────────────────────────────────────────────────────┘
```

## 请求优化

### 请求合并

```javascript
// 请求合并工具
class RequestBatcher {
  constructor(batchSize = 10, delay = 100) {
    this.queue = []
    this.batchSize = batchSize
    this.delay = delay
    this.timer = null
  }
  
  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject })
      
      if (this.queue.length >= this.batchSize) {
        this.flush()
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.delay)
      }
    })
  }
  
  async flush() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    
    const batch = [...this.queue]
    this.queue = []
    
    try {
      const requests = batch.map(item => item.request)
      const responses = await fetchBatch(requests)
      
      batch.forEach((item, index) => {
        item.resolve(responses[index])
      })
    } catch (err) {
      batch.forEach(item => {
        item.reject(err)
      })
    }
  }
}

// 使用示例
const batcher = new RequestBatcher()

async function fetchUser(id) {
  return batcher.add({ type: 'user', id })
}
```

### 请求优先级

```javascript
// 请求优先级管理
const priorities = {
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
}

class PriorityQueue {
  constructor() {
    this.queue = []
  }
  
  add(request, priority = priorities.NORMAL) {
    this.queue.push({ request, priority })
    this.queue.sort((a, b) => a.priority - b.priority)
  }
  
  get() {
    return this.queue.shift()?.request
  }
  
  process() {
    while (this.queue.length > 0) {
      const item = this.get()
      if (item) {
        this.executeRequest(item)
      }
    }
  }
  
  async executeRequest(request) {
    try {
      const response = await fetch(request.url, request.options)
      return response.json()
    } catch (err) {
      console.error('Request failed:', err)
    }
  }
}
```

### 请求重试

```javascript
// 带重试的请求
async function fetchWithRetry(url, options = {}, retries = 3) {
  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  } catch (err) {
    if (retries > 0) {
      console.log(`Retrying (${retries} attempts left)`)
      await delay(Math.pow(2, 3 - retries) * 1000) // 指数退避
      return fetchWithRetry(url, options, retries - 1)
    }
    
    throw err
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

## 缓存策略

### HTTP 缓存

```javascript
// 缓存控制头配置
const cacheConfig = {
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable'
  },
  api: {
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
  },
  noCache: {
    'Cache-Control': 'no-cache'
  }
}

// ETag 缓存
async function fetchWithETag(url, options = {}) {
  const cachedETag = localStorage.getItem(`etag_${url}`)
  
  const headers = {
    ...options.headers,
    'If-None-Match': cachedETag || ''
  }
  
  const response = await fetch(url, { ...options, headers })
  
  if (response.status === 304) {
    // 使用缓存
    return JSON.parse(localStorage.getItem(`cache_${url}`))
  }
  
  if (response.ok) {
    const etag = response.headers.get('ETag')
    const data = await response.json()
    
    localStorage.setItem(`etag_${url}`, etag)
    localStorage.setItem(`cache_${url}`, JSON.stringify(data))
    
    return data
  }
  
  throw new Error('Request failed')
}
```

### Service Worker 缓存

```javascript
// Service Worker 缓存策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      
      return fetch(event.request).then((networkResponse) => {
        caches.open('my-cache').then((cache) => {
          cache.put(event.request, networkResponse.clone())
        })
        
        return networkResponse
      })
    })
  )
})

// 缓存更新策略
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== 'my-cache'
        }).map((cacheName) => {
          return caches.delete(cacheName)
        })
      )
    })
  )
})
```

## 压缩优化

### Gzip/Brotli 压缩

```javascript
// 服务器配置（Express）
const compression = require('compression')

app.use(compression({
  level: 6, // 压缩级别
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  }
}))

// Brotli 压缩
const brotli = require('brotli')

app.get('/api/data', (req, res) => {
  const data = generateData()
  const compressed = brotli.compress(Buffer.from(JSON.stringify(data)))
  
  res.setHeader('Content-Encoding', 'br')
  res.setHeader('Content-Type', 'application/json')
  res.send(compressed)
})
```

### 图片优化

```javascript
// 响应式图片
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img src="image.jpg" alt="Image">
</picture>

// WebP 支持检测
function supportsWebP() {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAAkA0JaQAA3AA/vuUAAA='
  })
}
```

## CDN 加速

### CDN 配置

```javascript
// CDN 资源引用
const cdnConfig = {
  baseUrl: 'https://cdn.example.com',
  version: 'v1.0.0'
}

function getCDNUrl(path) {
  return `${cdnConfig.baseUrl}/${cdnConfig.version}${path}`
}

// 使用示例
const scriptUrl = getCDNUrl('/js/app.js')
const styleUrl = getCDNUrl('/css/style.css')
```

### 资源预加载

```html
<!-- 预加载关键资源 -->
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="critical.js" as="script">
<link rel="preload" href="hero.webp" as="image">

<!-- 预连接 -->
<link rel="preconnect" href="https://cdn.example.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- 预获取 -->
<link rel="prefetch" href="/next-page.html">
```

## 请求监控

```javascript
// 请求监控工具
class RequestMonitor {
  constructor() {
    this.requests = []
    this.totalTime = 0
  }
  
  start(requestId, url) {
    this.requests.push({
      id: requestId,
      url,
      startTime: Date.now(),
      endTime: null,
      duration: null
    })
  }
  
  end(requestId) {
    const request = this.requests.find(r => r.id === requestId)
    if (request) {
      request.endTime = Date.now()
      request.duration = request.endTime - request.startTime
      this.totalTime += request.duration
    }
  }
  
  report() {
    const avgDuration = this.totalTime / this.requests.length
    const slowRequests = this.requests.filter(r => r.duration > 1000)
    
    console.log('Total requests:', this.requests.length)
    console.log('Average duration:', avgDuration.toFixed(2), 'ms')
    console.log('Slow requests:', slowRequests.length)
  }
}

// 使用示例
const monitor = new RequestMonitor()

async function fetchData(url) {
  const requestId = Math.random().toString(36).substr(2, 9)
  monitor.start(requestId, url)
  
  try {
    const response = await fetch(url)
    return response.json()
  } finally {
    monitor.end(requestId)
  }
}
```

## 总结

| 优化策略 | 具体措施 |
|----------|----------|
| 请求优化 | 请求合并、优先级管理、重试机制 |
| 缓存策略 | HTTP 缓存、Service Worker、本地存储 |
| 压缩优化 | Gzip/Brotli、图片优化、资源内联 |
| CDN 加速 | 静态资源分发、边缘节点、预加载 |
| 请求监控 | 时长统计、慢请求检测、错误追踪 |
