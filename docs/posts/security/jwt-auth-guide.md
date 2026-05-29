---
title: JWT 认证与权限管理
date: 2024-11-25
---

# JWT 认证与权限管理

## JWT 架构

```
┌─────────────────────────────────────────────────────────┐
│                     JWT 架构                          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   用户登录   │  │   Token 生成 │  │   Token验证 │ │
│  │   Login      │  │  Sign        │  │  Verify     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  AccessToken │  │  RefreshToken│  │   RBAC      │ │
│  │   访问令牌   │  │   刷新令牌   │  │   权限控制   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## JWT 结构

```
┌─────────────────────────────────────────────────────────┐
│                      JWT 结构                         │
├─────────────────────────────────────────────────────────┤
│  Header.Payload.Signature                             │
│                                                       │
│  Header:  {"alg": "HS256", "typ": "JWT"}             │
│  Payload: {"sub": "123456", "exp": 1704067200}       │
│  Signature: HMACSHA256(base64Url(header) + "." +      │
│              base64Url(payload), secret)              │
└─────────────────────────────────────────────────────────┘
```

## JWT 实现

### 生成 Token

```typescript
import * as jwt from 'jsonwebtoken'

interface TokenPayload {
  userId: number
  username: string
  roles: string[]
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const ACCESS_TOKEN_EXPIRES_IN = '15m'
const REFRESH_TOKEN_EXPIRES_IN = '7d'

function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  })
}

function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  })
}

// 使用示例
const payload: TokenPayload = {
  userId: 1,
  username: 'admin',
  roles: ['admin', 'user']
}

const accessToken = generateAccessToken(payload)
const refreshToken = generateRefreshToken(payload)
```

### 验证 Token

```typescript
function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload
  } catch {
    return null
  }
}

// 检查 Token 是否过期
function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded) return true
  
  const currentTime = Math.floor(Date.now() / 1000)
  return decoded.exp < currentTime
}
```

## 登录流程

```typescript
import { Controller, Post, Body } from '@midwayjs/core'

@Controller('/api/auth')
export class AuthController {
  constructor(
    private userService: UserService,
    private redisService: RedisService
  ) {}

  @Post('/login')
  async login(@Body() body: { username: string; password: string }) {
    // 验证用户
    const user = await this.userService.getUserByUsername(body.username)
    
    if (!user || !await this.verifyPassword(body.password, user.password)) {
      throw new Error('用户名或密码错误')
    }

    // 生成 Token
    const payload = {
      userId: user.id,
      username: user.username,
      roles: user.roles
    }

    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    // 存储 Refresh Token
    await this.redisService.set(
      `refresh_token:${user.id}`,
      refreshToken,
      'EX',
      7 * 24 * 60 * 60 // 7天
    )

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, username: user.username, roles: user.roles }
    }
  }

  @Post('/refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    const decoded = verifyToken(body.refreshToken)
    
    if (!decoded) {
      throw new Error('无效的 refresh token')
    }

    // 验证 Refresh Token 是否存在
    const storedToken = await this.redisService.get(`refresh_token:${decoded.userId}`)
    
    if (storedToken !== body.refreshToken) {
      throw new Error('refresh token 已过期')
    }

    // 生成新的 Token
    const payload = {
      userId: decoded.userId,
      username: decoded.username,
      roles: decoded.roles
    }

    const accessToken = generateAccessToken(payload)
    const newRefreshToken = generateRefreshToken(payload)

    // 更新 Refresh Token
    await this.redisService.set(
      `refresh_token:${decoded.userId}`,
      newRefreshToken,
      'EX',
      7 * 24 * 60 * 60
    )

    return { accessToken, refreshToken: newRefreshToken }
  }

  @Post('/logout')
  async logout(@CurrentUser() user: TokenPayload) {
    await this.redisService.del(`refresh_token:${user.userId}`)
    return { success: true }
  }

  private async verifyPassword(inputPassword: string, storedPassword: string): Promise<boolean> {
    // 使用 bcrypt 验证密码
    return bcrypt.compare(inputPassword, storedPassword)
  }
}
```

## RBAC 权限模型

### 角色定义

```typescript
interface Role {
  id: number
  name: string
  description: string
  permissions: string[]
}

