---
title: Redis 缓存策略与实战
date: 2024-11-20
---

# Redis 缓存策略与实战

## Redis 架构

```
┌─────────────────────────────────────────────────────────┐
│                     Redis 架构                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Cache      │  │   Session    │  │   Queue      │ │
│  │   缓存层     │  │   会话存储   │  │   消息队列   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   主从复制   │  │   集群模式   │  │   持久化    │ │
│  │   Master-Slave│ │   Cluster   │  │   RDB/AOF   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 基础操作

### 字符串操作

```typescript
import { RedisService } from '@midwayjs/redis'

async function stringOperations(redis: RedisService) {
  // 设置值
  await redis.set('user:1:name', 'John')
  
  // 设置值并设置过期时间
  await redis.set('token:user1', 'abc123', 'EX', 3600)
  
  // 获取值
  const name = await redis.get('user:1:name')
  
  // 自增
  await redis.incr('counter:pageview')
  
  // 自增指定值
  await redis.incrBy('counter:score', 10)
  
  // 追加
  await redis.append('user:1:bio', ' loves coding')
  
  // 获取长度
  const len = await redis.strlen('user:1:name')
}
```

### Hash 操作

```typescript
async function hashOperations(redis: RedisService) {
  // 设置 hash 字段
  await redis.hset('user:1', 'name', 'John')
  await redis.hset('user:1', 'age', '25')
  await redis.hset('user:1', 'email', 'john@example.com')
  
  // 获取 hash 字段
  const name = await redis.hget('user:1', 'name')
  
  // 获取所有字段和值
  const user = await redis.hgetall('user:1')
  
  // 获取所有字段名
  const fields = await redis.hkeys('user:1')
  
  // 获取所有值
  const values = await redis.hvals('user:1')
  
  // 删除字段
  await redis.hdel('user:1', 'email')
  
  // 检查字段是否存在
  const exists = await redis.hexists('user:1', 'name')
}
```

### List 操作

```typescript
async function listOperations(redis: RedisService) {
  // 从左侧插入
  await redis.lpush('queue:tasks', 'task1')
  await redis.lpush('queue:tasks', 'task2')
  
  // 从右侧插入
  await redis.rpush('queue:tasks', 'task3')
  
  // 从左侧弹出
  const task = await redis.lpop('queue:tasks')
  
  // 从右侧弹出
  const lastTask = await redis.rpop('queue:tasks')
  
  // 获取列表长度
  const len = await redis.llen('queue:tasks')
  
  // 获取范围内的元素
  const tasks = await redis.lrange('queue:tasks', 0, -1)
  
  // 设置指定位置的元素
  await redis.lset('queue:tasks', 0, 'new-task')
}
```

### Set 操作

```typescript
async function setOperations(redis: RedisService) {
  // 添加元素
  await redis.sadd('set:users', 'user1', 'user2', 'user3')
  
  // 获取所有元素
  const users = await redis.smembers('set:users')
  
  // 检查元素是否存在
  const exists = await redis.sismember('set:users', 'user1')
  
  // 获取集合大小
  const size = await redis.scard('set:users')
  
  // 移除元素
  await redis.srem('set:users', 'user2')
  
  // 交集
  const inter = await redis.sinter('set:a', 'set:b')
  
  // 并集
  const union = await redis.sunion('set:a', 'set:b')
  
  // 差集
  const diff = await redis.sdiff('set:a', 'set:b')
}
```

### Sorted Set 操作

```typescript
async function sortedSetOperations(redis: RedisService) {
  // 添加元素
  await redis.zadd('leaderboard', 100, 'user1')
  await redis.zadd('leaderboard', 200, 'user2')
  await redis.zadd('leaderboard', 150, 'user3')
  
  // 获取排名（从高到低）
  const rank = await redis.zrevrank('leaderboard', 'user2')
  
  // 获取分数
  const score = await redis.zscore('leaderboard', 'user1')
  
  // 获取范围内的元素（从高到低）
  const topUsers = await redis.zrevrange('leaderboard', 0, 9)
  
  // 获取范围内的元素及分数
  const topWithScores = await redis.zrevrangeWithScores('leaderboard', 0, 9)
  
  // 增加分数
  await redis.zincrby('leaderboard', 50, 'user1')
  
  // 获取分数范围内的元素
  const range = await redis.zrangebyscore('leaderboard', 100, 200)
}
```

## 缓存策略

### Cache-Aside 模式

```typescript
async function getUserById(redis: RedisService, userId: number) {
  const cacheKey = `user:${userId}`
  
  // 先从缓存获取
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }
  
  // 缓存不存在，从数据库获取
  const user = await db.getUser(userId)
  
  // 写入缓存
  await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600)
  
  return user
}

async function updateUser(redis: RedisService, userId: number, data: User) {
  // 更新数据库
  await db.updateUser(userId, data)
  
  // 失效缓存
  await redis.del(`user:${userId}`)
}
```

### 缓存穿透解决方案

```typescript
// 使用布隆过滤器
class BloomFilter {
  constructor(private redis: RedisService, private key: string) {}
  
  async add(value: string) {
    const hash = this.hash(value)
    await this.redis.setbit(this.key, hash, 1)
  }
  
