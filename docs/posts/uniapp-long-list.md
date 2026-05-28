---
title: uni-app 长列表优化
date: 2024-09-01
---

# uni-app 长列表优化

## 长列表优化架构

```
┌─────────────────────────────────────────────────────────┐
│                    长列表优化方案                      │
├─────────────────────────────────────────────────────────┤
│  虚拟列表 ──> 分页加载 ──> 滚动优化 ──> 内存管理      │
│      │             │             │             │       │
│      ▼             ▼             ▼             ▼       │
│  窗口渲染      增量加载      节流防抖       及时释放    │
│  复用DOM       下拉刷新      GPU加速       避免泄漏    │
│  动态高度      上拉加载      样式优化       缓存策略    │
└─────────────────────────────────────────────────────────┘
```

## 虚拟列表实现

```javascript
// 虚拟列表组件
class VirtualList {
  constructor(options) {
    this.container = options.container
    this.itemHeight = options.itemHeight || 100
    this.renderCount = options.renderCount || 10
    this.data = options.data || []
    
    this.startIndex = 0
    this.endIndex = this.renderCount
    this.scrollTop = 0
    this.totalHeight = 0
    
    this.init()
  }
  
  init() {
    this.totalHeight = this.data.length * this.itemHeight
    this.render()
    this.bindEvents()
  }
  
  render() {
    const visibleData = this.data.slice(this.startIndex, this.endIndex)
    
    let html = `
      <view class="virtual-list-container" style="height: ${this.totalHeight}px;">
        <view class="virtual-list-content" style="transform: translateY(${this.startIndex * this.itemHeight}px);">
    `
    
    visibleData.forEach((item, index) => {
      const actualIndex = this.startIndex + index
      html += this.renderItem(item, actualIndex)
    })
    
    html += `
        </view>
      </view>
    `
    
    this.container.innerHTML = html
  }
  
  renderItem(item, index) {
    return `
      <view class="list-item" style="height: ${this.itemHeight}px;">
        <text>${item.title}</text>
      </view>
    `
  }
  
  bindEvents() {
    this.container.addEventListener('scroll', this.onScroll.bind(this), false)
  }
  
  onScroll(e) {
    this.scrollTop = e.detail.scrollTop
    this.updateVisibleRange()
  }
  
  updateVisibleRange() {
    const newStartIndex = Math.floor(this.scrollTop / this.itemHeight)
    const buffer = Math.ceil(this.renderCount / 2)
    
    this.startIndex = Math.max(0, newStartIndex - buffer)
    this.endIndex = Math.min(
      this.data.length,
      this.startIndex + this.renderCount + buffer
    )
    
    if (this.startIndex !== Math.floor(this.scrollTop / this.itemHeight)) {
      this.render()
    }
  }
  
  updateData(data) {
    this.data = data
    this.totalHeight = data.length * this.itemHeight
    this.render()
  }
  
  destroy() {
    this.container.removeEventListener('scroll', this.onScroll.bind(this))
  }
}
```

## Vue 虚拟列表组件

```vue
<template>
  <scroll-view
    ref="scrollContainer"
    scroll-y
    class="virtual-scroll"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
    :scroll-top="scrollTop"
  >
    <view class="scroll-content" :style="{ height: totalHeight + 'rpx' }">
      <view 
        class="visible-area"
        :style="{ transform: `translateY(${translateY}rpx)` }"
      >
        <view
          v-for="(item, index) in visibleItems"
          :key="item.id"
          class="list-item"
          :style="{ height: getItemHeight(index) + 'rpx' }"
        >
          <slot :item="item" :index="actualIndex(index)" />
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<script>
export default {
  name: 'VirtualList',
  props: {
    data: {
      type: Array,
      required: true
    },
    itemHeight: {
      type: Number,
      default: 200
    },
    containerHeight: {
      type: Number,
      default: 600
    },
    buffer: {
      type: Number,
      default: 2
    }
  },
  data() {
    return {
      startIndex: 0,
      endIndex: 0,
      scrollTop: 0,
      itemHeights: {}
    }
  },
  computed: {
    totalHeight() {
      return this.data.length * this.itemHeight
    },
    visibleCount() {
      return Math.ceil(this.containerHeight / this.itemHeight) + this.buffer * 2
    },
    translateY() {
      return this.startIndex * this.itemHeight
    },
    visibleItems() {
      return this.data.slice(this.startIndex, this.endIndex)
    }
  },
  mounted() {
    this.updateVisibleRange(0)
  },
  methods: {
    handleScroll(e) {
      const scrollTop = e.detail.scrollTop
      this.updateVisibleRange(scrollTop)
    },
    updateVisibleRange(scrollTop) {
      const startIndex = Math.floor(scrollTop / this.itemHeight) - this.buffer
      this.startIndex = Math.max(0, startIndex)
      this.endIndex = Math.min(
        this.data.length,
        this.startIndex + this.visibleCount
      )
    },
    getItemHeight(index) {
      return this.itemHeights[index] || this.itemHeight
    },
    actualIndex(index) {
      return this.startIndex + index
    }
  }
}
</script>

<style lang="scss">
.virtual-scroll {
  position: relative;
  overflow: hidden;
}

.scroll-content {
  position: relative;
}

.visible-area {
  position: absolute;
  left: 0;
  right: 0;
  transition: transform 0.1s ease-out;
}

.list-item {
  box-sizing: border-box;
}
</style>
```

## 分页加载

