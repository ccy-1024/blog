---
title: ORM 框架原理
date: 2024-08-05
---

# ORM 框架原理

## ORM 架构

```
┌─────────────────────────────────────────────────────────┐
│                      ORM 架构                         │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   实体类     │───>│   查询构建器  │───>│   SQL     │ │
│  └──────────────┘    └──────────────┘    └───────────┘ │
│         │                                     │        │
│         ▼                                     ▼        │
│  ┌──────────────┐                     ┌──────────────┐ │
│  │   数据映射   │                     │   数据库    │ │
│  └──────────────┘                     └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 实体定义

```javascript
// 使用 TypeORM 定义实体
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 100 })
  name: string

  @Column({ unique: true })
  email: string

  @Column()
  age: number

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date
}
```

## 查询构建器

```javascript
// 简化的查询构建器实现
class QueryBuilder {
  constructor(entity) {
    this.entity = entity
    this.tableName = entity.name.toLowerCase() + 's'
    this.select = []
    this.where = []
    this.joins = []
    this.orderBy = []
    this.limit = null
    this.offset = null
  }

  select(...columns) {
    this.select.push(...columns)
    return this
  }

  where(condition) {
    this.where.push(condition)
    return this
  }

  join(table, on) {
    this.joins.push({ table, on })
    return this
  }

  orderBy(column, direction = 'ASC') {
    this.orderBy.push({ column, direction })
    return this
  }

  limit(limit) {
    this.limit = limit
    return this
  }

  offset(offset) {
    this.offset = offset
    return this
  }

  build() {
    let sql = 'SELECT '
    
    // SELECT 子句
    if (this.select.length > 0) {
      sql += this.select.join(', ')
    } else {
      sql += '*'
    }
    
    // FROM 子句
    sql += ` FROM ${this.tableName}`
    
    // JOIN 子句
    this.joins.forEach(join => {
      sql += ` JOIN ${join.table} ON ${join.on}`
    })
    
    // WHERE 子句
    if (this.where.length > 0) {
      sql += ' WHERE ' + this.where.join(' AND ')
    }
    
    // ORDER BY 子句
    if (this.orderBy.length > 0) {
      sql += ' ORDER BY ' + this.orderBy.map(o => `${o.column} ${o.direction}`).join(', ')
    }
    
    // LIMIT 子句
    if (this.limit !== null) {
      sql += ` LIMIT ${this.limit}`
    }
    
    // OFFSET 子句
    if (this.offset !== null) {
      sql += ` OFFSET ${this.offset}`
    }
    
    return sql
  }
}

// 使用示例
const qb = new QueryBuilder(User)
  .select('id', 'name', 'email')
  .where('age > 18')
  .where('name LIKE "%John%"')
  .orderBy('createdAt', 'DESC')
  .limit(10)

console.log(qb.build())
// SELECT id, name, email FROM users WHERE age > 18 AND name LIKE "%John%" ORDER BY createdAt DESC LIMIT 10
```

## 数据映射

```javascript
// 实体管理器
class EntityManager {
  constructor(connection) {
    this.connection = connection
  }

