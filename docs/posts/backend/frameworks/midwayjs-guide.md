---
title: Midway 微服务架构实战
date: 2024-11-10
---

# Midway 微服务架构实战

## 微服务架构概述

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         微服务架构体系                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     │
│   │  网关层   │     │ 服务发现  │     │ 配置中心  │     │ 消息队列  │     │
│   │ Gateway  │────▶│ Consul   │     │ Nacos    │     │ RabbitMQ │     │
│   └──────────┘     └──────────┘     └──────────┘     └──────────┘     │
│         │                                     │              │         │
│         └───────────────┬─────────────────────┴──────────────┘         │
│                         │                                                  │
│         ┌───────────────┼───────────────┬───────────────┐               │
│         ▼               ▼               ▼               ▼               │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐      │
│   │ 用户服务  │     │ 订单服务  │     │ 商品服务  │     │ 支付服务  │      │
│   │  :7001   │     │  :7002   │     │  :7003   │     │  :7004   │      │
│   └──────────┘     └──────────┘     └──────────┘     └──────────┘      │
│         │               │               │               │              │
│         └───────────────┴───────────────┴───────────────┘              │
│                         │                                                  │
│                    ┌──────────┐                                         │
│                    │ 数据库群   │                                         │
│                    │ MySQL    │                                         │
│                    │ MongoDB  │                                         │
│                    │ Redis    │                                         │
│                    └──────────┘                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 项目结构设计

```
├── midway-microservices/
│   ├── gateway/                    # API 网关服务
│   │   ├── src/
│   │   │   ├── controller/
│   │   │   ├── middleware/
│   │   │   ├── filter/
│   │   │   └── config/
│   │   ├── package.json
│   │   └── bootstrap.js
│   │
│   ├── user-service/               # 用户服务
│   │   ├── src/
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── entity/
│   │   │   └── config/
│   │   ├── package.json
│   │   └── bootstrap.js
│   │
│   ├── order-service/              # 订单服务
│   │   ├── src/
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── entity/
│   │   │   └── config/
│   │   ├── package.json
│   │   └── bootstrap.js
│   │
│   ├── common/                     # 公共模块
│   │   ├── src/
│   │   │   ├── constants/
│   │   │   ├── errors/
│   │   │   └── utils/
│   │   └── package.json
│   │
│   └── docker-compose.yml          # 容器编排
```

## 网关服务实现

```typescript
// gateway/src/configuration.ts
import { Configuration, ILifeCycle } from '@midwayjs/core'
import { MidwayWebMiddlewareService } from '@midwayjs/web'
import { IMiddleware } from '@midwayjs/koa'
import { RouterMiddleware } from '@midwayjs/koa-router'
import * as consul from '@midwayjs/consul'

@Configuration({
  imports: [consul],
  globalMiddleware: ['traceMiddleware', 'authMiddleware']
})
export class MainConfiguration implements ILifeCycle {
  async onReady() {
    // 注册服务到 Consul
    await this.registerService()
  }

  async registerService() {
    const consulClient = await consul.getConfig('consul')
    await consulClient.agent.service.register({
      name: 'api-gateway',
      address: '192.168.1.100',
      port: 7000,
      check: {
        http: 'http://192.168.1.100:7000/health',
        interval: '10s',
        timeout: '5s'
      }
    })
  }
}
```

```typescript
// gateway/src/middleware/trace.middleware.ts
import { Middleware, IMiddleware } from '@midwayjs/core'
import { Context } from '@midwayjs/koa'

@Middleware()
export class TraceMiddleware implements IMiddleware<Context> {
  resolve() {
    return async (ctx: Context, next) => {
      const traceId = ctx.headers['x-trace-id'] || this.generateTraceId()
      ctx.traceId = traceId
      ctx.set('x-trace-id', traceId)
      ctx.set('x-response-time', Date.now().toString())
      await next()
    }
  }

  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
```

```typescript
// gateway/src/middleware/auth.middleware.ts
import { Middleware, IMiddleware } from '@midwayjs/core'
import { Context } from '@midwayjs/koa'
import * as jwt from 'jsonwebtoken'

@Middleware()
export class AuthMiddleware implements IMiddleware<Context> {
  resolve() {
    return async (ctx: Context, next) => {
      const token = ctx.headers['authorization']?.split(' ')[1]

      if (!token) {
        ctx.status = 401
        ctx.body = { code: 401, message: 'Unauthorized' }
        return
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        ctx.user = decoded
        await next()
      } catch (err) {
        ctx.status = 401
        ctx.body = { code: 401, message: 'Invalid token' }
      }
    }
  }
}
```

