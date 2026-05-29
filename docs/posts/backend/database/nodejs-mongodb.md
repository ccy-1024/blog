---
title: MongoDB 高级应用
date: 2024-07-15
---

# MongoDB 高级应用

## MongoDB 架构

```
┌─────────────────────────────────────────────────────────┐
│                    MongoDB 架构                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │              Replica Set                        │   │
│  │  ┌──────┐    ┌──────┐    ┌──────┐             │   │
│  │  │Primary│───>│Secondary│───>│Secondary│       │   │
│  │  └──────┘    └──────┘    └──────┘             │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                              │
│                         ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Sharded Cluster                    │   │
│  │  ┌──────┐    ┌──────┐    ┌──────┐             │   │
│  │  │Shard1 │    │Shard2 │    │Shard3 │           │   │
│  │  └──────┘    └──────┘    └──────┘             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 索引优化

```javascript
const { MongoClient } = require('mongodb')

// 创建索引
async function createIndexes() {
  const client = await MongoClient.connect('mongodb://localhost:27017')
  const db = client.db('example')
  const collection = db.collection('users')
  
  // 单字段索引
  await collection.createIndex({ email: 1 })
  
  // 复合索引
  await collection.createIndex({ name: 1, age: -1 })
  
  // 唯一索引
  await collection.createIndex({ email: 1 }, { unique: true })
  
  // 文本索引
  await collection.createIndex({ bio: 'text' })
  
  // 过期索引（自动删除过期文档）
  await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })
  
  // 地理空间索引
  await collection.createIndex({ location: '2dsphere' })
  
  await client.close()
}

// 查看索引
async function listIndexes() {
  const client = await MongoClient.connect('mongodb://localhost:27017')
  const db = client.db('example')
  const collection = db.collection('users')
  
  const indexes = await collection.listIndexes().toArray()
  console.log(indexes)
  
  await client.close()
}
```

## 查询优化

```javascript
// 避免全表扫描
// ❌ db.users.find({ age: { $gt: 18 } })
// ✅ db.users.find({ age: { $gt: 18 } }).hint({ age: 1 })

// 使用投影减少数据传输
async function getUsers() {
  const client = await MongoClient.connect('mongodb://localhost:27017')
  const db = client.db('example')
  const collection = db.collection('users')
  
  // 只返回需要的字段
  const users = await collection.find(
    { age: { $gt: 18 } },
    { projection: { name: 1, email: 1, _id: 0 } }
  ).toArray()
  
  await client.close()
  return users
}

// 使用聚合管道
async function getStats() {
  const client = await MongoClient.connect('mongodb://localhost:27017')
  const db = client.db('example')
  const collection = db.collection('orders')
  
  const stats = await collection.aggregate([
    { $match: { status: 'completed' } },
    { $group: {
      _id: '$userId',
      totalAmount: { $sum: '$amount' },
      orderCount: { $count: {} }
    }},
    { $sort: { totalAmount: -1 } },
    { $limit: 10 }
  ]).toArray()
  
  await client.close()
  return stats
}
```

## 副本集配置

```javascript
// 副本集连接
const client = new MongoClient(
  'mongodb://primary:27017,secondary1:27017,secondary2:27017/?replicaSet=myReplicaSet'
)

// 查看副本集状态
async function checkReplicaSet() {
  await client.connect()
  const admin = client.db('admin')
  const status = await admin.command({ replSetGetStatus: 1 })
  console.log(status)
  await client.close()
}

// 手动故障转移
async function failover() {
  await client.connect()
  const admin = client.db('admin')
  
  // 强制降级主节点
  await admin.command({
    replSetStepDown: 60,
    force: true
  })
  
  await client.close()
}
```

## 分片配置

```javascript
// 分片连接
const client = new MongoClient(
  'mongodb://mongos1:27017,mongos2:27017/?replicaSet=myShardCluster'
)

