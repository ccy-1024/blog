# 博客文章

这里是我的技术博客，记录学习过程中的思考和总结。

## 🎯 前端开发

### Vue.js
- [Vue3 响应式原理深度解析](/posts/frontend/vue/vue3-reactive-principle) - 深入理解 Proxy 代理机制和依赖收集
- [Vue3 虚拟 DOM 与 Diff 算法](/posts/frontend/vue/vue3-virtual-dom) - 双端比较、最长递增子序列、PatchFlags
- [Vue3 组合式 API 最佳实践](/posts/frontend/vue/vue3-composition-api) - ref/reactive 选择、computed/watch 使用技巧
- [Vue3 自定义指令开发](/posts/frontend/vue/vue3-custom-directives) - 指令钩子、参数传递、实际应用场景
- [Vue3 响应式系统源码剖析](/posts/frontend/vue/vue3-reactive-source) - Proxy 代理、依赖收集、effect 工作原理

### 浏览器原理
- [浏览器渲染原理详解](/posts/frontend/browser/browser-rendering) - 解析、布局、绘制、合成、Layer 树
- [首屏加载优化实战](/posts/frontend/browser/frontend-performance-optimization) - 从 3s 到 0.8s 的性能优化之旅
- [内存泄漏排查与优化](/posts/frontend/browser/memory-leak) - 常见泄漏场景、内存分析工具、优化策略
- [网络请求优化](/posts/frontend/browser/network-optimization) - 请求合并、缓存策略、压缩优化、CDN 加速

### 前端工程化
- [TypeScript 高级类型实战](/posts/frontend/engineering/typescript-advanced) - 泛型、条件类型、映射类型、模板字面量
- [Vite 插件开发指南](/posts/frontend/engineering/vite-plugin-dev) - 插件机制、钩子函数、常用插件解析
- [Git 工作流最佳实践](/posts/frontend/engineering/git-workflow) - Git Flow、Commit 规范、代码审查
- [Webpack 性能优化](/posts/frontend/engineering/webpack-performance) - 构建速度优化、代码分割、Tree Shaking、资源压缩
- [前端代码规范与最佳实践](/posts/frontend/engineering/code-style-guide) - ESLint、Prettier、BEM 命名、Git 提交规范

## 🚀 后端开发

### Node.js 核心
- [Node.js 事件循环详解](/posts/backend/nodejs/nodejs-event-loop) - 从踩坑经历理解事件循环机制
- [Node.js 内存泄漏排查](/posts/backend/nodejs/nodejs-memory-leak) - Chrome DevTools、heapdump、常见泄漏场景
- [Node.js 进程管理与集群](/posts/backend/nodejs/nodejs-process-cluster) - Cluster、PM2、负载均衡配置
- [Node.js 流处理实战](/posts/backend/nodejs/nodejs-streams) - Readable/Writable/Transform、背压处理
- [Node.js 模块系统源码解析](/posts/backend/nodejs/nodejs-module-system) - require 实现、路径解析、循环依赖处理
- [Node.js 文件系统原理](/posts/backend/nodejs/nodejs-fs-module) - 文件描述符、同步/异步 IO、流式处理
- [Node.js 异步编程模型](/posts/backend/nodejs/nodejs-async-model) - 回调、Promise、Generator、Async/Await
- [Node.js 网络编程深入](/posts/backend/nodejs/nodejs-network) - HTTP、TCP、WebSocket、HTTP/2
- [PM2 源码解析](/posts/backend/nodejs/nodejs-pm2) - 进程管理、集群模式、日志管理
- [Node.js 性能监控](/posts/backend/nodejs/nodejs-performance) - 指标收集、性能分析、告警系统

### Node.js 框架
- [Express/Koa 源码解析](/posts/backend/frameworks/nodejs-express-koa) - 中间件机制、路由实现、上下文处理
- [NestJS 架构设计](/posts/backend/frameworks/nodejs-nestjs) - 模块化、依赖注入、管道/守卫/拦截器
- [Midway.js 框架实战](/posts/backend/frameworks/midwayjs-guide) - 依赖注入、装饰器、配置管理、TypeORM 集成

