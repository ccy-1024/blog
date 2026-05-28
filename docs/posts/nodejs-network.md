---
title: Node.js 网络编程深入
date: 2024-08-01
---

# Node.js 网络编程深入

## 网络编程架构

```
┌─────────────────────────────────────────────────────────┐
│                    网络编程架构                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐                 │
│  │   HTTP 模块  │    │   TCP 模块   │                 │
│  └──────┬───────┘    └──────┬───────┘                 │
│         │                   │                          │
│         └─────────┬─────────┘                          │
│                   ▼                                    │
│         ┌──────────────┐                              │
│         │   libuv      │                              │
│         └──────┬───────┘                              │
│                │                                       │
│                ▼                                       │
│         ┌──────────────┐                              │
│         │ 操作系统网络  │                              │
│         └──────────────┘                              │
└─────────────────────────────────────────────────────────┘
```

## HTTP 服务器

```javascript
const http = require('http')

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // 设置响应头
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'X-Powered-By': 'Node.js'
  })
  
  // 写入响应体
  res.write('Hello, World!\n')
  
  // 结束响应
  res.end()
})

// 监听端口
server.listen(3000, 'localhost', () => {
  console.log('Server running on http://localhost:3000')
})
```

## HTTP 请求处理

```javascript
const http = require('http')

const server = http.createServer((req, res) => {
  // 获取请求信息
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Headers:', req.headers)
  
  // 解析查询参数
  const { URL } = require('url')
  const url = new URL(req.url, 'http://localhost:3000')
  const query = url.searchParams
  
  console.log('Query:', Object.fromEntries(query))
  
  // 处理请求体
  let body = ''
  req.on('data', (chunk) => {
    body += chunk
  })
  
  req.on('end', () => {
    console.log('Body:', body)
    
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      method: req.method,
      url: req.url,
      body: body || null
    }))
  })
})

server.listen(3000)
```

## 路由处理

```javascript
const http = require('http')
const { URL } = require('url')

// 路由处理器
const routes = {
  '/': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end('<h1>Home Page</h1>')
  },
  '/about': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end('<h1>About Page</h1>')
  },
  '/api/users': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify([
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' }
    ]))
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:3000')
  const pathname = url.pathname
  
  // 查找路由处理器
  const handler = routes[pathname]
  
  if (handler) {
    handler(req, res)
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    res.end('<h1>404 Not Found</h1>')
  }
})

server.listen(3000)
```

## TCP 服务器

```javascript
const net = require('net')

// 创建 TCP 服务器
const server = net.createServer((socket) => {
  console.log('Client connected')
  
  // 发送欢迎消息
  socket.write('Welcome to the TCP server!\n')
  
  // 监听数据
  socket.on('data', (data) => {
    console.log('Received:', data.toString())
    
    // 回显数据
    socket.write(`Echo: ${data}`)
  })
  
  // 监听连接关闭
  socket.on('end', () => {
    console.log('Client disconnected')
  })
  
  // 监听错误
  socket.on('error', (err) => {
    console.error('Socket error:', err)
  })
})

// 监听端口
server.listen(3000, 'localhost', () => {
  console.log('TCP server running on port 3000')
})

// TCP 客户端
const client = new net.Socket()

client.connect(3000, 'localhost', () => {
  console.log('Connected to server')
  client.write('Hello from client!')
})

client.on('data', (data) => {
  console.log('Server response:', data.toString())
  client.destroy()
})

client.on('close', () => {
  console.log('Connection closed')
})
```

## WebSocket 服务器

```javascript
const WebSocket = require('ws')

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ port: 8080 })

// 存储所有连接
const clients = new Set()

wss.on('connection', (ws) => {
  console.log('New client connected')
  
  // 添加到客户端集合
  clients.add(ws)
  
  // 发送欢迎消息
  ws.send('Welcome to the WebSocket server!')
  
  // 监听消息
  ws.on('message', (message) => {
    console.log('Received:', message.toString())
    
    // 广播消息给所有客户端
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`Broadcast: ${message}`)
      }
    })
  })
  
  // 监听关闭
  ws.on('close', () => {
    console.log('Client disconnected')
    clients.delete(ws)
  })
  
  // 监听错误
  ws.on('error', (err) => {
    console.error('WebSocket error:', err)
  })
})

console.log('WebSocket server running on ws://localhost:8080')
```

## HTTP/2 服务器

```javascript
const http2 = require('http2')
const fs = require('fs')

// 读取证书
const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
}

// 创建 HTTP/2 服务器
const server = http2.createSecureServer(options)

server.on('stream', (stream, headers) => {
  // 获取请求路径
  const path = headers[':path']
  
  // 设置响应头
  stream.respond({
    ':status': 200,
    'content-type': 'text/html'
  })
  
  // 发送响应
  stream.end(`<h1>Hello from HTTP/2! Path: ${path}</h1>`)
})

server.listen(8443, () => {
  console.log('HTTP/2 server running on https://localhost:8443')
})
```

## 代理服务器

```javascript
const http = require('http')
const httpProxy = require('http-proxy')

// 创建代理服务器
const proxy = httpProxy.createProxyServer({})

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // 根据路径转发请求
  if (req.url.startsWith('/api')) {
    proxy.web(req, res, {
      target: 'http://localhost:3001',
      changeOrigin: true
    })
  } else {
    proxy.web(req, res, {
      target: 'http://localhost:3002',
      changeOrigin: true
    })
  }
})

// 监听错误
proxy.on('error', (err, req, res) => {
  res.writeHead(500, { 'Content-Type': 'text/plain' })
  res.end('Proxy error')
})

server.listen(8080, () => {
  console.log('Proxy server running on http://localhost:8080')
})
```

## 负载均衡

```javascript
// 简单的负载均衡器
class LoadBalancer {
  constructor(servers) {
    this.servers = servers
    this.currentIndex = 0
  }
  
  // 轮询算法
  getNextServer() {
    const server = this.servers[this.currentIndex]
    this.currentIndex = (this.currentIndex + 1) % this.servers.length
    return server
  }
  
  // 最少连接算法
  getLeastConnectedServer() {
    return this.servers.reduce((prev, curr) => {
      return prev.connections < curr.connections ? prev : curr
    })
  }
}

// 使用示例
const servers = [
  { host: 'localhost', port: 3001, connections: 0 },
  { host: 'localhost', port: 3002, connections: 0 },
  { host: 'localhost', port: 3003, connections: 0 }
]

const lb = new LoadBalancer(servers)

// 转发请求
function forwardRequest(req, res) {
  const server = lb.getNextServer()
  
  const proxy = http.request({
    hostname: server.host,
    port: server.port,
    path: req.url,
    method: req.method,
    headers: req.headers
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers)
    proxyRes.pipe(res)
  })
  
  req.pipe(proxy)
}
```

## 总结

| 协议 | 模块 | 适用场景 |
|------|------|----------|
| HTTP | http | Web 服务器 |
| HTTPS | https | 安全通信 |
| TCP | net | 底层通信 |
| WebSocket | ws | 实时通信 |
| HTTP/2 | http2 | 高性能 |
| 代理 | http-proxy | 反向代理 |
