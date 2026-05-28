---
title: BullMQ 分布式消息队列实战
date: 2024-12-15
---

# BullMQ 分布式消息队列实战

## BullMQ 架构

```
┌─────────────────────────────────────────────────────────┐
│                    BullMQ 架构                          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   Producer   │───▶│    Queue     │                  │
│  │   生产者      │    │    队列      │                  │
│  └──────────────┘    └──────┬───────┘                  │
│                              │                          │
│                              ▼                          │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   Worker     │◀───│    Redis     │                  │
│  │   消费者      │    │   消息存储   │                  │
│  └──────┬───────┘    └──────────────┘                  │
│         │                                               │
│         │                                               │
│         ▼                                               │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   Scheduler │    │    Flow      │                  │
│  │   调度器     │    │   子任务链   │                  │
│  └──────────────┘    └──────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

## 快速开始

### 安装依赖

```bash
npm install bullmq ioredis
```

### 创建队列

```typescript
import { Queue, Worker } from 'bullmq'

// 创建队列
const myQueue = new Queue('my-queue', {
  connection: {
    host: 'localhost',
    port: 6379
  }
})

// 创建消费者
const worker = new Worker('my-queue', async job => {
  console.log(`Processing job ${job.id}`)
  return { result: 'success' }
}, {
  connection: {
    host: 'localhost',
    port: 6379
  },
  concurrency: 5
})
```

### 添加任务

```typescript
// 添加简单任务
await myQueue.add('greet', {
  name: '芝麻粒',
  message: '你好！'
})

// 添加带选项的任务
await myQueue.add('send-email', {
  to: 'user@example.com',
  subject: '测试邮件'
}, {
  attempts: 3,           // 失败重试次数
  backoff: {
    type: 'exponential', // 指数退避
    delay: 2000          // 基础延迟 2s
  },
  delay: 5000,           // 5秒后执行
  priority: 1            // 优先级（数字越小优先级越高）
})
```

## 任务生命周期

```
                    ┌─────────────┐
                    │   Waiting  │
                    │   等待中    │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
              ┌─────│  Delayed   │─────┐
              │     │  延迟中     │     │
              │     └─────────────┘     │
              │                          │
              ▼                          │
       ┌─────────────┐                   │
       │   Failed    │                   │
       │   已失败    │                   │
       └─────────────┘                   │
                           │             │
                           ▼             ▼
                    ┌─────────────┐ ┌─────────────┐
                    │  Completed  │ │  Active     │
                    │   已完成    │ │  执行中     │
                    └─────────────┘ └─────────────┘
```

## Worker 处理器

### 基本用法

```typescript
const worker = new Worker('my-queue', async (job) => {
  // job.data 包含传入的数据
  const { name, email } = job.data

  // 更新进度
  await job.updateProgress(10)

  // 执行业务逻辑
  await sendEmail(email, name)

  await job.updateProgress(100)

  // 返回结果
  return { success: true, email }
})
```

### 手动完成与失败

```typescript
const worker = new Worker('my-queue', async (job) => {
  try {
    const result = await processJob(job.data)

    // 手动标记成功并返回数据
    return result
  } catch (error) {
    // 手动标记失败
    throw error
  }
})
```

### 错误处理

```typescript
const worker = new Worker('my-queue', async (job) => {
  const result = await riskyOperation(job.data)

  return result
}, {
  // 错误处理配置
  limiter: {
    max: 10,
    duration: 1000
  }
})

// 监听错误事件
worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message)
})

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`)
})
```

## 延时任务与定时任务

### 延时任务

```typescript
// 10秒后执行
await myQueue.add('delayed-job', {
  data: 'something'
}, {
  delay: 10000
})

// 预约到指定时间
const scheduledTime = new Date('2024-12-25T10:00:00')
await myQueue.add('christmas-email', {
  recipient: 'user@example.com'
}, {
  delay: scheduledTime.getTime() - Date.now()
})
```

### 重复任务 (Cron)

```typescript
// 每小时执行
await myQueue.add('hourly-task', {
  type: 'cleanup'
}, {
  repeat: {
    pattern: '0 * * * *'  // Cron 表达式
  }
})

// 每 5 分钟执行
await myQueue.add('check-status', {
  type: 'health-check'
}, {
  repeat: {
    every: 5 * 60 * 1000  // 每 5 分钟
  }
})

// 限制重复次数
await myQueue.add('scheduled-report', {
  reportId: '123'
}, {
  repeat: {
    pattern: '0 9 * * *',  // 每天上午 9 点
    limit: 30             // 最多重复 30 次
  }
})
```

