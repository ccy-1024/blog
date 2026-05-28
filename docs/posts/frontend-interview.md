---
title: 前端面试题解析
date: 2024-10-15
---

# 前端面试题解析

## 面试题分类

```
┌─────────────────────────────────────────────────────────┐
│                    面试题分类                          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   JavaScript │  │   CSS/HTML   │  │   Vue/React  │ │
│  │     基础     │  │    基础      │  │    框架      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   浏览器     │  │   网络协议   │  │   工程化     │ │
│  │     原理     │  │     HTTP     │  │    工具链    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## JavaScript 基础

### 闭包

```javascript
// 什么是闭包？
// 闭包是指有权访问另一个函数作用域中变量的函数

function createCounter() {
  let count = 0
  
  return {
    increment() {
      count++
      return count
    },
    decrement() {
      count--
      return count
    },
    getCount() {
      return count
    }
  }
}

const counter = createCounter()
console.log(counter.increment()) // 1
console.log(counter.increment()) // 2
console.log(counter.getCount()) // 2
```

### 原型链

```javascript
// 原型链是什么？
// 每个对象都有 __proto__ 属性，指向它的原型对象
// 当访问对象的属性时，会沿着原型链向上查找

function Person(name) {
  this.name = name
}

Person.prototype.sayHello = function() {
  console.log(`Hello, ${this.name}`)
}

const person = new Person('John')
person.sayHello() // Hello, John

// 原型链：person -> Person.prototype -> Object.prototype -> null
```

### 事件循环

```javascript
// 事件循环的执行顺序
// 1. 执行同步代码（调用栈）
// 2. 执行微任务队列（Promise.then, MutationObserver）
// 3. 执行宏任务队列（setTimeout, setInterval, I/O）

console.log('1') // 同步

setTimeout(() => {
  console.log('2') // 宏任务
}, 0)

Promise.resolve().then(() => {
  console.log('3') // 微任务
})

console.log('4') // 同步

// 输出顺序: 1, 4, 3, 2
```

## CSS/HTML 基础

### Flexbox 布局

```css
/* Flexbox 常用属性 */
.container {
  display: flex;
  
  /* 主轴方向 */
  flex-direction: row; /* row | row-reverse | column | column-reverse */
  
  /* 主轴对齐 */
  justify-content: center; /* flex-start | flex-end | center | space-between | space-around */
  
  /* 交叉轴对齐 */
  align-items: center; /* flex-start | flex-end | center | baseline | stretch */
  
  /* 换行 */
  flex-wrap: wrap; /* nowrap | wrap | wrap-reverse */
}

.item {
  /* 弹性增长 */
  flex-grow: 1;
  
  /* 弹性收缩 */
  flex-shrink: 1;
  
  /* 基础大小 */
  flex-basis: auto;
}
```

### CSS 优先级

```css
/* 优先级从高到低 */
/* 1. !important */
/* 2. 内联样式 */
/* 3. ID 选择器 */
/* 4. 类选择器、伪类、属性选择器 */
/* 5. 元素选择器、伪元素 */
/* 6. 通配符选择器 */

/* 示例 */
#id { color: red; }           /* 优先级: 100 */
.class { color: blue; }       /* 优先级: 10 */
element { color: green; }     /* 优先级: 1 */
```

### BFC

```css
/* BFC (Block Formatting Context) */
/* 触发 BFC 的方式 */
.bfc {
  overflow: hidden;
  /* 或 */
  float: left;
  /* 或 */
  position: absolute;
  /* 或 */
  display: flow-root;
}

/* BFC 的作用 */
/* 1. 清除浮动 */
/* 2. 防止 margin 重叠 */
/* 3. 元素不会被浮动元素覆盖 */
```

## Vue/React 框架

### Vue3 响应式原理

```javascript
// Vue3 使用 Proxy 实现响应式
const target = { name: 'John' }

const proxy = new Proxy(target, {
  get(target, key, receiver) {
    // 依赖收集
    track(target, key)
    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    const result = Reflect.set(target, key, value, receiver)
    // 触发更新
    trigger(target, key)
    return result
  }
})
```

### React Hooks 规则

```javascript
// Hooks 规则
// 1. 只能在函数组件或自定义 Hook 中调用
// 2. 只能在函数顶层调用，不能在循环、条件、嵌套函数中调用

