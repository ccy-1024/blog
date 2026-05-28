---
title: uni-app 图片优化
date: 2024-08-30
---

# uni-app 图片优化

## 图片优化架构

```
┌─────────────────────────────────────────────────────────┐
│                    图片优化体系                        │
├─────────────────────────────────────────────────────────┤
│  压缩优化 ──> 格式选择 ──> 懒加载 ──> 缓存策略        │
│      │             │             │             │       │
│      ▼             ▼             ▼             ▼       │
│  尺寸压缩      WebP/AVIF      Intersection     内存缓存  │
│  质量压缩      渐进式加载      Observer        磁盘缓存  │
│  格式转换      响应式图片     占位图策略      CDN缓存   │
└─────────────────────────────────────────────────────────┘
```

## 图片压缩

```javascript
// 图片压缩工具
const imageCompressor = {
  // 压缩图片
  async compress(imagePath, options = {}) {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1080,
      format = 'webp'
    } = options
    
    return new Promise((resolve, reject) => {
      uni.compressImage({
        src: imagePath,
        quality,
        success: (res) => {
          resolve(res.tempFilePath)
        },
        fail: reject
      })
    })
  },
  
  // 批量压缩
  async compressBatch(imagePaths, options) {
    const promises = imagePaths.map(path => 
      this.compress(path, options)
    )
    
    return Promise.all(promises)
  }
}

// 使用示例
async function uploadImages(imagePaths) {
  const compressedPaths = await imageCompressor.compressBatch(imagePaths, {
    quality: 0.7,
    maxWidth: 1200,
    maxHeight: 1200
  })
  
  // 上传压缩后的图片
  for (const path of compressedPaths) {
    await uploadFile(path)
  }
}
```

## WebP 支持

```vue
<template>
  <image 
    :src="imageUrl" 
    mode="aspectFill"
    class="optimized-image"
    @error="onImageError"
  />
</template>

<script>
export default {
  data() {
    return {
      imageUrl: ''
    }
  },
  computed: {
    webpSupport() {
      // 检测 WebP 支持
      return this.checkWebPSupport()
    }
  },
  methods: {
    checkWebPSupport() {
      // 在 uni-app 中，可以通过环境判断
      // 或者使用 canvas 检测
      const canvas = document.createElement('canvas')
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
    },
    getImageUrl(originalUrl) {
      if (this.webpSupport) {
        // 如果支持 WebP，返回 WebP 格式
        return originalUrl.replace(/\.(jpg|png)$/i, '.webp')
      }
      return originalUrl
    },
    onImageError(e) {
      // WebP 加载失败，回退到原始格式
      this.imageUrl = this.imageUrl.replace('.webp', '.jpg')
    }
  }
}
</script>
```

## 懒加载

```vue
<template>
  <scroll-view 
    scroll-y 
    class="image-list"
    @scroll="onScroll"
  >
    <view 
      v-for="(item, index) in images" 
      :key="index"
      class="image-item"
      :class="{ loaded: item.loaded }"
    >
      <image 
        v-if="item.loaded"
        :src="item.src" 
        mode="aspectFill"
        class="lazy-image"
        @load="onImageLoad(index)"
      />
      <view v-else class="image-placeholder">
        <text class="placeholder-text">加载中...</text>
      </view>
    </view>
  </scroll-view>
</template>

<script>
export default {
  data() {
    return {
      images: [
        { src: '/images/1.webp', loaded: false },
        { src: '/images/2.webp', loaded: false },
        { src: '/images/3.webp', loaded: false },
        // ...更多图片
      ],
      viewportHeight: 0,
      scrollTop: 0
    }
  },
  onMounted() {
    // 获取视口高度
    const systemInfo = uni.getSystemInfoSync()
    this.viewportHeight = systemInfo.windowHeight
  },
  onScroll(e) {
    this.scrollTop = e.detail.scrollTop
    this.checkVisibleImages()
  },
  checkVisibleImages() {
    const visibleThreshold = this.viewportHeight * 1.5
    
    this.images.forEach((item, index) => {
      if (item.loaded) return
      
      const itemTop = index * 300 // 假设每个图片高度为 300px
      
      if (itemTop <= this.scrollTop + visibleThreshold && 
          itemTop >= this.scrollTop - visibleThreshold) {
        // 图片进入可视区域，开始加载
        setTimeout(() => {
          if (!this.images[index].loaded) {
            this.images[index].loaded = true
          }
        }, index * 100) // 错开加载时间
      }
    })
  },
  onImageLoad(index) {
    console.log('Image loaded:', index)
  }
}
</script>

<style lang="scss">
.image-list {
  height: 100vh;
}

.image-item {
  margin-bottom: 20rpx;
}

.image-placeholder {
  width: 100%;
  height: 400rpx;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lazy-image {
  width: 100%;
  height: 400rpx;
  transition: opacity 0.3s ease;
}
</style>
```

## 响应式图片

