---
title: CSRF 攻击与防护策略
date: 2024-12-22
---

# CSRF 攻击与防护策略

## CSRF 原理

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CSRF 攻击流程                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐        ┌──────────────┐        ┌──────────────┐  │
│  │   攻击者网站  │        │    用户浏览器  │        │   目标网站   │  │
│  │   (evil.com) │        │              │        │  (bank.com)  │  │
│  └──────┬───────┘        └───────┬──────┘        └──────┬───────┘  │
│         │                        │                       │          │
│         │  1. 诱导用户访问       │                       │          │
│         ▼                        │                       │          │
│  ┌──────────────┐               │                       │          │
│  │ 恶意页面     │               │                       │          │
│  │ <form action │               │                       │          │
│  │ =bank.com/   │               │                       │          │
│  │ transfer>    │               │                       │          │
│  └──────┬───────┘               │                       │          │
│         │ 2. 自动提交表单        │                       │          │
│         │◀──────────────────────┘                       │          │
│         │                                               │          │
│         │ 3. 请求携带用户 Cookie │                       │          │
│         │────────────────────────▶                       │          │
│         │                                               ▼          │
│         │                                        ┌──────────────┐  │
│         │                                        │ 验证 Cookie │  │
│         │                                        │ 执行转账     │  │
│         │                                        └──────────────┘  │
│         │                                               │          │
│         │ 4. 返回响应                                  │          │
│         │◀───────────────────────────────────────────────┘          │
│         ▼                                                          │
│  ┌──────────────┐                                                  │
│  │ 攻击成功     │                                                  │
│  └──────────────┘                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## CSRF 攻击类型

### 1. GET 请求型

```html
<!-- 攻击者网站 -->
<img src="http://bank.com/api/transfer?to=attacker&amount=1000" 
     style="display: none;">
```

### 2. POST 请求型

```html
<!-- 攻击者网站 -->
<form id="csrf-form" 
      action="http://bank.com/api/transfer" 
      method="POST">
  <input type="hidden" name="to" value="attacker">
  <input type="hidden" name="amount" value="1000">
</form>

<script>
  // 页面加载时自动提交
  document.getElementById('csrf-form').submit()
</script>
```

### 3. XHR 请求型

```javascript
// 攻击者网站脚本
function attack() {
  const xhr = new XMLHttpRequest()
  xhr.open('POST', 'http://bank.com/api/transfer')
  xhr.withCredentials = true
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.send(JSON.stringify({
    to: 'attacker',
    amount: 1000
  }))
}
```

### 4. 链接型

```html
<!-- 钓鱼邮件中的链接 -->
<a href="http://bank.com/api/transfer?to=attacker&amount=1000">
  点击查看您的账户详情
</a>
```

## 防护方案

### 方案一：CSRF Token（推荐）

```javascript
// ✅ 服务端生成并验证 CSRF Token
const express = require('express')
const session = require('express-session')

const app = express()

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}))

// 生成 CSRF Token
app.get('/api/csrf-token', (req, res) => {
  req.session.csrfToken = generateToken()
  res.json({ csrfToken: req.session.csrfToken })
})

// CSRF 中间件
function csrfMiddleware(req, res, next) {
  const token = req.headers['x-csrf-token'] || req.body.csrfToken
  
  if (token !== req.session.csrfToken) {
    return res.status(403).json({ error: 'CSRF token mismatch' })
  }
  
  next()
}

// 应用到敏感路由
app.post('/api/transfer', csrfMiddleware, (req, res) => {
  // 处理转账逻辑
  res.json({ success: true })
})

function generateToken() {
  return require('crypto').randomBytes(32).toString('hex')
}
```

```html
<!-- 前端使用 -->
<form id="transfer-form" action="/api/transfer" method="POST">
  <input type="hidden" name="csrfToken" id="csrf-token">
  <input type="text" name="to" placeholder="收款账户">
  <input type="number" name="amount" placeholder="金额">
  <button type="submit">转账</button>
</form>

<script>
// 获取 CSRF Token
fetch('/api/csrf-token')
  .then(res => res.json())
  .then(data => {
    document.getElementById('csrf-token').value = data.csrfToken
  })
</script>
```

### 方案二：Double Submit Cookie

```javascript
// ✅ Double Submit Cookie 方案
const express = require('express')

const app = express()

// 生成随机 token 并存入 cookie
app.use((req, res, next) => {
  if (!req.cookies.csrfToken) {
    const token = require('crypto').randomBytes(32).toString('hex')
    res.cookie('csrfToken', token, {
      httpOnly: false,  // 必须设为 false 以便 JS 访问
      secure: true,
      sameSite: 'strict'
    })
  }
  next()
})

// 验证 token
app.post('/api/transfer', (req, res) => {
  const cookieToken = req.cookies.csrfToken
  const headerToken = req.headers['x-csrf-token']
  
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'CSRF attack detected' })
  }
  
  // 处理请求
  res.json({ success: true })
})
```

### 方案三：SameSite Cookie 属性

```javascript
// ✅ 使用 SameSite 属性
const express = require('express')
const cookieParser = require('cookie-parser')

const app = express()
app.use(cookieParser())

// 设置 Cookie 时添加 SameSite
app.get('/login', (req, res) => {
  res.cookie('session', 'abc123', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'  // 或 'lax'
  })
  res.send('登录成功')
})
```