```typescript
// gateway/src/filter/rpc.filter.ts
import { Catch, ILogger } from '@midwayjs/core'
import { Context } from '@midwayjs/koa'

@Catch()
export class RpcFilter {
  logger: ILogger

  catch(err: Error, ctx: Context) {
    this.logger = ctx.logger

    // 记录错误日志
    this.logger.error(`RPC Error: ${err.message}`, {
      traceId: ctx.traceId,
      path: ctx.path,
      stack: err.stack
    })

    // 熔断器触发
    if (err.message.includes('ECONNREFUSED') || err.message.includes('timeout')) {
      return {
        code: 503,
        message: 'Service temporarily unavailable'
      }
    }

    return {
      code: 500,
      message: 'Internal server error'
    }
  }
}
```

## 服务注册与发现

```typescript
// user-service/src/configuration.ts
import { Configuration, ILifeCycle } from '@midwayjs/core'
import * as consul from '@midwayjs/consul'
import { ConsulService } from '@midwayjs/consul'

@Configuration({
  imports: [consul]
})
export class UserServiceConfiguration implements ILifeCycle {
  async onReady(container) {
    // 获取 Consul 服务
    const consulService = await container.getAsync(ConsulService)

    // 注册当前服务
    await this.registerService(consulService)

    // 订阅服务变化
    await this.watchServices(consulService)
  }

  private async registerService(consulService: ConsulService) {
    await consulService.register({
      name: 'user-service',
      address: process.env.SERVICE_HOST || '192.168.1.101',
      port: parseInt(process.env.SERVICE_PORT || '7001'),
      tags: ['v1', 'stable'],
      meta: {
        version: '1.0.0',
        weight: '100'
      },
      check: {
        http: `http://${process.env.SERVICE_HOST}:${process.env.SERVICE_PORT}/health`,
        interval: '10s',
        timeout: '5s',
        deregister_critical_service_after: '30s'
      }
    })

    console.log('User service registered to Consul')
  }

  private async watchServices(consulService: ConsulService) {
    // 监听订单服务变化
    await consulService.watch({
      service: 'order-service',
      callback: (services) => {
        console.log('Order service instances:', services)
        // 更新本地服务实例缓存
        this.updateServiceCache('order-service', services)
      }
    })
  }

  private updateServiceCache(serviceName: string, instances: any[]) {
    // 更新本地负载均衡器实例列表
    console.log(`Updated ${serviceName} cache with ${instances.length} instances`)
  }
}
```

```typescript
// common/src/utils/loadbalancer.ts
import { Injectable } from '@midwayjs/core'

interface ServiceInstance {
  id: string
  address: string
  port: number
  weight: number
  healthy: boolean
}

@Injectable()
export class LoadBalancer {
  private instances: Map<string, ServiceInstance[]> = new Map()
  private currentIndex: Map<string, number> = new Map()

  // 添加服务实例
  addInstances(serviceName: string, instances: ServiceInstance[]) {
    this.instances.set(serviceName, instances)
    this.currentIndex.set(serviceName, 0)
  }

  // 轮询负载均衡
  select(serviceName: string): ServiceInstance | null {
    const instances = this.instances.get(serviceName)
    if (!instances || instances.length === 0) {
      return null
    }

    const healthyInstances = instances.filter(i => i.healthy)
    if (healthyInstances.length === 0) {
      return null
    }

    const index = this.currentIndex.get(serviceName) || 0
    const selected = healthyInstances[index % healthyInstances.length]

    // 更新索引
    this.currentIndex.set(serviceName, (index + 1) % healthyInstances.length)

    return selected
  }