### 移除重复任务

```typescript
import { Queue, Worker } from 'bullmq'

const queue = new Queue('reports')

// 获取所有重复任务
const repeatableJobs = await queue.getRepeatableJobs()

// 移除特定的重复任务
for (const job of repeatableJobs) {
  if (job.name === 'scheduled-report' && job.id === 'specific-id') {
    await queue.removeRepeatableByKey(job.key)
  }
}
```

## 任务流程 (Flows)

### 父子任务链

```typescript
import { Queue, Worker, FlowProducer } from 'bullmq'

const flowProducer = new FlowProducer({
  connection: { host: 'localhost', port: 6379 }
})

// 创建任务流程
const flow = await flowProducer.add({
  name: 'parent-job',
  queueName: 'main-queue',
  data: { orderId: '12345' },
  children: [
    {
      name: 'send-email',
      queueName: 'email-queue',
      data: { to: 'user@example.com' },
      children: [
        {
          name: 'log-email',
          queueName: 'logs-queue',
          data: { action: 'email_sent' }
        }
      ]
    },
    {
      name: 'update-database',
      queueName: 'db-queue',
      data: { status: 'completed' }
    }
  ]
})

console.log('Flow created:', flow.job.id)
```

### 等待子任务完成

```typescript
const flow = await flowProducer.add({
  name: 'process-order',
  queueName: 'orders',
  data: { orderId: '123' },
  children: [
    {
      name: 'validate-inventory',
      queueName: 'inventory',
      data: { items: ['item1', 'item2'] },
      waitForChildren: true  // 等待子任务完成
    },
    {
      name: 'charge-payment',
      queueName: 'payment',
      data: { amount: 100 }
    }
  ]
})
```

## 分布式锁

### 使用 Tracer

```typescript
import { Queue, Worker } from 'bullmq'

const queue = new Queue('distributed-task')

// 确保同一时间只有一个实例执行
const worker = new Worker('distributed-task', async (job) => {
  // 获取锁
  const tracer = await job.tracer('mutex-lock', {
    duration: 30000  // 锁的有效期
  })

  try {
    if (!tracer.obtained) {
      // 未能获取锁，跳过执行
      return { skipped: true, reason: 'Lock not obtained' }
    }

    // 执行业务逻辑
    await processWithMutex(job.data)

  } finally {
    // 释放锁
    await tracer.release()
  }
})
```

## 并发与限流

### 设置并发数

```typescript
const worker = new Worker('my-queue', async (job) => {
  await processJob(job.data)
}, {
  concurrency: 10  // 同时处理 10 个任务
})
```

### 请求限流

```typescript
const worker = new Worker('api-queue', async (job) => {
  const result = await callExternalAPI(job.data)
  return result
}, {
  limiter: {
    max: 100,        // 最多 100 个请求
    duration: 1000   // 每秒
  }
})
```

### 队列优先级

```typescript
// 高优先级任务会优先处理
await myQueue.add('urgent-task', { critical: true }, { priority: 1 })
await myQueue.add('normal-task', { critical: false }, { priority: 5 })
await myQueue.add('low-task', { critical: false }, { priority: 10 })
```

## 哨兵模式 (Sentinel)

```typescript
const worker = new Worker('sentinel-queue', async (job) => {
  return processJob(job.data)
}, {
  connection: {
    sentinels: [
      { host: 'sentinel-1', port: 26379 },
      { host: 'sentinel-2', port: 26379 },
      { host: 'sentinel-3', port: 26379 }
    ],
    name: 'mymaster',           // Redis 主节点名称
    password: 'your-password',  // 密码（如果有）
    enableReadyCheck: false,
    connectTimeout: 10000
  }
})
```

## 集群模式 (Cluster)

```typescript
import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'

const connection = new Redis.Cluster([
  { host: '127.0.0.1', port: 7000 },
  { host: '127.0.0.1', port: 7001 },
  { host: '127.0.0.1', port: 7002 }
])

const queue = new Queue('cluster-queue', { connection })
const worker = new Worker('cluster-queue', async (job) => {
  return processJob(job.data)
}, { connection })
```

## 监控与日志

### 事件监听

