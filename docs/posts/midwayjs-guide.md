---
title: Midway.js 框架实战
date: 2024-11-10
---

# Midway.js 框架实战

## Midway.js 架构体系

```
┌─────────────────────────────────────────────────────────┐
│                    Midway.js 架构                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Controller │  │   Service    │  │   Repository│ │
│  │   控制器     │  │   服务层     │  │   数据访问层 │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    Router    │  │   Context    │  │   Database  │ │
│  │   路由配置   │  │   请求上下文 │  │    数据库   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 项目初始化

```bash
# 创建项目
npx degit midwayjs/midway-examples/packages/koa-starter .

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 目录结构

```
src/
├── controller/          # 控制器
│   └── user.controller.ts
├── service/             # 服务层
│   └── user.service.ts
├── entity/              # 实体类
│   └── user.entity.ts
├── repository/          # 数据访问层
│   └── user.repository.ts
├── config/              # 配置文件
│   ├── config.default.ts
│   └── config.prod.ts
├── middleware/          # 中间件
│   └── auth.middleware.ts
├── decorator/           # 自定义装饰器
│   └── auth.decorator.ts
└── bootstrap.ts         # 启动文件
```

## 控制器与路由

```typescript
// src/controller/user.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@midwayjs/core'

@Controller('/api/users')
export class UserController {
  constructor(private userService: UserService) {}

  // GET /api/users
  @Get('/')
  async getUsers(@Query() query: { page: number; size: number }) {
    return this.userService.getUsers(query.page, query.size)
  }

  // GET /api/users/:id
  @Get('/:id')
  async getUser(@Param('id') id: number) {
    return this.userService.getUser(id)
  }

  // POST /api/users
  @Post('/')
  async createUser(@Body() body: CreateUserDTO) {
    return this.userService.createUser(body)
  }

  // PUT /api/users/:id
  @Put('/:id')
  async updateUser(@Param('id') id: number, @Body() body: UpdateUserDTO) {
    return this.userService.updateUser(id, body)
  }

  // DELETE /api/users/:id
  @Delete('/:id')
  async deleteUser(@Param('id') id: number) {
    return this.userService.deleteUser(id)
  }
}
```

## 服务层

```typescript
// src/service/user.service.ts
import { Injectable } from '@midwayjs/core'
import { InjectEntityModel } from '@midwayjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../entity/user.entity'

@Injectable()
export class UserService {
  constructor(
    @InjectEntityModel(User)
    private userRepository: Repository<User>
  ) {}

  async getUsers(page: number, size: number) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * size,
      take: size,
      order: { createdAt: 'DESC' }
    })
    return { users, total, page, size }
  }

  async getUser(id: number) {
    return this.userRepository.findOneBy({ id })
  }

  async createUser(data: CreateUserDTO) {
    const user = this.userRepository.create(data)
    return this.userRepository.save(user)
  }

  async updateUser(id: number, data: UpdateUserDTO) {
    await this.userRepository.update(id, data)
    return this.getUser(id)
  }

  async deleteUser(id: number) {
    await this.userRepository.delete(id)
    return { success: true }
  }
}
```

## 实体定义

```typescript
// src/entity/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true, length: 50 })
  username: string

  @Column({ length: 255 })
  password: string

  @Column({ length: 100 })
  email: string

  @Column({ default: true })
  active: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
```

## 中间件开发

```typescript
// src/middleware/auth.middleware.ts
import { Middleware, IMiddleware } from '@midwayjs/core'
import { Context } from '@midwayjs/koa'

@Middleware()
export class AuthMiddleware implements IMiddleware<Context> {
  resolve() {
    return async (ctx: Context, next) => {
      const token = ctx.headers['authorization']?.split(' ')[1]
      
      if (!token) {
        ctx.status = 401
        ctx.body = { error: 'Unauthorized' }
        return
      }

      try {
        const decoded = await this.verifyToken(token)
        ctx.user = decoded
        await next()
      } catch {
        ctx.status = 401
        ctx.body = { error: 'Invalid token' }
      }
    }
  }

  async verifyToken(token: string) {
    // 验证 JWT token
    return { userId: 1, username: 'admin' }
  }
}
```

## 自定义装饰器

```typescript
// src/decorator/auth.decorator.ts
import { createParamDecorator } from '@midwayjs/core'
import { Context } from '@midwayjs/koa'

export const CurrentUser = createParamDecorator(async (ctx: Context) => {
  return ctx.user
})

// 使用
@Get('/profile')
async getProfile(@CurrentUser() user: User) {
  return user
}
```

## 配置管理

```typescript
// src/config/config.default.ts
import { MidwayConfig } from '@midwayjs/core'

export default {
  // 服务端口
  port: 7001,

  // TypeORM 配置
  typeorm: {
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'midway',
    entities: ['dist/**/*.entity{.ts,.js}'],
    synchronize: true,
    logging: false
  },

  // Redis 配置
  redis: {
    client: {
      port: parseInt(process.env.REDIS_PORT || '6379'),
      host: process.env.REDIS_HOST || 'localhost',
      password: process.env.REDIS_PASSWORD || ''
    }
  }
} as MidwayConfig
```

## 依赖注入

```typescript
// src/service/order.service.ts
import { Injectable } from '@midwayjs/core'
import { RedisService } from '@midwayjs/redis'

@Injectable()
export class OrderService {
  constructor(
    private redisService: RedisService,
    private userService: UserService
  ) {}

  async getOrder(id: number) {
    const cacheKey = `order:${id}`
    const cached = await this.redisService.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const order = await this.orderRepository.findOneBy({ id })
    
    if (order) {
      await this.redisService.set(cacheKey, JSON.stringify(order), 'EX', 3600)
    }

    return order
  }
}
```

## 测试

```typescript
// test/controller/user.controller.test.ts
import { createApp, close } from '@midwayjs/mock'
import { Framework } from '@midwayjs/koa'

describe('UserController', () => {
  let app: Application

  beforeAll(async () => {
    app = await createApp<Framework>()
  })

  afterAll(async () => {
    await close(app)
  })

  it('should get users', async () => {
    const result = await app
      .getHttpServer()
      .get('/api/users')
      .query({ page: 1, size: 10 })
    
    expect(result.status).toBe(200)
    expect(result.body).toHaveProperty('users')
  })
})
```

## 总结

| 特性 | 说明 |
|------|------|
| 依赖注入 | 基于 IoC 容器的依赖管理 |
| 装饰器 | 声明式路由、中间件、参数注入 |
| 配置管理 | 多环境配置、环境变量支持 |
| 数据库 | TypeORM 集成、实体管理 |
| 缓存 | Redis 集成、缓存策略 |
| 测试 | 内置测试框架、Mock 支持 |