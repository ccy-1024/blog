---
title: Node.js 异步编程模型
date: 2024-07-05
---

# Node.js 异步编程模型

## 异步编程演进

```
回调函数 → Promise → Generator → Async/Await
     │           │           │            │
     ▼           ▼           ▼            ▼
  嵌套地狱    链式调用    协程概念    同步写法
```

## 回调函数

```javascript
// 回调函数示例
fs.readFile('file1.txt', 'utf8', (err1, data1) => {
  if (err1) throw err1
  
  fs.readFile('file2.txt', 'utf8', (err2, data2) => {
    if (err2) throw err2
    
    fs.readFile('file3.txt', 'utf8', (err3, data3) => {
      if (err3) throw err3
      
      console.log(data1 + data2 + data3)
    })
  })
})

// 回调地狱问题
// 1. 嵌套层级太深
// 2. 错误处理复杂
// 3. 代码可读性差
```

## Promise

```javascript
// Promise 封装
function readFilePromise(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, data) => {
      if (err) {
        reject(err)
        return
      }
      resolve(data)
    })
  })
}

// Promise 链式调用
readFilePromise('file1.txt')
  .then(data1 => {
    console.log(data1)
    return readFilePromise('file2.txt')
  })
  .then(data2 => {
    console.log(data2)
    return readFilePromise('file3.txt')
  })
  .then(data3 => {
    console.log(data3)
  })
  .catch(err => {
    console.error(err)
  })

// Promise.all 并行执行
Promise.all([
  readFilePromise('file1.txt'),
  readFilePromise('file2.txt'),
  readFilePromise('file3.txt')
])
.then(([data1, data2, data3]) => {
  console.log(data1 + data2 + data3)
})
.catch(err => {
  console.error(err)
})
```

## Generator

```javascript
// Generator 函数
function* generatorFunction() {
  yield 'First'
  yield 'Second'
  yield 'Third'
  return 'Done'
}

const gen = generatorFunction()
console.log(gen.next()) // { value: 'First', done: false }
console.log(gen.next()) // { value: 'Second', done: false }
console.log(gen.next()) // { value: 'Third', done: false }
console.log(gen.next()) // { value: 'Done', done: true }

// 使用 co 库实现异步流程控制
const co = require('co')

co(function* () {
  const data1 = yield readFilePromise('file1.txt')
  const data2 = yield readFilePromise('file2.txt')
  const data3 = yield readFilePromise('file3.txt')
  console.log(data1 + data2 + data3)
}).catch(err => {
  console.error(err)
})
```

## Async/Await

```javascript
// Async/Await 示例
async function readFiles() {
  try {
    const data1 = await readFilePromise('file1.txt')
    const data2 = await readFilePromise('file2.txt')
    const data3 = await readFilePromise('file3.txt')
    console.log(data1 + data2 + data3)
  } catch (err) {
    console.error(err)
  }
}

// 并行执行
async function readFilesParallel() {
  try {
    const [data1, data2, data3] = await Promise.all([
      readFilePromise('file1.txt'),
      readFilePromise('file2.txt'),
      readFilePromise('file3.txt')
    ])
    console.log(data1 + data2 + data3)
  } catch (err) {
    console.error(err)
  }
}

// 顺序执行（对比）
async function readFilesSequential() {
  const results = []
  const files = ['file1.txt', 'file2.txt', 'file3.txt']
  
  for (const file of files) {
    const data = await readFilePromise(file)
    results.push(data)
  }
  
  return results.join('')
}
```

## Promise 实现原理

```javascript
// 简化的 Promise 实现
class MyPromise {
  constructor(executor) {
    this.state = 'pending'
    this.value = undefined
    this.reason = undefined
    this.onFulfilledCallbacks = []
    this.onRejectedCallbacks = []
    
    const resolve = (value) => {
      if (this.state === 'pending') {
        this.state = 'fulfilled'
        this.value = value
        this.onFulfilledCallbacks.forEach(fn => fn(value))
      }
    }
    
    const reject = (reason) => {
      if (this.state === 'pending') {
        this.state = 'rejected'
        this.reason = reason
        this.onRejectedCallbacks.forEach(fn => fn(reason))
      }
    }
    
    try {
      executor(resolve, reject)
    } catch (err) {
      reject(err)
    }
  }
  
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      if (this.state === 'fulfilled') {
        setTimeout(() => {
          try {
            const result = onFulfilled(this.value)
            resolve(result)
          } catch (err) {
            reject(err)
          }
        }, 0)
      }
      
      if (this.state === 'rejected') {
        setTimeout(() => {
          try {
            const result = onRejected(this.reason)
            resolve(result)
          } catch (err) {
            reject(err)
          }
        }, 0)
      }
      
      if (this.state === 'pending') {
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              const result = onFulfilled(this.value)
              resolve(result)
            } catch (err) {
              reject(err)
            }
          }, 0)
        })
        
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const result = onRejected(this.reason)
              resolve(result)
            } catch (err) {
              reject(err)
            }
          }, 0)
        })
      }
    })
  }
  
  catch(onRejected) {
    return this.then(null, onRejected)
  }
}
```

## 异步错误处理

```javascript
// 全局未捕获异常处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err)
  process.exit(1)
})

// 未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason)
})

// 异步函数错误处理
async function safeOperation() {
  try {
    const result = await someAsyncOperation()
    return result
  } catch (err) {
    // 重试逻辑
    if (err.retryable) {
      return safeOperation()
    }
    throw err
  }
}
```

## 异步模式对比

| 模式 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 回调函数 | 简单直接 | 回调地狱 | 简单异步操作 |
| Promise | 链式调用、统一错误处理 | 学习成本 | 复杂异步流程 |
| Generator | 同步写法 | 需要 co 库 | 复杂异步流程 |
| Async/Await | 同步写法、简单直观 | 需要 ES2017 | 推荐使用 |

## 最佳实践

1. **优先使用 Async/Await**：代码更清晰，错误处理更简单
2. **合理使用 Promise.all**：并行执行多个异步操作
3. **避免滥用 await**：不需要顺序执行的操作应该并行
4. **统一错误处理**：使用 try-catch 或 Promise.catch
5. **使用工具函数**：封装重复的异步逻辑

## 总结

| 特性 | 回调函数 | Promise | Generator | Async/Await |
|------|----------|---------|-----------|-------------|
| 可读性 | 差 | 中 | 中 | 优 |
| 错误处理 | 复杂 | 统一 | 统一 | 简单 |
| 学习曲线 | 低 | 中 | 高 | 中 |
| 性能 | 略高 | 略低 | 略低 | 略低 |
