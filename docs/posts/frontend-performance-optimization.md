---
title: 首屏加载优化实战：从 3s 到 0.8s 的蜕变
date: 2024-01-18
---

# 首屏加载优化实战：从 3s 到 0.8s 的蜕变

大家好，我是芝麻粒。最近在优化公司项目的首屏加载速度，从原来的 3 秒优化到了 0.8 秒。想把这个过程分享给大家，希望能帮到有同样困扰的同学。

## 问题背景

我们项目是一个 Vue3 + TypeScript 的管理后台，打包后 vendor.js 有 2MB，首屏加载慢得让人崩溃。用户反馈说："你们的系统怎么比蜗牛还慢？"

## 优化过程

### 第一步：分析性能瓶颈

我先用 Chrome DevTools 的 Performance 面板分析了一下：

```
┌─────────────────────────────────────────────────────────────┐
│                    加载时间分析                              │
├──────────────────┬──────────────────────────────────────────┤
│     阶段         │            耗时                          │
├──────────────────┼──────────────────────────────────────────┤
│  HTML 加载       │            150ms                         │
│  CSS 加载        │            200ms                         │
│  JS 下载         │           1200ms                         │
│  JS 解析执行     │           1000ms                         │
│  首屏渲染        │            450ms                         │
└──────────────────┴──────────────────────────────────────────┘
```

问题很明显：JS 文件太大，下载和解析都耗时严重。

### 第二步：代码分割与懒加载

首先想到的是代码分割。我们项目里有很多路由页面，可以按需加载。

```javascript
// 优化前
import Dashboard from './views/Dashboard.vue'
import UserManagement from './views/UserManagement.vue'
import OrderList from './views/OrderList.vue'

const routes = [
  { path: '/', component: Dashboard },
  { path: '/users', component: UserManagement },
  { path: '/orders', component: OrderList }
]

// 优化后：使用动态 import
const routes = [
  { path: '/', component: () => import('./views/Dashboard.vue') },
  { path: '/users', component: () => import('./views/UserManagement.vue') },
  { path: '/orders', component: () => import('./views/OrderList.vue') }
]
```

这样首页只会加载必要的代码，其他页面用到才加载。

### 第三步：第三方库按需引入

我们项目用了 Element Plus，但是默认是全量引入的，这也是体积大的原因之一。

```javascript
// 优化前
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

app.use(ElementPlus)

// 优化后：按需引入
import { ElButton, ElInput, ElTable } from 'element-plus'
import 'element-plus/theme-chalk/el-button.css'
import 'element-plus/theme-chalk/el-input.css'
import 'element-plus/theme-chalk/el-table.css'

app.component('ElButton', ElButton)
app.component('ElInput', ElInput)
app.component('ElTable', ElTable)
```

不过这样写太麻烦了，后来我用了 `unplugin-vue-components` 插件自动按需引入。

### 第四步：图片优化

项目里有很多图片没有压缩，这也是一个大问题。

```html
<!-- 优化前 -->
<img src="/images/banner.png" alt="banner">

<!-- 优化后：使用 WebP 格式 -->
<picture>
  <source srcset="/images/banner.webp" type="image/webp">
  <img src="/images/banner.png" alt="banner" loading="lazy">
</picture>
```

我用 TinyPNG 把所有图片压缩了一遍，平均压缩率达到了 60%。

### 第五步：启用 Gzip 压缩

在服务器端启用了 Gzip 压缩，这也是一个很有效的优化手段。

```nginx
# Nginx 配置
gzip on;
gzip_types text/plain text/css application/javascript application/json;
gzip_min_length 1024;
gzip_comp_level 6;
```

压缩后，vendor.js 从 2MB 降到了 500KB 左右。

### 第六步：使用 CDN 加速

把一些静态资源放到了 CDN 上，利用 CDN 的边缘节点加速。

```html
<!-- 在 index.html 中引入 -->
<script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vue-router@4/dist/vue-router.global.prod.js"></script>
```

然后在 vite.config.ts 中配置 externals：

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['vue', 'vue-router']
    }
  }
})
```

### 第七步：预加载关键资源

对于首屏需要的关键资源，使用 preload 提前加载。

```html
<link rel="preload" href="/assets/js/chunk-vendors.js" as="script">
<link rel="preload" href="/assets/css/index.css" as="style">
```

## 优化效果对比

```
┌──────────────────┬──────────┬──────────┐
│     指标         │ 优化前   │ 优化后   │
├──────────────────┼──────────┼──────────┤
│ 首屏加载时间     │   3.0s   │   0.8s   │
│ 首字节时间       │  800ms   │  200ms   │
│ 最大内容绘制     │  2.5s    │  600ms   │
│ JS 文件体积      │  2.0MB   │  500KB   │
└──────────────────┴──────────┴──────────┘
```

## 总结

优化过程中我学到了很多：

1. **先分析再优化**：用 DevTools 找出瓶颈，不要盲目优化
2. **代码分割是关键**：按需加载能显著减少首屏体积
3. **图片优化不能忽视**：很多时候图片是最大的资源
4. **CDN 和压缩是基础**：这是后端同学也能帮忙做的

如果你也在做性能优化，欢迎留言交流经验！

---

感谢阅读！🎉
