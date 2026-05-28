---
title: CI/CD 流水线配置
date: 2024-12-20
---

# CI/CD 流水线配置

## CI/CD 架构

```
┌─────────────────────────────────────────────────────────┐
│                     CI/CD 架构                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   代码提交   │  │   构建测试   │  │   部署发布   │ │
│  │  Git Push   │  │  Build/Test │  │   Deploy    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   GitHub    │  │   GitHub     │  │   Docker    │ │
│  │   Actions   │  │   Actions    │  │   Registry  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## GitHub Actions 配置

### 基础工作流

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run lint
        run: npm run lint
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
```

### 构建并推送 Docker 镜像

```yaml
name: Build and Deploy

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
          
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/my-app:latest
            ${{ secrets.DOCKER_USERNAME }}/my-app:${{ github.sha }}
```

### 部署到服务器

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Set up SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          port: ${{ secrets.SERVER_PORT }}
          script: |
            cd /path/to/app
            git pull origin main
            npm ci --only=production
            npm run build
            pm2 restart all
```

### 多环境部署

```yaml
name: Multi-Environment Deployment

on:
  push:
    branches:
      - develop
      - staging
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: ${{ 
        github.ref == 'refs/heads/main' && 'production' ||
        github.ref == 'refs/heads/staging' && 'staging' ||
        'development' 
      }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Deploy to ${{ env.ENV_NAME }}
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /path/to/app/${{ env.ENV_NAME }}
            git checkout ${{ github.ref_name }}
            git pull
            npm ci --only=production
            npm run build
            pm2 restart ${{ env.ENV_NAME }}-app
```

## GitLab CI 配置

### .gitlab-ci.yml

```yaml
stages:
  - build
  - test
  - deploy

variables:
  NODE_VERSION: '18'

build:
  stage: build
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

test:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run lint
    - npm test

deploy_staging:
  stage: deploy
  image: alpine:latest
  only:
    - develop
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
  script:
    - ssh -o StrictHostKeyChecking=no $STAGING_USER@$STAGING_HOST "
        cd /path/to/staging &&
        git pull origin develop &&
        npm ci --only=production &&
        npm run build &&
        pm2 restart staging-app
      "

deploy_production:
  stage: deploy
  image: alpine:latest
  only:
    - main
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
  script:
    - ssh -o StrictHostKeyChecking=no $PROD_USER@$PROD_HOST "
        cd /path/to/production &&
        git pull origin main &&
        npm ci --only=production &&
        npm run build &&
        pm2 restart prod-app
      "
```

## Jenkins 配置

### Jenkinsfile

```groovy
pipeline {
  agent any
  
  environment {
    NODE_VERSION = '18'
  }
  
  stages {
    stage('Checkout') {
      steps {
        git branch: 'main', url: 'https://github.com/user/repo.git'
      }
    }
    
    stage('Install Dependencies') {
      steps {
        script {
          nodejs(nodeJSInstallationName: "NodeJS_${NODE_VERSION}") {
            sh 'npm ci'
          }
        }
      }
    }
    
    stage('Lint') {
      steps {
        script {
          nodejs(nodeJSInstallationName: "NodeJS_${NODE_VERSION}") {
            sh 'npm run lint'
          }
        }
      }
    }
    
    stage('Test') {
      steps {
        script {
          nodejs(nodeJSInstallationName: "NodeJS_${NODE_VERSION}") {
            sh 'npm test'
          }
        }
      }
      post {
        always {
          junit 'reports/**/*.xml'
        }
      }
    }
    
    stage('Build') {
      steps {
        script {
          nodejs(nodeJSInstallationName: "NodeJS_${NODE_VERSION}") {
            sh 'npm run build'
          }
        }
      }
    }
    
    stage('Deploy') {
      when {
        branch 'main'
      }
      steps {
        sshPublisher(publishers: [sshPublisherDesc(
          configName: 'Production Server',
          transfers: [sshTransfer(
            sourceFiles: 'dist/**',
            remoteDirectory: '/path/to/app',
            cleanRemote: false
          )],
          execCommand: 'cd /path/to/app && npm ci --only=production && pm2 restart app'
        )])
      }
    }
  }
  
  post {
    success {
      echo 'Pipeline succeeded!'
    }
    failure {
      echo 'Pipeline failed!'
      emailext(
        to: 'admin@example.com',
        subject: 'Pipeline Failed: ${BUILD_NUMBER}',
        body: 'The pipeline failed. Please check the logs.'
      )
    }
  }
}
```

## 环境变量管理

### 使用 .env 文件

```env
# .env.development
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password

# .env.production
NODE_ENV=production
DB_HOST=prod-db.example.com
DB_PORT=3306
DB_USER=prod-user
DB_PASSWORD=${{ secrets.DB_PASSWORD }}
```

### 在 CI 中使用环境变量

```yaml
# GitHub Actions
env:
  NODE_ENV: production
  DB_HOST: ${{ secrets.DB_HOST }}
  DB_PORT: ${{ secrets.DB_PORT }}
```

## 质量门禁

```yaml
name: Quality Gate

on: [push]

jobs:
  quality:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run lint
        run: npm run lint
        
      - name: Run tests with coverage
        run: npm test -- --coverage
        
      - name: Check coverage threshold
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
            
            const threshold = 80;
            const totalCoverage = coverage.total.lines.pct;
            
            if (totalCoverage < threshold) {
              core.setFailed(`Coverage (${totalCoverage}%) is below threshold (${threshold}%)`);
            }
```

## 蓝绿部署

```yaml
name: Blue-Green Deployment

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Deploy to Staging
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /path/to/staging
            git pull origin main
            npm ci --only=production
            npm run build
            pm2 restart staging-app
            
      - name: Run Integration Tests
        run: npm run test:integration
        
      - name: Switch Traffic to Green
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            # 切换 Nginx 配置到绿色环境
            ln -sf /etc/nginx/sites-available/green /etc/nginx/sites-enabled/app
            nginx -s reload
            
            # 停止蓝色环境
            pm2 stop blue-app
```

## 总结

| 工具 | 说明 |
|------|------|
| GitHub Actions | 轻量级 CI/CD，与 GitHub 深度集成 |
| GitLab CI | 自托管或 SaaS，功能强大 |
| Jenkins | 高度可定制，丰富的插件生态 |
| 环境变量 | 使用 Secrets 管理敏感信息 |
| 质量门禁 | 代码质量、测试覆盖率检查 |
| 蓝绿部署 | 零停机部署策略 |