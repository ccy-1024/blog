---
title: JWT 认证实现
date: 2024-06-15
---

# JWT 认证实现

## JWT 结构

```
┌─────────────────────────────────────────────────────────┐
│                      JWT 结构                          │
├─────────────────────────────────────────────────────────┤
│  Header.Payload.Signature                              │
│         │                                                │
│         ▼                                                │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.                │ ← Base64 编码的 Header
│  eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.  │ ← Base64 编码的 Payload
│  SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c           │ ← 签名
└─────────────────────────────────────────────────────────┘
```

## Header

```javascript
// Header 结构
{
  "alg": "HS256",  // 算法（HMAC SHA256）
  "typ": "JWT"     // 类型
}

// 支持的算法
const algorithms = {
  'HS256': 'HMAC SHA256',
  'HS384': 'HMAC SHA384',
  'HS512': 'HMAC SHA512',
  'RS256': 'RSA SHA256',
  'RS384': 'RSA SHA384',
  'RS512': 'RSA SHA512'
}
```

## Payload

```javascript
// 标准声明（Registered Claims）
{
  "iss": "https://example.com",  // 签发者
  "sub": "user123",              // 主题
  "aud": "https://api.example.com", // 受众
  "exp": 1609459200,             // 过期时间（Unix时间戳）
  "nbf": 1609452000,             // 生效时间
  "iat": 1609452000,             // 签发时间
  "jti": "unique-token-id"       // JWT ID
}

// 自定义声明
{
  "userId": "12345",
  "role": "admin",
  "permissions": ["read", "write"]
}
```

## Signature

```javascript
// 签名计算
// HMACSHA256(
//   base64UrlEncode(header) + "." + base64UrlEncode(payload),
//   secret
// )

function createSignature(header, payload, secret) {
  const data = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`
  return hmacSHA256(data, secret)
}

function verifySignature(token, secret) {
  const [headerB64, payloadB64, signature] = token.split('.')
  const expectedSignature = createSignature(headerB64, payloadB64, secret)
  return signature === expectedSignature
}
```

## JWT 实现

### 安装依赖

```bash
npm install jsonwebtoken
npm install @types/jsonwebtoken -D
```

### 创建 Token

```javascript
const jwt = require('jsonwebtoken')

// 生成访问令牌
function generateAccessToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 15) // 15分钟过期
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: 'HS256'
  })
}

// 生成刷新令牌
function generateRefreshToken(user) {
  const payload = {
    userId: user.id,
    tokenId: generateTokenId()
  }
  
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d' // 7天过期
  })
}
```

### 验证 Token

```javascript
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return { valid: true, decoded }
  } catch (err) {
    return { 
      valid: false, 
      error: err.message 
    }
  }
}

// 中间件验证
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'Token missing' })
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' })
    }
    
    req.user = user
    next()
  })
}
```

### Token 刷新机制

```javascript
async function refreshToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    
    // 检查刷新令牌是否在黑名单中
    const isBlacklisted = await checkBlacklist(refreshToken)
    if (isBlacklisted) {
      throw new Error('Token revoked')
    }
    
    // 获取用户信息
    const user = await getUserById(decoded.userId)
    if (!user) {
      throw new Error('User not found')
    }
    
    // 生成新的访问令牌
    const accessToken = generateAccessToken(user)
    
    return { accessToken }
  } catch (err) {
    throw new Error('Invalid refresh token')
  }
}
```

## 安全实践

### 密钥管理

```javascript
// 使用环境变量存储密钥
require('dotenv').config()

// 生成强密钥
// node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Token 存储

```javascript
// 客户端存储方式对比

// 1. HttpOnly Cookie（推荐用于 Web）
res.cookie('access_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000 // 15分钟
})

// 2. LocalStorage（适用于 SPA）
localStorage.setItem('access_token', token)

// 3. SessionStorage（临时存储）
sessionStorage.setItem('access_token', token)
```

### Token 撤销

```javascript
// 黑名单机制
const tokenBlacklist = new Set()

async function revokeToken(token) {
  // 获取 Token 过期时间
  const decoded = jwt.decode(token)
  const expiresAt = decoded.exp * 1000
  const ttl = expiresAt - Date.now()
  
  // 添加到黑名单
  tokenBlacklist.add(token)
  
  // 设置自动清理
  setTimeout(() => {
    tokenBlacklist.delete(token)
  }, ttl)
}

async function checkBlacklist(token) {
  return tokenBlacklist.has(token)
}

// 使用 Redis 存储黑名单（分布式场景）
async function revokeTokenRedis(token) {
  const decoded = jwt.decode(token)
  const ttl = (decoded.exp * 1000 - Date.now()) / 1000
  
  await redis.set(`blacklist:${token}`, 'true', 'EX', ttl)
}

async function checkBlacklistRedis(token) {
  const exists = await redis.get(`blacklist:${token}`)
  return exists === 'true'
}
```

## OAuth2.0 集成

```javascript
// OAuth2.0 授权码流程
async function exchangeCodeForToken(code) {
  const response = await fetch('https://oauth.example.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'https://example.com/callback',
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET
    })
  })
  
  const data = await response.json()
  
  // 使用第三方用户信息创建或更新本地用户
  const user = await findOrCreateUser(data.user)
  
  // 生成 JWT
  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)
  
  return { accessToken, refreshToken }
}
```

## 总结

| 场景 | 推荐做法 |
|------|----------|
| Token 存储 | HttpOnly Cookie |
| Token 过期 | 短时间 access_token + 长时间 refresh_token |
| Token 撤销 | Redis 黑名单 |
| 密钥管理 | 环境变量 + 定期轮换 |
| 算法选择 | HS256（对称）或 RS256（非对称） |
