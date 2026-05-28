---
title: Node.js 进程管理与集群
date: 2024-03-20
---

# Node.js 进程管理与集群

## Node.js 进程模型

### 单线程特性

```javascript
// Node.js 单线程执行
console.log('Start')

setTimeout(() => {
  console.log('Timeout')
}, 0)

console.log('End')

// 输出顺序: Start -> End -> Timeout
```

### 进程对象

```javascript
// 进程信息
console.log('PID:', process.pid)
console.log('PPID:', process.ppid)
console.log('平台:', process.platform)
console.log('版本:', process.version)

// 环境变量
console.log('NODE_ENV:', process.env.NODE_ENV)

// 内存使用
const mem = process.memoryUsage()
console.log('内存使用:', mem)
```

## Cluster 集群

### 基本用法

```javascript
const cluster = require('cluster')
const numCPUs = require('os').cpus().length

if (cluster.isPrimary) {
  console.log(`主进程 ${process.pid} 正在运行`)
  
  // 启动子进程
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }
  
  // 监听子进程退出
  cluster.on('exit', (worker, code, signal) => {
    console.log(`子进程 ${worker.process.pid} 退出`)
    cluster.fork() // 重启子进程
  })
} else {
  // 子进程运行应用
  const http = require('http')
  const server = http.createServer((req, res) => {
    res.writeHead(200)
    res.end(`Hello from worker ${process.pid}`)
  })
  
  server.listen(3000)
  console.log(`子进程 ${process.pid} 启动`)
}
```

### 进程间通信

```javascript
// 主进程发送消息
if (cluster.isPrimary) {
  const worker = cluster.fork()
  
  worker.on('message', (msg) => {
    console.log(`主进程收到: ${msg}`)
  })
  
  worker.send('Hello from primary')
} else {
  // 子进程接收消息
  process.on('message', (msg) => {
    console.log(`子进程收到: ${msg}`)
    process.send('Hello from worker')
  })
}
```

## PM2 进程管理

### 安装与基本用法

```bash
npm install -g pm2

# 启动应用
pm2 start app.js

# 查看状态
pm2 status

# 停止应用
pm2 stop app

# 重启应用
pm2 restart app

# 查看日志
pm2 logs

# 监控
pm2 monit
```

### PM2 配置文件

```json
{
  "apps": [
    {
      "name": "my-app",
      "script": "app.js",
      "instances": "max",
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production",
        "PORT": "3000"
      },
      "env_development": {
        "NODE_ENV": "development"
      },
      "log_date_format": "YYYY-MM-DD HH:mm:ss",
      "out_file": "./logs/out.log",
      "error_file": "./logs/error.log",
      "max_memory_restart": "1G"
    }
  ]
}
```

### 负载均衡

```bash
# 启动多个实例
pm2 start app.js -i max

# 查看负载状态
pm2 show my-app
```

## 进程退出处理

```javascript
// 优雅退出
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭...')
  
  // 停止接收新请求
  server.close(() => {
    console.log('服务器已关闭')
    process.exit(0)
  })
  
  // 强制退出超时
  setTimeout(() => {
    console.log('强制退出')
    process.exit(1)
  }, 5000)
})

// 未捕获异常处理
process.on('uncaughtException', (err) => {
  console.error('未捕获异常:', err)
  process.exit(1)
})

// 未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason)
})
```

## 守护进程

### 使用 nohup

```bash
nohup node app.js > app.log 2>&1 &
```

### 使用 systemd（Linux）

```ini
[Unit]
Description=My Node.js App
After=network.target

[Service]
Type=simple
User=www-data
ExecStart=/usr/bin/node /path/to/app.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# 启动服务
systemctl start my-app

# 开机自启
systemctl enable my-app

# 查看状态
systemctl status my-app
```

## 性能监控

```javascript
const os = require('os')

setInterval(() => {
  const cpuUsage = os.loadavg()[0]
  const memUsage = os.totalmem() - os.freemem()
  
  console.log(`CPU 负载: ${cpuUsage}`)
  console.log(`内存使用: ${(memUsage / 1024 / 1024).toFixed(2)} MB`)
}, 5000)
```

## 最佳实践

1. **使用 Cluster 或 PM2**：充分利用多核 CPU
2. **设置重启策略**：确保进程异常退出后自动重启
3. **日志管理**：定期清理日志，避免磁盘溢出
4. **资源限制**：设置内存上限，防止内存泄漏导致服务崩溃
5. **优雅重启**：使用 `pm2 reload` 实现零停机部署
