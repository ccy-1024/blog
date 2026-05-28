---
title: Redis 实战与原理
date: 2024-06-10
---

# Redis 实战与原理

## Redis 架构

```
┌─────────────────────────────────────────────────────────┐
│                      Redis 架构                        │
├─────────────────────────────────────────────────────────┤
│  客户端                                                 │
│     │                                                  │
│     ▼                                                  │
│  ┌──────────────┐                                      │
│  │   Master     │ ← 主节点（写操作）                    │
│  └──────┬───────┘                                      │
│         │                                              │
│         │ 复制                                          │
│         ▼                                              │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   Slave 1    │    │   Slave 2    │ ← 从节点（读操作） │
│  └──────────────┘    └──────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

## 数据结构

### 字符串 (String)

```javascript
const redis = require('redis')
const client = redis.createClient()

// 设置值
await client.set('name', '芝麻粒')
await client.set('age', '25', 'EX', 60) // 60秒过期

// 获取值
const name = await client.get('name')
console.log(name) // '芝麻粒'

// 原子操作
await client.incr('counter') // 自增
await client.decr('counter') // 自减
await client.append('name', '博客') // 追加
```

### 哈希 (Hash)

```javascript
// 设置哈希字段
await client.hset('user:1', {
  name: '芝麻粒',
  age: '25',
  email: 'test@example.com'
})

// 获取哈希字段
const user = await client.hgetall('user:1')
console.log(user) // { name: '芝麻粒', age: '25', email: 'test@example.com' }

// 获取单个字段
const userName = await client.hget('user:1', 'name')

// 删除字段
await client.hdel('user:1', 'email')
```

### 列表 (List)

```javascript
// 推入元素
await client.lpush('queue', 'task1')
await client.rpush('queue', 'task2')

// 弹出元素
const task = await client.lpop('queue') // 'task1'
const lastTask = await client.rpop('queue') // 'task2'

// 获取列表长度
const length = await client.llen('queue')

// 获取范围元素
const items = await client.lrange('queue', 0, -1)
```

### 集合 (Set)

```javascript
// 添加元素
await client.sadd('tags', 'vue', 'node', 'javascript')

// 获取所有元素
const tags = await client.smembers('tags')

// 判断元素是否存在
const exists = await client.sismember('tags', 'vue')

// 集合运算
await client.sadd('tags2', 'react', 'node')
const intersection = await client.sinter('tags', 'tags2') // ['node']
const union = await client.sunion('tags', 'tags2') // ['vue', 'node', 'javascript', 'react']
```

### 有序集合 (Sorted Set)

```javascript
// 添加元素（带分数）
await client.zadd('scores', {
  'Alice': 95,
  'Bob': 88,
  'Charlie': 92
})

// 获取排名
const rank = await client.zrank('scores', 'Bob') // 1（从0开始）

// 获取分数
const score = await client.zscore('scores', 'Alice') // 95

// 按分数范围获取
const topScores = await client.zrangeByScore('scores', 90, 100)

// 获取数量
const count = await client.zcount('scores', 80, 100)
```

## 持久化机制

### RDB (快照)

```javascript
// 配置
// save 900 1    // 900秒内至少1个key变化
// save 300 10   // 300秒内至少10个key变化
// save 60 10000 // 60秒内至少10000个key变化

// 手动触发
await client.save()      // 同步保存
await client.bgsave()    // 异步保存
```

### AOF (追加日志)

```javascript
// 配置
// appendonly yes           // 开启AOF
// appendfsync always       // 每次写入都同步
// appendfsync everysec     // 每秒同步（推荐）
// appendfsync no           // 由操作系统决定

// AOF重写
await client.bgrewriteaof() // 异步重写AOF文件
```

## 缓存策略

### 缓存穿透

```javascript
// 问题：查询不存在的数据，每次都穿透到数据库

