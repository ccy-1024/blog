import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "我的博客",
  description: "个人技术博客",
  base: '/blog/',
  lang: 'zh-CN',
  themeConfig: {
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
      { icon: 'github', link: 'https://github.com/ccy-1024' }
    ],
    footer: {
      message: '基于 VitePress 构建',
      copyright: 'Copyright © 2024-present'
    }
  }
})
