---
title: 前端安全攻防实战
date: 2024-05-15
---

# 前端安全攻防实战

## XSS 攻击防护

### 什么是 XSS

XSS（Cross-Site Scripting）是一种注入攻击，攻击者通过在网页中注入恶意脚本，当用户访问时执行该脚本。

### XSS 分类

| 类型 | 存储位置 | 触发方式 | 示例 |
|------|----------|----------|------|
| 存储型 | 服务器数据库 | 页面渲染时 | 评论区注入 |
| 反射型 | URL 参数 | 点击链接时 | 搜索结果页面 |
| DOM 型 | 客户端脚本 | DOM 操作时 | `document.write()` |

### 防护措施

#### 1. 输入过滤

```javascript
// 过滤 HTML 标签
function sanitizeInput(input) {
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

// 使用 DOMPurify
import DOMPurify from 'dompurify'

const clean = DOMPurify.sanitize(userInput)
```

#### 2. 输出编码

```javascript
// HTML 实体编码
function htmlEncode(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

// 对用户输入进行编码
const safeContent = htmlEncode(userComment)
element.innerHTML = `<p>${safeContent}</p>`
```

#### 3. CSP (Content Security Policy)

```html
<!-- 严格的 CSP 配置 -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://trusted-cdn.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  object-src 'none';
  frame-src 'none';
">
```

#### 4. 使用文本Content而非innerHTML

```javascript
// 安全方式
element.textContent = userInput

// 危险方式
element.innerHTML = userInput // 可能执行恶意脚本
```

## CSRF 攻击防护

### 什么是 CSRF

CSRF（Cross-Site Request Forgery）是一种跨站请求伪造攻击，攻击者诱导用户在已登录的状态下执行非预期的操作。

### 防护措施

#### 1. CSRF Token

```javascript
// 服务端生成 Token
app.get('/csrf-token', (req, res) => {
  const token = generateToken()
  res.cookie('csrf-token', token, { httpOnly: true })
  res.json({ token })
})

// 前端获取并使用
async function sendRequest() {
  const { token } = await fetch('/csrf-token').then(res => res.json())
  
  fetch('/api/transfer', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
}
```

#### 2. 验证 Origin

```javascript
// 服务端验证
app.post('/api/transfer', (req, res) => {
  const origin = req.headers.origin
  
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Invalid origin' })
  }
  
  // 处理请求
})
```

#### 3. SameSite Cookies

```javascript
// 设置 SameSite 属性
res.cookie('session', sessionId, {
  sameSite: 'strict', // 仅同站请求携带
  httpOnly: true,
  secure: true
})
```

## 点击劫持防护

### 什么是点击劫持

点击劫持是一种视觉欺骗攻击，攻击者通过透明 iframe 覆盖在目标页面上，诱导用户点击。

### 防护措施

#### 1. X-Frame-Options

```javascript
// 服务端设置响应头
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY')
  // 或允许特定域名
  // res.setHeader('X-Frame-Options', 'ALLOW-FROM https://example.com')
  next()
})
```

#### 2. CSP frame-ancestors

```html
<meta http-equiv="Content-Security-Policy" content="
  frame-ancestors 'none';
">
```

#### 3. JavaScript 防护

```javascript
// 检测是否在 iframe 中
if (window.top !== window.self) {
  // 阻止显示或跳转到安全页面
  window.top.location = window.self.location
}
```

## 敏感数据保护

### 1. HTTPS 强制

```javascript
// 强制 HTTPS
if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
  window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length)
}
```

### 2. 安全的本地存储

```javascript
// 使用 secure cookie
res.cookie('token', token, {
  secure: true,
  httpOnly: true,
  sameSite: 'strict'
})

// 避免在 localStorage 存储敏感数据
// ❌ localStorage.setItem('token', token)
// ✅ 使用 HttpOnly Cookie
```

### 3. 密码安全

```javascript
// 密码强度验证
function validatePassword(password) {
  const rules = [
    { test: /.{8,}/, message: '至少8位' },
    { test: /[A-Z]/, message: '包含大写字母' },
    { test: /[a-z]/, message: '包含小写字母' },
    { test: /[0-9]/, message: '包含数字' },
    { test: /[^A-Za-z0-9]/, message: '包含特殊字符' }
  ]
  
  return rules.filter(rule => !rule.test(password))
}

// 安全的密码哈希
import bcrypt from 'bcrypt'

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}
```

## 代码注入防护

### 1. 避免 eval

```javascript
// ❌ 危险
const code = 'alert("XSS")'
eval(code)

// ✅ 安全
// 使用配置或函数映射
const actions = {
  showAlert: () => alert('Hello'),
  hideModal: () => modal.hide()
}

actions[actionName]?.()
```

### 2. 动态代码执行

```javascript
// ❌ 危险
new Function('return ' + userInput)()

// ✅ 安全：使用 JSON 解析
try {
  const config = JSON.parse(userInput)
} catch (e) {
  console.error('Invalid JSON')
}
```

## 安全编码实践

### 输入验证清单

```javascript
const validators = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^1[3-9]\d{9}$/,
  url: /^https?:\/\/[\w.-]+(\.[\w.-]+)+[/?]?.*$/
}

function validate(field, value) {
  const validator = validators[field]
  return validator ? validator.test(value) : true
}
```

### 错误处理

```javascript
// 避免泄露敏感信息
try {
  // 业务逻辑
} catch (error) {
  // 记录详细日志到服务器
  logError(error)
  
  // 向用户显示友好消息
  showToast('操作失败，请重试')
}
```

### 安全检查清单

```javascript
const securityChecks = [
  // 1. 所有用户输入是否经过过滤/编码
  // 2. 是否使用 CSP 头
  // 3. 是否设置 X-Frame-Options
  // 4. 是否使用 HTTPS
  // 5. 敏感数据是否使用 HttpOnly Cookie
  // 6. 是否避免使用 eval
  // 7. 是否验证所有 API 请求的 CSRF Token
  // 8. 是否正确设置 SameSite 属性
]
```

## 总结

| 攻击类型 | 防护措施 | 优先级 |
|----------|----------|--------|
| XSS | 输入过滤、输出编码、CSP | 高 |
| CSRF | CSRF Token、Origin 验证、SameSite | 高 |
| 点击劫持 | X-Frame-Options、frame-ancestors | 中 |
| 敏感数据泄露 | HTTPS、HttpOnly Cookie | 高 |
| 代码注入 | 避免 eval、输入验证 | 高 |
