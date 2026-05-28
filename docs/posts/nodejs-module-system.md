---
title: Node.js 模块系统源码解析
date: 2024-06-01
---

# Node.js 模块系统源码解析

## 模块系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    模块加载流程                          │
├─────────────────────────────────────────────────────────┤
│  require(module)                                       │
│      │                                                 │
│      ▼                                                 │
│  Module._load(request, parent, isMain)                 │
│      │                                                 │
│      ▼                                                 │
│  Module._resolveFilename(request, parent)              │
│      │                                                 │
│      ▼                                                 │
│  文件查找 (路径解析)                                     │
│      │                                                 │
│      ▼                                                 │
│  Module.cache 检查                                      │
│      │                                                 │
│      ├─ 命中 → 返回缓存模块                              │
│      │                                                 │
│      └─ 未命中 → 加载文件                               │
│              │                                         │
│              ▼                                         │
│         编译执行 (wrap)                                 │
│              │                                         │
│              ▼                                         │
│         添加到缓存                                      │
│              │                                         │
│              ▼                                         │
│         返回 module.exports                             │
└─────────────────────────────────────────────────────────┘
```

## require 实现原理

```javascript
// 简化的 require 实现
function require(path) {
  return Module._load(path, this, false)
}

Module._load = function(request, parent, isMain) {
  // 解析文件名
  const filename = Module._resolveFilename(request, parent)
  
  // 检查缓存
  if (Module.cache[filename]) {
    return Module.cache[filename].exports
  }
  
  // 创建新模块
  const module = new Module(filename, parent)
  
  // 添加到缓存
  Module.cache[filename] = module
  
  // 加载模块
  try {
    module.load(filename)
    return module.exports
  } catch (err) {
    // 加载失败，从缓存移除
    delete Module.cache[filename]
    throw err
  }
}
```

## 路径解析机制

```javascript
Module._resolveFilename = function(request, parent) {
  const resolvedPath = resolve(request, parent.paths)
  
  // 尝试添加扩展名
  const exts = Object.keys(Module._extensions)
  
  for (const ext of exts) {
    if (fs.existsSync(resolvedPath + ext)) {
      return resolvedPath + ext
    }
  }
  
  throw new Error(`Cannot find module '${request}'`)
}

// 模块搜索路径
Module._nodeModulePaths = function(from) {
  const paths = []
  let parts = path.dirname(from).split(path.sep)
  
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] === 'node_modules') continue
    parts[i] = 'node_modules'
    paths.push(parts.join(path.sep))
  }
  
  // 添加全局 node_modules
  paths.push(path.join(process.execPath, '..', 'lib', 'node_modules'))
  
  return paths
}
```

## 文件加载与编译

```javascript
Module.prototype.load = function(filename) {
  const ext = path.extname(filename)
  
  // 根据扩展名选择加载方式
  if (Module._extensions[ext]) {
    Module._extensions[ext](this, filename)
  } else {
    Module._extensions['.js'](this, filename)
  }
}

// JavaScript 模块编译
Module._extensions['.js'] = function(module, filename) {
  const content = fs.readFileSync(filename, 'utf8')
  
  // 包装模块代码
  const wrapper = Module.wrap(content)
  
  // 创建模块函数
  const compiledWrapper = vm.runInThisContext(wrapper, {
    filename,
    lineOffset: 0
  })
  
  // 执行模块函数
  const args = [
    module.exports,  // exports
    require,        // require
    module,         // module
    filename,       // __filename
    path.dirname(filename)  // __dirname
  ]
  
  compiledWrapper.apply(module.exports, args)
}

// 模块包装函数
Module.wrap = function(script) {
  return `(function(exports, require, module, __filename, __dirname) {
${script}
})`
}
```

## 循环依赖处理

```javascript
// 循环依赖示例
// a.js
const b = require('./b')
console.log('a loaded, b is:', b)
module.exports = 'a'

// b.js  
const a = require('./a')
console.log('b loaded, a is:', a)
module.exports = 'b'

// 执行 require('./a')
// 输出:
// b loaded, a is: {}  // a 还未完成，exports 是空对象
// a loaded, b is: b

// 原理：模块创建后立即加入缓存，即使还未完成加载
```

## 模块类型

### CommonJS 模块

```javascript
// 导出方式
module.exports = { foo: 'bar' }
exports.foo = 'bar'

// 注意：不能直接赋值 exports
// ❌ exports = { foo: 'bar' }
// ✅ module.exports = { foo: 'bar' }
```

### ES Module

```javascript
// package.json 中声明
{
  "type": "module"
}

// 导入导出
import { foo } from './module.js'
export const bar = 'value'
export default { baz: 'qux' }
```

### JSON 模块

```javascript
// 直接导入 JSON
const config = require('./config.json')
console.log(config.port)
```

### Native 模块

```javascript
// C/C++ 扩展
const crypto = require('crypto')
const fs = require('fs')
```

## 模块缓存

```javascript
// 清除模块缓存
function clearCache(moduleName) {
  const modulePath = require.resolve(moduleName)
  
  if (Module.cache[modulePath]) {
    delete Module.cache[modulePath]
  }
  
  // 清除子模块缓存
  Object.keys(Module.cache).forEach(key => {
    if (key.startsWith(modulePath)) {
      delete Module.cache[key]
    }
  })
}
```

## 最佳实践

1. **避免循环依赖**：设计模块时避免循环引用
2. **使用路径别名**：配置 NODE_PATH 或使用模块解析工具
3. **按需加载**：使用动态 import() 实现懒加载
4. **模块拆分**：将大模块拆分为小模块，提高可维护性
5. **缓存策略**：对于计算密集的模块，考虑缓存结果

## 总结

| 核心组件 | 作用 |
|----------|------|
| `Module._load` | 模块加载入口 |
| `Module._resolveFilename` | 路径解析 |
| `Module.cache` | 模块缓存 |
| `Module.wrap` | 代码包装 |
| `vm.runInThisContext` | 代码执行 |
