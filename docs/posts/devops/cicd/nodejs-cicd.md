---
title: CI/CD 实践
date: 2024-08-15
---

# CI/CD 实践

## CI/CD 架构

```
┌─────────────────────────────────────────────────────────┐
│                    CI/CD 流程                         │
├─────────────────────────────────────────────────────────┤
│  代码提交 ──> 构建 ──> 测试 ──> 部署                   │
│     │         │         │         │                   │
│     ▼         ▼         ▼         ▼                   │
│  Git仓库    编译      单元测试   生产环境               │
│             打包      集成测试                         │
│                      E2E测试                          │
└─────────────────────────────────────────────────────────┘
```

## GitHub Actions 配置

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint
      run: npm run lint
    
    - name: Test
      run: npm test
    
    - name: Build
      run: npm run build
```

## 部署配置

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to production
      uses: easingthemes/ssh-deploy@v5
      with:
        SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
        ARGS: "-avz --delete"
        SOURCE: "dist/"
        REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
        REMOTE_USER: ${{ secrets.REMOTE_USER }}
        TARGET: ${{ secrets.REMOTE_TARGET }}
```

## Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    restart: unless-stopped

volumes:
  postgres_data:
```

## 自动化测试

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts'
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      statements: 80,
      functions: 80,
      branches: 80
    }
  }
}

// 示例测试文件
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a user', async () => {
      const user = await userService.createUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
      
      expect(user).toHaveProperty('id')
      expect(user.name).toBe('Test User')
      expect(user.email).toBe('test@example.com')
    })
    
    it('should throw error for duplicate email', async () => {
      await userService.createUser({
        name: 'User 1',
        email: 'duplicate@example.com',
        password: 'password123'
      })
      
      await expect(userService.createUser({
        name: 'User 2',
        email: 'duplicate@example.com',
        password: 'password456'
      })).rejects.toThrow('Email already exists')
    })
  })
})
```

## 环境配置

```javascript
// config.ts
export const config = {
  development: {
    database: {
      host: 'localhost',
      port: 5432,
      name: 'dev_db',
      user: 'dev_user',
      password: 'dev_password'
    },
    server: {
      port: 3000,
      host: 'localhost'
    }
  },
  production: {
    database: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      name: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    },
    server: {
      port: parseInt(process.env.PORT || '3000'),
      host: '0.0.0.0'
    }
  }
}

export function getConfig() {
  const env = process.env.NODE_ENV || 'development'
  return config[env as keyof typeof config]
}
```

## 健康检查

```javascript
// health.controller.ts
import { Controller, Get } from '@nestjs/common'
import { HealthService } from './health.service'

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    return await this.healthService.check()
  }
}

// health.service.ts
import { Injectable } from '@nestjs/common'

@Injectable()
export class HealthService {
  async check() {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis()
    ])
    
    const isHealthy = checks.every(check => check.status === 'healthy')
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks
    }
  }
  
  async checkDatabase() {
    try {
      // 检查数据库连接
      await this.db.query('SELECT 1')
      return { name: 'database', status: 'healthy' as const }
    } catch (err) {
      return { name: 'database', status: 'unhealthy' as const, error: err.message }
    }
  }
  
  async checkRedis() {
    try {
      await this.redis.ping()
      return { name: 'redis', status: 'healthy' as const }
    } catch (err) {
      return { name: 'redis', status: 'unhealthy' as const, error: err.message }
    }
  }
}
```

## 日志管理

```javascript
// logger.ts
const winston = require('winston')

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

module.exports = logger

// 使用示例
logger.info('Application started')
logger.error('Database connection failed', { error: err })
logger.warn('High memory usage detected')
```

## 监控告警

```javascript
// 告警配置
const alerts = {
  cpu: {
    threshold: 80,
    message: 'CPU usage exceeded {threshold}%',
    severity: 'warning'
  },
  memory: {
    threshold: 85,
    message: 'Memory usage exceeded {threshold}%',
    severity: 'warning'
  },
  errors: {
    threshold: 10,
    message: 'Error rate exceeded {threshold}%',
    severity: 'critical'
  }
}

// 告警检查
async function checkAlerts(metrics) {
  const triggeredAlerts = []
  
  if (metrics.cpu > alerts.cpu.threshold) {
    triggeredAlerts.push({
      ...alerts.cpu,
      currentValue: metrics.cpu,
      timestamp: Date.now()
    })
  }
  
  if (metrics.memory > alerts.memory.threshold) {
    triggeredAlerts.push({
      ...alerts.memory,
      currentValue: metrics.memory,
      timestamp: Date.now()
    })
  }
  
  return triggeredAlerts
}

// 发送告警
async function sendAlerts(alerts) {
  for (const alert of alerts) {
    await sendSlackNotification(alert)
    await sendEmailNotification(alert)
  }
}
```

## 总结

| CI/CD 阶段 | 工具 | 职责 |
|------------|------|------|
| 代码托管 | GitHub/GitLab | 版本控制 |
| 持续集成 | GitHub Actions/GitLab CI | 构建、测试 |
| 容器化 | Docker | 环境一致性 |
| 部署 | Docker Compose/Kubernetes | 应用部署 |
| 监控 | Prometheus/Grafana | 性能监控 |
| 告警 | Slack/Email | 异常通知 |
