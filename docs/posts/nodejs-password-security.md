---
title: 密码安全
date: 2024-08-10
---

# 密码安全

## 密码安全架构

```
┌─────────────────────────────────────────────────────────┐
│                    密码安全架构                        │
├─────────────────────────────────────────────────────────┤
│  用户输入 ──> 验证 ──> 哈希 ──> 存储                   │
│     │              │        │        │                │
│     ▼              ▼        ▼        ▼                │
│  长度检查    复杂度检查   加盐    数据库                │
│              字典检查                                  │
└─────────────────────────────────────────────────────────┘
```

## 密码哈希

```javascript
const bcrypt = require('bcrypt')
const saltRounds = 12

// 生成哈希
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(saltRounds)
  const hash = await bcrypt.hash(password, salt)
  return hash
}

// 验证密码
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

// 使用示例
async function testPassword() {
  const password = 'mySecurePassword123!'
  const hash = await hashPassword(password)
  
  console.log('Hash:', hash)
  
  const isValid = await verifyPassword(password, hash)
  console.log('Is valid:', isValid) // true
  
  const isInvalid = await verifyPassword('wrongPassword', hash)
  console.log('Is invalid:', isInvalid) // false
}
```

## scrypt 算法

```javascript
const crypto = require('crypto')

// scrypt 哈希
function scryptHash(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const key = crypto.scryptSync(password, salt, 64, { N: 1024, r: 8, p: 1 })
  return `${salt}:${key.toString('hex')}`
}

// scrypt 验证
function scryptVerify(password, hash) {
  const [salt, key] = hash.split(':')
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 1024, r: 8, p: 1 })
  return derivedKey.toString('hex') === key
}

// 使用示例
const hash = scryptHash('myPassword')
console.log('scrypt hash:', hash)

const isValid = scryptVerify('myPassword', hash)
console.log('Is valid:', isValid)
```

## 密码策略

```javascript
// 密码验证函数
function validatePassword(password) {
  const errors = []
  
  // 长度检查
  if (password.length < 8) {
    errors.push('密码长度至少8位')
  }
  
  // 大写字母检查
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母')
  }
  
  // 小写字母检查
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母')
  }
  
  // 数字检查
  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含数字')
  }
  
  // 特殊字符检查
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符')
  }
  
  // 字典检查
  if (isCommonPassword(password)) {
    errors.push('密码过于常见，请使用更复杂的密码')
  }
  
  return errors
}

// 常见密码检查
const commonPasswords = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
  'baseball', 'iloveyou', 'master', 'sunshine', 'ashley'
])

function isCommonPassword(password) {
  return commonPasswords.has(password.toLowerCase())
}
```

## 令牌生成

```javascript
const crypto = require('crypto')

// 生成随机令牌
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex')
}

// 生成重置密码令牌
function generateResetToken() {
  const token = generateToken()
  const expiresAt = Date.now() + 3600000 // 1小时后过期
  
  return {
    token,
    expiresAt
  }
}

// 生成 API Key
function generateApiKey() {
  const prefix = 'sk_'
  const key = generateToken(32)
  return prefix + key
}

// 使用示例
console.log('Reset token:', generateResetToken())
console.log('API Key:', generateApiKey())
```

## 安全存储

```javascript
// 数据库存储示例
async function saveUser(userData) {
  const { username, password, email } = userData
  
  // 验证密码
  const errors = validatePassword(password)
  if (errors.length > 0) {
    throw new Error(errors.join(', '))
  }
  
  // 哈希密码
  const hash = await hashPassword(password)
  
  // 保存到数据库
  const user = await db.users.insert({
    username,
    passwordHash: hash,
    email
  })
  
  return user
}

// 登录验证
async function login(username, password) {
  // 查询用户
  const user = await db.users.findOne({ username })
  
  if (!user) {
    throw new Error('用户名或密码错误')
  }
  
  // 验证密码
  const isValid = await verifyPassword(password, user.passwordHash)
  
  if (!isValid) {
    throw new Error('用户名或密码错误')
  }
  
  // 生成会话令牌
  const sessionToken = generateToken()
  
  // 更新用户会话
  await db.users.update({ id: user.id }, { sessionToken })
  
  return { user, sessionToken }
}
```

## 多因素认证

```javascript
const speakeasy = require('speakeasy')
const qrcode = require('qrcode')

// 生成 MFA 密钥
function generateMfaSecret() {
  return speakeasy.generateSecret({
    length: 20,
    name: 'My App',
    issuer: 'My Company'
  })
}

// 生成 QR Code URL
async function generateQrCodeUrl(secret) {
  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret.base32,
    label: secret.name,
    issuer: secret.issuer,
    encoding: 'base32'
  })
  
  return qrcode.toDataURL(otpauthUrl)
}

// 验证 MFA 令牌
function verifyMfaToken(secret, token) {
  return speakeasy.totp.verify({
    secret: secret.base32,
    encoding: 'base32',
    token
  })
}

// 使用示例
async function setupMfa() {
  const secret = generateMfaSecret()
  const qrCodeUrl = await generateQrCodeUrl(secret)
  
  console.log('Secret:', secret.base32)
  console.log('QR Code URL:', qrCodeUrl)
  
  // 保存 secret 到用户记录
  await db.users.update({ id: userId }, { mfaSecret: secret.base32 })
}

// 验证登录
async function verifyLoginWithMfa(username, password, mfaToken) {
  const user = await login(username, password)
  
  if (user.mfaEnabled) {
    const isValid = verifyMfaToken(user.mfaSecret, mfaToken)
    
    if (!isValid) {
      throw new Error('无效的 MFA 令牌')
    }
  }
  
  return user
}
```

## 安全最佳实践

```javascript
// 安全配置示例
const securityConfig = {
  // 密码策略
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },
  
  // 会话配置
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    secure: true,
    httpOnly: true,
    sameSite: 'strict'
  },
  
  // 令牌配置
  token: {
    resetTokenExpiry: 3600000, // 1小时
    sessionTokenLength: 64
  },
  
  // 速率限制
  rateLimit: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000 // 15分钟
  }
}

// 速率限制中间件
function rateLimitMiddleware(req, res, next) {
  const ip = req.ip
  const attempts = rateLimitStore.get(ip) || 0
  
  if (attempts >= securityConfig.rateLimit.maxAttempts) {
    return res.status(429).send('请求过于频繁，请稍后重试')
  }
  
  rateLimitStore.set(ip, attempts + 1)
  
  setTimeout(() => {
    rateLimitStore.set(ip, Math.max(0, (rateLimitStore.get(ip) || 0) - 1))
  }, securityConfig.rateLimit.windowMs)
  
  next()
}
```

## 总结

| 安全措施 | 实现方式 |
|----------|----------|
| 密码哈希 | bcrypt/scrypt |
| 密码验证 | 长度、复杂度、字典检查 |
| 令牌生成 | crypto.randomBytes |
| 多因素认证 | TOTP (speakeasy) |
| 速率限制 | IP 计数 |
| 会话安全 | HttpOnly、Secure、SameSite |
