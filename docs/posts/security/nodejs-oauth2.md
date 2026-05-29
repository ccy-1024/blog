---
title: OAuth2.0 实战
date: 2024-07-10
---

# OAuth2.0 实战

## OAuth2.0 流程

```
┌─────────────────────────────────────────────────────────┐
│                    OAuth2.0 授权码流程                 │
├─────────────────────────────────────────────────────────┤
│  用户 → 客户端 → 授权服务器 → 资源服务器                │
│    │      │           │            │                   │
│    ▼      ▼           ▼            ▼                   │
│  访问    请求授权    返回授权码    获取资源              │
│          重定向                     │                   │
│               │                     ▼                   │
│               └─────────→ 交换访问令牌                 │
└─────────────────────────────────────────────────────────┘
```

## 授权模式

### 授权码模式 (Authorization Code)

```javascript
// 1. 构造授权请求 URL
function buildAuthUrl(clientId, redirectUri, scope) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope.join(' '),
    state: generateRandomState()
  })
  
  return `https://auth.example.com/authorize?${params.toString()}`
}

// 2. 处理授权回调
async function handleCallback(req, res) {
  const { code, state } = req.query
  
  // 验证 state
  if (state !== req.session.state) {
    return res.status(403).send('Invalid state')
  }
  
  // 3. 交换访问令牌
  const token = await exchangeCodeForToken(code)
  
  // 4. 获取用户信息
  const user = await fetchUserInfo(token.access_token)
  
  // 5. 创建或登录用户
  const localUser = await findOrCreateUser(user)
  
  // 6. 生成本地会话
  req.session.userId = localUser.id
  
  res.redirect('/dashboard')
}

// 交换授权码
async function exchangeCodeForToken(code) {
  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.REDIRECT_URI,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET
    })
  })
  
  return response.json()
}
```

### 隐式模式 (Implicit)

```javascript
// 隐式模式直接返回访问令牌（不推荐用于服务器端）
function buildImplicitAuthUrl(clientId, redirectUri, scope) {
  const params = new URLSearchParams({
    response_type: 'token',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope.join(' ')
  })
  
  return `https://auth.example.com/authorize?${params.toString()}`
}

// 回调处理（前端）
function handleImplicitCallback(hash) {
  const params = new URLSearchParams(hash.slice(1))
  const accessToken = params.get('access_token')
  const expiresIn = params.get('expires_in')
  
  // 存储令牌
  localStorage.setItem('access_token', accessToken)
}
```

### 密码模式 (Resource Owner Password Credentials)

```javascript
// 密码模式（仅用于信任的客户端）
async function getTokenWithPassword(username, password) {
  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username,
      password,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET
    })
  })
  
  return response.json()
}
```

### 客户端凭证模式 (Client Credentials)

```javascript
// 客户端凭证模式（用于服务器间通信）
async function getClientToken() {
  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'read write'
    })
  })
  
  return response.json()
}
```

## Token 管理

```javascript
// Token 存储
class TokenStore {
  constructor() {
    this.tokens = new Map()
  }
  
  save(userId, token) {
    const expiresAt = Date.now() + (token.expires_in * 1000)
    this.tokens.set(userId, { ...token, expiresAt })
  }
  
  get(userId) {
    const token = this.tokens.get(userId)
    if (!token) return null
    
    // 检查是否过期
    if (Date.now() > token.expiresAt) {
      this.tokens.delete(userId)
      return null
    }
    
    return token
  }
  
  delete(userId) {
    this.tokens.delete(userId)
  }
}

// Token 刷新
async function refreshAccessToken(refreshToken) {
  const response = await fetch('https://auth.example.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET
    })
  })
  
  return response.json()
}
```

## 权限范围 (Scope)

```javascript
// 定义权限范围
const SCOPES = {
  'read:users': '读取用户信息',
  'write:users': '修改用户信息',
  'read:posts': '读取文章',
  'write:posts': '发布文章',
  'admin': '管理员权限'
}

// 验证权限
function checkScope(token, requiredScope) {
  const scopes = token.scope.split(' ')
  return scopes.includes(requiredScope)
}

// 中间件验证权限
function requireScope(scope) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).send('Unauthorized')
    }
    
    if (!checkScope(token, scope)) {
      return res.status(403).send('Insufficient scope')
    }
    
    next()
  }
}
```

## 第三方登录集成

### GitHub OAuth

```javascript
// GitHub OAuth 配置
const GITHUB_CONFIG = {
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  userUrl: 'https://api.github.com/user'
}

// 授权链接
function getGithubAuthUrl() {
  const params = new URLSearchParams({
    client_id: GITHUB_CONFIG.clientId,
    redirect_uri: 'https://example.com/auth/github/callback',
    scope: 'user:email'
  })
  
  return `${GITHUB_CONFIG.authUrl}?${params.toString()}`
}

// 获取用户信息
async function getGithubUser(accessToken) {
  const response = await fetch(GITHUB_CONFIG.userUrl, {
    headers: {
      Authorization: `token ${accessToken}`
    }
  })
  
  return response.json()
}
```

### Google OAuth

```javascript
// Google OAuth 配置
const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userUrl: 'https://www.googleapis.com/oauth2/v3/userinfo'
}

// 授权链接
function getGoogleAuthUrl() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: GOOGLE_CONFIG.clientId,
    redirect_uri: 'https://example.com/auth/google/callback',
    scope: 'openid email profile'
  })
  
  return `${GOOGLE_CONFIG.authUrl}?${params.toString()}`
}
```

## 安全实践

```javascript
// 使用 HTTPS
const https = require('https')
const fs = require('fs')

const server = https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
}, app)

// CSRF 保护
function generateState() {
  return crypto.randomBytes(16).toString('hex')
}

// 验证重定向 URI
function validateRedirectUri(redirectUri) {
  const allowedUris = ['https://example.com/callback']
  return allowedUris.includes(redirectUri)
}

// 令牌存储安全
res.cookie('access_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
})
```

## 总结

| 授权模式 | 适用场景 | 安全性 |
|----------|----------|--------|
| 授权码 | Web 应用 | 高 |
| 隐式 | SPA 应用 | 中 |
| 密码 | 信任客户端 | 低 |
| 客户端凭证 | 服务器间 | 高 |