// 解决方案1：缓存空值
async function getData(id) {
  const cacheKey = `data:${id}`
  let data = await client.get(cacheKey)
  
  if (data !== null) {
    if (data === 'NULL') return null // 空值标记
    return JSON.parse(data)
  }
  
  data = await db.query(id)
  
  if (data) {
    await client.set(cacheKey, JSON.stringify(data), 'EX', 3600)
  } else {
    await client.set(cacheKey, 'NULL', 'EX', 60) // 缓存空值60秒
  }
  
  return data
}

// 解决方案2：布隆过滤器
const { BloomFilter } = require('bloom-filters')
const filter = new BloomFilter(10000, 0.01)

// 初始化时将所有ID加入过滤器
const ids = await db.getAllIds()
ids.forEach(id => filter.add(id))

async function getData(id) {
  if (!filter.has(id)) return null // 快速判断不存在
  
  // 继续正常缓存逻辑
}
```

### 缓存击穿

```javascript
// 问题：热点key过期时，大量请求同时穿透到数据库

// 解决方案1：互斥锁
const mutex = require('redis-mutex')(client)

async function getData(id) {
  const cacheKey = `data:${id}`
  let data = await client.get(cacheKey)
  
  if (data) return JSON.parse(data)
  
  // 获取锁
  const lock = await mutex.lock(`lock:${id}`, 5000)
  
  try {
    // 再次检查缓存
    data = await client.get(cacheKey)
    if (data) return JSON.parse(data)
    
    // 从数据库获取
    data = await db.query(id)
    await client.set(cacheKey, JSON.stringify(data), 'EX', 3600)
    
    return data
  } finally {
    await lock.unlock()
  }
}

// 解决方案2：热点key永不过期，后台定时更新
```

### 缓存雪崩

```javascript
// 问题：大量key同时过期，导致数据库压力剧增

// 解决方案1：设置随机过期时间
async function setCache(key, value) {
  const ttl = 3600 + Math.random() * 3600 // 1-2小时随机
  await client.set(key, JSON.stringify(value), 'EX', ttl)
}

// 解决方案2：多级缓存（本地缓存 + Redis）
const localCache = new Map()

async function getData(id) {
  // 先查本地缓存
  if (localCache.has(id)) {
    return localCache.get(id)
  }
  
  // 再查Redis
  const cacheKey = `data:${id}`
  let data = await client.get(cacheKey)
  
  if (data) {
    data = JSON.parse(data)
    localCache.set(id, data)
    return data
  }
  
  // 查数据库
  data = await db.query(id)
  await client.set(cacheKey, JSON.stringify(data), 'EX', 3600)
  localCache.set(id, data)
  
  return data
}
```

## 集群部署

### 主从复制

```javascript
// 从节点配置
// replicaof <master-ip> <master-port>
// masterauth <password>

// 查看复制状态
await client.info('replication')
```

### 哨兵模式

```javascript
// sentinel.conf
// sentinel monitor mymaster 127.0.0.1 6379 2
// sentinel down-after-milliseconds mymaster 30000
// sentinel failover-timeout mymaster 180000
```

### 集群模式

```javascript
// 集群节点配置
const cluster = redis.createCluster({
  rootNodes: [
    { host: '127.0.0.1', port: 7000 },
    { host: '127.0.0.1', port: 7001 },
    { host: '127.0.0.1', port: 7002 }
  ]
})

await cluster.connect()
await cluster.set('key', 'value')
const value = await cluster.get('key')
```

## 性能优化

```javascript
// 管道操作
const pipeline = client.pipeline()
pipeline.set('key1', 'value1')
pipeline.set('key2', 'value2')
pipeline.get('key1')
const results = await pipeline.exec()

// 批量操作
await client.mset('key1', 'value1', 'key2', 'value2')
const values = await client.mget('key1', 'key2')

// 使用连接池
const client = redis.createClient({
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true
})
```

## 总结

| 数据结构 | 常用命令 | 适用场景 |
|----------|----------|----------|
| String | set, get, incr | 缓存、计数器 |
| Hash | hset, hget, hgetall | 对象存储 |
| List | lpush, rpop, lrange | 队列、栈 |
| Set | sadd, smembers, sinter | 去重、交集 |
| Sorted Set | zadd, zrank, zrange | 排行榜、计分 |