### 数据库技术
- [MySQL 实战](/posts/backend/database/nodejs-mysql) - 索引优化、查询优化、读写分离
- [MongoDB 高级应用](/posts/backend/database/nodejs-mongodb) - 副本集、分片集群、事务处理
- [Redis 实战与原理](/posts/backend/database/nodejs-redis) - 数据结构、持久化机制、缓存策略
- [Redis 缓存策略与实战](/posts/backend/database/redis-cache-guide) - 数据结构、缓存模式、分布式锁、会话管理
- [MySQL 性能优化](/posts/backend/database/mysql-optimization) - 索引优化、查询优化、主从复制、连接池配置
- [TypeORM 深度解析](/posts/backend/database/typeorm-guide) - 实体定义、关联关系、查询构建器、事务处理、数据迁移
- [ORM 框架原理](/posts/backend/database/nodejs-orm) - TypeORM、Sequelize、数据映射

## 🐳 部署运维

### Docker 容器化
- [Docker 容器化部署](/posts/devops/docker/docker-guide) - Dockerfile 编写、Docker Compose、多阶段构建、CI/CD 集成

### CI/CD 流程
- [CI/CD 流水线配置](/posts/devops/cicd/cicd-guide) - GitHub Actions、GitLab CI、Jenkins、质量门禁
- [Node.js CI/CD 实践](/posts/devops/cicd/nodejs-cicd) - GitHub Actions、Docker、自动化测试

## 📨 消息队列

- [BullMQ 分布式消息队列](/posts/message-queue/bullmq-guide) - Redis 分布式消息队列实战

## 🔒 安全防护

- [前端安全攻防实战](/posts/security/frontend-security) - XSS、CSRF、点击劫持、敏感数据保护
- [SQL 注入攻击与防护](/posts/security/sql-injection-guide) - SQL 注入原理、防护策略
- [CSRF 攻击与防护策略](/posts/security/csrf-protection-guide) - CSRF 原理、防护方案
- [JWT 认证与权限管理](/posts/security/jwt-auth-guide) - Token 生成/验证、RBAC、密码安全、黑名单机制
- [JWT 认证实现](/posts/security/nodejs-jwt-auth) - Token 生成/验证、刷新机制、安全存储
- [OAuth2.0 实战](/posts/security/nodejs-oauth2) - 授权码流程、第三方登录、权限管理
- [密码安全](/posts/security/nodejs-password-security) - bcrypt/scrypt、密码策略、多因素认证

## 📊 监控与日志

- [前端监控与性能分析](/posts/monitoring/frontend-monitoring) - Core Web Vitals、错误监控、用户行为追踪

## 📱 跨端开发

### UniApp
- [uni-app 入门与项目搭建](/posts/cross-platform/uniapp/uniapp-getting-started) - 环境配置、项目结构、pages.json 配置
- [uni-app 生命周期详解](/posts/cross-platform/uniapp/uniapp-lifecycle) - 应用、页面、组件生命周期详解
- [uni-app 路由与页面跳转](/posts/cross-platform/uniapp/uniapp-router) - 路由配置、页面传参、导航守卫
- [uni-app 数据请求封装](/posts/cross-platform/uniapp/uniapp-api-wrapper) - 统一请求封装、拦截器、错误处理
- [uni-app 性能优化实战](/posts/cross-platform/uniapp/uniapp-performance) - 首屏优化、包体积优化、渲染优化、运行时优化
- [uni-app 小程序分包加载](/posts/cross-platform/uniapp/uniapp-subpackage) - 分包配置、独立分包、预加载策略
- [uni-app 图片优化](/posts/cross-platform/uniapp/uniapp-image-optimization) - 图片压缩、WebP 支持、懒加载、缓存策略
- [uni-app 长列表优化](/posts/cross-platform/uniapp/uniapp-long-list) - 虚拟列表、分页加载、滚动优化、内存管理