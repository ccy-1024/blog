import { defineConfig, type DefaultTheme } from 'vitepress'

const sidebarItems: DefaultTheme.SidebarItem[] = [
  {
    text: '前端开发',
    collapsed: true,
    items: [
      {
        text: 'Vue.js',
        items: [
          { text: 'Vue3 响应式原理深度解析', link: '/posts/frontend/vue/vue3-reactive-principle' },
          { text: 'Vue3 虚拟 DOM 与 Diff 算法', link: '/posts/frontend/vue/vue3-virtual-dom' },
          { text: 'Vue3 组合式 API 最佳实践', link: '/posts/frontend/vue/vue3-composition-api' },
          { text: 'Vue3 自定义指令开发', link: '/posts/frontend/vue/vue3-custom-directives' },
          { text: 'Vue3 响应式系统源码剖析', link: '/posts/frontend/vue/vue3-reactive-source' }
        ]
      },
      {
        text: '浏览器原理',
        items: [
          { text: '浏览器渲染原理详解', link: '/posts/frontend/browser/browser-rendering' },
          { text: '首屏加载优化实战', link: '/posts/frontend/browser/frontend-performance-optimization' },
          { text: '内存泄漏排查与优化', link: '/posts/frontend/browser/memory-leak' },
          { text: '网络请求优化', link: '/posts/frontend/browser/network-optimization' }
        ]
      },
      {
        text: '前端工程化',
        items: [
          { text: 'TypeScript 高级类型实战', link: '/posts/frontend/engineering/typescript-advanced' },
          { text: 'Vite 插件开发指南', link: '/posts/frontend/engineering/vite-plugin-dev' },
          { text: 'Git 工作流最佳实践', link: '/posts/frontend/engineering/git-workflow' },
          { text: 'Webpack 性能优化', link: '/posts/frontend/engineering/webpack-performance' },
          { text: '前端代码规范与最佳实践', link: '/posts/frontend/engineering/code-style-guide' }
        ]
      }
    ]
  },
  {
    text: '后端开发',
    collapsed: true,
    items: [
      {
        text: 'Node.js 核心',
        items: [
          { text: 'Node.js 事件循环详解', link: '/posts/backend/nodejs/nodejs-event-loop' },
          { text: 'Node.js 内存泄漏排查', link: '/posts/backend/nodejs/nodejs-memory-leak' },
          { text: 'Node.js 进程管理与集群', link: '/posts/backend/nodejs/nodejs-process-cluster' },
          { text: 'Node.js 流处理实战', link: '/posts/backend/nodejs/nodejs-streams' },
          { text: 'Node.js 模块系统源码解析', link: '/posts/backend/nodejs/nodejs-module-system' },
          { text: 'Node.js 文件系统原理', link: '/posts/backend/nodejs/nodejs-fs-module' },
          { text: 'Node.js 异步编程模型', link: '/posts/backend/nodejs/nodejs-async-model' },
          { text: 'Node.js 网络编程深入', link: '/posts/backend/nodejs/nodejs-network' },
          { text: 'PM2 源码解析', link: '/posts/backend/nodejs/nodejs-pm2' },
          { text: 'Node.js 性能监控', link: '/posts/backend/nodejs/nodejs-performance' }
        ]
      },
      {
        text: 'Node.js 框架',
        items: [
          { text: 'Express/Koa 源码解析', link: '/posts/backend/frameworks/nodejs-express-koa' },
          { text: 'NestJS 架构设计', link: '/posts/backend/frameworks/nodejs-nestjs' },
          { text: 'Midway.js 框架实战', link: '/posts/backend/frameworks/midwayjs-guide' }
        ]
      },
      {
        text: '数据库技术',
        items: [
          { text: 'MySQL 实战', link: '/posts/backend/database/nodejs-mysql' },
          { text: 'MongoDB 高级应用', link: '/posts/backend/database/nodejs-mongodb' },
          { text: 'Redis 实战与原理', link: '/posts/backend/database/nodejs-redis' },
          { text: 'Redis 缓存策略与实战', link: '/posts/backend/database/redis-cache-guide' },
          { text: 'MySQL 性能优化', link: '/posts/backend/database/mysql-optimization' },
          { text: 'TypeORM 深度解析', link: '/posts/backend/database/typeorm-guide' },
          { text: 'ORM 框架原理', link: '/posts/backend/database/nodejs-orm' }
        ]
      }
    ]
  },
  {
    text: '部署运维',
    collapsed: true,
    items: [
      {
        text: 'Docker 容器化',
        items: [
          { text: 'Docker 容器化部署', link: '/posts/devops/docker/docker-guide' }
        ]
      },
      {
        text: 'CI/CD 流程',
        items: [
          { text: 'CI/CD 流水线配置', link: '/posts/devops/cicd/cicd-guide' },
          { text: 'Node.js CI/CD 实践', link: '/posts/devops/cicd/nodejs-cicd' }
        ]
      }
    ]
  },
  {
    text: '消息队列',
    collapsed: true,
    items: [
      { text: 'BullMQ 分布式消息队列', link: '/posts/message-queue/bullmq-guide' }
    ]
  },
  {
    text: '安全防护',
    collapsed: true,
    items: [
      { text: '前端安全攻防实战', link: '/posts/security/frontend-security' },
      { text: 'SQL 注入攻击与防护', link: '/posts/security/sql-injection-guide' },
      { text: 'CSRF 攻击与防护策略', link: '/posts/security/csrf-protection-guide' },
      { text: 'JWT 认证与权限管理', link: '/posts/security/jwt-auth-guide' },
      { text: 'JWT 认证实现', link: '/posts/security/nodejs-jwt-auth' },
      { text: 'OAuth2.0 实战', link: '/posts/security/nodejs-oauth2' },
      { text: '密码安全', link: '/posts/security/nodejs-password-security' }
    ]
  },
  {
    text: '监控与日志',
    collapsed: true,
    items: [
      { text: '前端监控与性能分析', link: '/posts/monitoring/frontend-monitoring' }
    ]
  },
  {
    text: '跨端开发',
    collapsed: true,
    items: [
      {
        text: 'UniApp',
        items: [
          { text: 'uni-app 入门与项目搭建', link: '/posts/cross-platform/uniapp/uniapp-getting-started' },
          { text: 'uni-app 生命周期详解', link: '/posts/cross-platform/uniapp/uniapp-lifecycle' },
          { text: 'uni-app 路由与页面跳转', link: '/posts/cross-platform/uniapp/uniapp-router' },
          { text: 'uni-app 数据请求封装', link: '/posts/cross-platform/uniapp/uniapp-api-wrapper' },
          { text: 'uni-app 性能优化实战', link: '/posts/cross-platform/uniapp/uniapp-performance' },
          { text: 'uni-app 小程序分包加载', link: '/posts/cross-platform/uniapp/uniapp-subpackage' },
          { text: 'uni-app 图片优化', link: '/posts/cross-platform/uniapp/uniapp-image-optimization' },
          { text: 'uni-app 长列表优化', link: '/posts/cross-platform/uniapp/uniapp-long-list' }
        ]
      }
    ]
  }
]

export default defineConfig({
  title: "芝麻粒的博客",
  description: "记录技术成长，分享学习心得",
  base: '/blog/',
  lang: 'zh-CN',
  lastUpdated: false,  
  themeConfig: {
    search: {
      provider: 'local'
    },
    
    nav: [
      { text: '首页', link: '/' },
      { text: '博客', link: '/posts/' },
      { 
        text: '简历', 
        link: '/blog/resume.pdf',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
      { text: '关于', link: '/about' }
    ],
    
    sidebar: {
      '/posts/': sidebarItems
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ccy-1024' },
      { icon: 'twitter', link: 'https://twitter.com' }
    ],
    
    footer: {
      message: '基于 VitePress 构建 | 用心记录每一次成长',
      copyright: 'Copyright © 2024-present'
    },
    
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    
    outline: {
      level: 'deep',
      label: '文章目录'
    }
  }
})