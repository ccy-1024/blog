---
title: uni-app 生命周期详解
date: 2024-02-15
---

# uni-app 生命周期详解

## 生命周期分类

### 应用生命周期
- 在 App.vue 中定义
- 监听整个应用的启动、显示、隐藏等状态

### 页面生命周期
- 在页面组件中定义
- 监听页面的加载、显示、隐藏、卸载等状态

### 组件生命周期
- 在自定义组件中定义
- 监听组件的创建、挂载、更新、销毁等状态

## 应用生命周期

```javascript
// App.vue
export default {
  onLaunch() {
    // 应用启动时触发
    console.log('App Launch')
    // 可以在这里做初始化操作
    this.initApp()
  },
  
  onShow() {
    // 应用从后台进入前台时触发
    console.log('App Show')
  },
  
  onHide() {
    // 应用从前台进入后台时触发
    console.log('App Hide')
  },
  
  onError(err) {
    // 应用出错时触发
    console.error('App Error:', err)
  },
  
  initApp() {
    // 初始化操作
    // 如：获取用户信息、加载配置等
  }
}
```

## 页面生命周期

```javascript
// pages/index/index.vue
export default {
  data() {
    return {
      list: []
    }
  },
  
  onLoad(options) {
    // 页面加载时触发
    // options 包含页面跳转时传递的参数
    console.log('Page Load:', options)
    this.loadData()
  },
  
  onShow() {
    // 页面显示时触发
    console.log('Page Show')
  },
  
  onReady() {
    // 页面初次渲染完成时触发
    console.log('Page Ready')
    // 可以在这里操作 DOM
  },
  
  onHide() {
    // 页面隐藏时触发
    console.log('Page Hide')
  },
  
  onUnload() {
    // 页面卸载时触发
    console.log('Page Unload')
    // 清理定时器、取消订阅等
  },
  
  onPullDownRefresh() {
    // 下拉刷新时触发
    console.log('Pull Down Refresh')
    this.loadData()
    uni.stopPullDownRefresh()
  },
  
  onReachBottom() {
    // 触底时触发
    console.log('Reach Bottom')
    this.loadMore()
  },
  
  onPageScroll(e) {
    // 页面滚动时触发
    console.log('Page Scroll:', e.scrollTop)
  },
  
  async loadData() {
    // 加载数据
    const res = await uni.request({
      url: '/api/list'
    })
    this.list = res.data
  },
  
  loadMore() {
    // 加载更多
    // ...
  }
}
```

## 组件生命周期

```javascript
// components/MyComponent.vue
export default {
  props: {
    title: {
      type: String,
      default: ''
    }
  },
  
  data() {
    return {
      count: 0
    }
  },
  
  beforeCreate() {
    // 组件实例创建之前
    console.log('Before Create')
    // 此时无法访问 data 和 props
  },
  
  created() {
    // 组件实例创建完成
    console.log('Created')
    // 可以访问 data 和 props
    // 可以发起异步请求
  },
  
  beforeMount() {
    // 组件挂载之前
    console.log('Before Mount')
    // 此时 DOM 还未渲染
  },
  
  mounted() {
    // 组件挂载完成
    console.log('Mounted')
    // 可以访问 DOM 元素
    this.initDOM()
  },
  
  beforeUpdate() {
    // 组件更新之前
    console.log('Before Update')
    // 可以在更新前做一些准备工作
  },
  
  updated() {
    // 组件更新完成
    console.log('Updated')
    // DOM 已更新
  },
  
  beforeUnmount() {
    // 组件卸载之前
    console.log('Before Unmount')
    // 清理定时器、取消事件监听等
  },
  
  unmounted() {
    // 组件卸载完成
    console.log('Unmounted')
  },
  
  initDOM() {
    // 初始化 DOM
    // ...
  }
}
```

## 生命周期执行顺序

```
应用启动:
  onLaunch → onShow

页面打开:
  onLoad → onShow → onReady

页面切换:
  当前页 onHide → 新页面 onLoad → 新页面 onShow → 新页面 onReady

页面返回:
  当前页 onUnload → 上一页 onShow

应用退后台:
  onHide

应用进前台:
  onShow
```

## 注意事项

1. **避免在 onLaunch 中做耗时操作**：会影响应用启动速度
2. **页面间数据传递**：使用 url 参数或全局状态
3. **清理资源**：在 onUnload 或 beforeUnmount 中清理定时器等
4. **异步请求**：建议在 created 或 onLoad 中发起
