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
          text: '博客文章',
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
