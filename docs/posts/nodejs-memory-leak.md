---
title: Node.js 内存泄漏排查
date: 2024-03-15
---

# Node.js 内存泄漏排查

## 常见内存泄漏场景

### 场景1：未清理的定时器

```javascript
// 错误示例：定时器引用未清理
function startTimer() {
  setInterval(() => {
    console.log('tick')
  }, 1000)
}

// 正确做法：保存引用并在适当时候清除
let timer = null
function startTimer() {
  timer = setInterval(() => {
    console.log('tick')
  }, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
```

### 场景2：事件监听器未移除

```javascript
// 错误示例：事件监听器累积
const emitter = new EventEmitter()

function setupListener() {
  emitter.on('data', (data) => {
    console.log(data)
  })
}

// 正确做法：使用 once 或手动移除
function setupListener() {
  const handler = (data) => {
    console.log(data)
  }
  emitter.on('data', handler)
  
  // 保存 handler 引用以便后续移除
  return () => emitter.removeListener('data', handler)
}
```

### 场景3：缓存无限增长

```javascript
// 错误示例：缓存没有上限
const cache = {}

function getData(key) {
  if (cache[key]) {
    return cache[key]
  }
  const data = fetchData(key)
  cache[key] = data // 永远不会被清理
  return data
}

// 正确做法：设置缓存大小限制
const cache = new Map()
const MAX_CACHE_SIZE = 1000

function getData(key) {
  if (cache.has(key)) {
    return cache.get(key)
  }
  
  const data = fetchData(key)
  
  if (cache.size >= MAX_CACHE_SIZE) {
    // 删除最早的条目
    const firstKey = cache.keys().next().value
    cache.delete(firstKey)
  }
  
  cache.set(key, data)
  return data
}
```

### 场景4：闭包引用

```javascript
// 错误示例：闭包捕获大对象
function createCallback() {
  const largeObject = new Array(100000).fill('data')
  
  return function() {
    console.log('callback')
    // 即使没有使用 largeObject，它也被闭包捕获
  }
}

// 正确做法：只捕获需要的变量
function createCallback() {
  const neededValue = 'important'
  
  return function() {
    console.log(neededValue)
  }
}
```

## 使用 Chrome DevTools 排查

### 步骤1：启动调试模式

```bash
node --inspect=0.0.0.0:9229 app.js
```

### 步骤2：打开 Chrome DevTools

在 Chrome 中输入：`chrome://inspect`

### 步骤3：获取堆快照

1. 点击 Memory 面板
2. 选择 Heap snapshot
3. 点击 Take snapshot
4. 分析快照中的大对象和泄漏点

### 步骤4：对比快照

1. 执行可能导致泄漏的操作
2. 再次获取快照
3. 使用 Comparison 模式对比两次快照
4. 查找增长的对象

## 使用 heapdump 工具

```bash
npm install heapdump
```

```javascript
const heapdump = require('heapdump')

// 触发堆快照
heapdump.writeSnapshot((err, filename) => {
  console.log(`Snapshot written to ${filename}`)
})

// 或者通过信号触发
// kill -USR2 <pid>
```

## 使用 clinic.js 分析

```bash
npm install -g clinic
```

```bash
# CPU 分析
clinic flame -- node app.js

# 内存分析
clinic heap-profiler -- node app.js

# 阻塞分析
clinic bubbleprof -- node app.js
```

## 监控指标

```javascript
// 定期输出内存使用情况
setInterval(() => {
  const mem = process.memoryUsage()
  
  console.log(`Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`)
  console.log(`Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`)
  console.log(`External: ${(mem.external / 1024 / 1024).toFixed(2)} MB`)
}, 5000)
```

## 预防措施

1. **定期清理定时器和事件监听器**
2. **限制缓存大小**
3. **避免不必要的闭包引用**
4. **使用 WeakRef 和 FinalizationRegistry**（Node.js 14+）
5. **定期进行压力测试**

## 诊断流程

```
内存泄漏检测流程：
  1. 发现内存持续增长
  2. 生成堆快照
  3. 分析快照找出泄漏点
  4. 修复代码
  5. 验证修复效果
```
