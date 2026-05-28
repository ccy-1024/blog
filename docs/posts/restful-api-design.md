---
title: RESTful API 设计规范
date: 2024-12-15
---

# RESTful API 设计规范

## RESTful 架构

```
┌─────────────────────────────────────────────────────────┐
│                  RESTful API 架构                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   资源标识   │  │   HTTP方法   │  │   状态码     │ │
│  │  Resource   │  │  HTTP Verb   │  │ Status Code │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   统一接口   │  │   无状态     │  │   缓存       │ │
│  │  Uniform     │  │ Stateless   │  │   Cache     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 资源命名规范

### 基础规则

```
✅ 复数名词：/users, /posts, /orders
✅ 小写字母：/api/users, /api/products
✅ 连字符分隔：/user-profiles, /order-items
❌ 下划线：/user_profiles（不推荐）
❌ 驼峰式：/userProfiles（不推荐）
```

### 资源层次

```
# 用户资源
GET    /users              # 获取所有用户
GET    /users/{id}         # 获取单个用户
POST   /users              # 创建用户
PUT    /users/{id}         # 更新用户
DELETE /users/{id}         # 删除用户

# 用户的文章
GET    /users/{id}/posts   # 获取用户的所有文章
GET    /users/{id}/posts/{postId}  # 获取用户的单篇文章
POST   /users/{id}/posts   # 用户创建文章

# 嵌套资源
GET    /orders/{id}/items  # 获取订单的所有商品
GET    /orders/{id}/items/{itemId}  # 获取订单的单个商品
```

## HTTP 方法使用

| 方法 | 语义 | 幂等性 |
|------|------|--------|
| GET | 获取资源 | ✅ |
| POST | 创建资源 | ❌ |
| PUT | 更新资源（全量） | ✅ |
| PATCH | 更新资源（部分） | ✅ |
| DELETE | 删除资源 | ✅ |

### 示例

```typescript
// 获取用户列表
GET /api/users
// 参数：page, size, sort, filter

// 获取单个用户
GET /api/users/1

// 创建用户
POST /api/users
// Body: { name, email, password }

// 更新用户（全量）
PUT /api/users/1
// Body: { name, email, password }

// 更新用户（部分）
PATCH /api/users/1
// Body: { email: 'new@example.com' }

// 删除用户
DELETE /api/users/1
```

## 状态码规范

| 状态码 | 类别 | 说明 |
|--------|------|------|
| 200 | 成功 | 请求成功 |
| 201 | 成功 | 创建资源成功 |
| 204 | 成功 | 删除成功，无返回内容 |
| 400 | 客户端错误 | 请求参数错误 |
| 401 | 客户端错误 | 未认证 |
| 403 | 客户端错误 | 无权限 |
| 404 | 客户端错误 | 资源不存在 |
| 409 | 客户端错误 | 资源冲突 |
| 500 | 服务端错误 | 服务器内部错误 |

### 错误响应格式

```json
{
  "code": 400,
  "message": "参数错误",
  "errors": [
    {
      "field": "email",
      "message": "邮箱格式不正确"
    },
    {
      "field": "password",
      "message": "密码长度不能少于6位"
    }
  ],
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 成功响应格式

```json
// 单个资源
{
  "code": 200,
  "data": {
    "id": 1,
    "name": "John",
    "email": "john@example.com",
    "createdAt": "2024-01-01T12:00:00Z"
  },
  "message": "success"
}

// 列表资源
{
  "code": 200,
  "data": {
    "items": [
      { "id": 1, "name": "John" },
      { "id": 2, "name": "Jane" }
    ],
    "pagination": {
      "page": 1,
      "size": 10,
      "total": 100,
      "pages": 10
    }
  },
  "message": "success"
}
```

## 参数规范

### 查询参数

```typescript
// 分页参数
GET /api/users?page=1&size=10

// 排序参数
GET /api/users?sort=createdAt,DESC

// 过滤参数
GET /api/users?status=active&role=admin

// 搜索参数
GET /api/users?q=John

// 字段选择
GET /api/users?fields=id,name,email
```

### 请求体验证

```typescript
import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator'

class CreateUserDTO {
  @IsString()
  @MinLength(2)
  name: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  password: string

  @IsOptional()
  @IsString()
  phone?: string
}
```

## 认证与授权

### JWT Token

```typescript
// 请求头携带 Token
// Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// 中间件验证
async function authMiddleware(ctx, next) {
  const token = ctx.headers.authorization?.split(' ')[1]
  
  if (!token) {
    ctx.status = 401
    ctx.body = { code: 401, message: 'Unauthorized' }
    return
  }

  try {
    const decoded = verifyToken(token)
    ctx.user = decoded
    await next()
  } catch {
    ctx.status = 401
    ctx.body = { code: 401, message: 'Invalid token' }
  }
}
```

### 权限控制

```typescript
function requirePermission(permission) {
  return async (ctx, next) => {
    const user = ctx.user
    
    if (!user || !user.permissions.includes(permission)) {
      ctx.status = 403
      ctx.body = { code: 403, message: 'Forbidden' }
      return
    }
    
    await next()
  }
}

// 使用
router.delete('/users/:id', requirePermission('user:delete'), deleteUser)
```

## 版本控制

```typescript
// URL 版本控制（推荐）
GET /api/v1/users
GET /api/v2/users

// 请求头版本控制
// Accept: application/vnd.example.v1+json

// 路由配置
const v1Router = new Router()
const v2Router = new Router()

v1Router.get('/users', v1UserController.getUsers)
v2Router.get('/users', v2UserController.getUsers)

app.use('/api/v1', v1Router)
app.use('/api/v2', v2Router)
```

## 缓存策略

### HTTP 缓存头

```typescript
// 设置缓存
ctx.set({
  'Cache-Control': 'max-age=3600',  // 缓存1小时
  'ETag': generateETag(data),
  'Last-Modified': new Date().toUTCString()
})

// 条件请求处理
async function handleCache(ctx, next) {
  const ifNoneMatch = ctx.headers['if-none-match']
  const etag = generateETag(currentData)
  
  if (ifNoneMatch === etag) {
    ctx.status = 304
    return
  }
  
  ctx.set('ETag', etag)
  await next()
}
```

## 日志与监控

### 请求日志

```typescript
async function requestLogger(ctx, next) {
  const start = Date.now()
  
  await next()
  
  const duration = Date.now() - start
  const log = {
    method: ctx.method,
    path: ctx.path,
    status: ctx.status,
    duration: `${duration}ms`,
    ip: ctx.ip,
    user: ctx.user?.id || 'anonymous'
  }
  
  console.log(JSON.stringify(log))
}
```

### API 文档

```typescript
// 使用 Swagger
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'

const config = new DocumentBuilder()
  .setTitle('API 文档')
  .setDescription('RESTful API 文档')
  .setVersion('1.0')
  .addBearerAuth()
  .build()

const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('api/docs', app, document)
```

## 总结

| 规范 | 说明 |
|------|------|
| 资源命名 | 复数名词、小写、连字符分隔 |
| HTTP 方法 | GET(查)、POST(创)、PUT(全更)、PATCH(部更)、DELETE(删) |
| 状态码 | 2xx成功、4xx客户端错误、5xx服务端错误 |
| 响应格式 | 统一 JSON 格式，包含 code、data、message |
| 认证授权 | JWT Token + 权限控制 |
| 版本控制 | URL 路径版本化 |
| 缓存 | HTTP 缓存头、ETag |