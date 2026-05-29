---
title: SQL 注入攻击与防护
date: 2024-12-20
---

# SQL 注入攻击与防护

## SQL 注入原理

```
┌─────────────────────────────────────────────────────────┐
│                    SQL 注入攻击流程                     │
├─────────────────────────────────────────────────────────┤
│  用户输入                                                │
│     │                                                   │
│     ▼                                                   │
│  ┌──────────────┐                                       │
│  │ 恶意输入     │  ' OR '1'='1                         │
│  └──────┬───────┘                                       │
│         │                                               │
│         ▼                                               │
│  ┌──────────────┐                                       │
│  │ 字符串拼接   │  SELECT * FROM users WHERE id='1' OR  │
│  │              │  '1'='1'                             │
│  └──────┬───────┘                                       │
│         │                                               │
│         ▼                                               │
│  ┌──────────────┐                                       │
│  │ 数据库执行   │  条件恒为真，返回所有用户数据           │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

## 常见 SQL 注入类型

### 1. 基于错误的注入

```javascript
// ❌ 危险：直接拼接用户输入
const userId = req.params.id
const query = `SELECT * FROM users WHERE id = ${userId}`
// 如果 userId = 1' OR 1=1--
// 最终 SQL: SELECT * FROM users WHERE id = 1' OR 1=1--
```

### 2. 基于布尔的盲注

```javascript
// 用户输入: 1' AND (SELECT COUNT(*) FROM users) > 0--
const username = req.body.username
const query = `SELECT * FROM users WHERE username = '${username}'`
// 攻击者通过观察返回结果判断条件是否成立
```

### 3. 基于时间的盲注

```javascript
// 用户输入: 1'; WAITFOR DELAY '0:0:5'--
const id = req.params.id
const query = `SELECT * FROM posts WHERE id = '${id}'`
// 攻击者通过响应时间判断注入是否成功
```

### 4. 联合查询注入

```javascript
// 用户输入: 1' UNION SELECT username, password FROM users--
const productId = req.params.id
const query = `SELECT name, price FROM products WHERE id = '${productId}'`
// 联合查询获取其他表数据
```

## 防护方案

### 方案一：参数化查询（推荐）

```javascript
// ✅ 使用参数化查询
const mysql = require('mysql2/promise')

async function getUserById(userId) {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'app_db'
  })

  // 使用占位符 ?
  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  )

  await connection.end()
  return rows[0]
}
```

### 方案二：使用 ORM 框架

```typescript
// ✅ TypeORM 自动防止 SQL 注入
import { Entity, Column, PrimaryGeneratedColumn, Repository } from 'typeorm'

@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  username: string

  @Column()
  email: string
}

async function getUser(username: string) {
  const userRepository = getRepository(User)
  
  // ORM 自动使用参数化查询
  const user = await userRepository.findOne({
    where: { username }
  })
  
  return user
}
```

### 方案三：输入验证

```javascript
// ✅ 使用 Joi 进行输入验证
const Joi = require('joi')

const schema = Joi.object({
  userId: Joi.number().integer().min(1).max(10000).required(),
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required()
})

async function validateInput(data) {
  const { error, value } = await schema.validate(data)
  
  if (error) {
    throw new Error('Invalid input: ' + error.details[0].message)
  }
  
  return value
}
```

### 方案四：存储过程

```sql
-- ✅ 使用存储过程
DELIMITER $$
CREATE PROCEDURE GetUserById(IN userId INT)
BEGIN
  SELECT * FROM users WHERE id = userId;
END$$
DELIMITER ;
```

```javascript
// 调用存储过程
async function getUserById(userId) {
  const [rows] = await connection.execute('CALL GetUserById(?)', [userId])
  return rows[0]
}
```

### 方案五：转义特殊字符

```javascript
// ✅ 使用连接池的转义方法
const mysql = require('mysql2')

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'app_db'
})

function getUser(username) {
  // 手动转义特殊字符
  const escapedUsername = connection.escape(username)
  const query = `SELECT * FROM users WHERE username = ${escapedUsername}`
  
  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) reject(error)
      resolve(results[0])
    })
  })
}
```

## 危险代码示例

### ❌ 危险：字符串拼接

```javascript
// 危险示例 1
const username = req.body.username
const password = req.body.password
const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
// 攻击者输入: username = ' OR '1'='1, password = anything
// 结果: SELECT * FROM users WHERE username = '' OR '1'='1' AND password = 'anything'
```

### ❌ 危险：动态表名

```javascript
// 危险示例 2
const tableName = req.params.table
const query = `SELECT * FROM ${tableName} WHERE id = 1`
// 攻击者输入: table = users; DROP TABLE posts--
// 结果: SELECT * FROM users; DROP TABLE posts-- WHERE id = 1
```

### ❌ 危险：ORDER BY 注入

```javascript
// 危险示例 3
const sortBy = req.query.sortBy || 'id'
const query = `SELECT * FROM products ORDER BY ${sortBy}`
// 攻击者输入: sortBy = id; DROP TABLE users--
// 结果: SELECT * FROM products ORDER BY id; DROP TABLE users--
```

## 进阶防护

### 最小权限原则

```sql
-- 创建只读用户
CREATE USER 'app_reader'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT ON app_db.* TO 'app_reader'@'localhost';

-- 创建读写用户
CREATE USER 'app_writer'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT, INSERT, UPDATE, DELETE ON app_db.* TO 'app_writer'@'localhost';

-- 创建管理员用户
CREATE USER 'app_admin'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON app_db.* TO 'app_admin'@'localhost';
```

### 使用 Web Application Firewall (WAF)

```nginx
# Nginx WAF 配置示例
http {
  # 禁止常见 SQL 注入模式
  if ($query_string ~* "(select|union|insert|update|delete|drop|execute)") {
    return 403;
  }
  
  # 禁止特殊字符
  if ($query_string ~* "['\";--]") {
    return 403;
  }
}
```

### 日志与监控

```javascript
const winston = require('winston')

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

// 记录所有数据库查询
function logQuery(query, params) {
  logger.info('Database query', {
    query: query.replace(/\s+/g, ' ').trim(),
    params: params || [],
    timestamp: new Date().toISOString()
  })
}
```

### 定期安全审计

```javascript
// 使用 sqlmap 进行自动化测试
// 命令行: sqlmap -u http://example.com/api/user?id=1 --batch

// 或使用 Jest 进行安全测试
test('should prevent SQL injection', async () => {
  const maliciousInput = "1' OR 1=1--"
  
  expect(async () => {
    await getUserById(maliciousInput)
  }).not.toThrow()
  
  const result = await getUserById(maliciousInput)
  expect(result).toBeNull() // 不应返回任何结果
})
```

## 总结

| 防护方法 | 适用场景 | 推荐指数 |
|----------|----------|----------|
| 参数化查询 | 所有数据库操作 | ⭐⭐⭐⭐⭐ |
| ORM 框架 | 复杂业务逻辑 | ⭐⭐⭐⭐⭐ |
| 输入验证 | 用户输入处理 | ⭐⭐⭐⭐ |
| 存储过程 | 复杂查询封装 | ⭐⭐⭐ |
| 字符转义 | 特定场景兼容 | ⭐⭐⭐ |
| WAF | 外围防护 | ⭐⭐⭐⭐ |
| 最小权限 | 数据库层面 | ⭐⭐⭐⭐⭐ |