### 方案四：验证 Referer 头部

```javascript
// ✅ Referer 验证中间件
function validateReferer(req, res, next) {
  const referer = req.headers.referer
  
  if (!referer) {
    return res.status(403).json({ error: 'Missing referer' })
  }
  
  const allowedOrigins = [
    'https://your-domain.com',
    'https://www.your-domain.com'
  ]
  
  const origin = new URL(referer).origin
  
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Invalid referer' })
  }
  
  next()
}

app.post('/api/transfer', validateReferer, (req, res) => {
  res.json({ success: true })
})
```

### 方案五：使用 Origin 头部验证

```javascript
// ✅ Origin 验证
function validateOrigin(req, res, next) {
  const origin = req.headers.origin
  
  // 允许的来源
  const allowedOrigins = [
    'https://your-domain.com',
    'https://app.your-domain.com'
  ]
  
  // 如果有 Origin 头部，验证是否在白名单中
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Invalid origin' })
  }
  
  next()
}

app.post('/api/*', validateOrigin, (req, res) => {
  // 处理请求
})
```

## 防护矩阵

| 请求类型 | 推荐防护方案 |
|----------|--------------|
| GET 请求 | SameSite Cookie + 业务层面幂等性检查 |
| POST 请求 | CSRF Token + SameSite Cookie |
| XHR 请求 | Origin 验证 + CSRF Token |
| API 请求 | Token 认证（JWT/OAuth）替代 Cookie |

## 错误防护示例

### ❌ 错误：仅依赖 Cookie 验证

```javascript
// 危险示例
app.post('/api/transfer', (req, res) => {
  // 只验证用户是否登录（通过 Cookie）
  if (!req.session.userId) {
    return res.status(401).json({ error: '未登录' })
  }
  
  // 直接执行转账 - 容易受到 CSRF 攻击
  transferMoney(req.body.to, req.body.amount)
  
  res.json({ success: true })
})
```

### ❌ 错误：使用不可预测的参数名

```javascript
// 危险示例 - 攻击者可以暴力破解参数名
app.post('/api/transfer', (req, res) => {
  // 参数名混淆不是有效的 CSRF 防护
  const to = req.body['unpredictable_param_name_123']
  const amount = req.body['another_secret_param_456']
  
  transferMoney(to, amount)
  res.json({ success: true })
})
```

### ❌ 错误：使用固定 Token

```javascript
// 危险示例 - 固定 Token 容易被泄露
const FIXED_CSRF_TOKEN = 'abc123xyz'

app.post('/api/transfer', (req, res) => {
  if (req.body.csrfToken !== FIXED_CSRF_TOKEN) {
    return res.status(403).json({ error: 'Invalid token' })
  }
  
  transferMoney(req.body.to, req.body.amount)
  res.json({ success: true })
})
```

## 前端最佳实践

### 使用 Axios 自动携带 Token

```javascript
import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',
  withCredentials: true
})

// 请求拦截器：自动添加 CSRF Token
api.interceptors.request.use((config) => {
  // 从 meta 标签获取 Token
  const token = document.querySelector('meta[name="csrf-token"]')?.content
  
  if (token) {
    config.headers['X-CSRF-Token'] = token
  }
  
  return config
})

// 使用
api.post('/transfer', {
  to: 'user123',
  amount: 1000
})
```

### 在 HTML 中嵌入 Token

```html
<!-- 在页面中嵌入 CSRF Token -->
<meta name="csrf-token" content="<%= csrfToken %>">

<!-- 表单中使用 -->
<form action="/api/transfer" method="POST">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  <!-- 其他表单字段 -->
</form>
```

## 后端框架集成

### Express.js

```javascript
const express = require('express')
const csrf = require('csurf')
const cookieParser = require('cookie-parser')

const app = express()

// 配置
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))

// CSRF 保护
const csrfProtection = csrf({ cookie: true })

// 路由
app.get('/form', csrfProtection, (req, res) => {
  res.render('send', { csrfToken: req.csrfToken() })
})

app.post('/process', csrfProtection, (req, res) => {
  res.send('数据已处理')
})
```

### NestJS

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common'
import { CsrfGuard } from './csrf.guard'

@Controller('api')
export class AppController {
  @Post('transfer')
  @UseGuards(CsrfGuard)
  transfer() {
    // 处理转账逻辑
  }
}
```

## 总结

| 防护方法 | 优点 | 缺点 | 推荐度 |
|----------|------|------|--------|
| CSRF Token | 防护效果最好 | 需前后端配合 | ⭐⭐⭐⭐⭐ |
| SameSite Cookie | 配置简单 | 兼容性有限 | ⭐⭐⭐⭐ |
| Double Submit Cookie | 无需服务端存储 | 依赖 JS 执行 | ⭐⭐⭐⭐ |
| Referer 验证 | 无需修改代码 | 不完全可靠 | ⭐⭐⭐ |
| Origin 验证 | 对 API 友好 | 无法防护同域攻击 | ⭐⭐⭐⭐ |
| Token 认证 | 天然防护 CSRF | 实现复杂 | ⭐⭐⭐⭐⭐ |
