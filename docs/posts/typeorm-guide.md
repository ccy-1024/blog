---
title: TypeORM 深度解析
date: 2024-11-15
---

# TypeORM 深度解析

## TypeORM 架构

```
┌─────────────────────────────────────────────────────────┐
│                    TypeORM 架构                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Entity     │  │   Repository │  │   Query      │ │
│  │   实体定义   │  │   数据访问层 │  │   Builder   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Migration  │  │   Connection │  │   QueryRunner│ │
│  │   数据迁移   │  │   数据库连接 │  │   查询执行器 │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 实体定义

### 基础实体

```typescript
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ 
    type: 'varchar', 
    length: 50, 
    unique: true, 
    nullable: false 
  })
  username: string

  @Column({ type: 'varchar', length: 255 })
  password: string

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string

  @Column({ type: 'boolean', default: true })
  active: boolean

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date
}
```

### 复杂实体

```typescript
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn,
  Index,
  Check,
  Generated
} from 'typeorm'

@Entity('products')
@Index(['name', 'category'])
@Check('price > 0')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 200 })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number

  @Column({ type: 'int', default: 0 })
  stock: number

  @Column({ type: 'enum', enum: ['active', 'inactive', 'deleted'] })
  status: string

  @Generated('uuid')
  sku: string
}
```

## 关联关系

### 一对多关系

```typescript
// User.ts
import { OneToMany } from 'typeorm'
import { Post } from './post.entity'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @OneToMany(() => Post, post => post.author)
  posts: Post[]
}

// Post.ts
import { ManyToOne } from 'typeorm'
import { User } from './user.entity'

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => User, user => user.posts)
  author: User
}
```

### 多对多关系

```typescript
// User.ts
import { ManyToMany, JoinTable } from 'typeorm'
import { Role } from './role.entity'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'role_id' }
  })
  roles: Role[]
}

// Role.ts
import { ManyToMany } from 'typeorm'
import { User } from './user.entity'

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToMany(() => User, user => user.roles)
  users: User[]
}
```

## 查询构建器

### 基础查询

```typescript
// 查询所有用户
const users = await userRepository.find()

// 条件查询
const activeUsers = await userRepository.find({
  where: { active: true },
  order: { createdAt: 'DESC' },
  skip: 0,
  take: 10
})

// 根据 ID 查询
const user = await userRepository.findOneBy({ id: 1 })

// 复杂查询
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.active = :active', { active: true })
  .andWhere('user.createdAt > :date', { date: '2024-01-01' })
  .leftJoinAndSelect('user.posts', 'post')
  .orderBy('user.createdAt', 'DESC')
  .skip(0)
  .take(10)
  .getMany()
```

### 聚合查询

```typescript
// 统计数量
const count = await userRepository.count({ where: { active: true } })

// 求和
const totalPrice = await productRepository
  .createQueryBuilder('product')
  .select('SUM(product.price)', 'total')
  .where('product.status = :status', { status: 'active' })
  .getRawOne()

// 分组统计
const stats = await orderRepository
  .createQueryBuilder('order')
  .select('DATE(order.createdAt)', 'date')
  .addSelect('COUNT(*)', 'count')
  .addSelect('SUM(order.amount)', 'total')
  .groupBy('DATE(order.createdAt)')
  .orderBy('date', 'DESC')
  .getRawMany()
```

### 子查询

```typescript
const subQuery = userRepository
  .createQueryBuilder('u')
  .select('u.id')
  .where('u.active = :active', { active: true })

const posts = await postRepository
  .createQueryBuilder('post')
  .where(`post.authorId IN (${subQuery.getQuery()})`)
  .setParameters(subQuery.getParameters())
  .getMany()
```

## 事务处理

```typescript
// 使用 QueryRunner
const queryRunner = dataSource.createQueryRunner()
await queryRunner.connect()
await queryRunner.startTransaction()

try {
  await queryRunner.manager.save(user)
  await queryRunner.manager.save(order)
  
  await queryRunner.commitTransaction()
} catch (error) {
  await queryRunner.rollbackTransaction()
  throw error
} finally {
  await queryRunner.release()
}

// 使用装饰器
import { Transactional } from 'typeorm-transactional'

@Transactional()
async function createOrder(user: User, items: OrderItem[]) {
  const order = new Order()
  order.user = user
  order.items = items
  
  await orderRepository.save(order)
}
```

## 数据迁移

### 创建迁移

```bash
npx typeorm migration:create src/migration/CreateUsersTable
```

### 迁移文件

```typescript
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateUsersTable1620000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'users',
      columns: [
        {
          name: 'id',
          type: 'int',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'increment'
        },
        {
          name: 'username',
          type: 'varchar',
          length: '50',
          isUnique: true
        },
        {
          name: 'email',
          type: 'varchar',
          length: '100',
          isUnique: true
        },
        {
          name: 'password',
          type: 'varchar',
          length: '255'
        },
        {
          name: 'created_at',
          type: 'datetime',
          default: 'CURRENT_TIMESTAMP'
        },
        {
          name: 'updated_at',
          type: 'datetime',
          default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        }
      ]
    }))
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users')
  }
}
```

### 运行迁移

```bash
# 运行所有未执行的迁移
npx typeorm migration:run

# 回滚最后一次迁移
npx typeorm migration:revert

# 生成迁移文件（从实体自动生成）
npx typeorm migration:generate src/migration/AddColumnToUser
```

## 性能优化

### 查询优化

```typescript
// 只选择需要的字段
const users = await userRepository.find({
  select: ['id', 'username', 'email']
})

// 使用缓存
const users = await userRepository
  .createQueryBuilder('user')
  .where('user.active = :active', { active: true })
  .cache(true)
  .getMany()

// 使用索引
@Entity()
export class User {
  @Index()
  @Column()
  email: string
}
```

### 批量操作

```typescript
// 批量插入
const users = [/* ... */]
await userRepository.insert(users)

// 批量更新
await userRepository.update(
  { active: true },
  { lastLogin: new Date() }
)

// 批量删除
await userRepository.delete({ active: false })
```

## 总结

| 特性 | 说明 |
|------|------|
| 实体定义 | 装饰器声明式定义数据库表结构 |
| 关联关系 | 支持一对一、一对多、多对多 |
| 查询构建器 | 强大的 SQL 构建能力 |
| 事务 | 支持声明式和编程式事务 |
| 迁移 | 版本化数据库结构管理 |
| 缓存 | 查询结果缓存支持 |