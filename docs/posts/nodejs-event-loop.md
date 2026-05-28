---
title: Node.js 事件循环：从踩坑到理解
date: 2024-01-15
---

# Node.js 事件循环：从踩坑到理解

## 一个踩坑的例子

先看一段代码：

```javascript
console.log('1. 开始')

setTimeout(() => {
  console.log('2. setTimeout 100ms')
}, 100)

setImmediate(() => {
  console.log('3. setImmediate')
})

// 一个非常耗时的同步操作
function blockingOperation() {
  const start = Date.now()
  while (Date.now() - start < 2000) {
    // 阻塞 2 秒
  }
}

blockingOperation()

console.log('4. 结束')
```

你觉得输出顺序是什么？答案是：1 → 4 → 2 → 3

为什么 setTimeout 明明设置了 100ms，却在同步代码执行完才执行？这就是事件循环的问题。

## 事件循环的六个阶段

Node.js 的事件循环分为六个阶段，按顺序执行：

```
┌─────────────────────────────────────────────────────────────┐
│                    事件循环阶段                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│   │  timers  │ -> │ I/O 回调  │ -> │ idle/prepare │        │
│   └──────────┘    └──────────┘    └──────────┘            │
│         │                  │                   │            │
│         ▼                  ▼                   ▼            │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│   │  close   │ <- │  check   │ <- │  poll    │            │
│   └──────────┘    └──────────┘    └──────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 各个阶段的作用

1. **timers**：执行 setTimeout 和 setInterval 的回调
2. **I/O callbacks**：执行 I/O 操作的回调（如文件读写、网络请求）
3. **idle/prepare**：内部使用，我们不用关心
4. **poll**：等待新的 I/O 事件，是最重要的阶段
5. **check**：执行 setImmediate 的回调
6. **close callbacks**：执行 close 事件的回调

## setTimeout vs setImmediate

这两个经常被混淆，我之前也搞不清楚它们的区别。

```javascript
// 情况一：在主模块中执行
setTimeout(() => {
  console.log('timeout')
}, 0)

setImmediate(() => {
  console.log('immediate')
})

// 输出顺序不确定，可能是 timeout 也可能是 immediate
```

```javascript
// 情况二：在 I/O 回调中执行
fs.readFile('./test.txt', () => {
  setTimeout(() => {
    console.log('timeout')
  }, 0)
  
  setImmediate(() => {
    console.log('immediate')
  })
})

// 输出顺序一定是：immediate -> timeout
```

为什么会这样？因为在 I/O 回调中，事件循环会进入 check 阶段，而 setImmediate 正好在这个阶段执行。

## process.nextTick 的特殊地位

process.nextTick 不在事件循环的六个阶段中，它有自己的队列，优先级最高。

```javascript
console.log('1. 开始')

setTimeout(() => {
  console.log('2. setTimeout')
}, 0)

process.nextTick(() => {
  console.log('3. nextTick')
})

console.log('4. 结束')

// 输出顺序：1 -> 4 -> 3 -> 2
```

## 实战建议

### 避免阻塞事件循环

```javascript
// 错误示例：同步执行大量计算
function processData(data) {
  const result = []
  for (let i = 0; i < 1000000; i++) {
    result.push(data[i] * 2)
  }
  return result
}

// 正确示例：分批处理，让出事件循环
async function processDataAsync(data) {
  const result = []
  const batchSize = 1000
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    batch.forEach(item => result.push(item * 2))
    // 让出事件循环
    await new Promise(resolve => setImmediate(resolve))
  }
  
  return result
}
```

### 使用 worker_threads 处理 CPU 密集任务

对于 CPU 密集型任务，最好使用 worker_threads：

```javascript
// main.js
const { Worker, isMainThread, parentPort } = require('worker_threads')

if (isMainThread) {
  const worker = new Worker('./worker.js')
  worker.postMessage({ type: 'compute', data: [1, 2, 3, 4, 5] })
  worker.on('message', result => {
    console.log('计算结果:', result)
  })
} else {
  parentPort.on('message', ({ type, data }) => {
    if (type === 'compute') {
      const result = data.map(x => x * x)
      parentPort.postMessage(result)
    }
  })
}
```

## 总结

理解事件循环对编写高性能 Node.js 代码非常重要：

1. **不要阻塞事件循环**：避免长时间的同步操作
2. **合理使用定时器**：理解 setTimeout 和 setImmediate 的区别
3. **CPU 密集任务用 worker**：充分利用多核 CPU
4. **process.nextTick 慎用**：虽然优先级高，但过度使用会阻塞其他任务

如果你也有事件循环相关的踩坑经历，欢迎留言分享！

---

感谢阅读！🎉
