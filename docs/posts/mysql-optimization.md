---
title: MySQL 性能优化
date: 2024-12-10
---

# MySQL 性能优化

## MySQL 优化体系

```
┌─────────────────────────────────────────────────────────┐
│                   MySQL 性能优化                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   索引优化   │  │   查询优化   │  │   配置优化   │ │
│  │   Indexing   │  │   Query      │  │   Config    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   存储引擎   │  │   连接池     │  │   主从复制   │ │
│  │  Engine      │  │ Connection   │  │ Replication │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 索引优化

### 索引类型

```sql
-- B-Tree 索引（默认）
CREATE INDEX idx_username ON users(username);

-- 唯一索引
CREATE UNIQUE INDEX idx_email ON users(email);

-- 复合索引
CREATE INDEX idx_user_status ON users(status, created_at);

-- 全文索引
CREATE FULLTEXT INDEX idx_content ON articles(content);

-- 空间索引
CREATE SPATIAL INDEX idx_location ON places(location);
```

### 索引使用原则

```sql
-- ✅ 正确：最左前缀原则
-- 索引: idx_name_age (name, age)
SELECT * FROM users WHERE name = 'John';  -- 使用索引
SELECT * FROM users WHERE name = 'John' AND age = 25;  -- 使用索引
SELECT * FROM users WHERE age = 25;  -- 不使用索引（违反最左前缀）

-- ✅ 正确：避免在索引列上进行函数操作
-- ❌ 错误
SELECT * FROM users WHERE DATE(created_at) = '2024-01-01';

-- ✅ 正确
SELECT * FROM users WHERE created_at BETWEEN '2024-01-01 00:00:00' AND '2024-01-01 23:59:59';

-- ✅ 正确：使用覆盖索引
CREATE INDEX idx_user_name_email ON users(name, email);
SELECT name, email FROM users WHERE name = 'John';  -- 覆盖索引，无需回表
```

### 索引维护

```sql
-- 查看索引
SHOW INDEX FROM users;

-- 删除索引
DROP INDEX idx_username ON users;

-- 重建索引（解决索引碎片）
ALTER TABLE users ENGINE=InnoDB;

-- 分析表（更新统计信息）
ANALYZE TABLE users;
```

## 查询优化

### EXPLAIN 分析

```sql
EXPLAIN SELECT * FROM users 
WHERE status = 'active' 
ORDER BY created_at DESC 
LIMIT 10;

-- 输出字段说明
-- id: 查询序列号
-- select_type: 查询类型（SIMPLE, SUBQUERY, DERIVED, UNION等）
-- table: 表名
-- type: 访问类型（ALL, index, range, ref, eq_ref, const, system, NULL）
-- possible_keys: 可能使用的索引
-- key: 实际使用的索引
-- key_len: 索引长度
-- ref: 与索引比较的列
-- rows: 预计扫描行数
-- Extra: 额外信息（Using index, Using where, Using filesort等）
```

### 查询优化示例

```sql
-- ❌ 低效：SELECT *
SELECT * FROM orders WHERE user_id = 1;

-- ✅ 高效：只选择需要的列
SELECT id, order_no, amount FROM orders WHERE user_id = 1;

-- ❌ 低效：使用 NOT IN
SELECT * FROM users WHERE id NOT IN (SELECT user_id FROM orders);

-- ✅ 高效：使用 LEFT JOIN
SELECT u.* FROM users u 
LEFT JOIN orders o ON u.id = o.user_id 
WHERE o.user_id IS NULL;

-- ❌ 低效：OR 条件
SELECT * FROM users WHERE name = 'John' OR email = 'john@example.com';

-- ✅ 高效：UNION
SELECT * FROM users WHERE name = 'John'
UNION
SELECT * FROM users WHERE email = 'john@example.com';

-- ✅ 高效：批量插入
INSERT INTO users (name, email) VALUES
('John', 'john@example.com'),
('Jane', 'jane@example.com'),
('Bob', 'bob@example.com');
```

## 存储引擎选择

### InnoDB vs MyISAM

| 特性 | InnoDB | MyISAM |
|------|--------|--------|
| 事务支持 | ✅ | ❌ |
| 行级锁 | ✅ | ❌（表级锁） |
| 外键 | ✅ | ❌ |
| 全文索引 | ✅（5.6+） | ✅ |
| 崩溃恢复 | ✅ | ❌ |
| 性能 | 写操作更好 | 读操作更快 |

### 配置建议

```ini
[mysqld]
# 选择 InnoDB 作为默认存储引擎
default-storage-engine = InnoDB

