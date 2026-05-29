---
title: Docker 容器化部署
date: 2024-12-01
---

# Docker 容器化部署

## Docker 架构

```
┌─────────────────────────────────────────────────────────┐
│                     Docker 架构                       │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    Image     │  │   Container  │  │   Registry   │ │
│  │    镜像      │  │    容器      │  │    仓库      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Dockerfile │  │  Docker Compose│ │   Docker Hub │ │
│  │   镜像构建   │  │   编排工具   │  │   公共仓库   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Dockerfile 编写

### 基础 Node.js 应用

```dockerfile
# 使用官方 Node.js 镜像作为基础
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖（生产环境）
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 7001

# 启动应用
CMD ["npm", "start"]
```

### 多阶段构建

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app

# 仅复制构建产物和依赖
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm ci --only=production

EXPOSE 7001

CMD ["node", "dist/bootstrap.js"]
```

### 优化 Dockerfile

```dockerfile
# 使用更轻量的基础镜像
FROM node:18-slim

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=7001

# 创建非 root 用户
RUN useradd -m appuser

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖并清理缓存
RUN npm ci --only=production && \
    npm cache clean --force

# 复制应用代码
COPY --chown=appuser:appuser . .

# 切换到非 root 用户
USER appuser

# 暴露端口
EXPOSE ${PORT}

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# 启动命令
CMD ["node", "dist/bootstrap.js"]
```

## Docker Compose

### 基础配置

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "7001:7001"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=3306
      - DB_USER=root
      - DB_PASSWORD=password
      - DB_NAME=app_db
    depends_on:
      - db
      - redis
    networks:
      - app-network

  db:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: app_db
    volumes:
      - db-data:/var/lib/mysql
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - app-network

volumes:
  db-data:
  redis-data:

networks:
  app-network:
    driver: bridge
```

### 多环境配置

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "7001:7001"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=error
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - app-network
```

## Docker 命令

### 镜像操作

```bash
# 构建镜像
docker build -t my-app:latest .

# 查看镜像列表
docker images

# 删除镜像
docker rmi my-app:latest

# 导出镜像
docker save -o my-app.tar my-app:latest

# 导入镜像
docker load -i my-app.tar

# 推送镜像到仓库
docker tag my-app:latest registry.example.com/my-app:latest
docker push registry.example.com/my-app:latest
```

### 容器操作

```bash
# 运行容器
docker run -d -p 7001:7001 --name my-app my-app:latest

# 运行容器并映射端口和目录
docker run -d \
  -p 7001:7001 \
  -v /host/path:/container/path \
  -e NODE_ENV=production \
  --name my-app \
  my-app:latest

# 查看运行中的容器
docker ps

# 查看所有容器
docker ps -a

# 停止容器
docker stop my-app

# 启动容器
docker start my-app

# 删除容器
docker rm my-app

# 查看容器日志
docker logs my-app
docker logs -f my-app

# 进入容器
docker exec -it my-app /bin/bash
```

### Docker Compose 命令

```bash
# 启动服务
docker-compose up -d

# 构建并启动服务
docker-compose up -d --build

# 查看日志
docker-compose logs
docker-compose logs -f app

# 停止服务
docker-compose down

# 查看服务状态
docker-compose ps

# 执行命令
docker-compose exec app npm run test

# 查看服务配置
docker-compose config
```

## 网络配置

### 创建自定义网络

```bash
# 创建桥接网络
docker network create --driver bridge app-network

# 查看网络列表
docker network ls

# 查看网络详情
docker network inspect app-network

# 将容器连接到网络
docker network connect app-network my-app

# 从网络断开容器
docker network disconnect app-network my-app
```

## 数据卷管理

```bash
# 创建数据卷
docker volume create db-data

# 查看数据卷列表
docker volume ls

# 查看数据卷详情
docker volume inspect db-data

# 删除数据卷
docker volume rm db-data

# 清理未使用的数据卷
docker volume prune
```

## 安全最佳实践

```dockerfile
# 避免使用 root 用户
USER appuser

# 最小化镜像层数
RUN apt-get update && apt-get install -y --no-install-recommends \
    package1 \
    package2 \
    && rm -rf /var/lib/apt/lists/*

# 使用非 root 用户运行
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser

# 设置正确的文件权限
COPY --chown=appuser:appuser . .

# 限制容器资源
docker run --memory=512m --cpus=1 my-app:latest
```

## CI/CD 集成

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/my-app:latest
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USERNAME }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            docker pull ${{ secrets.DOCKER_USERNAME }}/my-app:latest
            docker-compose up -d
```

## 总结

| 功能 | 说明 |
|------|------|
| Dockerfile | 定义镜像构建过程 |
| Docker Compose | 编排多个容器服务 |
| 多阶段构建 | 减小镜像体积 |
| 网络配置 | 容器间通信 |
| 数据卷 | 持久化数据 |
| CI/CD | 自动化部署 |