  // 加权随机负载均衡
  weightedRandom(serviceName: string): ServiceInstance | null {
    const instances = this.instances.get(serviceName)
    if (!instances || instances.length === 0) {
      return null
    }

    const healthyInstances = instances.filter(i => i.healthy)
    if (healthyInstances.length === 0) {
      return null
    }

    const totalWeight = healthyInstances.reduce((sum, i) => sum + i.weight, 0)
    let random = Math.random() * totalWeight

    for (const instance of healthyInstances) {
      random -= instance.weight
      if (random <= 0) {
        return instance
      }
    }

    return healthyInstances[0]
  }
}
```

## 分布式配置中心

```typescript
// order-service/src/config/config.default.ts
import { MidwayConfig } from '@midwayjs/core'

export default {
  // 使用 Nacos 配置中心
  nacos: {
    serverHost: process.env.NACOS_HOST || '192.168.1.200',
    serverPort: process.env.NACOS_PORT || '8848',
    namespace: 'development',
    group: 'microservices',
    dataId: 'order-service-config'
  },

  // 本地配置会与远程配置合并
  port: 7002,

  // 数据库配置（可被远程配置覆盖）
  typeorm: {
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'orders'
  },

  // Redis 配置
  redis: {
    client: {
      port: parseInt(process.env.REDIS_PORT || '6379'),
      host: process.env.REDIS_HOST || 'localhost'
    }
  }
} as MidwayConfig
```

```typescript
// common/src/config/config.loader.ts
import { ILifeCycle, MidwayConfigService } from '@midwayjs/core'
import * as nacos from '@midwayjs/nacos'

export class ConfigLoader implements ILifeCycle {
  async onReady(container) {
    const configService = await container.getAsync(MidwayConfigService)
    const nacosConfig = await container.getAsync(nacos.NacosConfigService)

    // 监听配置变化
    await nacosConfig.subscribe({
      dataId: 'order-service-config',
      group: 'microservices',
      callback: (config) => {
        console.log('Remote config changed:', config)
        // 动态更新配置
        configService.updateObject(config)
      }
    })
  }
}
```

## 服务间通信

### HTTP 客户端调用

```typescript
// user-service/src/service/order.service.ts
import { Injectable, HTTPController, HTTPMethod, HTTPGet } from '@midwayjs/core'
import { HttpService } from '@midwayjs/axios'

@Injectable()
export class OrderService {
  constructor(private httpService: HttpService) {}

  async getUserOrders(userId: number) {
    try {
      // 直接 HTTP 调用（不推荐跨服务直接调用）
      const response = await this.httpService.get(
        'http://order-service:7002/api/orders',
        { params: { userId } }
      )
      return response.data
    } catch (error) {
      console.error('Failed to get orders:', error)
      throw error
    }
  }
}
```

### RPC 远程调用（推荐）

```typescript
// common/src/rpc/client.ts
import { Injectable, ILogger } from '@midwayjs/core'
import { GrpcClient, GrpcCallType } from '@midwayjs/grpc'
import * as proto from './proto/user.proto'

interface UserServiceClient {
  GetUser(request: { id: number }): Promise<User>
  GetUsers(request: { page: number; size: number }): Promise<UserList>
  CreateUser(request: CreateUserDTO): Promise<User>
}

@Injectable()
export class UserRPCClient {
  @GrpcClient({
    package: 'user',
    protoPath: './proto/user.proto',
    url: 'consul://user-service?wait=30s'
  })
  userService: UserServiceClient

  logger: ILogger

  async getUserById(id: number): Promise<User> {
    try {
      const response = await this.userService.GetUser({ id })
      return response
    } catch (error) {
      this.logger.error('Failed to get user via RPC:', error)
      throw error
    }
  }
}
```

```typescript
// user-service/src/controller/user.controller.ts
import { Controller, Inject, GrpcMethod, Provide } from '@midwayjs/core'
import { Context } from '@midwayjs/koa'

// Proto 定义
// syntax = "proto3";
// package user;
//
// service UserService {
//   rpc GetUser(GetUserRequest) returns (UserResponse);
//   rpc GetUsers(GetUsersRequest) returns (UsersResponse);
//   rpc CreateUser(CreateUserRequest) returns (UserResponse);
// }

@Controller('/user')
export class UserController {

  @GrpcMethod('UserService', 'GetUser')
  async getUser(data: { id: number }, ctx: Context): Promise<User> {
    const user = await this.userService.getUser(data.id)
    return {
      id: user.id,
      username: user.username,
      email: user.email
    }
  }

