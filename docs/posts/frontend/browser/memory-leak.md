---
title: 内存泄漏排查与优化
date: 2024-09-15
---

# 内存泄漏排查与优化

## 内存泄漏类型

```
┌─────────────────────────────────────────────────────────┐
│                    内存泄漏类型                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ 全局变量泄漏 │  │  闭包泄漏    │  │  DOM泄漏     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ 定时器泄漏   │  │  事件监听器   │  │  缓存泄漏    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 常见泄漏场景

### 全局变量泄漏

```javascript
// 错误：隐式全局变量
function foo() {
  bar = 'hello' // 没有声明，成为全局变量
}

// 正确：使用 let/const
function foo() {
  const bar = 'hello'
}

// 检查全局变量
function detectGlobalLeaks() {
  const initialGlobals = new Set(Object.keys(window))
  
  // 执行代码后检查新增的全局变量
  setTimeout(() => {
    const currentGlobals = new Set(Object.keys(window))
    const leaked = [...currentGlobals].filter(g => !initialGlobals.has(g))
    console.log('Leaked globals:', leaked)
  }, 1000)
}
```

### 闭包泄漏

```javascript
// 错误：闭包持有外部变量引用
function createClosure() {
  const bigObject = new Array(100000).fill('data')
  
  return function() {
    return bigObject.length // 闭包持有 bigObject 引用
  }
}

// 正确：及时释放引用
function createClosure() {
  let bigObject = new Array(100000).fill('data')
  const length = bigObject.length
  
  bigObject = null // 释放引用
  
  return function() {
    return length // 只引用需要的值
  }
}
```

### DOM 泄漏

```javascript
// 错误：保留已移除 DOM 的引用
const elements = []

function addElement() {
  const el = document.createElement('div')
  elements.push(el)
  document.body.appendChild(el)
}

function removeElement() {
  const el = elements.pop()
  document.body.removeChild(el)
  // el 仍然在 elements 数组中被引用！
}

// 正确：移除引用
function removeElement() {
  const index = elements.findIndex(el => /* find element */)
  if (index !== -1) {
    const el = elements[index]
    document.body.removeChild(el)
    elements.splice(index, 1) // 移除引用
  }
}
```

### 定时器泄漏

```javascript
// 错误：忘记清理定时器
class TimerExample {
  constructor() {
    this.timer = setInterval(() => {
      console.log('tick')
    }, 1000)
  }
}

// 正确：组件销毁时清理
class TimerExample {
  constructor() {
    this.timer = setInterval(() => {
      console.log('tick')
    }, 1000)
  }
  
  destroy() {
    clearInterval(this.timer)
    this.timer = null
  }
}
```

### 事件监听器泄漏

```javascript
// 错误：忘记移除事件监听器
function setupListeners() {
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleScroll)
}

// 正确：及时移除
function setupListeners() {
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleScroll)
}

function cleanupListeners() {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleScroll)
}
```

## 内存分析工具

### Chrome DevTools 内存面板

```javascript
// 使用 console API 标记内存快照
console.profile('Memory Profile')

// 执行可能泄漏的代码
for (let i = 0; i < 1000; i++) {
  createObject()
}

console.profileEnd('Memory Profile')

// 堆快照
// 1. 打开 DevTools -> Memory
// 2. 点击 "Take snapshot"
// 3. 分析内存使用情况
```

### heapdump 工具

```javascript
// Node.js 环境使用 heapdump
const heapdump = require('heapdump')

// 定时生成堆快照
setInterval(() => {
  const filename = `heap-${Date.now()}.heapsnapshot`
  heapdump.writeSnapshot(filename)
  console.log(`Heap snapshot written to ${filename}`)
}, 60000)

// 触发快照
process.on('SIGUSR2', () => {
  heapdump.writeSnapshot(`heap-${Date.now()}.heapsnapshot`)
})
```

### 内存监控

```javascript
// 内存监控工具
class MemoryMonitor {
  constructor() {
    this.threshold = 500 * 1024 * 1024 // 500MB
    this.usageHistory = []
  }
  
  start() {
    this.interval = setInterval(() => {
      const usage = process.memoryUsage()
      this.usageHistory.push({
        timestamp: Date.now(),
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal
      })
      
      // 保留最近 100 条记录
      if (this.usageHistory.length > 100) {
        this.usageHistory.shift()
      }
      
      // 检查内存泄漏
      this.checkLeak()
    }, 1000)
  }
  
  checkLeak() {
    if (this.usageHistory.length < 10) return
    
    const recent = this.usageHistory.slice(-10)
    const avgUsed = recent.reduce((sum, u) => sum + u.heapUsed, 0) / recent.length
    
    if (avgUsed > this.threshold) {
      console.warn('Memory usage exceeded threshold:', avgUsed)
    }
  }
  
  stop() {
    clearInterval(this.interval)
  }
}
```

## 优化策略

### 对象池

```javascript
// 对象池实现
class ObjectPool {
  constructor(createFn, resetFn) {
    this.pool = []
    this.createFn = createFn
    this.resetFn = resetFn
  }
  
  acquire() {
    if (this.pool.length > 0) {
      const obj = this.pool.pop()
      this.resetFn(obj)
      return obj
    }
    return this.createFn()
  }
  
  release(obj) {
    this.pool.push(obj)
  }
  
  clear() {
    this.pool = []
  }
}

// 使用示例
const pool = new ObjectPool(
  () => ({ data: null, timestamp: null }),
  (obj) => { obj.data = null; obj.timestamp = null }
)

const obj = pool.acquire()
obj.data = 'some data'
obj.timestamp = Date.now()

// 使用完释放
pool.release(obj)
```

### 弱引用

```javascript
// 使用 WeakMap 避免内存泄漏
const cache = new WeakMap()

function cacheResult(key, value) {
  cache.set(key, value)
}

function getCached(key) {
  return cache.get(key)
}

// 使用 WeakSet 存储 DOM 元素
const observers = new WeakSet()

function observeElement(el) {
  observers.add(el)
  // 当 el 被 GC 时，会自动从 WeakSet 中移除
}
```

### 内存清理模式

```javascript
// 清理函数
function cleanup() {
  // 清理定时器
  if (this.timer) {
    clearInterval(this.timer)
    this.timer = null
  }
  
  // 清理事件监听器
  window.removeEventListener('resize', this.handleResize)
  
  // 清理引用
  this.data = null
  this.elements = null
  
  // 清理定时器
  if (this.timeout) {
    clearTimeout(this.timeout)
    this.timeout = null
  }
}

// 在组件卸载时调用
componentWillUnmount() {
  this.cleanup()
}
```

## 总结

| 泄漏类型 | 检测方法 | 解决方案 |
|----------|----------|----------|
| 全局变量 | 检查 window 对象 | 使用 let/const |
| 闭包 | 堆快照分析 | 及时释放引用 |
| DOM | 检查 detached DOM | 移除数组/对象引用 |
| 定时器 | 内存增长分析 | clearInterval/Timeout |
| 事件监听器 | 事件监听器数量 | removeEventListener |
| 缓存 | 缓存大小监控 | 使用 WeakMap |