function MyComponent() {
  // ✅ 正确：在顶层调用
  const [count, setCount] = useState(0)
  
  // ❌ 错误：在条件中调用
  if (count > 0) {
    const [name, setName] = useState('')
  }
  
  return <div>{count}</div>
}
```

## 浏览器原理

### 渲染流程

```javascript
// 浏览器渲染步骤
// 1. HTML 解析 → DOM Tree
// 2. CSS 解析 → CSSOM Tree
// 3. DOM + CSSOM → Render Tree
// 4. Layout (布局)
// 5. Paint (绘制)
// 6. Composite (合成)

// 重排 vs 重绘
// 重排 (Reflow): 布局发生变化，性能开销大
// 重绘 (Repaint): 样式发生变化，性能开销小

// 优化策略
// 1. 使用 transform 代替 top/left
// 2. 使用 will-change 提示浏览器
// 3. 批量 DOM 操作
```

### 跨域解决方案

```javascript
// 跨域解决方案
// 1. CORS (后端配置)
// Access-Control-Allow-Origin: *

// 2. 代理服务器
// 在前端和后端之间设置代理

// 3. JSONP (仅支持 GET)
function jsonp(url, callback) {
  const script = document.createElement('script')
  script.src = `${url}?callback=${callback}`
  document.body.appendChild(script)
}

// 4. WebSocket
const socket = new WebSocket('wss://example.com')
```

## 网络协议

### HTTP/HTTPS

```javascript
// HTTP 状态码
// 1xx: 信息性响应
// 2xx: 成功 (200 OK, 201 Created, 204 No Content)
// 3xx: 重定向 (301 Moved Permanently, 302 Found, 304 Not Modified)
// 4xx: 客户端错误 (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found)
// 5xx: 服务器错误 (500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable)

// HTTP/2 特性
// - 多路复用
// - 头部压缩
// - 服务器推送
// - 优先级
```

### TCP/IP 三次握手

```
┌─────────────────────┐           ┌─────────────────────┐
│        Client       │           │        Server       │
└──────────┬──────────┘           └──────────┬──────────┘
           │                                  │
           │  SYN (seq=x)                     │
           ├─────────────────────────────────>│
           │                                  │
           │              SYN+ACK (seq=y,     │
           │              ack=x+1)            │
           │<─────────────────────────────────┤
           │                                  │
           │  ACK (ack=y+1)                   │
           ├─────────────────────────────────>│
           │                                  │
           │         连接建立                   │
           │                                  │
```

## 工程化

### Webpack 原理

```javascript
// Webpack 核心概念
// Entry: 入口文件
// Output: 输出配置
// Loader: 转换模块
// Plugin: 扩展功能

// 简化的 Webpack 流程
// 1. 解析入口文件
// 2. 递归解析依赖
// 3. 使用 Loader 转换文件
// 4. 生成 AST
// 5. 代码优化（Tree Shaking, 压缩）
// 6. 输出 Bundle
```

### Git 工作流

```javascript
// Git Flow 工作流
// - main: 主分支，生产代码
// - develop: 开发分支
// - feature/*: 功能分支
// - release/*: 发布分支
// - hotfix/*: 热修复分支

// 常用命令
// git branch <name> - 创建分支
// git checkout <name> - 切换分支
// git merge <name> - 合并分支
// git rebase <name> - 变基
// git cherry-pick <commit> - 挑选提交
```

## 手写题

### Promise.all

```javascript
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = []
    let completed = 0
    
    if (promises.length === 0) {
      resolve(results)
      return
    }
    
    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then((value) => {
          results[index] = value
          completed++
          
          if (completed === promises.length) {
            resolve(results)
          }
        })
        .catch((error) => {
          reject(error)
        })
    })
  })
}
```

### 防抖和节流

```javascript
// 防抖
function debounce(fn, delay = 300) {
  let timer = null
  
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 节流
function throttle(fn, delay = 100) {
  let lastTime = 0
  
  return function(...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}
```

### 深拷贝

```javascript
function deepClone(obj, hash = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj)
  }
  
  if (obj instanceof RegExp) {
    return new RegExp(obj)
  }
  
  if (hash.has(obj)) {
    return hash.get(obj)
  }
  
  const clone = Array.isArray(obj) ? [] : {}
  hash.set(obj, clone)
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key], hash)
    }
  }
  
  return clone
}
```

## 总结

| 知识点 | 重点内容 |
|--------|----------|
| JS 基础 | 闭包、原型链、事件循环、异步编程 |
| CSS/HTML | Flexbox、Grid、BFC、优先级 |
| 框架 | Vue3 响应式、React Hooks、组件通信 |
| 浏览器 | 渲染流程、重排重绘、跨域 |
| 网络 | HTTP 状态码、HTTP/2、TCP 握手 |
| 工程化 | Webpack、Git 工作流、CI/CD |