  @GrpcMethod('UserService', 'GetUsers')
  async getUsers(data: { page: number; size: number }): Promise<UserList> {
    const result = await this.userService.getUsers(data.page, data.size)
    return {
      users: result.users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email
      })),
      total: result.total
    }
  }

  @GrpcMethod('UserService', 'CreateUser')
  async createUser(data: CreateUserDTO): Promise<User> {
    const user = await this.userService.createUser(data)
    return {
      id: user.id,
      username: user.username,
      email: user.email
    }
  }
}
```

### 消息队列通信（事件驱动）

```typescript
// user-service/src/event/user.event.ts
import { MidwayEventHandler, IEventHandler } from '@midwayjs/core'

// 用户创建事件
export class UserCreatedEvent {
  userId: number
  username: string
  email: string
  timestamp: Date

  constructor(data: { userId: number; username: string; email: string }) {
    this.userId = data.userId
    this.username = data.username
    this.email = data.email
    this.timestamp = new Date()
  }
}

// 用户服务发布事件
@Provide()
export class UserEventPublisher {
  async publishUserCreated(data: { userId: number; username: string; email: string }) {
    const event = new UserCreatedEvent(data)
    // 发布到消息队列
    await this.eventPublisher.emit('user.created', event)
    console.log('Published user.created event:', event)
  }
}

// 订单服务订阅事件
@Provide()
export class OrderEventHandler implements IEventHandler {
  constructor(private userRPCClient: UserRPCClient) {}

  get eventKey(): string {
    return 'user.created'
  }

  async handle(event: UserCreatedEvent) {
    console.log('Received user.created event:', event)

    // 初始化用户订单统计
    await this.initializeUserOrderStats(event.userId)
  }

  private async initializeUserOrderStats(userId: number) {
    // 创建用户初始订单统计记录
    console.log(`Initialize order stats for user ${userId}`)
  }
}
```

```typescript
// order-service/src/configuration.ts
import { Configuration } from '@midwayjs/core'
import { EventDispatcher } from '@midwayjs/event'

@Configuration({
  imports: [EventDispatcher]
})
export class OrderServiceConfiguration {}
```

```typescript
// rabbitmq 配置
export default {
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchanges: [
      { name: 'user.events', type: 'topic' }
    ],
    queues: [
      { name: 'order.user.created', exchange: 'user.events', routingKey: 'user.created' }
    ]
  }
}
```

## 熔断器与限流

```typescript
// common/src/circuitbreaker.ts
import { Injectable, ILogger } from '@midwayjs/core'

enum CircuitState {
  CLOSED = 'CLOSED',      // 关闭状态，正常调用
  OPEN = 'OPEN',          // 打开状态，拒绝调用
  HALF_OPEN = 'HALF_OPEN' // 半开状态，尝试恢复
}

interface CircuitBreakerOptions {
  failureThreshold: number  // 失败次数阈值
  resetTimeout: number      // 重置超时时间(ms)
  halfOpenMaxCalls: number  // 半开状态最大尝试次数
}

@Injectable()
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime: number | null = null
  private halfOpenCalls = 0

  constructor(
    private name: string,
    private options: CircuitBreakerOptions
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN
        this.halfOpenCalls = 0
        console.log(`CircuitBreaker [${this.name}] state: CLOSED -> HALF_OPEN`)
      } else {
        throw new Error(`CircuitBreaker [${this.name}] is OPEN`)
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failureCount = 0
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++
      if (this.halfOpenCalls >= this.options.halfOpenMaxCalls) {
        this.state = CircuitState.CLOSED
        console.log(`CircuitBreaker [${this.name}] state: HALF_OPEN -> CLOSED`)
      }
    }
  }

  private onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN
      console.log(`CircuitBreaker [${this.name}] state: CLOSED -> OPEN`)
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true
    return Date.now() - this.lastFailureTime >= this.options.resetTimeout
  }
}
```

```typescript
// 熔断器使用示例
@Injectable()
export class OrderService {
  private userCircuitBreaker: CircuitBreaker
  private httpService: HttpService

  constructor() {
    this.userCircuitBreaker = new CircuitBreaker('user-service', {
      failureThreshold: 5,
      resetTimeout: 30000,
      halfOpenMaxCalls: 3
    })
  }