```typescript
const worker = new Worker('my-queue', async (job) => {
  return processJob(job.data)
})

worker.on('active', (job) => {
  console.log(`Job ${job.id} is now active`)
})

worker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result)
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message)
})

worker.on('progress', (job, progress) => {
  console.log(`Job ${job.id} progress: ${progress}%`)
})

worker.on('error', (err) => {
  console.error('Worker error:', err)
})
```

### 查看队列状态

```typescript
import { Queue } from 'bullmq'

const queue = new Queue('my-queue')

// 获取等待中的任务
const waiting = await queue.getWaiting()

// 获取活跃任务
const active = await queue.getActive()

// 获取失败任务
const failed = await queue.getFailed()

// 获取完成任务
const completed = await queue.getCompleted()

// 获取任务计数
const counts = await queue.getJobCounts('wait', 'active', 'completed', 'failed')

console.log('Queue counts:', counts)
```

## 最佳实践

### 1. 连接管理

```typescript
import { Queue, Worker, QueueEvents } from 'bullmq'

// 复用连接
const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT)
}

// 所有组件使用相同连接
const queue = new Queue('my-queue', { connection })
const worker = new Worker('my-queue', processor, { connection })
const queueEvents = new QueueEvents('my-queue', { connection })

// 关闭时正确清理
async function shutdown() {
  await worker.close()
  await queue.close()
  await queueEvents.close()
}

process.on('SIGTERM', shutdown)
```

### 2. 任务数据设计

```typescript
// ✅ 推荐：只传递必要的数据 ID
await queue.add('process-order', {
  orderId: '12345'  // 只传 ID，实际数据从数据库读取
})

// ❌ 避免：传递大量数据
await queue.add('process-order', {
  orderId: '12345',
  customer: { /* 大量客户信息 */ },
  items: [ /* 大量商品信息 */ ]
})
```

### 3. 错误重试策略

```typescript
await queue.add('critical-task', data, {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000  // 2s, 4s, 8s, 16s, 32s
  },
  removeOnComplete: {
    age: 3600,    // 完成后 1 小时删除
    count: 1000   // 最多保留 1000 个
  },
  removeOnFail: {
    age: 86400   // 失败后 24 小时删除
  }
})
```

### 4. 健康检查

```typescript
import { Worker } from 'bullmq'

const worker = new Worker('health-check', async (job) => {
  // 模拟健康检查
  return { status: 'healthy' }
}, {
  connection: {
    host: 'localhost',
    port: 6379
  }
})

// HTTP 健康检查端点
app.get('/health/worker', async (req, res) => {
  const isRunning = worker.isRunning()
  const isPaused = worker.isPaused()

  res.json({
    status: isRunning && !isPaused ? 'healthy' : 'unhealthy',
    running: isRunning,
    paused: isPaused
  })
})
```

## 常见问题

### Q: 如何确保任务不丢失？

```typescript
// 1. 使用任务完成事件
const queueEvents = new QueueEvents('my-queue')

queueEvents.on('completed', async ({ jobId }) => {
  // 记录到数据库，确保任务被处理
  await db.logCompletedJob(jobId)
})

// 2. 持久化重要任务
await queue.add('important-task', data, {
  removeOnComplete: false,  // 不自动删除
  removeOnFail: false      // 不自动删除
})
```

### Q: 如何处理任务积压？

```typescript
// 1. 增加 Worker 并发
const worker = new Worker('my-queue', processor, {
  concurrency: 20  // 提高并发
})

// 2. 使用速率限制
const worker = new Worker('my-queue', processor, {
  limiter: {
    max: 100,
    duration: 1000
  }
})

// 3. 优先处理紧急任务
await queue.add('urgent', data, { priority: 1 })
```

### Q: 如何调试任务？

```typescript
// 获取特定任务详情
const job = await queue.getJob('job-id')
const state = await job.getState()
const progress = job.progress
const data = job.data
const result = await job.waitUntilFinished(queueEvents)

console.log('Job state:', state)
console.log('Job data:', data)
console.log('Job result:', result)
```

## 总结

| 功能 | 说明 |
|------|------|
| 基础队列 | 异步任务处理 |
| 延时任务 | 延迟执行 |
| 定时任务 | Cron 表达式调度 |
| 任务流程 | 父子任务链 |
| 并发控制 | 控制消费速率 |
| 重试机制 | 失败自动重试 |
| 分布式锁 | 多实例协调 |
| 事件监控 | 实时状态追踪 |
| 优先级队列 | 重要任务优先 |