interface Permission {
  id: number
  name: string
  code: string
  description: string
}

// 角色权限配置
const roles: Record<string, string[]> = {
  admin: ['user:read', 'user:create', 'user:update', 'user:delete', 'system:*'],
  editor: ['user:read', 'user:create', 'user:update'],
  user: ['user:read']
}
```

### 权限守卫

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@midwayjs/core'

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.getContext()
    const token = ctx.headers['authorization']?.split(' ')[1]
    
    if (!token) {
      ctx.status = 401
      ctx.body = { error: 'Unauthorized' }
      return false
    }

    const decoded = verifyToken(token)
    
    if (!decoded) {
      ctx.status = 401
      ctx.body = { error: 'Invalid token' }
      return false
    }

    ctx.user = decoded
    return true
  }
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private requiredPermission: string) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.getContext()
    const user = ctx.user as TokenPayload
    
    if (!user) {
      ctx.status = 401
      ctx.body = { error: 'Unauthorized' }
      return false
    }

    const hasPermission = this.checkPermission(user.roles, this.requiredPermission)
    
    if (!hasPermission) {
      ctx.status = 403
      ctx.body = { error: 'Forbidden' }
      return false
    }

    return true
  }

  private checkPermission(roles: string[], permission: string): boolean {
    for (const role of roles) {
      const rolePermissions = roles[role] || []
      
      // 检查精确匹配
      if (rolePermissions.includes(permission)) {
        return true
      }
      
      // 检查通配符匹配
      if (rolePermissions.some(p => p.endsWith(':*') && permission.startsWith(p.replace(':*', '')))) {
        return true
      }
    }
    
    return false
  }
}
```

### 自定义装饰器

```typescript
import { createDecorator } from '@midwayjs/core'

export const RequirePermission = createDecorator<string>('permission')

// 使用
@Controller('/api/users')
export class UserController {
  @Get('/')
  @RequirePermission('user:read')
  async getUsers() {
    // 只有拥有 user:read 权限的用户才能访问
  }

  @Post('/')
  @RequirePermission('user:create')
  async createUser(@Body() body: CreateUserDTO) {
    // 只有拥有 user:create 权限的用户才能访问
  }
}
```

## 密码安全

```typescript
import * as bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

// 加密密码
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// 验证密码
async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// 创建用户时加密密码
async function createUser(userData: CreateUserDTO) {
  const hashedPassword = await hashPassword(userData.password)
  
  const user = new User()
  user.username = userData.username
  user.password = hashedPassword
  user.email = userData.email
  
  await userRepository.save(user)
}
```

## 安全最佳实践

```typescript
// Token 黑名单
class TokenBlacklist {
  constructor(private redis: RedisService) {}
  
  async add(token: string, expiresAt: number): Promise<void> {
    const now = Math.floor(Date.now() / 1000)
    const ttl = expiresAt - now
    
    if (ttl > 0) {
      await this.redis.set(`blacklist:${token}`, '1', 'EX', ttl)
    }
  }
  
  async contains(token: string): Promise<boolean> {
    const result = await this.redis.get(`blacklist:${token}`)
    return result === '1'
  }
}

// 使用示例
const blacklist = new TokenBlacklist(redis)

// 注销时添加到黑名单
async function logout(userId: number, token: string) {
  const decoded = decodeToken(token)
  if (decoded) {
    await blacklist.add(token, decoded.exp)
  }
  await redis.del(`refresh_token:${userId}`)
}

// 验证时检查黑名单
function verifyTokenWithBlacklist(token: string): TokenPayload | null {
  if (blacklist.contains(token)) {
    return null
  }
  return verifyToken(token)
}
```

## 总结

| 功能 | 说明 |
|------|------|
| JWT 生成 | 使用 jsonwebtoken 库生成访问令牌和刷新令牌 |
| Token 验证 | 验证 Token 有效性和过期时间 |
| 刷新机制 | 使用 Refresh Token 获取新的 Access Token |
| RBAC | 基于角色的权限控制 |
| 密码安全 | 使用 bcrypt 加密存储密码 |
| 黑名单 | 支持 Token 强制失效 |