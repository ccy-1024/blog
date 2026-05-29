---
title: PM2 源码解析
date: 2024-07-20
---

# PM2 源码解析

## PM2 架构

```
┌─────────────────────────────────────────────────────────┐
│                      PM2 架构                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │                    PM2 主进程                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│  │  │  Master  │  │   API    │  │  Logger  │     │   │
│  │  │ Process  │  │ Server   │  │ Service  │     │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘     │   │
│  │       │             │             │            │   │
│  └───────┼─────────────┼─────────────┼────────────┘   │
│          │             │             │                │
│          ▼             ▼             ▼                │
│  ┌─────────────────────────────────────────────┐      │
│  │              子进程集群                      │      │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐    │      │
│  │  │ App1 │  │ App2 │  │ App3 │  │ App4 │    │      │
│  │  │ (PID)│  │ (PID)│  │ (PID)│  │ (PID)│    │      │
│  │  └──────┘  └──────┘  └──────┘  └──────┘    │      │
│  └─────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## 进程管理

```javascript
// PM2 进程管理器核心
class PM2 {
  constructor() {
    this.processes = {}
    this.clusterMode = false
    this.maxWorkers = require('os').cpus().length
  }
  
  // 创建进程
  async spawn(processConfig) {
    const { name, script, args = [], env = {} } = processConfig
    
    const child = require('child_process').fork(script, args, {
      env: { ...process.env, ...env },
      silent: true
    })
    
    const processId = child.pid
    
    this.processes[processId] = {
      id: processId,
      name,
      script,
      args,
      env,
      child,
      status: 'online',
      createdAt: Date.now()
    }
    
    // 监听进程事件
    this.setupProcessListeners(child, processId)
    
    return processId
  }
  
  // 设置进程监听器
  setupProcessListeners(child, processId) {
    child.on('exit', (code, signal) => {
      this.handleExit(processId, code, signal)
    })
    
    child.on('error', (err) => {
      this.handleError(processId, err)
    })
    
    child.on('message', (message) => {
      this.handleMessage(processId, message)
    })
  }
  
  // 处理进程退出
  handleExit(processId, code, signal) {
    const processInfo = this.processes[processId]
    
    if (!processInfo) return
    
    console.log(`Process ${processId} exited with code ${code}`)
    
    // 如果是意外退出，尝试重启
    if (code !== 0 && processInfo.status !== 'stopped') {
      this.restart(processId)
    }
    
    delete this.processes[processId]
  }
  
  // 重启进程
  async restart(processId) {
    const processInfo = this.processes[processId]
    
    if (!processInfo) return
    
    console.log(`Restarting process ${processId}`)
    
    // 先停止进程
    if (processInfo.child) {
      processInfo.child.kill()
    }
    
    // 重新启动
    await this.spawn({
      name: processInfo.name,
      script: processInfo.script,
      args: processInfo.args,
      env: processInfo.env
    })
  }
  
  // 停止进程
  stop(processId) {
    const processInfo = this.processes[processId]
    
    if (!processInfo) return
    
    processInfo.status = 'stopped'
    processInfo.child.kill()
  }
  
  // 获取进程列表
  list() {
    return Object.values(this.processes)
  }
}
```

## 集群模式

```javascript
// 集群模式实现
class ClusterManager {
  constructor() {
    this.workers = {}
    this.workerCount = 0
  }
  
  // 启动集群
  async startCluster(appConfig, instances = require('os').cpus().length) {
    for (let i = 0; i < instances; i++) {
      await this.forkWorker(appConfig, i)
    }
    
    // 设置负载均衡
    this.setupLoadBalancer()
  }
  
  // 启动工作进程
  async forkWorker(appConfig, index) {
    const { script, args = [], env = {} } = appConfig
    
    const worker = require('child_process').fork(script, args, {
      env: { 
        ...process.env, 
        ...env,
        NODE_APP_INSTANCE: index
      },
      silent: true
    })
    
    const workerId = worker.pid
    
    this.workers[workerId] = {
      id: workerId,
      index,
      worker,
      status: 'online',
      requestCount: 0
    }
    
    // 监听工作进程事件
    this.setupWorkerListeners(worker, workerId)
    
    return workerId
  }
  
  // 设置负载均衡
  setupLoadBalancer() {
    // 使用轮询策略
    let currentIndex = 0
    
    this.getNextWorker = () => {
      const workerIds = Object.keys(this.workers)
      if (workerIds.length === 0) return null
      
      const workerId = workerIds[currentIndex % workerIds.length]
      currentIndex++
      
      return this.workers[workerId]
    }
  }
  
