---
title: MySQL 性能优化
date: 2024-06-25
---

# MySQL 性能优化

## 查询优化

### 索引优化

```sql
-- 创建索引
CREATE INDEX idx_users_email ON users(email);

-- 创建复合索引
CREATE INDEX idx_users_name_age ON users(name, age);

-- 删除索引
DROP INDEX idx_users_email ON users;

-- 查看索引使用情况
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
```

### 查询分析

```sql
-- 分析查询计划
EXPLAIN SELECT * FROM orders 
WHERE user_id = 123 
AND created_at > '2024-01-01';

-- 分析详细信息
EXPLAIN ANALYZE SELECT * FROM orders 
WHERE user_id = 123;

-- 查看慢查询日志
-- 修改配置
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- 查看慢查询日志位置
SHOW VARIABLES LIKE 'slow_query_log_file';
```

### 优化技巧

```sql
-- 避免 SELECT *
SELECT id, name, email FROM users WHERE id = 1;

-- 避免隐式转换
-- ❌ SELECT * FROM users WHERE id = '123'
-- ✅ SELECT * FROM users WHERE id = 123

-- 使用 LIMIT 限制结果
SELECT * FROM orders LIMIT 100;

-- 使用 JOIN 代替子查询
SELECT u.name, o.total 
FROM users u 
JOIN orders o ON u.id = o.user_id;

-- 避免在 WHERE 子句中使用函数
-- ❌ SELECT * FROM users WHERE YEAR(created_at) = 2024
-- ✅ SELECT * FROM users WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'
```

## 数据库结构优化

### 表设计优化

```sql
-- 使用合适的数据类型
-- ❌ VARCHAR(255) 存储手机号
-- ✅ VARCHAR(11) 存储手机号

-- 避免 NULL 值
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE
);

-- 规范化设计（第三范式）
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT,
  product_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 分区表
CREATE TABLE logs (
  id INT,
  log_time DATETIME,
  message TEXT
)
PARTITION BY RANGE (TO_DAYS(log_time)) (
  PARTITION p202401 VALUES LESS THAN (TO_DAYS('2024-02-01')),
  PARTITION p202402 VALUES LESS THAN (TO_DAYS('2024-03-01'))
);
```

### 索引策略

```sql
-- B-Tree 索引（默认）
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- 哈希索引（仅适用于等值查询）
CREATE INDEX idx_users_email_hash ON users(email) USING HASH;

-- 全文索引
CREATE FULLTEXT INDEX idx_articles_content ON articles(content);

-- 唯一索引
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- 覆盖索引（包含所有查询字段）
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at, total);
```

## 连接池配置

```javascript
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'example',
  connectionLimit: 10,    // 最大连接数
  queueLimit: 0,          // 队列限制（0 表示无限制）
  waitForConnections: true, // 是否等待可用连接
  connectTimeout: 10000,   // 连接超时时间
  idleTimeout: 60000,      // 空闲连接超时时间
  enableKeepAlive: true,    // 保持连接
  keepAliveInitialDelay: 0
})

// 使用连接池
async function query(sql, params) {
  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.execute(sql, params)
    return rows
  } finally {
    connection.release()
  }
}
```

## 读写分离

```javascript
// 主从复制配置
const masterPool = mysql.createPool({
  host: 'master.example.com',
  user: 'root',
  password: 'password',
  database: 'example'
})

const slavePool = mysql.createPool({
  host: 'slave.example.com',
  user: 'root',
  password: 'password',
  database: 'example'
})

// 读写分离中间件
function query(sql, params, isWrite = false) {
  const pool = isWrite ? masterPool : slavePool
  return pool.execute(sql, params)
}

// 事务处理
async function transaction(fn) {
  const connection = await masterPool.getConnection()
  
  try {
    await connection.beginTransaction()
    
    await fn(connection)
    
    await connection.commit()
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}
```

## 缓存策略

```javascript
const redis = require('redis')
const client = redis.createClient()

// 查询缓存
async function getUserById(id) {
  const cacheKey = `user:${id}`
  
  // 先查缓存
  const cached = await client.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }
  
  // 查数据库
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id])
  const user = rows[0]
  
  // 写入缓存
  if (user) {
    await client.set(cacheKey, JSON.stringify(user), 'EX', 3600)
  }
  
  return user
}

// 数据更新时清除缓存
async function updateUser(id, data) {
  await pool.execute('UPDATE users SET ? WHERE id = ?', [data, id])
  
  // 清除相关缓存
  await client.del(`user:${id}`)
}
```

## 性能监控

```sql
-- 查看数据库状态
SHOW STATUS LIKE 'Queries';
SHOW STATUS LIKE 'Connections';
SHOW STATUS LIKE 'Threads_%';

-- 查看缓存命中率
SHOW STATUS LIKE 'Qcache_%';

-- 查看锁等待
SHOW PROCESSLIST;

-- 查看索引使用情况
SELECT * FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'example';

-- 查看表碎片
SELECT 
  TABLE_NAME,
  DATA_FREE 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'example';

-- 优化表
OPTIMIZE TABLE users;
```

## 配置优化

```ini
# my.cnf

[mysqld]
# 内存配置
innodb_buffer_pool_size = 4G
innodb_log_buffer_size = 64M
key_buffer_size = 256M

# 连接配置
max_connections = 1000
wait_timeout = 60
interactive_timeout = 60

# 查询缓存（MySQL 8.0 已移除）
query_cache_type = 1
query_cache_size = 64M

# 日志配置
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# InnoDB 配置
innodb_flush_log_at_trx_commit = 1
innodb_file_per_table = 1
innodb_log_file_size = 512M
```

## 总结

| 优化维度 | 具体措施 |
|----------|----------|
| 查询优化 | 索引优化、避免 SELECT *、使用 JOIN |
| 结构优化 | 合适的数据类型、规范化设计、分区表 |
| 连接管理 | 连接池配置、连接复用 |
| 读写分离 | 主从复制、读写路由 |
| 缓存策略 | Redis 缓存、查询缓存 |
| 监控调优 | 慢查询日志、性能指标监控 |
