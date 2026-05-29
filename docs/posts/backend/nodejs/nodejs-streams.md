---
title: Node.js 流处理实战
date: 2024-03-25
---

# Node.js 流处理实战

## 流的概念

### 什么是流

流是一种处理大量数据的方式，它将数据分成小块逐个处理，而不是一次性加载到内存中。

### 流的类型

| 类型 | 描述 | 示例 |
|------|------|------|
| Readable | 可读流 | 文件读取、HTTP 请求 |
| Writable | 可写流 | 文件写入、HTTP 响应 |
| Duplex | 双工流 | TCP socket |
| Transform | 转换流 | zlib、crypto |

## Readable 流

### 基本用法

```javascript
const fs = require('fs')

// 创建可读流
const readable = fs.createReadStream('large-file.txt', {
  highWaterMark: 64 * 1024 // 64KB 缓冲区
})

// 监听数据事件
readable.on('data', (chunk) => {
  console.log(`接收到 ${chunk.length} 字节`)
})

// 监听结束事件
readable.on('end', () => {
  console.log('读取完成')
})

// 监听错误事件
readable.on('error', (err) => {
  console.error('读取错误:', err)
})
```

### 暂停和恢复

```javascript
const readable = fs.createReadStream('file.txt')

readable.on('data', (chunk) => {
  console.log(`接收到 ${chunk.length} 字节`)
  
  // 暂停读取
  readable.pause()
  
  // 1秒后恢复
  setTimeout(() => {
    readable.resume()
  }, 1000)
})
```

## Writable 流

### 基本用法

```javascript
const fs = require('fs')

// 创建可写流
const writable = fs.createWriteStream('output.txt')

// 写入数据
writable.write('Hello, ')
writable.write('World!')

// 结束写入
writable.end(() => {
  console.log('写入完成')
})

// 监听错误
writable.on('error', (err) => {
  console.error('写入错误:', err)
})
```

### 背压处理

```javascript
const readable = fs.createReadStream('large-file.txt')
const writable = fs.createWriteStream('output.txt')

readable.on('data', (chunk) => {
  // write() 返回 false 表示内部缓冲区已满
  const canContinue = writable.write(chunk)
  
  if (!canContinue) {
    // 暂停读取直到缓冲区排空
    readable.pause()
  }
})

// 缓冲区排空时恢复读取
writable.on('drain', () => {
  readable.resume()
})
```

## Transform 流

### 创建转换流

```javascript
const { Transform } = require('stream')

// 创建转换流：转换为大写
const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    const result = chunk.toString().toUpperCase()
    this.push(result)
    callback()
  }
})

// 使用
process.stdin.pipe(upperCaseTransform).pipe(process.stdout)
```

### 压缩流示例

```javascript
const fs = require('fs')
const zlib = require('zlib')

// 读取文件 → 压缩 → 写入文件
fs.createReadStream('large-file.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('large-file.txt.gz'))
  .on('finish', () => {
    console.log('压缩完成')
  })
```

## 管道流

### 基本管道

```javascript
const fs = require('fs')

// 文件复制
fs.createReadStream('input.txt')
  .pipe(fs.createWriteStream('output.txt'))
  .on('finish', () => {
    console.log('复制完成')
  })
```

### 链式管道

```javascript
const fs = require('fs')
const zlib = require('zlib')
const crypto = require('crypto')

// 读取 → 加密 → 压缩 → 写入
fs.createReadStream('secret.txt')
  .pipe(crypto.createCipher('aes192', 'password'))
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('secret.txt.gz.enc'))
  .on('finish', () => {
    console.log('加密压缩完成')
  })
```

## 流的事件

| 事件 | 触发时机 |
|------|----------|
| data | 有数据可读时 |
| end | 数据读取完毕时 |
| error | 发生错误时 |
| close | 流关闭时 |
| drain | 缓冲区排空时（仅 Writable） |
| finish | 写入完成时（仅 Writable） |

## 自定义流

### 自定义可读流

```javascript
const { Readable } = require('stream')

class NumberStream extends Readable {
  constructor(max) {
    super()
    this.current = 0
    this.max = max
  }
  
  _read() {
    if (this.current < this.max) {
      this.push(String(this.current++))
    } else {
      this.push(null) // 结束流
    }
  }
}

// 使用
const stream = new NumberStream(5)
stream.pipe(process.stdout) // 输出: 01234
```

### 自定义可写流

```javascript
const { Writable } = require('stream')

class LogStream extends Writable {
  _write(chunk, encoding, callback) {
    console.log(`[LOG] ${chunk.toString()}`)
    callback()
  }
}

// 使用
const logger = new LogStream()
logger.write('Hello World') // 输出: [LOG] Hello World
```

## 最佳实践

1. **使用管道**：优先使用 `pipe()` 处理流，自动处理背压
2. **监听错误**：始终监听 `error` 事件，避免异常退出
3. **设置合理的 highWaterMark**：根据内存情况调整缓冲区大小
4. **及时销毁流**：使用 `destroy()` 方法释放资源
5. **使用流式 API**：对于大文件操作，优先使用流而不是 `readFileSync`
