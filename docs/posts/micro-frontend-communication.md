---
title: 微前端通信方案详解
date: 2024-02-05
---

# 微前端通信方案详解

## 通信场景分类

### 父子通信
- 父应用向子应用传递配置信息
- 子应用向父应用上报状态

### 兄弟通信
- 子应用之间的数据共享
- 子应用之间的事件通知

### 全局状态管理
- 跨应用的状态同步
- 用户登录状态、主题配置等

## 方案一：CustomEvent 事件通信

```javascript
// 发送消息
function emit(eventName, data) {
  window.dispatchEvent(new CustomEvent(eventName, {
    detail: data,
    bubbles: false,
    cancelable: false
  }))
}

// 监听消息
function on(eventName, callback) {
  window.addEventListener(eventName, (e) => {
    callback(e.detail)
  })
}

// 使用示例
emit('user-login', { userId: '123', name: '芝麻粒' })
on('user-login', (data) => {
  console.log('用户登录:', data)
})
```

## 方案二：全局状态管理器

```javascript
// 全局状态管理
class GlobalState {
  constructor() {
    this.state = {}
    this.listeners = new Map()
  }

  set(key, value) {
    this.state[key] = value
    this.notify(key, value)
  }

  get(key) {
    return this.state[key]
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key).add(callback)
  }

  unsubscribe(key, callback) {
    this.listeners.get(key)?.delete(callback)
  }

  notify(key, value) {
    this.listeners.get(key)?.forEach(callback => {
      callback(value)
    })
  }
}

// 全局实例
window.globalState = new GlobalState()

// 使用示例
globalState.subscribe('theme', (theme) => {
  console.log('主题变更:', theme)
})

globalState.set('theme', 'dark')
```

## 方案三：Shared Worker

```javascript
// 主应用创建 Shared Worker
const worker = new SharedWorker('shared-worker.js')

worker.port.postMessage({ type: 'init', appId: 'app1' })

worker.port.onmessage = (e) => {
  console.log('收到消息:', e.data)
}

// shared-worker.js
const ports = []

self.onconnect = (e) => {
  const port = e.ports[0]
  ports.push(port)
  
  port.onmessage = (e) => {
    // 广播消息给所有连接的端口
    ports.forEach(p => {
      if (p !== port) {
        p.postMessage(e.data)
      }
    })
  }
}
```

## 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| CustomEvent | 简单、无依赖 | 缺乏状态管理 | 简单通信场景 |
| 全局状态管理器 | 状态统一管理 | 需要维护状态 | 复杂状态同步 |
| Shared Worker | 隔离性好 | 兼容性有限 | 需要跨域通信 |

## 实践建议

1. **避免过度通信**：减少不必要的跨应用通信
2. **定义通信协议**：制定统一的数据格式和事件命名规范
3. **做好错误处理**：处理通信失败的情况
4. **性能优化**：对于频繁更新的数据，考虑合并或节流
