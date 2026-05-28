---
title: Vite 插件开发指南
date: 2024-04-15
---

# Vite 插件开发指南

## Vite 插件基础

### 插件结构

```typescript
export default function myPlugin(options = {}) {
  return {
    name: 'my-plugin',  // 插件名称，用于错误信息和日志
    
    // 插件钩子
    buildStart() {
      console.log('构建开始')
    },
    
    buildEnd() {
      console.log('构建结束')
    }
  }
}
```

### 插件配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import myPlugin from './plugins/my-plugin'

export default defineConfig({
  plugins: [
    myPlugin({
      option1: 'value1',
      option2: true
    })
  ]
})
```

## 核心钩子

### 构建钩子

```typescript
export default function myPlugin() {
  return {
    name: 'my-plugin',
    
    // 构建开始时调用
    buildStart(options) {
      console.log('buildStart:', options)
    },
    
    // 解析模块时调用
    resolveId(id) {
      // 返回自定义模块路径
      if (id.startsWith('@my/')) {
        return `/custom/path/${id.slice(4)}`
      }
    },
    
    // 加载模块时调用
    load(id) {
      // 返回模块内容
      if (id.endsWith('.custom')) {
        return 'export default "custom module"'
      }
    },
    
    // 转换代码时调用
    transform(code, id) {
      // 修改代码
      if (id.endsWith('.js')) {
        return code.replace('console.log', 'console.warn')
      }
    },
    
    // 构建结束时调用
    buildEnd(error) {
      if (error) {
        console.error('构建失败:', error)
      } else {
        console.log('构建成功')
      }
    }
  }
}
```

### 服务端钩子

```typescript
export default function myPlugin() {
  return {
    name: 'my-plugin',
    
    // 开发服务器启动时调用
    configureServer(server) {
      // 添加自定义中间件
      server.middlewares.use((req, res, next) => {
        if (req.url === '/custom-api') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ message: 'Hello from custom API' }))
          return
        }
        next()
      })
    },
    
    // 热更新时调用
    handleHotUpdate({ file, server }) {
      console.log('文件变更:', file)
      
      // 手动触发热更新
      server.ws.send({
        type: 'custom',
        event: 'file-change',
        data: { file }
      })
    }
  }
}
```

## 实用插件示例

### 示例1：代码替换插件

```typescript
export default function replacePlugin(options) {
  const { replacements = [] } = options
  
  return {
    name: 'replace-plugin',
    
    transform(code, id) {
      let result = code
      
      replacements.forEach(({ from, to }) => {
        result = result.replace(new RegExp(from, 'g'), to)
      })
      
      return result
    }
  }
}

// 使用
// replacePlugin({
//   replacements: [
//     { from: '__VERSION__', to: '1.0.0' },
//     { from: 'console.log', to: '// console.log' }
//   ]
// })
```

### 示例2：自定义模块解析

```typescript
export default function aliasPlugin() {
  return {
    name: 'alias-plugin',
    
    resolveId(id) {
      // 将 @components 解析为 src/components
      if (id.startsWith('@components/')) {
        return `/src/components/${id.slice(12)}`
      }
      
      // 返回 null 表示使用默认解析
      return null
    }
  }
}

// 使用
// import Button from '@components/Button.vue'
// 会被解析为 /src/components/Button.vue
```

### 示例3：资源处理插件

```typescript
export default function assetPlugin() {
  return {
    name: 'asset-plugin',
    
    load(id) {
      if (id.endsWith('.svg')) {
        const fs = require('fs')
        const content = fs.readFileSync(id, 'utf-8')
        
        // 将 SVG 转换为 base64
        const base64 = Buffer.from(content).toString('base64')
        return `export default "data:image/svg+xml;base64,${base64}"`
      }
      
      return null
    }
  }
}
```

## 插件执行顺序

### 钩子执行顺序

```
构建阶段：
  buildStart → resolveId → load → transform → buildEnd

开发服务器：
  configureServer → buildStart → ... → handleHotUpdate
```

### 插件顺序配置

```typescript
export default defineConfig({
  plugins: [
    pluginA(),  // 先执行
    pluginB()   // 后执行
  ]
})
```

## 常用工具函数

### 获取模块信息

```typescript
export default function myPlugin() {
  return {
    name: 'my-plugin',
    
    async resolveId(id, importer) {
      // 获取导入路径
      console.log('导入路径:', id)
      console.log('导入者:', importer)
      
      // 使用 Vite 的解析功能
      const resolved = await this.resolve(id, importer)
      return resolved?.id
    }
  }
}
```

### 生成代码

```typescript
export default function myPlugin() {
  return {
    name: 'my-plugin',
    
    transform(code, id) {
      if (id.endsWith('.vue')) {
        // 添加自定义代码
        return code + '\nconsole.log("Processed by my-plugin")'
      }
      
      return code
    }
  }
}
```

## 调试插件

### 使用 debug 模式

```bash
# 开启调试
DEBUG=vite:plugin-development npm run dev
```

### 打印日志

```typescript
export default function myPlugin() {
  return {
    name: 'my-plugin',
    
    transform(code, id) {
      // 打印调试信息
      this.info(`Transforming: ${id}`)
      this.warn(`Large file: ${id}`)
      this.error(`Error processing: ${id}`)
      
      return code
    }
  }
}
```

## 发布插件

### package.json 配置

```json
{
  "name": "vite-plugin-my-plugin",
  "version": "1.0.0",
  "description": "My Vite Plugin",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": ["vite", "plugin"],
  "peerDependencies": {
    "vite": "^5.0.0"
  }
}
```

### 构建配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs']
    }
  }
})
```

## 最佳实践

1. **钩子选择**：根据需求选择合适的钩子
2. **错误处理**：使用 `this.error()` 抛出清晰的错误信息
3. **性能优化**：避免在 transform 钩子中做耗时操作
4. **测试覆盖**：编写单元测试确保插件正确性
5. **文档完善**：提供清晰的使用说明和示例

## 参考资源

- [Vite 官方插件 API](https://vitejs.dev/guide/api-plugin.html)
- [Vite 插件列表](https://github.com/vitejs/awesome-vite#plugins)