```vue
<template>
  <scroll-view
    scroll-y
    class="page-list"
    @scrolltolower="loadMore"
    :refresher-enabled="true"
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
  >
    <view v-for="item in list" :key="item.id" class="list-item">
      <!-- 列表项内容 -->
    </view>
    
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>
    
    <view v-if="!loading && !hasMore" class="no-more">
      <text>没有更多了</text>
    </view>
  </scroll-view>
</template>

<script>
export default {
  data() {
    return {
      list: [],
      page: 1,
      pageSize: 20,
      loading: false,
      hasMore: true,
      refreshing: false
    }
  },
  onMounted() {
    this.loadData()
  },
  methods: {
    async loadData(isRefresh = false) {
      if (this.loading) return
      
      this.loading = true
      const currentPage = isRefresh ? 1 : this.page
      
      try {
        const response = await fetchList(currentPage, this.pageSize)
        
        if (isRefresh) {
          this.list = response.data
        } else {
          this.list = [...this.list, ...response.data]
        }
        
        this.hasMore = response.data.length >= this.pageSize
        this.page = currentPage + 1
      } catch (err) {
        console.error('加载数据失败:', err)
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },
    loadMore() {
      if (!this.loading && this.hasMore) {
        this.loadData()
      }
    },
    onRefresh() {
      this.refreshing = true
      this.page = 1
      this.hasMore = true
      this.loadData(true)
    }
  }
}
</script>
```

## 滚动优化

```javascript
// 滚动节流
function throttleScroll(fn, delay = 16) {
  let lastTime = 0
  
  return function(...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

// 使用 GPU 加速
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}

// 避免滚动时重排
.scroll-container {
  contain: layout paint style;
}

// 优化滚动性能
.scroll-smooth {
  -webkit-overflow-scrolling: touch;
  overflow-scrolling: touch;
}
```

## 内存管理

```javascript
// 列表项组件
export default {
  data() {
    return {
      timer: null
    }
  },
  mounted() {
    // 需要定时执行的逻辑
    this.timer = setInterval(() => {
      // 定时任务
    }, 1000)
  },
  beforeUnmount() {
    // 及时清理定时器
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}

// 图片资源清理
export default {
  data() {
    return {
      imageLoaded: false
    }
  },
  beforeUnmount() {
    // 清理图片引用
    this.imageLoaded = false
  }
}
```

## 缓存策略

```javascript
// 列表数据缓存
const listCache = {
  cache: new Map(),
  
  get(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() < cached.expires) {
      return cached.data
    }
    return null
  },
  
  set(key, data, expires = 300000) {
    this.cache.set(key, {
      data,
      expires: Date.now() + expires
    })
  },
  
  clear(key) {
    this.cache.delete(key)
  }
}

// 带缓存的列表加载
async function loadList(page, pageSize) {
  const cacheKey = `list_${page}_${pageSize}`
  const cached = listCache.get(cacheKey)
  
  if (cached) {
    return cached
  }
  
  const data = await fetchListData(page, pageSize)
  listCache.set(cacheKey, data)
  
  return data
}
```

## 动态高度处理

```javascript
// 动态计算列表项高度
class DynamicHeightList {
  constructor() {
    this.itemHeights = {}
    this.totalHeight = 0
  }
  
  // 计算单个项的高度
  calculateItemHeight(item) {
    let height = 100 // 默认高度
    
    if (item.content) {
      // 根据内容长度计算高度
      const contentLength = item.content.length
      height = 100 + Math.floor(contentLength / 20) * 20
    }
    
    if (item.images && item.images.length > 0) {
      // 根据图片数量增加高度
      height += item.images.length * 150
    }
    
    return height
  }
  
  // 计算总高度
  calculateTotalHeight(data) {
    let totalHeight = 0
    
    data.forEach((item, index) => {
      const height = this.calculateItemHeight(item)
      this.itemHeights[index] = height
      totalHeight += height
    })
    
    this.totalHeight = totalHeight
    return totalHeight
  }
  
  // 获取指定索引的高度
  getItemHeight(index) {
    return this.itemHeights[index] || 100
  }
  
  // 获取到指定索引的累计高度
  getAccumulatedHeight(index) {
    let height = 0
    
    for (let i = 0; i < index; i++) {
      height += this.itemHeights[i] || 100
    }
    
    return height
  }
}
```

## 性能监控

```javascript
// 列表性能监控
class ListPerformanceMonitor {
  constructor() {
    this.metrics = {
      renderTime: 0,
      scrollFPS: 0,
      memoryUsage: 0,
      itemCount: 0
    }
  }
  
  start() {
    this.startTime = Date.now()
    this.frameCount = 0
    this.frameTime = Date.now()
  }
  
  recordFrame() {
    this.frameCount++
    const now = Date.now()
    
    if (now - this.frameTime >= 1000) {
      this.metrics.scrollFPS = this.frameCount
      this.frameCount = 0
      this.frameTime = now
    }
  }
  
  end() {
    this.metrics.renderTime = Date.now() - this.startTime
    this.metrics.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024
  }
  
  report() {
    console.log('List Performance Report:', this.metrics)
  }
}

// 使用示例
const monitor = new ListPerformanceMonitor()
monitor.start()

// 在滚动回调中记录帧率
onScroll: throttleScroll(() => {
  monitor.recordFrame()
})
```

## 总结

| 优化策略 | 适用场景 |
|----------|----------|
| 虚拟列表 | 超大量数据（1000+ 项） |
| 分页加载 | 中等数据量，需要完整浏览 |
| 滚动节流 | 滚动时触发频繁事件 |
| GPU 加速 | 复杂列表项渲染 |
| 内存管理 | 列表项包含定时器/资源 |
| 缓存策略 | 需要快速返回的列表 |
