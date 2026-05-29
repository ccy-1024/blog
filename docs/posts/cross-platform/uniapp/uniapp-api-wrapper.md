---
title: uni-app 数据请求封装
date: 2024-04-05
---

# uni-app 数据请求封装

## 基础封装

### 创建请求实例

```javascript
// utils/request.js
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.example.com' 
  : 'http://localhost:3000'

export default function request(options) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': uni.getStorageSync('token') || '',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`HTTP Error: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}
```

### 请求方法封装

```javascript
// api/index.js
import request from '../utils/request'

// GET 请求
export function get(url, params = {}) {
  return request({
    url,
    method: 'GET',
    data: params
  })
}

// POST 请求
export function post(url, data = {}) {
  return request({
    url,
    method: 'POST',
    data
  })
}

// PUT 请求
export function put(url, data = {}) {
  return request({
    url,
    method: 'PUT',
    data
  })
}

// DELETE 请求
export function del(url, params = {}) {
  return request({
    url,
    method: 'DELETE',
    data: params
  })
}
```

## 拦截器

### 请求拦截器

```javascript
// utils/request.js
let requestInterceptor = null
let responseInterceptor = null

export function setRequestInterceptor(fn) {
  requestInterceptor = fn
}

export function setResponseInterceptor(fn) {
  responseInterceptor = fn
}

export default function request(options) {
  return new Promise((resolve, reject) => {
    // 请求拦截
    if (requestInterceptor) {
      const result = requestInterceptor(options)
      if (result) {
        options = { ...options, ...result }
      }
    }
    
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': uni.getStorageSync('token') || '',
        ...options.header
      },
      success: (res) => {
        // 响应拦截
        if (responseInterceptor) {
          const result = responseInterceptor(res)
          if (result) {
            res = result
          }
        }
        
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`HTTP Error: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}
```

### 配置拦截器

```javascript
// main.js
import { setRequestInterceptor, setResponseInterceptor } from './utils/request'

// 请求拦截器：添加 loading
setRequestInterceptor((options) => {
  uni.showLoading({
    title: '加载中...'
  })
  return options
})

// 响应拦截器：统一处理错误
setResponseInterceptor((res) => {
  uni.hideLoading()
  
  const { code, message } = res.data
  
  if (code === 401) {
    // 未登录，跳转登录页
    uni.redirectTo({
      url: '/pages/login/index'
    })
  } else if (code !== 200) {
    // 其他错误，显示提示
    uni.showToast({
      title: message || '请求失败',
      icon: 'none'
    })
  }
  
  return res
})
```

## API 模块封装

```javascript
// api/user.js
import { get, post, put, del } from './index'

// 用户相关 API
export const userApi = {
  // 获取用户信息
  getUserInfo() {
    return get('/user/info')
  },
  
  // 登录
  login(data) {
    return post('/user/login', data)
  },
  
  // 注册
  register(data) {
    return post('/user/register', data)
  },
  
  // 更新用户信息
  updateUserInfo(data) {
    return put('/user/info', data)
  },
  
  // 删除用户
  deleteUser(id) {
    return del(`/user/${id}`)
  }
}

// 文章相关 API
export const articleApi = {
  // 获取文章列表
  getArticleList(params) {
    return get('/articles', params)
  },
  
  // 获取文章详情
  getArticleDetail(id) {
    return get(`/articles/${id}`)
  },
  
  // 创建文章
  createArticle(data) {
    return post('/articles', data)
  },
  
  // 更新文章
  updateArticle(id, data) {
    return put(`/articles/${id}`, data)
  },
  
  // 删除文章
  deleteArticle(id) {
    return del(`/articles/${id}`)
  }
}
```

## 使用示例

```javascript
// pages/index/index.vue
import { userApi, articleApi } from '../../api/user'

export default {
  data() {
    return {
      userInfo: null,
      articles: []
    }
  },
  
  async onLoad() {
    try {
      // 获取用户信息
      this.userInfo = await userApi.getUserInfo()
      
      // 获取文章列表
      this.articles = await articleApi.getArticleList({
        page: 1,
        limit: 10
      })
    } catch (err) {
      console.error('加载失败:', err)
    }
  }
}
```

## 文件上传

```javascript
// utils/upload.js
export function uploadFile(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + '/upload',
      filePath,
      name: options.name || 'file',
      formData: options.formData || {},
      header: {
        'Authorization': uni.getStorageSync('token') || ''
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        resolve(data)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 使用
async function uploadImage(filePath) {
  try {
    const result = await uploadFile(filePath)
    console.log('上传成功:', result)
    return result
  } catch (err) {
    console.error('上传失败:', err)
  }
}
```

## 错误处理

### 统一错误处理

```javascript
// utils/request.js
export function handleError(err) {
  console.error('Request Error:', err)
  
  if (err.errMsg) {
    uni.showToast({
      title: err.errMsg,
      icon: 'none'
    })
  } else if (err.message) {
    uni.showToast({
      title: err.message,
      icon: 'none'
    })
  } else {
    uni.showToast({
      title: '网络请求失败',
      icon: 'none'
    })
  }
}

// 使用
try {
  const result = await userApi.login(data)
} catch (err) {
  handleError(err)
}
```

## 最佳实践

1. **统一 API 管理**：将 API 按模块分类，便于维护
2. **使用拦截器**：统一处理 loading、错误、登录状态等
3. **错误处理**：使用 try-catch 或 Promise.catch 捕获异常
4. **环境配置**：区分开发和生产环境的 API 地址
5. **token 管理**：使用本地存储保存 token，请求时自动携带
6. **请求取消**：对于频繁的请求，考虑使用防抖或取消之前的请求