  // 处理工作进程消息
  handleWorkerMessage(workerId, message) {
    const worker = this.workers[workerId]
    
    if (message.type === 'ready') {
      worker.status = 'ready'
    }
    
    if (message.type === 'request') {
      worker.requestCount++
    }
  }
}
```

## 日志管理

```javascript
// 日志服务
class Logger {
  constructor(options = {}) {
    this.logDir = options.logDir || './logs'
    this.maxSize = options.maxSize || '10M'
    this.maxFiles = options.maxFiles || 5
    
    // 确保日志目录存在
    require('fs').mkdirSync(this.logDir, { recursive: true })
  }
  
  // 写入日志
  write(processId, message, type = 'info') {
    const timestamp = new Date().toISOString()
    const logLine = `[${timestamp}] [${type}] [${processId}] ${message}\n`
    
    // 写入文件
    const fs = require('fs')
    const logPath = `${this.logDir}/app-${processId}.log`
    
    fs.appendFileSync(logPath, logLine)
    
    // 检查文件大小，需要时切割
    this.rotateLog(logPath)
  }
  
  // 日志切割
  rotateLog(logPath) {
    const fs = require('fs')
    
    try {
      const stats = fs.statSync(logPath)
      const maxBytes = this.parseSize(this.maxSize)
      
      if (stats.size > maxBytes) {
        // 重命名旧日志
        const timestamp = Date.now()
        fs.renameSync(logPath, `${logPath}.${timestamp}`)
        
        // 删除旧日志文件
        this.cleanOldLogs()
      }
    } catch (err) {
      console.error('Log rotation error:', err)
    }
  }
  
  // 解析文件大小
  parseSize(sizeStr) {
    const units = {
      'B': 1,
      'K': 1024,
      'M': 1024 * 1024,
      'G': 1024 * 1024 * 1024
    }
    
    const match = sizeStr.match(/^(\d+)([BKMG])$/)
    if (!match) return 10 * 1024 * 1024 // 默认 10MB
    
    return parseInt(match[1]) * units[match[2]]
  }
  
  // 清理旧日志
  cleanOldLogs() {
    const fs = require('fs')
    
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(f => f.endsWith('.log') || f.match(/\.log\.\d+/))
        .map(f => ({
          name: f,
          time: fs.statSync(`${this.logDir}/${f}`).ctime.getTime()
        }))
        .sort((a, b) => b.time - a.time)
      
      // 删除超过 maxFiles 的旧日志
      files.slice(this.maxFiles).forEach(file => {
        fs.unlinkSync(`${this.logDir}/${file.name}`)
      })
    } catch (err) {
      console.error('Log cleanup error:', err)
    }
  }
}
```

## 监控功能

```javascript
// 监控服务
class Monitor {
  constructor() {
    this.metrics = {}
    this.interval = null
  }
  
  // 开始监控
  start(processId, interval = 1000) {
    this.interval = setInterval(() => {
      this.collectMetrics(processId)
    }, interval)
  }
  
  // 收集指标
  collectMetrics(processId) {
    const pidusage = require('pidusage')
    
    pidusage(processId, (err, stats) => {
      if (err) {
        console.error('Metrics collection error:', err)
        return
      }
      
      this.metrics[processId] = {
        cpu: stats.cpu,
        memory: stats.memory,
        timestamp: Date.now()
      }
    })
  }
  
  // 获取指标
  getMetrics(processId) {
    return this.metrics[processId] || null
  }
  
  // 停止监控
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}
```

## 配置文件

```javascript
// PM2 配置示例
module.exports = {
  apps: [
    {
      name: 'api',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      log_file: './logs/api.log',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      max_restarts: 10,
      restart_delay: 3000,
      autorestart: true,
      watch: ['src'],
      ignore_watch: ['node_modules', '.git']
    }
  ]
}
```

## 命令行接口

```javascript
// CLI 命令处理
class CLI {
  constructor(pm2) {
    this.pm2 = pm2
  }
  
  // 解析命令
  parse(args) {
    const command = args[0]
    
    switch (command) {
      case 'start':
        this.start(args.slice(1))
        break
      case 'stop':
        this.stop(args.slice(1))
        break
      case 'restart':
        this.restart(args.slice(1))
        break
      case 'list':
        this.list()
        break
      case 'logs':
        this.logs(args.slice(1))
        break
      default:
        console.log('Unknown command:', command)
    }
  }
  
  // 启动命令
  async start(args) {
    const script = args[0]
    const name = args[1] || script
    
    const processId = await this.pm2.spawn({
      name,
      script
    })
    
    console.log(`Process ${processId} started`)
  }
  
  // 停止命令
  stop(args) {
    const processId = parseInt(args[0])
    this.pm2.stop(processId)
    console.log(`Process ${processId} stopped`)
  }
  
  // 列出进程
  list() {
    const processes = this.pm2.list()
    console.table(processes)
  }
}
```

## 总结

| 组件 | 功能 |
|------|------|
| Process Manager | 进程创建、停止、重启 |
| Cluster Manager | 集群模式、负载均衡 |
| Logger | 日志收集、切割、管理 |
| Monitor | CPU、内存监控 |
| CLI | 命令行接口 |
