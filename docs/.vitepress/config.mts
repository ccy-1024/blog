import { defineConfig } from 'vitepress'

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
      { text: '关于', link: '/about' }
    ],
    
    sidebar: {
      '/posts/': [
        {
          text: 'Vue.js',
          items: [
            { text: 'Vue3 响应式原理深度解析', link: '/posts/vue3-reactive-principle' },
            { text: 'Vue3 虚拟 DOM 与 Diff 算法', link: '/posts/vue3-virtual-dom' },
            { text: 'Vue3 组合式 API 最佳实践', link: '/posts/vue3-composition-api' },
            { text: 'Vue3 自定义指令开发', link: '/posts/vue3-custom-directives' },
            { text: 'Vue3 响应式系统源码剖析', link: '/posts/vue3-reactive-source' },
            { text: 'Formily 表单框架实战', link: '/posts/formily-guide' }
          ]
        },
        {
          text: 'Node.js',
          items: [
            { text: 'Node.js 事件循环详解', link: '/posts/nodejs-event-loop' },
            { text: 'Node.js 内存泄漏排查', link: '/posts/nodejs-memory-leak' },
            { text: 'Node.js 进程管理与集群', link: '/posts/nodejs-process-cluster' },
            { text: 'Node.js 流处理实战', link: '/posts/nodejs-streams' },
            { text: 'Node.js 模块系统源码解析', link: '/posts/nodejs-module-system' },
            { text: 'Node.js 文件系统原理', link: '/posts/nodejs-fs-module' },
            { text: 'Node.js 异步编程模型', link: '/posts/nodejs-async-model' },
            { text: 'Node.js 网络编程深入', link: '/posts/nodejs-network' },
            { text: 'Express/Koa 源码解析', link: '/posts/nodejs-express-koa' },
            { text: 'NestJS 架构设计', link: '/posts/nodejs-nestjs' },
            { text: 'Redis 实战与原理', link: '/posts/nodejs-redis' },
            { text: 'BullMQ 分布式消息队列', link: '/posts/bullmq-guide' },
            { text: 'MySQL 性能优化', link: '/posts/nodejs-mysql' },
            { text: 'MongoDB 高级应用', link: '/posts/nodejs-mongodb' },
            { text: 'ORM 框架原理', link: '/posts/nodejs-orm' },
            { text: 'JWT 认证实现', link: '/posts/nodejs-jwt-auth' },
            { text: 'OAuth2.0 实战', link: '/posts/nodejs-oauth2' },
            { text: '密码安全', link: '/posts/nodejs-password-security' },
            { text: 'PM2 源码解析', link: '/posts/nodejs-pm2' },
            { text: 'Node.js 性能监控', link: '/posts/nodejs-performance' },
            { text: 'CI/CD 实践', link: '/posts/nodejs-cicd' }
          ]
        },
        {
          text: '后端技术',
          items: [
            { text: 'Midway.js 框架实战', link: '/posts/midwayjs-guide' },
            { text: 'TypeORM 深度解析', link: '/posts/typeorm-guide' },
            { text: 'Redis 缓存策略与实战', link: '/posts/redis-cache-guide' },
            { text: 'JWT 认证与权限管理', link: '/posts/jwt-auth-guide' },
            { text: 'Docker 容器化部署', link: '/posts/docker-guide' },
            { text: 'Node.js 性能调优', link: '/posts/nodejs-performance' },
            { text: 'MySQL 性能优化', link: '/posts/mysql-optimization' },
            { text: 'RESTful API 设计规范', link: '/posts/restful-api-design' },
            { text: 'CI/CD 流水线配置', link: '/posts/cicd-guide' }
          ]
        },
        {
          text: '微前端',
          items: [
            { text: '微前端架构原理与实践', link: '/posts/micro-frontend-principle' },
            { text: '微前端通信方案详解', link: '/posts/micro-frontend-communication' }
          ]
        },
        {
          text: 'uni-app',
          items: [
            { text: 'uni-app 入门与项目搭建', link: '/posts/uniapp-getting-started' },
            { text: 'uni-app 生命周期详解', link: '/posts/uniapp-lifecycle' },
            { text: 'uni-app 路由与页面跳转', link: '/posts/uniapp-router' },
            { text: 'uni-app 数据请求封装', link: '/posts/uniapp-api-wrapper' },
            { text: 'uni-app 性能优化实战', link: '/posts/uniapp-performance' },
            { text: 'uni-app 小程序分包加载', link: '/posts/uniapp-subpackage' },
            { text: 'uni-app 图片优化', link: '/posts/uniapp-image-optimization' },
            { text: 'uni-app 长列表优化', link: '/posts/uniapp-long-list' }
          ]
        },
        {
          text: '浏览器原理',
          items: [
            { text: '浏览器渲染原理详解', link: '/posts/browser-rendering' }
          ]
        },
        {
          text: '架构设计',
          items: [
            { text: '前端状态管理架构', link: '/posts/frontend-state-management' }
          ]
        },
        {
          text: '安全攻防',
          items: [
            { text: '前端安全攻防实战', link: '/posts/frontend-security' }
          ]
        },
        {
          text: '性能优化',
          items: [
            { text: '首屏加载优化实战', link: '/posts/frontend-performance-optimization' },
            { text: 'Webpack 性能优化', link: '/posts/webpack-performance' },
            { text: '前端监控与性能分析', link: '/posts/frontend-monitoring' },
            { text: '内存泄漏排查与优化', link: '/posts/memory-leak' },
            { text: '网络请求优化', link: '/posts/network-optimization' }
          ]
        },
        {
          text: '工程化',
          items: [
            { text: 'TypeScript 高级类型实战', link: '/posts/typescript-advanced' },
            { text: 'Vite 插件开发指南', link: '/posts/vite-plugin-dev' },
            { text: 'Git 工作流最佳实践', link: '/posts/git-workflow' }
          ]
        },
        {
          text: '实用工具',
          items: [
            { text: '前端调试技巧与工具', link: '/posts/frontend-debugging' },
            { text: '前端单元测试实战', link: '/posts/unit-testing' },
            { text: '前端代码规范与最佳实践', link: '/posts/code-style-guide' },
            { text: '技术文档写作指南', link: '/posts/tech-writing-guide' },
            { text: '前端面试题解析', link: '/posts/frontend-interview' }
          ]
        },
        {
          text: '实用功能',
          items: [
            { text: '用户体验优化实战', link: '/posts/ux-optimization' },
            { text: '表单验证与数据处理', link: '/posts/form-validation' },
            { text: 'PWA 实战指南', link: '/posts/pwa-guide' }
          ]
        },
        {
          text: '其他',
          items: [
            { text: '我的第一篇博客', link: '/posts/my-first-blog' }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ccy-1024' },
      { icon: 'twitter', link: 'https://twitter.com' }
    ],
    
    footer: {
      message: '基于 VitePress 构建 | 用心记录每一次成长',
      copyright: 'Copyright © 2024-present'
    },
    
    // editLink: {
    //   pattern: 'https://github.com/ccy-1024/blog/edit/main/docs/:path',
    //   text: '在 GitHub 上编辑此页面'
    // },
    
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
