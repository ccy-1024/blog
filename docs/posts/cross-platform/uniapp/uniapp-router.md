---
title: uni-app 路由与页面跳转
date: 2024-04-01
---

# uni-app 路由与页面跳转

## 路由配置

### pages.json 配置

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "首页",
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/detail/index",
      "style": {
        "navigationBarTitleText": "详情页"
      }
    },
    {
      "path": "pages/user/index",
      "style": {
        "navigationBarTitleText": "个人中心",
        "navigationBarBackgroundColor": "#007aff"
      }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "芝麻粒",
    "navigationBarBackgroundColor": "#ffffff",
    "backgroundColor": "#f5f5f5"
  },
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#007aff",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "static/home.png",
        "selectedIconPath": "static/home-active.png"
      },
      {
        "pagePath": "pages/user/index",
        "text": "我的",
        "iconPath": "static/user.png",
        "selectedIconPath": "static/user-active.png"
      }
    ]
  }
}
```

## 页面跳转 API

### navigateTo（保留当前页面）

```javascript
// 跳转到详情页，保留当前页面
uni.navigateTo({
  url: '/pages/detail/index?id=123&name=芝麻粒',
  success: () => {
    console.log('跳转成功')
  },
  fail: (err) => {
    console.error('跳转失败:', err)
  }
})
```

### redirectTo（关闭当前页面）

```javascript
// 跳转到登录页，关闭当前页面
uni.redirectTo({
  url: '/pages/login/index'
})
```

### reLaunch（关闭所有页面）

```javascript
// 重新启动应用，关闭所有页面
uni.reLaunch({
  url: '/pages/index/index'
})
```

### switchTab（切换 tabBar）

```javascript
// 切换到首页 tab
uni.switchTab({
  url: '/pages/index/index'
})
```

### navigateBack（返回上一页）

```javascript
// 返回上一页
uni.navigateBack({
  delta: 1 // 返回的页数，默认为 1
})

// 返回首页
uni.navigateBack({
  delta: 99 // 超过页面栈长度则返回首页
})
```

## 页面传参

### 通过 URL 参数传递

```javascript
// 跳转时传递参数
uni.navigateTo({
  url: `/pages/detail/index?id=123&title=Hello`
})

// 在详情页接收参数
export default {
  onLoad(options) {
    console.log('id:', options.id)       // 123
    console.log('title:', options.title) // Hello
  }
}
```

### 通过全局变量传递

```javascript
// App.vue 中定义全局变量
globalData: {
  userInfo: null
}

// 设置全局变量
getApp().globalData.userInfo = { name: '芝麻粒', age: 25 }

// 获取全局变量
const user = getApp().globalData.userInfo
```

### 通过本地存储传递

```javascript
// 存储数据
uni.setStorageSync('userInfo', { name: '芝麻粒', age: 25 })

// 获取数据
const user = uni.getStorageSync('userInfo')

// 删除数据
uni.removeStorageSync('userInfo')
```

## 导航守卫

### 使用 beforeRouteEnter（Vue Router 风格）

```javascript
// 在页面组件中
export default {
  beforeRouteEnter(to, from, next) {
    // 进入页面之前
    const isLogin = checkLogin()
    
    if (isLogin) {
      next() // 允许进入
    } else {
      next('/pages/login/index') // 跳转到登录页
    }
  }
}
```

### 使用 onLoad 钩子

```javascript
export default {
  onLoad(options) {
    // 检查登录状态
    const token = uni.getStorageSync('token')
    
    if (!token) {
      uni.redirectTo({
        url: '/pages/login/index'
      })
      return
    }
    
    // 正常加载页面
    this.loadData()
  }
}
```

## 页面栈管理

### 获取页面栈

```javascript
const pages = getCurrentPages()
console.log('当前页面栈长度:', pages.length)

// 获取当前页面信息
const currentPage = pages[pages.length - 1]
console.log('当前页面:', currentPage.route)
```

### 页面栈示意图

```
页面栈结构（最多10层）:
┌─────────────────────┐
│  pages/detail/index │ ← 当前页面
├─────────────────────┤
│  pages/list/index   │
├─────────────────────┤
│  pages/index/index  │ ← 首页
└─────────────────────┘
```

## 注意事项

1. **页面栈限制**：页面栈最多 10 层，超过会自动销毁最底层页面
2. **tabBar 页面**：只能通过 `switchTab` 跳转，不能用 `navigateTo`
3. **参数大小限制**：URL 参数长度有限制，大数据建议使用全局变量或本地存储
4. **页面刷新**：小程序端页面刷新会丢失页面栈，需要注意状态恢复
5. **性能优化**：避免过深的页面栈，及时使用 `redirectTo` 关闭不需要的页面

## 路由封装

```javascript
// utils/router.js
export const router = {
  navigate(url, params = {}) {
    const query = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&')
    
    uni.navigateTo({
      url: query ? `${url}?${query}` : url
    })
  },
  
  redirect(url, params = {}) {
    const query = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&')
    
    uni.redirectTo({
      url: query ? `${url}?${query}` : url
    })
  },
  
  back(delta = 1) {
    uni.navigateBack({ delta })
  },
  
  tab(url) {
    uni.switchTab({ url })
  },
  
  reLaunch(url) {
    uni.reLaunch({ url })
  }
}

// 使用
router.navigate('/pages/detail/index', { id: 123, name: '芝麻粒' })
router.back()
router.tab('/pages/index/index')
```