```javascript
// 根据设备像素比选择图片
function getResponsiveImage(baseUrl, sizes) {
  const systemInfo = uni.getSystemInfoSync()
  const pixelRatio = systemInfo.pixelRatio
  
  // 根据像素比选择合适的图片尺寸
  let selectedSize = sizes[0]
  
  for (const size of sizes) {
    if (size >= pixelRatio * 320) {
      selectedSize = size
      break
    }
  }
  
  return `${baseUrl}/${selectedSize}x${selectedSize}.webp`
}

// 使用示例
const imageUrl = getResponsiveImage(
  'https://example.com/images/avatar',
  [128, 256, 512]
)
```

## 缓存策略

```javascript
// 图片缓存管理
const imageCache = {
  cache: new Map(),
  
  // 获取缓存的图片
  get(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() < cached.expires) {
      return cached.data
    }
    return null
  },
  
  // 设置缓存
  set(key, data, expires = 3600000) {
    this.cache.set(key, {
      data,
      expires: Date.now() + expires
    })
  },
  
  // 清除缓存
  clear(key) {
    this.cache.delete(key)
  },
  
  // 清空所有缓存
  clearAll() {
    this.cache.clear()
  },
  
  // 获取缓存大小
  getSize() {
    return this.cache.size
  }
}

// 带缓存的图片加载
async function loadImageWithCache(url) {
  const cached = imageCache.get(url)
  
  if (cached) {
    return cached
  }
  
  return new Promise((resolve, reject) => {
    uni.downloadFile({
      url,
      success: (res) => {
        imageCache.set(url, res.tempFilePath)
        resolve(res.tempFilePath)
      },
      fail: reject
    })
  })
}
```

## 渐进式加载

```vue
<template>
  <view class="progressive-image">
    <image 
      :src="lowResUrl" 
      class="low-res"
      mode="aspectFill"
    />
    <image 
      :src="highResUrl" 
      class="high-res"
      mode="aspectFill"
      :class="{ loaded: highResLoaded }"
      @load="highResLoaded = true"
    />
  </view>
</template>

<script>
export default {
  data() {
    return {
      lowResUrl: '/images/low-res.jpg',
      highResUrl: '/images/high-res.webp',
      highResLoaded: false
    }
  }
}
</script>

<style lang="scss">
.progressive-image {
  position: relative;
  width: 100%;
  height: 400rpx;
}

.low-res,
.high-res {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.low-res {
  filter: blur(20px);
  transform: scale(1.1);
}

.high-res {
  opacity: 0;
  transition: opacity 0.5s ease;
  
  &.loaded {
    opacity: 1;
  }
}
</style>
```

## CDN 优化

```javascript
// CDN 图片处理
const cdnProcessor = {
  baseUrl: 'https://cdn.example.com',
  
  // 生成缩略图
  thumbnail(url, width, height) {
    return `${this.baseUrl}/thumbnail?url=${encodeURIComponent(url)}&w=${width}&h=${height}`
  },
  
  // 生成水印
  watermark(url, text) {
    return `${this.baseUrl}/watermark?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
  },
  
  // 图片裁剪
  crop(url, x, y, width, height) {
    return `${this.baseUrl}/crop?url=${encodeURIComponent(url)}&x=${x}&y=${y}&w=${width}&h=${height}`
  },
  
  // 质量调整
  quality(url, q) {
    return `${this.baseUrl}/quality?url=${encodeURIComponent(url)}&q=${q}`
  }
}

// 使用示例
const thumbnailUrl = cdnProcessor.thumbnail(
  'https://example.com/images/original.jpg',
  200,
  200
)
```

## 性能监控

```javascript
// 图片加载监控
class ImageMonitor {
  constructor() {
    this.loadTimes = []
  }
  
  start(url) {
    this.loadTimes.push({
      url,
      startTime: Date.now()
    })
  }
  
  end(url) {
    const record = this.loadTimes.find(r => r.url === url)
    if (record) {
      record.endTime = Date.now()
      record.duration = record.endTime - record.startTime
      console.log(`Image ${url} loaded in ${record.duration}ms`)
    }
  }
  
  report() {
    const avgTime = this.loadTimes.reduce((sum, r) => sum + (r.duration || 0), 0) / this.loadTimes.length
    const slowImages = this.loadTimes.filter(r => r.duration > 1000)
    
    console.log('Average load time:', avgTime.toFixed(2), 'ms')
    console.log('Slow images:', slowImages.length)
  }
}

// 使用示例
const monitor = new ImageMonitor()

monitor.start('/images/large.jpg')

uni.downloadFile({
  url: '/images/large.jpg',
  success: () => {
    monitor.end('/images/large.jpg')
    monitor.report()
  }
})
```

## 总结

| 优化策略 | 具体措施 |
|----------|----------|
| 压缩优化 | 尺寸压缩、质量压缩、格式转换 |
| 格式选择 | WebP、AVIF、渐进式加载 |
| 懒加载 | Intersection Observer、滚动监听 |
| 缓存策略 | 内存缓存、磁盘缓存、CDN 缓存 |
| 响应式 | 根据设备像素比选择图片尺寸 |
| CDN 处理 | 缩略图、水印、裁剪、质量调整 |
