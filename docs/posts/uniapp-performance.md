---
title: uni-app 性能优化实战
date: 2024-08-20
---

# uni-app 性能优化实战

## 性能优化架构

```
┌─────────────────────────────────────────────────────────┐
│                   性能优化体系                         │
├─────────────────────────────────────────────────────────┤
│  首屏优化 ──> 包体积优化 ──> 渲染优化 ──> 运行时优化   │
│      │             │             │             │       │
│      ▼             ▼             ▼             ▼       │
│  资源预加载    代码分割      虚拟列表       内存管理    │
│  骨架屏       静态资源压缩    按需渲染      事件节流    │
│  请求优化     Tree Shaking   样式优化      缓存策略    │
└─────────────────────────────────────────────────────────┘
```

## 首屏优化

### 骨架屏实现

```vue
<template>
  <view class="skeleton">
    <view v-if="!loaded" class="skeleton-content">
      <view class="skeleton-header">
        <view class="skeleton-avatar"></view>
        <view class="skeleton-info">
          <view class="skeleton-title"></view>
          <view class="skeleton-desc"></view>
        </view>
      </view>
      <view class="skeleton-list">
        <view class="skeleton-item" v-for="i in 3" :key="i">
          <view class="skeleton-item-img"></view>
          <view class="skeleton-item-content">
            <view class="skeleton-item-title"></view>
            <view class="skeleton-item-desc"></view>
          </view>
        </view>
      </view>
    </view>
    <view v-else class="content">
      <!-- 实际内容 -->
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      loaded: false
    }
  },
  async onMounted() {
    await this.loadData()
    this.loaded = true
  }
}
</script>

<style lang="scss">
.skeleton-content {
  padding: 20rpx;
}

.skeleton-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
```

### 资源预加载

```javascript
// pages.json 配置预加载
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "首页"
      }
    }
  ],
  "preloadRule": {
    "pages/index/index": {
      "network": "all",
      "packages": ["pages/detail/detail"]
    }
  }
}

// 动态预加载
uni.preloadPage({
  url: '/pages/detail/detail'
})
```

### 请求优化

```javascript
// 请求合并
async function loadAllData() {
  const [userInfo, articles, notices] = await Promise.all([
    fetchUserInfo(),
    fetchArticles(),
    fetchNotices()
  ])
  
  return { userInfo, articles, notices }
}

// 请求缓存
const requestCache = new Map()

async function fetchWithCache(url, options = {}) {
  const cacheKey = `${url}_${JSON.stringify(options.params)}`
  
  if (requestCache.has(cacheKey)) {
    const cached = requestCache.get(cacheKey)
    if (Date.now() - cached.timestamp < 60000) {
      return cached.data
    }
  }
  
  const response = await uni.request({ url, ...options })
  requestCache.set(cacheKey, {
    data: response.data,
    timestamp: Date.now()
  })
  
  return response.data
}
```

## 包体积优化

### 代码分割

```javascript
// 异步组件
export default {
  components: {
    LazyComponent: () => import('./LazyComponent.vue')
  }
}

// 按需引入
import { debounce } from 'lodash-es'

// Tree Shaking 配置
// package.json
{
  "sideEffects": false
}
```

### 静态资源压缩

```javascript
// 图片压缩配置（webpack）
const imageWebpackLoader = {
  loader: 'image-webpack-loader',
  options: {
    mozjpeg: { quality: 80 },
    optipng: { enabled: true },
    pngquant: { quality: [0.6, 0.8] }
  }
}

// 字体压缩
// 使用 woff2 格式，按需引入字体子集
```

### 资源懒加载

```vue
<template>
  <image 
    v-for="(item, index) in images" 
    :key="index"
    :src="item.loaded ? item.src : '/static/placeholder.png'"
    @load="onImageLoad(index)"
    class="lazy-image"
  />
</template>

<script>
export default {
  data() {
    return {
      images: [
        { src: '/images/1.jpg', loaded: false },
        { src: '/images/2.jpg', loaded: false }
      ]
    }
  },
  onImageLoad(index) {
    this.images[index].loaded = true
  }
}
</script>
```

## 渲染优化

### 虚拟列表

