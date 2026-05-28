---
title: Node.js 性能调优
date: 2024-12-05
---

# Node.js 性能调优

## 性能优化体系

```
┌─────────────────────────────────────────────────────────┐
│                 Node.js 性能优化                       │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   CPU 分析   │  │   内存分析   │  │   I/O 优化   │ │
│  │  Profiling   │  │  Memory      │  │  Async I/O   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   集群模式   │  │   缓存优化   │  │   代码优化   │ │
│  │   Cluster    │  │   Caching    │  │  Code Opt   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## CPU 分析

### 使用 Chrome DevTools

```bash
# 启动 Node.js 应用并开启调试
node --inspect=0.0.0.0:9229 dist/bootstrap.js

# 或使用 inspect-brk 在第一行断点
node --inspect-brk=0.0.0.0:9229 dist/bootstrap.js
```

### 使用 Node.js 内置工具

```bash
# 使用 --cpu-prof 生成 CPU 分析文件
node --cpu-prof index.js

# 使用 --cpu-prof-dir 指定输出目录
node --cpu-prof-dir=./profiles index.js

# 使用 --cpu-prof-interval 指定采样间隔（微秒）
node --cpu-prof-interval=1000 index.js
```

### 分析 CPU 快照

```javascript
// 使用 v8-profiler-node8 手动生成快照
const profiler = require('v8-profiler-node8')

// 开始 CPU 分析
profiler.startProfiling('my-profile')

// 执行需要分析的代码
runHeavyTask()

// 停止分析并获取结果
const profile = profiler.stopProfiling('my-profile')

// 保存到文件
require('fs').writeFileSync('cpu-profile.cpuprofile', JSON.stringify(profile))
```

## 内存分析

### 生成堆快照

```bash
# 使用 --heap-prof 生成堆快照
node --heap-prof index.js

# 使用 --heap-prof-dir 指定输出目录
node --heap-prof-dir=./profiles index.js

# 使用 --heap-prof-interval 指定采样间隔
node --heap-prof-interval=5000 index.js
```

### 手动内存监控

```javascript
// 内存监控工具
class MemoryMonitor {
  constructor() {
    this.start()
  }

  start() {
    setInterval(() => {
      const mem = process.memoryUsage()
      
      console.log(`Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`)
      console.log(`Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`)
      console.log(`External: ${(mem.external / 1024 / 1024).toFixed(2)} MB`)
      console.log('---')
    }, 5000)
  }
}

// 使用
new MemoryMonitor()
```

### 检测内存泄漏

```javascript
// 使用 weak-napi 检测内存泄漏
const weak = require('weak-napi')

class ResourceManager {
  constructor() {
    this.resources = new Map()
  }

  add(id, resource) {
    const weakRef = weak(resource, () => {
      console.log(`Resource ${id} was garbage collected`)
      this.resources.delete(id)
    })
    
    this.resources.set(id, weakRef)
  }

  get(id) {
    const ref = this.resources.get(id)
    return ref ? weak.get(ref) : null
  }
}
```

## 异步 I/O 优化

### 使用 Stream 处理大文件

```javascript
// 使用 Stream 读取大文件
const fs = require('fs')
const { pipeline } = require('stream/promises')
const zlib = require('zlib')

async function processLargeFile(inputPath, outputPath) {
  const gzip = zlib.createGzip()
  
  await pipeline(
    fs.createReadStream(inputPath),
    gzip,
    fs.createWriteStream(`${outputPath}.gz`)
  )
  
  console.log('File processed successfully')
}

// 使用 async iterator 处理流
async function* generateData() {
  for (let i = 0; i < 1000000; i++) {
    yield `Line ${i}\n`
  }
}

async function writeLargeFile(outputPath) {
  const writer = fs.createWriteStream(outputPath)
  
  for await (const chunk of generateData()) {
    if (!writer.write(chunk)) {
      await new Promise(resolve => writer.once('drain', resolve))
    }
  }
  
  writer.end()
}
```

### 批量数据库操作

```javascript
// 批量插入数据
async function batchInsert(items, batchSize = 1000) {
  const batches = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize))
  }
  
  for (const batch of batches) {
    await db.insertMany(batch)
  }
}

// 使用事务批量更新
async function batchUpdate(updates) {
  const queryRunner = dataSource.createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction()
  
  try {
    for (const update of updates) {
      await queryRunner.manager.update(
        User,
        { id: update.id },
        { ...update.data }
      )
    }
    
    await queryRunner.commitTransaction()
  } catch (error) {
    await queryRunner.rollbackTransaction()
    throw error
  } finally {
    await queryRunner.release()
  }
}
```

## 集群模式

### 使用 Cluster 模块

```javascript
const cluster = require('cluster')
const os = require('os')

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length
  
  console.log(`Primary ${process.pid} is running`)
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`)
    cluster.fork() // 自动重启
  })
} else {
  // 启动应用
  require('./app')
  console.log(`Worker ${process.pid} started`)
}
```

