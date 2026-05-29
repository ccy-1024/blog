---
title: Webpack 性能优化
date: 2024-09-05
---

# Webpack 性能优化

## Webpack 构建流程

```
┌─────────────────────────────────────────────────────────┐
│                   Webpack 构建流程                     │
├─────────────────────────────────────────────────────────┤
│  入口 ──> 解析 ──> 编译 ──> 优化 ──> 输出           │
│     │         │         │         │         │          │
│     ▼         ▼         ▼         ▼         ▼          │
│  entry    AST       转换       压缩      bundle       │
│           构建      tree      混淆                    │
│                     shaking                          │
└─────────────────────────────────────────────────────────┘
```

## 构建速度优化

### 缓存配置

```javascript
// webpack.config.js
const path = require('path')

module.exports = {
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  }
}
```

### 多进程构建

```javascript
const webpack = require('webpack')
const HappyPack = require('happypack')

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'happypack/loader?id=js',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new HappyPack({
      id: 'js',
      loaders: ['babel-loader'],
      threads: 4
    })
  ]
}
```

### 排除不必要的模块

```javascript
module.exports = {
  module: {
    noParse: /jquery|lodash/,
    
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
    extensions: ['.js', '.jsx', '.json'],
    modules: [path.resolve(__dirname, 'node_modules')]
  }
}
```

## 代码分割

### 入口分割

```javascript
module.exports = {
  entry: {
    main: './src/index.js',
    vendor: ['react', 'react-dom', 'lodash']
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
}
```

### 动态导入

```javascript
// 动态导入组件
const LazyComponent = React.lazy(() => import('./LazyComponent'))

// 路由级别的代码分割
const routes = [
  {
    path: '/about',
    component: React.lazy(() => import('./About'))
  }
]

// 按需加载
async function loadFeature() {
  const feature = await import('./feature')
  feature.init()
}
```

### SplitChunks 配置

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      minRemainingSize: 0,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  }
}
```

## 压缩优化

### Terser 压缩

```javascript
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          },
          mangle: true
        }
      })
    ]
  }
}
```

### CSS 压缩

```javascript
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

module.exports = {
  optimization: {
    minimizer: [
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          map: {
            inline: false
          }
        }
      })
    ]
  }
}
```

## Tree Shaking

```javascript
// package.json
{
  "sideEffects": false
}

// webpack.config.js
module.exports = {
  optimization: {
    usedExports: true
  }
}

// 确保导入语句是 ES Module
import { debounce } from 'lodash-es'
```

## 资源优化

### 图片优化

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[contenthash].[ext]',
              outputPath: 'images/'
            }
          },
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: { quality: 80 },
              optipng: { enabled: true },
              pngquant: { quality: [0.6, 0.8] }
            }
          }
        ]
      }
    ]
  }
}
```

### 字体优化

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[hash:8].[ext]',
            outputPath: 'fonts/'
          }
        }
      }
    ]
  }
}
```

## 性能监控

```javascript
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const smp = new SpeedMeasurePlugin()

module.exports = smp.wrap({
  // webpack 配置
})

// 分析打包体积
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html'
    })
  ]
}
```

## 开发环境优化

```javascript
module.exports = {
  devtool: 'eval-cheap-module-source-map',
  
  devServer: {
    hot: true,
    inline: true,
    compress: true,
    stats: 'errors-only'
  }
}
```

## 总结

| 优化维度 | 具体措施 |
|----------|----------|
| 构建速度 | 缓存、多进程、排除不必要模块 |
| 代码分割 | 入口分割、动态导入、SplitChunks |
| 压缩优化 | Terser、CSS 压缩、Tree Shaking |
| 资源优化 | 图片压缩、字体处理 |
| 性能监控 | SpeedMeasure、BundleAnalyzer |