# InnoDB 配置
innodb_buffer_pool_size = 1G  # 通常设为物理内存的 50-70%
innodb_log_file_size = 256M
innodb_log_buffer_size = 64M
innodb_flush_log_at_trx_commit = 1  # 生产环境建议 1
innodb_flush_method = O_DIRECT
innodb_autoinc_lock_mode = 2  # 并发插入优化
```

## 连接池配置

### 连接池参数

```ini
[mysqld]
# 最大连接数
max_connections = 151

# 等待连接超时
wait_timeout = 60

# 交互连接超时
interactive_timeout = 28800

# 连接队列大小
back_log = 80
```

### 应用层连接池

```typescript
// 使用 TypeORM 配置连接池
{
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'password',
  database: 'app_db',
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: false,
  
  // 连接池配置
  extra: {
    connectionLimit: 10,  // 最大连接数
    waitForConnections: true,  // 等待可用连接
    queueLimit: 0,  // 无限制等待队列
    acquireTimeout: 60000,  // 获取连接超时时间
    timeout: 60000,  // 连接超时时间
    idleTimeout: 30000  // 空闲连接超时时间
  }
}
```

## 主从复制

### 配置主库

```ini
[mysqld]
server-id = 1
log_bin = /var/log/mysql/mysql-bin.log
binlog_do_db = app_db
binlog_format = row  # 行级复制，更安全
expire_logs_days = 7
```

### 配置从库

```ini
[mysqld]
server-id = 2
relay_log = /var/log/mysql/relay-bin.log
log_slave_updates = 1
read_only = 1  # 从库只读
```

### 复制命令

```sql
-- 在主库创建复制用户
CREATE USER 'repl'@'slave_ip' IDENTIFIED BY 'password';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'slave_ip';

-- 查看主库状态
SHOW MASTER STATUS;

-- 在从库配置复制
CHANGE MASTER TO
  MASTER_HOST='master_ip',
  MASTER_USER='repl',
  MASTER_PASSWORD='password',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=107;

-- 启动复制
START SLAVE;

-- 查看复制状态
SHOW SLAVE STATUS\G
```

### 读写分离

```typescript
// 读写分离配置
class DatabaseManager {
  private masterPool: Pool
  private slavePool: Pool

  constructor() {
    this.masterPool = createPool(masterConfig)
    this.slavePool = createPool(slaveConfig)
  }

  async query(sql: string, params?: any[], isWrite = false): Promise<any> {
    const pool = isWrite ? this.masterPool : this.slavePool
    const connection = await pool.getConnection()
    
    try {
      return await connection.query(sql, params)
    } finally {
      connection.release()
    }
  }

  async insert(table: string, data: Record<string, any>): Promise<any> {
    return this.query(this.buildInsertSql(table, data), [], true)
  }

  async select(sql: string, params?: any[]): Promise<any> {
    return this.query(sql, params, false)
  }
}
```

## 缓存策略

```typescript
class MySQLCache {
  constructor(private redis, private ttl = 300) {}

  async get(key: string, query: string, params?: any[]): Promise<any> {
    // 先查缓存
    const cached = await this.redis.get(key)
    if (cached) {
      return JSON.parse(cached)
    }

    // 查询数据库
    const result = await db.query(query, params)
    
    // 设置缓存
    await this.redis.set(key, JSON.stringify(result), 'EX', this.ttl)
    
    return result
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(keys)
    }
  }
}
```

## 性能监控

```sql
-- 查看慢查询日志
SHOW VARIABLES LIKE 'slow_query_log';

-- 开启慢查询日志
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;  -- 超过1秒的查询记录

-- 查看当前连接
SHOW PROCESSLIST;

-- 查看索引使用情况
SELECT 
  TABLE_NAME, 
  INDEX_NAME, 
  SEQ_IN_INDEX, 
  COLUMN_NAME,
  CARDINALITY 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'app_db';

-- 查看表状态
SHOW TABLE STATUS LIKE 'users'\G
```

## 总结

| 优化维度 | 具体措施 |
|----------|----------|
| 索引优化 | B-Tree 索引、复合索引、覆盖索引 |
| 查询优化 | EXPLAIN 分析、避免 SELECT *、使用 UNION |
| 存储引擎 | 选择 InnoDB、优化 InnoDB 参数 |
| 连接池 | 合理配置连接数、超时时间 |
| 主从复制 | 读写分离、提高读性能 |
| 缓存策略 | Redis 缓存热点数据 |