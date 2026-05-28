---
title: 前端调试技巧与工具
date: 2024-09-25
---

# 前端调试技巧与工具

## 调试工具架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端调试体系                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  浏览器调试  │  │  代码调试    │  │  性能调试    │ │
│  │  DevTools    │  │  Console API │  │  Performance │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  网络调试    │  │  断点调试    │  │  内存调试    │ │
│  │  Network     │  │  Breakpoints │  │  Memory      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 浏览器 DevTools 调试

### Console 调试技巧

```javascript
// 基本输出
console.log('Hello World')
console.info('Info message')
console.warn('Warning message')
console.error('Error message')

// 格式化输出
console.log('User: %s, Age: %d, Score: %f', 'John', 25, 95.5)

// 对象输出
const user = { name: 'John', age: 25 }
console.log('User:', user)
console.table(user)
console.dir(user)

// 分组输出
console.group('User Info')
console.log('Name:', user.name)
console.log('Age:', user.age)
console.groupEnd()

// 计时
console.time('Operation')
// 执行操作
for (let i = 0; i < 100000; i++) {}
console.timeEnd('Operation')

// 断言
console.assert(1 === 2, 'Assertion failed')

// 清除控制台
console.clear()
```

### 断点调试

```javascript
// 条件断点
function processUser(user) {
  // 在这行设置断点，条件: user.age > 18
  console.log('Processing user:', user)
}

// 日志断点
function fetchData(url) {
  // 在这行设置日志断点，输出: 'Fetching:', url
  return fetch(url)
}

// 异常断点
// 在 Sources -> Breakpoints -> 勾选 "Pause on exceptions"

// DOM 断点
// 在 Elements 面板右键元素 -> Break on -> Subtree modifications

// XHR/fetch 断点
// 在 Network 面板右键请求 -> Add XHR breakpoint
```

### Network 调试

```javascript
// 过滤请求
// 在 Network 面板搜索框输入:
// - method:GET / method:POST
// - status-code:200
// - domain:api.example.com
// - larger-than:100000

// 模拟网络条件
// 在 Network 面板 -> Throttling -> 选择网络条件

// 复制请求
// 在 Network 面板右键请求 -> Copy -> Copy as cURL

// 响应拦截
// 使用 Requestly 或 Chrome 插件修改响应
```

## 性能调试

### Performance 面板

```javascript
// 录制性能
// 1. 打开 Performance 面板
// 2. 点击 Record 按钮
// 3. 执行操作
// 4. 点击 Stop

// 分析结果
// - Main Thread: 主线程活动
// - Tasks: 任务执行时间
// - Frame Rate: 帧率
// - Memory: 内存使用

// 关键指标
// - FPS: 每秒帧数
// - CPU: CPU 使用率
// - NET: 网络请求
```

### 性能 API

```javascript
// 自定义性能标记
performance.mark('start')

// 执行操作
for (let i = 0; i < 10000; i++) {
  Math.sqrt(i)
}

performance.mark('end')
performance.measure('sqrt-operation', 'start', 'end')

// 获取测量结果
const measures = performance.getEntriesByName('sqrt-operation')
console.log('Duration:', measures[0].duration)

// 清除标记
performance.clearMarks()
performance.clearMeasures()
```

## 内存调试

### Memory 面板

```javascript
// 堆快照分析
// 1. 打开 Memory 面板
// 2. 选择 "Heap snapshot"
// 3. 点击 "Take snapshot"
// 4. 分析内存使用

// 查找内存泄漏
// - 对比多个快照
// - 查找 detached DOM 节点
// - 检查 retainers

// 内存分配时间线
// 1. 选择 "Allocation timeline"
// 2. 点击 Record
// 3. 执行操作
// 4. 分析内存分配
```

## 调试技巧

### 条件断点进阶

```javascript
// 使用正则表达式
// 在断点条件中输入: /error/i.test(message)

// 使用函数
// 在断点条件中输入: 
function shouldBreak() {
  return user.age > 18 && user.status === 'active'
}
shouldBreak()

// 跳过断点次数
// 右键断点 -> Edit -> 勾选 "Pause after hitting X times"
```

### 日志调试进阶

```javascript
// 自定义日志函数
const logger = {
  info(...args) {
    console.log(`[INFO] ${new Date().toISOString()}`, ...args)
  },
  error(...args) {
    console.error(`[ERROR] ${new Date().toISOString()}`, ...args)
  },
  group(name) {
    console.group(`[GROUP] ${name}`)
  },
  groupEnd() {
    console.groupEnd()
  }
}

// 使用 logger
logger.info('Application started')
logger.group('User Processing')
logger.info('User:', user)
logger.groupEnd()
```

### 远程调试

```javascript
// 远程调试移动端
// 1. 连接手机到电脑
// 2. 在 Chrome 中打开 chrome://inspect
// 3. 选择要调试的设备

// 远程调试 Node.js
// node --inspect server.js
// 在 Chrome 中打开 chrome://inspect

// VS Code 远程调试
// 在 launch.json 中配置
{
  "type": "chrome",
  "request": "launch",
  "url": "http://localhost:3000",
  "webRoot": "${workspaceFolder}"
}
```

## 调试工具

### React DevTools

```javascript
// 安装 React DevTools
// npm install -g react-devtools

// 使用 React DevTools
// react-devtools

// 功能
// - 组件树查看
// - 状态和属性检查
// - 性能分析
// - 组件高亮
```

### Vue DevTools

```javascript
// Vue DevTools 功能
// - 组件树查看
// - 响应式数据检查
// - 事件监听
// - 性能分析
// - Vuex 状态管理

// 安装
// Chrome 应用商店搜索 Vue.js devtools
```

### Redux DevTools

```javascript
// Redux DevTools 功能
// - 状态历史记录
// - 时间旅行调试
// - 状态变化追踪
// - 性能分析

// 配置
const store = createStore(
  rootReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
)
```

## 调试最佳实践

```javascript
// 1. 使用有意义的日志消息
// ❌ console.log('test')
// ✅ console.log('User login attempt:', user.email)

// 2. 避免使用 debugger 语句提交代码
// 使用 eslint 规则禁止 debugger

// 3. 使用条件日志
const DEBUG = process.env.NODE_ENV !== 'production'

if (DEBUG) {
  console.log('Debug info:', data)
}

// 4. 清理调试代码
// 使用 eslint-plugin-no-debugger
// 使用 git 钩子检查

// 5. 使用断点代替 console.log
// 断点可以暂停执行，查看上下文
```

## 总结

| 调试场景 | 工具/方法 |
|----------|-----------|
| 代码逻辑 | Console API、断点调试 |
| 网络请求 | Network 面板、cURL |
| 性能问题 | Performance 面板、Lighthouse |
| 内存问题 | Memory 面板、堆快照 |
| 框架调试 | React/Vue/Redux DevTools |
| 远程调试 | Chrome DevTools、VS Code |