  async contains(value: string): Promise<boolean> {
    const hash = this.hash(value)
    return (await this.redis.getbit(this.key, hash)) === 1
  }
  
  private hash(value: string): number {
    // 简单的哈希函数
    let hash = 0
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i)
    }
    return Math.abs(hash) % 1000000
  }
}

// 使用示例
const bloomFilter = new BloomFilter(redis, 'bloom:users')

async function getUser(userId: number) {
  // 先检查布隆过滤器
  if (!(await bloomFilter.contains(userId.toString()))) {
    return null // 一定不存在
  }
  
  // 继续查询缓存和数据库
  const cacheKey = `user:${userId}`
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)
  
  const user = await db.getUser(userId)
  if (user) {
    await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600)
  }
  
  return user
}
```

### 缓存击穿解决方案

```typescript
// 使用互斥锁
async function getUserWithLock(redis: RedisService, userId: number) {
  const cacheKey = `user:${userId}`
  const lockKey = `lock:user:${userId}`
  
  // 先尝试获取缓存
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)
  
  // 获取锁
  const lock = await redis.set(lockKey, '1', 'NX', 'EX', 5)
  
  if (!lock) {
    // 锁被占用，等待后重试
    await new Promise(resolve => setTimeout(resolve, 100))
    return getUserWithLock(redis, userId)
  }
  
  try {
    // 查询数据库
    const user = await db.getUser(userId)
    if (user) {
      await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600)
    }
    return user
  } finally {
    // 释放锁
    await redis.del(lockKey)
  }
}
```

### 缓存雪崩解决方案

```typescript
// 随机过期时间
async function setCacheWithRandomTTL(key: string, value: string) {
  // 添加随机偏移，避免同时过期
  const baseTTL = 3600
  const randomOffset = Math.floor(Math.random() * 300)
  const ttl = baseTTL + randomOffset
  
  await redis.set(key, value, 'EX', ttl)
}

// 使用多级缓存
class MultiLevelCache {
  constructor(private redis: RedisService) {}
  
  async get(key: string) {
    // 先查本地缓存（如 Node.js 内存）
    const local = this.getLocal(key)
    if (local) return local
    
    // 再查 Redis
    const remote = await this.redis.get(key)
    if (remote) {
      this.setLocal(key, remote)
      return remote
    }
    
    return null
  }
  
  private getLocal(key: string) {
    // 本地缓存实现
  }
  
  private setLocal(key: string, value: string) {
    // 本地缓存实现
  }
}
```

## 分布式锁

```typescript
class DistributedLock {
  constructor(private redis: RedisService) {}
  
  async acquire(key: string, timeout: number = 30000): Promise<boolean> {
    const lockKey = `lock:${key}`
    const value = `${Date.now()}:${Math.random()}`
    
    // 使用 SET NX 获取锁
    const result = await this.redis.set(lockKey, value, 'NX', 'PX', timeout)
    
    return result === 'OK'
  }
  
  async release(key: string): Promise<void> {
    const lockKey = `lock:${key}`
    await this.redis.del(lockKey)
  }
  
  // 使用锁执行操作
  async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const acquired = await this.acquire(key)
    
    if (!acquired) {
      throw new Error('Failed to acquire lock')
    }
    
    try {
      return await fn()
    } finally {
      await this.release(key)
    }
  }
}

// 使用示例
const lock = new DistributedLock(redis)

async function processOrder(orderId: number) {
  return lock.withLock(`order:${orderId}`, async () => {
    // 处理订单逻辑
    const order = await db.getOrder(orderId)
    await db.updateOrder(orderId, { status: 'processing' })
    return order
  })
}
```

## 会话管理

```typescript
class SessionManager {
  private prefix = 'session:'
  private ttl = 86400 // 24小时
  
  constructor(private redis: RedisService) {}
  
  async create(sessionId: string, data: Record<string, any>): Promise<void> {
    const key = `${this.prefix}${sessionId}`
    await this.redis.set(key, JSON.stringify(data), 'EX', this.ttl)
  }
  
  async get(sessionId: string): Promise<Record<string, any> | null> {
    const key = `${this.prefix}${sessionId}`
    const data = await this.redis.get(key)
    return data ? JSON.parse(data) : null
  }
  
  async update(sessionId: string, data: Record<string, any>): Promise<void> {
    const key = `${this.prefix}${sessionId}`
    const existing = await this.get(sessionId)
    
    if (existing) {
      const merged = { ...existing, ...data }
      await this.redis.set(key, JSON.stringify(merged), 'EX', this.ttl)
    }
  }
  
  async destroy(sessionId: string): Promise<void> {
    const key = `${this.prefix}${sessionId}`
    await this.redis.del(key)
  }
  
  async refresh(sessionId: string): Promise<void> {
    const key = `${this.prefix}${sessionId}`
    await this.redis.expire(key, this.ttl)
  }
}
```

## 总结

| 功能 | 说明 |
|------|------|
| 数据结构 | 字符串、哈希、列表、集合、有序集合 |
| 缓存策略 | Cache-Aside、读写穿透、写回 |
| 问题解决 | 穿透（布隆过滤器）、击穿（互斥锁）、雪崩（随机TTL） |
| 分布式锁 | SET NX 实现 |
| 会话管理 | 缓存会话数据 |
| 持久化 | RDB 快照、AOF 日志 |