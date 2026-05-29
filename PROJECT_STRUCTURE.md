# 技术博客目录结构

本文档规划技术博客的内容结构，涵盖前端、后端、部署、架构等核心领域。

---

## 一、文件目录结构

```
docs/
├── posts/                           # 技术文章目录
│   │
│   ├── frontend/                    # 前端开发
│   │   ├── vue/                     # Vue.js 体系
│   │   │   ├── vue3-basics.md       # Vue3 基础入门
│   │   │   ├── vue3-composition.md  # Composition API
│   │   │   ├── vue3-reactive.md     # 响应式原理
│   │   │   ├── vue3-vdom.md         # 虚拟 DOM
│   │   │   ├── vue-router.md        # 路由管理
│   │   │   ├── vue-pinia.md         # 状态管理
│   │   │   └── vue-patterns.md      # 组件设计模式
│   │   │
│   │   ├── engineering/             # 前端工程化
│   │   │   ├── vite-principle.md    # Vite 原理与实践
│   │   │   ├── typescript-guide.md  # TypeScript 实战
│   │   │   ├── eslint-prettier.md   # 代码规范
│   │   │   └── git-workflow.md      # Git 工作流
│   │   │
│   │   ├── browser/                 # 浏览器原理
│   │   │   ├── browser-rendering.md # 渲染原理
│   │   │   ├── frontend-performance.md # 性能优化
│   │   │   └── web-security.md      # 前端安全
│   │   │
│   │   └── microfrontend/           # 微前端架构
│   │       ├── microfrontend-principle.md # 微前端原理
│   │       ├── microfrontend-communication.md # 微前端通信
│   │       └── microfrontend-practice.md # 微前端实践
│   │
│   ├── backend/                     # 后端开发
│   │   ├── nodejs/                  # Node.js 核心
│   │   │   ├── node-eventloop.md    # 事件循环
│   │   │   ├── node-async.md        # 异步编程
│   │   │   ├── node-streams.md      # 流处理
│   │   │   └── node-network.md      # 网络编程
│   │   │
│   │   ├── frameworks/              # Node.js 框架
│   │   │   ├── koa-guide.md         # Koa.js 实战
│   │   │   ├── nestjs-architecture.md # NestJS 架构
│   │   │   └── midway-guide.md      # Midway.js 入门
│   │   │
│   │   └── database/                # 数据库技术
│   │       ├── mysql-guide.md       # MySQL 实战
│   │       ├── mongodb-guide.md     # MongoDB 实战
│   │       ├── redis-guide.md       # Redis 缓存
│   │       └── typeorm-guide.md     # ORM 框架
│   │
│   ├── devops/                      # 部署运维
│   │   ├── docker/                  # Docker 容器化
│   │   ├── kubernetes/              # Kubernetes
│   │   └── cicd/                    # CI/CD 流程
│   │
│   ├── architecture/                # 架构设计
│   │   ├── design-principles.md     # 架构设计原则
│   │   ├── design-patterns.md       # 设计模式详解
│   │   ├── system-design.md         # 系统设计案例
│   │   └── scalability.md           # 可扩展性设计
│   │
│   ├── distributed/                 # 分布式系统
│   ├── microservice/                # 微服务架构
│   ├── cross-platform/              # 跨端开发
│   │   ├── uniapp/                  # UniApp
│   │   ├── wechat-mini/             # 微信小程序
│   │   └── dingtalk/                # 钉钉应用
│   ├── message-queue/               # 消息队列
│   ├── security/                    # 安全防护
│   ├── monitoring/                  # 监控与日志
│   ├── algorithm/                   # 算法与数据结构
│   └── engineering-practice/        # 工程实践
│       ├── debugging.md             # 调试技巧
│       ├── unit-testing.md          # 单元测试
│       ├── tech-writing.md          # 技术写作
│       ├── form-framework.md        # 表单框架
│       ├── ux-optimization.md       # 用户体验优化
│       ├── form-validation.md       # 表单验证
│       └── pwa-guide.md             # PWA 实战
│
├── about.md                         # 关于页面
├── resume.md                        # 简历页面
└── index.md                         # 首页
```

---

## 二、侧边栏导航结构

