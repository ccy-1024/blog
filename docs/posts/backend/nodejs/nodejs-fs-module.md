---
title: Node.js 文件系统原理
date: 2024-06-05
---

# Node.js 文件系统原理

## 文件系统架构

```
┌─────────────────────────────────────────────────────────┐
│                      fs 模块                           │
├─────────────────────────────────────────────────────────┤
│  JavaScript API                                        │
│  (fs.readFile, fs.writeFile, fs.createReadStream)      │
│                          │                             │
│                          ▼                             │
│  libuv (跨平台抽象层)                                   │
│  (uv_fs_* 系列函数)                                     │
│                          │                             │
│                          ▼                             │
│  操作系统文件系统 API                                    │
│  (Windows: CreateFile, ReadFile)                       │
│  (Unix: open, read, write)                             │
└─────────────────────────────────────────────────────────┘
```

## 文件描述符

```javascript
// 文件描述符是内核用于标识打开文件的整数
const fs = require('fs')

// 打开文件
fs.open('file.txt', 'r', (err, fd) => {
  if (err) throw err
  
  // fd 就是文件描述符
  console.log('File descriptor:', fd)
  
  // 读取文件
  const buffer = Buffer.alloc(1024)
  fs.read(fd, buffer, 0, buffer.length, null, (err, bytesRead) => {
    if (err) throw err
    console.log('Read:', buffer.slice(0, bytesRead).toString())
    
    // 关闭文件
    fs.close(fd, (err) => {
      if (err) throw err
    })
  })
})
```

## 同步 vs 异步

```javascript
// 同步读取（阻塞）
try {
  const data = fs.readFileSync('file.txt', 'utf8')
  console.log(data)
} catch (err) {
  console.error(err)
}

// 异步读取（非阻塞）
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  console.log(data)
})

// Promise 版本
async function readFileAsync() {
  try {
    const data = await fs.promises.readFile('file.txt', 'utf8')
    console.log(data)
  } catch (err) {
    console.error(err)
  }
}
```

## 文件读写

### 写入文件

```javascript
// 简单写入
fs.writeFile('output.txt', 'Hello World', (err) => {
  if (err) throw err
  console.log('文件已写入')
})

// 追加写入
fs.appendFile('log.txt', 'New log entry\n', (err) => {
  if (err) throw err
})

// 流式写入
const writeStream = fs.createWriteStream('large-file.txt', {
  flags: 'w',
  encoding: 'utf8',
  highWaterMark: 64 * 1024 // 64KB 缓冲区
})

for (let i = 0; i < 10000; i++) {
  writeStream.write(`Line ${i}\n`)
}

writeStream.end(() => {
  console.log('写入完成')
})
```

### 读取文件

```javascript
// 简单读取
fs.readFile('input.txt', 'utf8', (err, data) => {
  if (err) throw err
  console.log(data)
})

// 流式读取
const readStream = fs.createReadStream('large-file.txt', {
  highWaterMark: 64 * 1024
})

readStream.on('data', (chunk) => {
  console.log(`收到 ${chunk.length} 字节`)
})

readStream.on('end', () => {
  console.log('读取完成')
})

readStream.on('error', (err) => {
  console.error('读取错误:', err)
})
```

## 文件系统操作

### 文件信息

```javascript
fs.stat('file.txt', (err, stats) => {
  if (err) throw err
  
  console.log('是否是文件:', stats.isFile())
  console.log('是否是目录:', stats.isDirectory())
  console.log('文件大小:', stats.size)
  console.log('创建时间:', stats.birthtime)
  console.log('修改时间:', stats.mtime)
})
```

### 文件复制

```javascript
// 简单复制
fs.copyFile('source.txt', 'dest.txt', (err) => {
  if (err) throw err
  console.log('复制完成')
})

// 流式复制
const readStream = fs.createReadStream('source.txt')
const writeStream = fs.createWriteStream('dest.txt')

readStream.pipe(writeStream)

writeStream.on('finish', () => {
  console.log('复制完成')
})
```

### 文件删除

```javascript
fs.unlink('file.txt', (err) => {
  if (err) throw err
  console.log('文件已删除')
})
```

## 目录操作

```javascript
// 创建目录
fs.mkdir('new-dir', { recursive: true }, (err) => {
  if (err) throw err
  console.log('目录已创建')
})

// 读取目录
fs.readdir('dir', (err, files) => {
  if (err) throw err
  console.log('目录内容:', files)
})

// 删除目录
fs.rmdir('dir', { recursive: true }, (err) => {
  if (err) throw err
  console.log('目录已删除')
})

// 遍历目录树
function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file)
    const stats = fs.statSync(fullPath)
    
    if (stats.isDirectory()) {
      walk(fullPath)
    } else {
      console.log(fullPath)
    }
  })
}
```

## 权限管理

```javascript
// 设置文件权限
fs.chmod('file.txt', 0o644, (err) => {
  if (err) throw err
  console.log('权限已设置')
})

// 设置文件所有者
fs.chown('file.txt', uid, gid, (err) => {
  if (err) throw err
})
```

## 符号链接

```javascript
// 创建软链接
fs.symlink('target.txt', 'link.txt', (err) => {
  if (err) throw err
  console.log('软链接已创建')
})

// 读取链接目标
fs.readlink('link.txt', (err, target) => {
  if (err) throw err
  console.log('链接目标:', target)
})
```

## 最佳实践

1. **优先使用异步 API**：避免阻塞事件循环
2. **使用流式处理**：处理大文件时避免内存溢出
3. **错误处理**：始终处理回调中的错误
4. **路径处理**：使用 path 模块处理跨平台路径
5. **文件描述符管理**：及时关闭文件描述符，避免资源泄漏

## 总结

| API 类型 | 适用场景 |
|----------|----------|
| `readFile/writeFile` | 小文件读写 |
| `createReadStream/createWriteStream` | 大文件处理 |
| `open/read/write/close` | 底层文件操作 |
| `stat/lstat` | 获取文件信息 |
| `mkdir/rmdir/readdir` | 目录操作 |
| `copyFile` | 文件复制 |
| `unlink` | 文件删除 |
| `chmod/chown` | 权限管理 |