```javascript
// 虚拟列表实现
class VirtualList {
  constructor(options) {
    this.container = options.container
    this.itemHeight = options.itemHeight
    this.totalItems = options.totalItems
    this.renderCount = options.renderCount || 10
    
    this.startIndex = 0
    this.endIndex = this.renderCount
  }
  
  render(items) {
    const visibleItems = items.slice(this.startIndex, this.endIndex)
    const offset = this.startIndex * this.itemHeight
    
    // 渲染可见项
    this.container.style.transform = `translateY(${offset}px)`
    this.container.innerHTML = this.renderItems(visibleItems)
  }
  
  onScroll(scrollTop) {
    this.startIndex = Math.floor(scrollTop / this.itemHeight)
    this.endIndex = this.startIndex + this.renderCount
    
    if (this.endIndex > this.totalItems) {
      this.endIndex = this.totalItems
    }
    
    if (this.startIndex < 0) {
      this.startIndex = 0
    }
  }
}
```

### 按需渲染

```vue
<template>
  <view>
    <view v-if="activeTab === 'list'" class="list-content">
      <ListComponent />
    </view>
    <view v-else-if="activeTab === 'detail'" class="detail-content">
      <DetailComponent />
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      activeTab: 'list'
    }
  },
  components: {
    ListComponent: () => import('./ListComponent.vue'),
    DetailComponent: () => import('./DetailComponent.vue')
  }
}
</script>
```

### 样式优化

```css
/* 使用 CSS 变量 */
:root {
  --primary-color: #07c160;
  --text-color: #333;
}

/* 避免重排属性 */
.element {
  transform: translateX(10px); /* 好 */
  /* left: 10px; 坏 */
}

/* 使用 will-change */
.will-change-element {
  will-change: transform, opacity;
}

/* 减少选择器复杂度 */
/* 好 */
.card-title { }

/* 坏 */
.page .container .card .card-title { }
```

## 运行时优化

### 事件节流防抖

```javascript
// 节流
function throttle(fn, delay = 100) {
  let lastTime = 0
  
  return function(...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

// 防抖
function debounce(fn, delay = 300) {
  let timer = null
  
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 使用示例
onMounted(() => {
  const scrollHandler = throttle(() => {
    // 滚动处理逻辑
  }, 100)
  
  uni.$on('scroll', scrollHandler)
})
```

### 内存管理

```javascript
// 及时清理定时器
export default {
  data() {
    return {
      timer: null
    }
  },
  onMounted() {
    this.timer = setInterval(() => {
      // 定时任务
    }, 1000)
  },
  onUnmounted() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}

// 避免内存泄漏
export default {
  onMounted() {
    // 错误：保留了对已销毁组件的引用
    // someGlobalCallback(() => {
    //   this.updateData()
    // })
    
    // 正确：使用弱引用
    const weakThis = new WeakRef(this)
    someGlobalCallback(() => {
      const self = weakThis.deref()
      if (self) {
        self.updateData()
      }
    })
  }
}
```

### 缓存策略

```javascript
// 本地存储缓存
const storage = {
  set(key, value, expires = 3600000) {
    const data = {
      value,
      expires: Date.now() + expires
    }
    uni.setStorageSync(key, JSON.stringify(data))
  },
  
  get(key) {
    try {
      const item = uni.getStorageSync(key)
      if (!item) return null
      
      const data = JSON.parse(item)
      if (Date.now() > data.expires) {
        uni.removeStorageSync(key)
        return null
      }
      
      return data.value
    } catch {
      return null
    }
  },
  
  remove(key) {
    uni.removeStorageSync(key)
  }
}

// 使用示例
async function getUserInfo() {
  const cached = storage.get('userInfo')
  if (cached) return cached
  
  const userInfo = await fetchUserInfo()
  storage.set('userInfo', userInfo)
  
  return userInfo
}
```

## 性能监控

```javascript
// 性能监控工具
class PerformanceMonitor {
  constructor() {
    this.metrics = {}
  }
  
  start(key) {
    this.metrics[key] = {
      startTime: Date.now(),
      endTime: null,
      duration: null
    }
  }
  
  end(key) {
    if (this.metrics[key]) {
      this.metrics[key].endTime = Date.now()
      this.metrics[key].duration = 
        this.metrics[key].endTime - this.metrics[key].startTime
    }
  }
  
  report() {
    console.log('Performance Report:', this.metrics)
  }
}

// 使用示例
const monitor = new PerformanceMonitor()

monitor.start('pageLoad')
await loadPageData()
monitor.end('pageLoad')

monitor.report()
```

## 总结

| 优化维度 | 具体措施 |
|----------|----------|
| 首屏优化 | 骨架屏、资源预加载、请求合并 |
| 包体积优化 | 代码分割、静态资源压缩、按需引入 |
| 渲染优化 | 虚拟列表、按需渲染、样式优化 |
| 运行时优化 | 节流防抖、内存管理、缓存策略 |
| 性能监控 | 自定义监控工具、性能指标收集 |