```
博客
├── 前端开发
│   ├── Vue.js
│   │   ├── Vue3 响应式原理深度解析
│   │   ├── Vue3 虚拟 DOM 与 Diff 算法
│   │   ├── Vue3 组合式 API 最佳实践
│   │   ├── Vue3 自定义指令开发
│   │   └── Vue3 响应式系统源码剖析
│   ├── 浏览器原理
│   │   ├── 浏览器渲染原理详解
│   │   ├── 首屏加载优化实战
│   │   ├── 内存泄漏排查与优化
│   │   └── 网络请求优化
│   ├── 前端工程化
│   │   ├── TypeScript 高级类型实战
│   │   ├── Vite 插件开发指南
│   │   ├── Git 工作流最佳实践
│   │   ├── Webpack 性能优化
│   │   └── 前端代码规范与最佳实践
│   └── 微前端架构
│       ├── 微前端架构原理与实践
│       └── 微前端通信方案详解
├── 后端开发
│   ├── Node.js 核心
│   │   ├── Node.js 事件循环详解
│   │   ├── Node.js 内存泄漏排查
│   │   ├── Node.js 进程管理与集群
│   │   ├── Node.js 流处理实战
│   │   ├── Node.js 模块系统源码解析
│   │   ├── Node.js 文件系统原理
│   │   ├── Node.js 异步编程模型
│   │   ├── Node.js 网络编程深入
│   │   ├── PM2 源码解析
│   │   └── Node.js 性能监控
│   ├── Node.js 框架
│   │   ├── Express/Koa 源码解析
│   │   ├── NestJS 架构设计
│   │   └── Midway.js 框架实战
│   └── 数据库技术
│       ├── MySQL 实战
│       ├── MongoDB 高级应用
│       ├── Redis 实战与原理
│       ├── Redis 缓存策略与实战
│       ├── MySQL 性能优化
│       ├── TypeORM 深度解析
│       └── ORM 框架原理
├── 部署运维
│   ├── Docker 容器化
│   │   └── Docker 容器化部署
│   └── CI/CD 流程
│       ├── CI/CD 流水线配置
│       └── Node.js CI/CD 实践
├── 消息队列
│   └── BullMQ 分布式消息队列
├── 安全防护
│   ├── 前端安全攻防实战
│   ├── SQL 注入攻击与防护
│   ├── CSRF 攻击与防护策略
│   ├── JWT 认证与权限管理
│   ├── JWT 认证实现
│   ├── OAuth2.0 实战
│   └── 密码安全
├── 监控与日志
│   └── 前端监控与性能分析
├── 跨端开发
│   └── UniApp
│       ├── uni-app 入门与项目搭建
│       ├── uni-app 生命周期详解
│       ├── uni-app 路由与页面跳转
│       ├── uni-app 数据请求封装
│       ├── uni-app 性能优化实战
│       ├── uni-app 小程序分包加载
│       ├── uni-app 图片优化
│       └── uni-app 长列表优化
├── 架构设计
│   ├── 前端状态管理架构
│   └── RESTful API 设计规范
└── 工程实践
    ├── 前端调试技巧与工具
    ├── 前端单元测试实战
    ├── 技术文档写作指南
    ├── Formily 表单框架实战
    ├── 用户体验优化实战
    ├── 表单验证与数据处理
    ├── PWA 实战指南
    └── 我的第一篇博客
```

---

## 三、导航结构设计说明

### 层级设计
1. **一级分类**：大领域划分（前端开发、后端开发、部署运维等）
2. **二级分类**：细分技术方向（Vue.js、Node.js 核心、数据库技术等）
3. **三级分类**：具体文章列表

### 优化说明
1. **微前端**：从独立分类整合到「前端开发」下，作为前端架构模式更合理
2. **工程实践**：合并原「实用工具」和「实用功能」，内容更集中
3. **移除「其他」分类**：「我的第一篇博客」移至「工程实践」下

---

## 四、目录规范

1. **目录命名**：小写字母 + 连字符分隔
2. **文件命名**：小写字母 + 连字符分隔
3. **内容粒度**：每篇文章聚焦一个主题
4. **标签体系**：为每篇文章添加相关标签便于搜索

---

## 五、分类说明

| 分类 | 说明 |
|------|------|
| **frontend** | 前端开发（Vue.js、工程化、浏览器原理、微前端） |
| **backend** | 后端开发（Node.js、框架、数据库） |
| **devops** | 部署运维（Docker、K8s、CI/CD） |
| **architecture** | 架构设计（设计原则、设计模式、系统设计） |
| **distributed** | 分布式系统（一致性、事务、锁） |
| **microservice** | 微服务架构（服务发现、API网关、熔断器） |
| **cross-platform** | 跨端开发（UniApp、微信小程序、钉钉应用） |
| **message-queue** | 消息队列（BullMQ、RabbitMQ、Kafka） |
| **security** | 安全防护（SQL注入、XSS、CSRF、JWT） |
| **monitoring** | 监控与日志（Prometheus、Grafana、ELK） |
| **algorithm** | 算法与数据结构 |
| **engineering-practice** | 工程实践（调试、测试、写作等） |