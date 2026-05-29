---
title: uni-app 入门与项目搭建
date: 2024-02-10
---

# uni-app 入门与项目搭建

## 什么是 uni-app

uni-app 是一个使用 Vue.js 开发跨平台应用的前端框架，支持一次开发，多端部署。

## 环境准备

### 安装 Node.js
```bash
# 检查 Node.js 版本
node -v

# 安装 nvm（推荐）
# Windows: https://github.com/coreybutler/nvm-windows
# macOS/Linux: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

### 安装 HBuilderX
- 下载地址：https://www.dcloud.io/hbuilderx.html
- 安装 uni-app 插件

### 创建项目

```bash
# 使用官方脚手架
npx degit dcloudio/uni-preset-vue#vite-ts .

# 安装依赖
npm install

# 运行项目
npm run dev:h5    # H5
npm run dev:mp-weixin  # 微信小程序
```

## 项目结构

```
├── src/
│   ├── components/     # 组件目录
│   ├── pages/          # 页面目录
│   │   ├── index/      # 首页
│   │   │   └── index.vue
│   │   └── about/      # 关于页
│   │       └── index.vue
│   ├── static/         # 静态资源
│   ├── App.vue         # 应用入口
│   ├── main.ts         # 主入口文件
│   └── pages.json      # 页面配置
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## pages.json 配置

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "首页",
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/about/index",
      "style": {
        "navigationBarTitleText": "关于"
      }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "芝麻粒",
    "navigationBarBackgroundColor": "#ffffff",
    "backgroundColor": "#f5f5f5"
  },
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#007aff",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "static/home.png",
        "selectedIconPath": "static/home-active.png"
      },
      {
        "pagePath": "pages/about/index",
        "text": "关于",
        "iconPath": "static/about.png",
        "selectedIconPath": "static/about-active.png"
      }
    ]
  }
}
```

## 常用命令

```bash
# 开发模式
npm run dev:h5          # H5 开发
npm run dev:mp-weixin   # 微信小程序开发

# 构建生产版本
npm run build:h5        # H5 构建
npm run build:mp-weixin # 微信小程序构建

# 预览
npm run preview:h5      # H5 预览
npm run preview:mp-weixin # 微信小程序预览
```

## 注意事项

1. **跨平台差异**：注意 H5 和小程序的 API 差异
2. **样式兼容**：使用 uni-app 提供的样式变量
3. **性能优化**：注意小程序的包体积限制
4. **调试工具**：使用 HBuilderX 的真机调试功能