// 启用分片
async function enableSharding() {
  await client.connect()
  const admin = client.db('admin')
  
  // 启用数据库分片
  await admin.command({ enableSharding: 'example' })
  
  // 创建分片键
  await admin.command({
    shardCollection: 'example.users',
    key: { email: 'hashed' }
  })
  
  await client.close()
}

// 查看分片状态
async function checkShards() {
  await client.connect()
  const admin = client.db('admin')
  const status = await admin.command({ shardStatus: 1 })
  console.log(status)
  await client.close()
}
```

## 数据迁移

```javascript
// 使用 mongodump/mongorestore
// mongodump --uri="mongodb://localhost:27017/example" --out=./backup
// mongorestore --uri="mongodb://localhost:27018/example" ./backup

// 程序级迁移
async function migrateData(sourceUri, targetUri) {
  const sourceClient = await MongoClient.connect(sourceUri)
  const targetClient = await MongoClient.connect(targetUri)
  
  const sourceDb = sourceClient.db('example')
  const targetDb = targetClient.db('example')
  
  const sourceCollection = sourceDb.collection('users')
  const targetCollection = targetDb.collection('users')
  
  // 分批迁移
  const cursor = sourceCollection.find().batchSize(1000)
  
  while (await cursor.hasNext()) {
    const batch = await cursor.next()
    await targetCollection.insertOne(batch)
  }
  
  await sourceClient.close()
  await targetClient.close()
}
```

## 事务处理

```javascript
// 多文档事务
async function transferMoney(fromId, toId, amount) {
  const client = await MongoClient.connect('mongodb://localhost:27017')
  const session = client.startSession()
  
  try {
    await session.withTransaction(async () => {
      const db = client.db('example')
      const accounts = db.collection('accounts')
      
      // 扣除金额
      await accounts.updateOne(
        { _id: fromId },
        { $inc: { balance: -amount } },
        { session }
      )
      
      // 添加金额
      await accounts.updateOne(
        { _id: toId },
        { $inc: { balance: amount } },
        { session }
      )
    })
    
    console.log('Transaction completed successfully')
  } catch (err) {
    console.error('Transaction failed:', err)
  } finally {
    await session.endSession()
    await client.close()
  }
}
```

## 性能监控

```javascript
// 查看慢查询
async function checkSlowQueries() {
  const client = await MongoClient.connect('mongodb://localhost:27017')
  const admin = client.db('admin')
  
  // 启用慢查询日志
  await admin.command({
    setParameter: 1,
    slowms: 100,
    slowQueryLoggingEnabled: true
  })
  
  // 查看当前操作
  const operations = await admin.command({ currentOp: true })
  console.log(operations)
  
  await client.close()
}

// 查看数据库状态
async function checkDbStats() {
  const client = await MongoClient.connect('mongodb://localhost:27017')
  const db = client.db('example')
  
  const stats = await db.stats()
  console.log(stats)
  
  await client.close()
}
```

## 安全配置

```javascript
// 创建用户
async function createUser() {
  const client = await MongoClient.connect('mongodb://localhost:27017')
  const admin = client.db('admin')
  
  await admin.command({
    createUser: 'appUser',
    pwd: 'securePassword',
    roles: [
      { role: 'readWrite', db: 'example' }
    ]
  })
  
  await client.close()
}

// 启用身份验证
// mongod --auth --port 27017

// 连接认证
const client = new MongoClient(
  'mongodb://appUser:securePassword@localhost:27017/example'
)
```

## 总结

| 特性 | 说明 |
|------|------|
| 索引 | 单字段、复合、唯一、文本、地理空间 |
| 查询 | 投影、聚合管道、索引提示 |
| 高可用 | 副本集、自动故障转移 |
| 扩展性 | 分片、分布式存储 |
| 事务 | 多文档事务（MongoDB 4.0+） |
| 安全 | 用户认证、角色权限 |
