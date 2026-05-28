# 我的博客

个人技术博客，记录学习成长，分享技术心得。

## 🌐 博客地址

- **在线地址**: https://ccy-1024.github.io/blog/
- **GitHub 仓库**: https://github.com/ccy-1024/blog

## 🛠️ 技术栈

- **框架**: [VitePress](https://vitepress.dev/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **托管**: GitHub Pages

## ✨ 功能特性

- ✅ 响应式设计
- ✅ 本地搜索
- ✅ 文章目录
- ✅ 自动部署
- ✅ 代码高亮

## 📁 项目结构

```
blog/
├── docs/                  # 文档目录
│   ├── .vitepress/        # VitePress 配置
│   ├── posts/             # 博客文章
│   ├── index.md           # 首页
│   └── about.md           # 关于页
├── .github/workflows/     # GitHub Actions
├── .gitignore
├── package.json
└── README.md
```

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run docs:dev

# 构建生产版本
npm run docs:build

# 预览构建结果
npm run docs:preview
```

## 📝 写作指南

1. 在 `docs/posts/` 目录下创建 Markdown 文件
2. 更新 `docs/.vitepress/config.mts` 中的侧边栏配置
3. 提交代码到 GitHub，自动部署

## 📄 许可证

MIT
