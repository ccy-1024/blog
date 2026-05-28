---
title: uni-app 小程序分包加载
date: 2024-08-25
---

# uni-app 小程序分包加载

## 分包架构

```
┌─────────────────────────────────────────────────────────┐
│                    分包架构                           │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │              主包 (main)                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│  │  │   App    │  │  Pages   │  │  Common  │     │   │
│  │  │  Entry   │  │ (Index)  │  │  Utils   │     │   │
│  │  └──────────┘  └──────────┘  └──────────┘     │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│          ┌───────────────┼───────────────┐             │
│          ▼               ▼               ▼             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │  Subpackage │ │  Subpackage │ │  Subpackage │      │
│  │     A       │ │     B       │ │     C       │      │
│  │  Pages/A/   │ │  Pages/B/   │ │  Pages/C/   │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## 分包配置

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "首页"
      }
    },
    {
      "path": "pages/detail/detail",
      "style": {
        "navigationBarTitleText": "详情页"
      }
    }
  ],
  "subpackages": [
    {
      "root": "pages/subpackage-a",
      "pages": [
        {
          "path": "page1",
          "style": {
            "navigationBarTitleText": "分包A页面1"
          }
        },
        {
          "path": "page2",
          "style": {
            "navigationBarTitleText": "分包A页面2"
          }
        }
      ],
      "independent": false
    },
    {
      "root": "pages/subpackage-b",
      "pages": [
        {
          "path": "page1",
          "style": {
            "navigationBarTitleText": "分包B页面1"
          }
        }
      ],
      "independent": true
    }
  ],
  "preloadRule": {
    "pages/index/index": {
      "network": "all",
      "packages": ["pages/subpackage-a"]
    },
    "pages/detail/detail": {
      "network": "wifi",
      "packages": ["pages/subpackage-b"]
    }
  }
}
```

## 独立分包

```json
{
  "subpackages": [
    {
      "root": "pages/independent",
      "pages": [
        {
          "path": "login",
          "style": {
            "navigationBarTitleText": "登录"
          }
        }
      ],
      "independent": true
    }
  ]
}
```

## 分包预加载

```javascript
// pages.json 配置预加载
{
  "preloadRule": {
    "pages/index/index": {
      "network": "all",
      "packages": ["pages/subpackage-a"],
      "time": 5000
    }
  }
}

// 动态预加载
uni.preloadPage({
  url: '/pages/subpackage-a/page1'
})

// 预加载分包
uni.preloadPackage({
  name: 'pages/subpackage-a',
  success: () => {
    console.log('分包预加载成功')
  },
  fail: (err) => {
    console.error('分包预加载失败:', err)
  }
})
```

## 分包资源管理

```javascript
// 静态资源引用
// 在分包内使用相对路径
import utils from '../../utils/index.js'

// 图片资源
// 使用绝对路径或相对路径
const imagePath = '/pages/subpackage-a/images/logo.png'

// 组件引用
import SubComponent from './SubComponent.vue'

// 注意：主包和分包之间的资源引用
// 主包可以引用分包资源（不推荐）
// 分包可以引用主包资源（推荐）
```

## 分包大小监控

```javascript
// 监控分包大小
function checkPackageSize() {
  const fs = require('fs')
  const path = require('path')
  
  const packageSizes = []
  
  function getFolderSize(folderPath) {
    let totalSize = 0
    
    const files = fs.readdirSync(folderPath)
    
    files.forEach(file => {
      const filePath = path.join(folderPath, file)
      const stats = fs.statSync(filePath)
      
      if (stats.isDirectory()) {
        totalSize += getFolderSize(filePath)
      } else {
        totalSize += stats.size
      }
    })
    
    return totalSize
  }
  
  // 检查主包大小
  const mainSize = getFolderSize('./dist/build/h5')
  console.log(`主包大小: ${(mainSize / 1024 / 1024).toFixed(2)} MB`)
  
  // 检查分包大小
  const subpackages = ['subpackage-a', 'subpackage-b']
  
  subpackages.forEach(subpackage => {
    const size = getFolderSize(`./dist/build/h5/${subpackage}`)
    packageSizes.push({
      name: subpackage,
      size: (size / 1024 / 1024).toFixed(2) + ' MB'
    })
  })
  
  console.log('分包大小:', packageSizes)
}
```

## 分包策略

```javascript
// 按功能模块分包
// pages.json
{
  "subpackages": [
    {
      "root": "pages/user",
      "pages": ["profile", "settings", "orders"]
    },
    {
      "root": "pages/shop",
      "pages": ["list", "detail", "cart"]
    },
    {
      "root": "pages/article",
      "pages": ["list", "detail", "category"]
    }
  ]
}

// 按权重分包
// 高频页面放主包，低频页面放分包
// 首屏必要资源放主包，其他放分包

// 独立分包用于特殊场景
// 如登录页、广告页等不需要主包即可运行的页面
```

## 分包加载钩子

```javascript
// 监听分包加载
uni.onLoadPackage((res) => {
  console.log('分包加载完成:', res)
})

// 监听分包加载失败
uni.onLoadPackageFail((err) => {
  console.error('分包加载失败:', err)
})

// 手动加载分包
uni.loadPackage({
  name: 'pages/subpackage-a',
  success: () => {
    // 分包加载成功后跳转
    uni.navigateTo({
      url: '/pages/subpackage-a/page1'
    })
  },
  fail: (err) => {
    console.error('加载分包失败:', err)
  }
})
```

## 注意事项

```javascript
// 1. 主包大小限制
// 微信小程序主包不能超过 2MB
// 所有分包合计不能超过 20MB

// 2. 资源引用限制
// 分包内不能引用其他分包的资源
// 主包可以引用分包资源（不推荐）
// 分包可以引用主包资源

// 3. 独立分包
// 独立分包不能引用主包资源
// 独立分包之间可以相互引用
// 独立分包可以作为入口页面

// 4. 预加载策略
// 根据网络状况决定是否预加载
// 预加载过多会影响首屏性能
// 只预加载当前页面相关的分包

// 5. 动态加载
// 使用 uni.preloadPage 预加载页面
// 使用 uni.preloadPackage 预加载分包
```

## 总结

| 特性 | 说明 |
|------|------|
| 主包大小 | 建议不超过 1MB |
| 分包数量 | 建议不超过 10 个 |
| 独立分包 | 可独立运行，不能引用主包资源 |
| 预加载 | 根据网络状况和业务需求配置 |
| 资源引用 | 分包可以引用主包资源 |
| 加载时机 | 首次访问时自动加载 |
