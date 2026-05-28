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
            { text: 'Vue3 响应式原理深度解析', link: '/posts/vue3-reactive-principle' }
          ]
        },
        {
          text: 'Node.js',
          items: [
            { text: 'Node.js 事件循环详解', link: '/posts/nodejs-event-loop' }
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
            { text: 'uni-app 生命周期详解', link: '/posts/uniapp-lifecycle' }
          ]
        },
        {
          text: '性能优化',
          items: [
            { text: '首屏加载优化实战', link: '/posts/frontend-performance-optimization' }
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