  // 保存实体
  async save(entity) {
    const tableName = this.getTableName(entity.constructor)
    const columns = this.getColumns(entity)
    const values = this.getValues(entity)

    if (entity.id) {
      // 更新
      const sets = columns.map(col => `${col} = ?`).join(', ')
      const sql = `UPDATE ${tableName} SET ${sets} WHERE id = ?`
      await this.connection.execute(sql, [...values, entity.id])
    } else {
      // 插入
      const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.map(() => '?').join(', ')})`
      const result = await this.connection.execute(sql, values)
      entity.id = result.insertId
    }

    return entity
  }

  // 查询实体
  async find(entityClass, conditions = {}) {
    const tableName = this.getTableName(entityClass)
    const qb = new QueryBuilder(entityClass)

    Object.entries(conditions).forEach(([key, value]) => {
      qb.where(`${key} = ?`)
    })

    const sql = qb.build()
    const results = await this.connection.execute(sql, Object.values(conditions))

    return results.map(row => this.mapRowToEntity(row, entityClass))
  }

  // 删除实体
  async delete(entityClass, id) {
    const tableName = this.getTableName(entityClass)
    const sql = `DELETE FROM ${tableName} WHERE id = ?`
    await this.connection.execute(sql, [id])
  }

  // 获取表名
  getTableName(entityClass) {
    return entityClass.name.toLowerCase() + 's'
  }

  // 获取列名
  getColumns(entity) {
    return Object.keys(entity).filter(key => key !== 'id')
  }

  // 获取值
  getValues(entity) {
    return Object.values(entity).filter((_, index) => index !== 0)
  }

  // 映射行到实体
  mapRowToEntity(row, entityClass) {
    const entity = new entityClass()
    Object.assign(entity, row)
    return entity
  }
}
```

## 事务管理

```javascript
// 事务管理器
class TransactionManager {
  constructor(connection) {
    this.connection = connection
    this.isTransaction = false
  }

  // 开始事务
  async begin() {
    if (this.isTransaction) {
      throw new Error('Transaction already started')
    }

    await this.connection.execute('BEGIN TRANSACTION')
    this.isTransaction = true
  }

  // 提交事务
  async commit() {
    if (!this.isTransaction) {
      throw new Error('No transaction started')
    }

    await this.connection.execute('COMMIT')
    this.isTransaction = false
  }

  // 回滚事务
  async rollback() {
    if (!this.isTransaction) {
      throw new Error('No transaction started')
    }

    await this.connection.execute('ROLLBACK')
    this.isTransaction = false
  }

  // 在事务中执行
  async runInTransaction(fn) {
    await this.begin()

    try {
      const result = await fn()
      await this.commit()
      return result
    } catch (err) {
      await this.rollback()
      throw err
    }
  }
}
```

## 关系映射

```javascript
// 一对多关系
class Order {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  userId: number

  @ManyToOne(() => User, user => user.orders)
  user: User
}

class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @OneToMany(() => Order, order => order.user)
  orders: Order[]
}

// 多对多关系
class Post {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  @ManyToMany(() => Tag, tag => tag.posts)
  @JoinTable()
  tags: Tag[]
}

class Tag {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @ManyToMany(() => Post, post => post.tags)
  posts: Post[]
}
```

## 查询优化

```javascript
// 使用索引
@Entity()
class User {
  @Index()
  @Column()
  email: string
}

// 延迟加载
@Entity()
class User {
  @OneToMany(() => Order, order => order.user, { lazy: true })
  orders: Promise<Order[]>
}

// 预加载
const users = await userRepository.find({
  relations: ['orders']
})

// 分页查询
const users = await userRepository.find({
  take: 10,
  skip: 20
})

// 原生查询
const users = await userRepository.query(
  'SELECT * FROM users WHERE age > ?',
  [18]
)
```

## 迁移系统

```javascript
// 创建迁移
class CreateUsersTable1620000000000 {
  async up(queryRunner) {
    await queryRunner.createTable(new Table({
      name: 'users',
      columns: [
        { name: 'id', type: 'int', isPrimary: true, isGenerated: true },
        { name: 'name', type: 'varchar', length: 100 },
        { name: 'email', type: 'varchar', isUnique: true },
        { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' }
      ]
    }))
  }

  async down(queryRunner) {
    await queryRunner.dropTable('users')
  }
}

// 运行迁移
async function runMigrations() {
  const queryRunner = connection.createQueryRunner()
  await queryRunner.connect()
  
  const migrations = await getMigrations()
  
  for (const migration of migrations) {
    await migration.up(queryRunner)
  }
  
  await queryRunner.release()
}
```

## 总结

| ORM 框架 | 特点 | 适用场景 |
|----------|------|----------|
| TypeORM | 全功能、支持多种数据库 | TypeScript 项目 |
| Sequelize | 成熟、社区活跃 | Node.js 项目 |
| Prisma | 类型安全、现代化 | 新项目 |
| Mongoose | MongoDB 专用 | MongoDB 项目 |