### 使用 PM2

```bash
# 安装 PM2
npm install pm2 -g

# 启动应用（使用所有 CPU 核心）
pm2 start app.js -i max

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 监控
pm2 monit

# 重启
pm2 restart all

# 停止
pm2 stop all

# 配置文件 ecosystem.config.js
module.exports = {
  apps: [{
    name: 'my-app',
    script: 'dist/bootstrap.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}

# 使用配置文件启动
pm2 start ecosystem.config.js
```

## 缓存优化

### 多级缓存策略

```javascript
class MultiLevelCache {
  constructor(private redis, private ttl = 3600) {}

  async get(key) {
    // 先查内存缓存
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key)
    }

    // 再查 Redis
    const cached = await this.redis.get(key)
    if (cached) {
      const data = JSON.parse(cached)
      this.memoryCache.set(key, data, this.ttl / 2) // 内存缓存时间更短
      return data
    }

    return null
  }

  async set(key, value) {
    // 设置内存缓存
    this.memoryCache.set(key, value, this.ttl / 2)
    
    // 设置 Redis 缓存
    await this.redis.set(key, JSON.stringify(value), 'EX', this.ttl)
  }

  async del(key) {
    this.memoryCache.delete(key)
    await this.redis.del(key)
  }
}
```

### 使用 LRU 缓存

```javascript
const LRU = require('lru-cache')

const options = {
  max: 1000, // 最大缓存数量
  ttl: 60 * 1000, // 过期时间（毫秒）
  allowStale: false,
  updateAgeOnGet: true
}

const cache = new LRU(options)

// 使用
cache.set('key', 'value')
const value = cache.get('key')
cache.delete('key')
```

## 代码优化

### 避免同步阻塞

```javascript
// ❌ 错误：同步阻塞
function processData(data) {
  const result = heavyComputation(data) // 阻塞事件循环
  return result
}

// ✅ 正确：使用 Worker 线程
const { Worker, isMainThread, parentPort } = require('worker_threads')

if (isMainThread) {
  const worker = new Worker(__filename)
  worker.postMessage(data)
  worker.on('message', (result) => {
    console.log('Result:', result)
  })
} else {
  parentPort.on('message', (data) => {
    const result = heavyComputation(data)
    parentPort.postMessage(result)
  })
}
```

### 使用高效的数据结构

```javascript
// ❌ 低效：数组查找
function findUser(users, id) {
  return users.find(user => user.id === id) // O(n)
}

// ✅ 高效：使用 Map
const userMap = new Map()

function buildUserMap(users) {
  users.forEach(user => {
    userMap.set(user.id, user)
  })
}

function findUserFast(id) {
  return userMap.get(id) // O(1)
}
```

### 避免内存泄漏

```javascript
// ❌ 内存泄漏：事件监听器未清理
class EventEmitter {
  constructor() {
    this.listeners = []
  }

  on(event, listener) {
    this.listeners.push(listener)
  }

  emit(event, data) {
    this.listeners.forEach(listener => listener(data))
  }
}

// ✅ 正确：提供清理方法
class EventEmitter {
  constructor() {
    this.listeners = new Map()
  }

  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(listener)
    return () => this.off(event, listener) // 返回清理函数
  }

  off(event, listener) {
    const listeners = this.listeners.get(event) || []
    this.listeners.set(event, listeners.filter(l => l !== listener))
  }

  emit(event, data) {
    (this.listeners.get(event) || []).forEach(listener => listener(data))
  }
}
```

## 性能监控

### 使用 Prometheus

```javascript
const client = require('prom-client')

// 创建指标
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'status']
})

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'endpoint']
})

// 在中间件中使用
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    httpRequestsTotal.inc({ method: req.method, status: res.statusCode })
    httpRequestDuration.observe({ method: req.method, endpoint: req.path }, duration)
  })
  
  next()
})

// 暴露指标端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType)
  res.send(await client.register.metrics())
})
```

## 总结

| 优化维度 | 具体措施 |
|----------|----------|
| CPU 分析 | Chrome DevTools、v8-profiler |
| 内存分析 | heap snapshot、Memory Monitor |
| 异步 I/O | Stream、批量操作 |
| 集群模式 | Cluster 模块、PM2 |
| 缓存优化 | 多级缓存、LRU 缓存 |
| 代码优化 | Worker 线程、高效数据结构 |