  async getUserWithCircuitBreaker(userId: number) {
    return this.userCircuitBreaker.execute(async () => {
      const response = await this.httpService.get(
        `http://user-service:7001/api/users/${userId}`
      )
      return response.data
    })
  }
}
```

## 服务健康检查

```typescript
// user-service/src/controller/health.controller.ts
import { Controller, Get } from '@midwayjs/core'
import { Inject, Query } from '@midwayjs/core'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  memory: NodeJS.MemoryUsage
  services: {
    [key: string]: {
      status: 'up' | 'down'
      latency?: number
    }
  }
}

@Controller('/health')
export class HealthController {

  private startTime = Date.now()

  @Get('/')
  async check(@Query('detailed') detailed: boolean): Promise<HealthStatus> {
    const status: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      memory: process.memoryUsage(),
      services: {}
    }

    if (detailed) {
      // 检查依赖服务
      status.services = await this.checkDependencies()
    }

    // 根据依赖服务状态调整整体状态
    const dependencyStatuses = Object.values(status.services)
    if (dependencyStatuses.some(s => s.status === 'down')) {
      status.status = 'degraded'
    }

    return status
  }

  @Get('/live')
  async liveness(): Promise<{ status: string }> {
    return { status: 'OK' }
  }

  @Get('/ready')
  async readiness(): Promise<{ status: string }> {
    const isReady = await this.checkReadiness()
    if (!isReady) {
      throw new Error('Service not ready')
    }
    return { status: 'OK' }
  }

  private async checkDependencies(): Promise<Record<string, any>> {
    const results = {}

    // 检查 MySQL
    try {
      const start = Date.now()
      await this.typeormDataSource.query('SELECT 1')
      results['mysql'] = { status: 'up', latency: Date.now() - start }
    } catch {
      results['mysql'] = { status: 'down' }
    }

    // 检查 Redis
    try {
      const start = Date.now()
      await this.redisClient.ping()
      results['redis'] = { status: 'up', latency: Date.now() - start }
    } catch {
      results['redis'] = { status: 'down' }
    }

    return results
  }

  private async checkReadiness(): Promise<boolean> {
    try {
      await this.typeormDataSource.query('SELECT 1')
      return true
    } catch {
      return false
    }
  }
}
```

## Docker 容器化部署

```dockerfile
# user-service/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# 生产镜像
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN apk add --no-cache dumb-init
ENTRYPOINT ["dumb-init", "--"]

EXPOSE 7001

CMD ["node", "bootstrap.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  consul:
    image: consul:1.15
    ports:
      - "8500:8500"
    networks:
      - microservices

  nacos:
    image: nacos/nacos-server:v2.2.3
    environment:
      MODE: standalone
    ports:
      - "8848:8848"
      - "9848:9848"
    networks:
      - microservices

  gateway:
    build: ./gateway
    ports:
      - "7000:7000"
    depends_on:
      - consul
    networks:
      - microservices

  user-service:
    build: ./user-service
    environment:
      SERVICE_HOST: user-service
      SERVICE_PORT: 7001
      NACOS_HOST: nacos
      CONSUL_HOST: consul
    depends_on:
      - consul
      - nacos
    networks:
      - microservices

  order-service:
    build: ./order-service
    environment:
      SERVICE_HOST: order-service
      SERVICE_PORT: 7002
      NACOS_HOST: nacos
      CONSUL_HOST: consul
    depends_on:
      - consul
      - nacos
      - user-service
    networks:
      - microservices

networks:
  microservices:
    driver: bridge
```

## 总结

| 微服务组件 | 技术方案 | 说明 |
|-----------|---------|------|
| 服务注册与发现 | Consul / Nacos | 自动注册、心跳检测 |
| API 网关 | Midway Gateway | 统一入口、路由、认证 |
| 配置中心 | Nacos | 动态配置、热更新 |
| 服务通信 | gRPC / HTTP | 高性能 RPC 调用 |
| 消息队列 | RabbitMQ | 事件驱动、异步解耦 |
| 熔断器 | Sentinel | 服务保护、故障隔离 |
| 负载均衡 | Ribbon / LB | 客户端负载均衡 |
| 容器编排 | Docker Compose / K8s | 服务部署与扩缩容 |
