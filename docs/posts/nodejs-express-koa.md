---
title: Express/Koa 源码解析
date: 2024-06-20
---

# Express/Koa 源码解析

## Express 架构

```
┌─────────────────────────────────────────────────────────┐
│                      Express                           │
├─────────────────────────────────────────────────────────┤
│  req → [Middleware1] → [Middleware2] → Route Handler  │
│        ↓                   ↓                ↓          │
│      next()             next()         res.send()      │
└─────────────────────────────────────────────────────────┘
```

## Express 中间件机制

```javascript
// Express 应用构造函数
function createApplication() {
  const app = function(req, res, next) {
    app.handle(req, res, next)
  }
  
  // 混合中间件方法
  mixin(app, EventEmitter.prototype, false)
  mixin(app, proto, false)
  
  app.request = { __proto__: req, app }
  app.response = { __proto__: res, app }
  
  app.init()
  return app
}

// 中间件数组
app.lazyrouter = function lazyrouter() {
  if (!this._router) {
    this._router = new Router()
    this._router.use(query())
    this._router.use(bodyParser.json())
    this._router.use(bodyParser.urlencoded({ extended: true }))
  }
}

// 使用中间件
app.use = function use(fn) {
  const path = '/';
  const layer = new Layer(path, {
    sensitive: this.caseSensitive,
    strict: false,
    end: false
  }, fn)
  
  layer.route = undefined
  this.stack.push(layer)
  
  return this
}
```

## Express 路由实现

```javascript
// Layer 类
class Layer {
  constructor(path, options, fn) {
    this.path = path
    this.regexp = pathToRegexp(path, this.keys = [], options)
    this.methods = options.methods || []
    this.handle = fn
    this.name = fn.name || '<anonymous>'
  }
  
  match(path) {
    return this.regexp.test(path)
  }
  
  handle_request(req, res, next) {
    const fn = this.handle
    
    try {
      fn(req, res, next)
    } catch (err) {
      next(err)
    }
  }
}

// Router 类
class Router {
  constructor() {
    this.stack = []
  }
  
  handle(req, res, out) {
    let idx = 0
    const stack = this.stack
    
    function next(err) {
      if (err) {
        return out(err)
      }
      
      if (idx >= stack.length) {
        return out()
      }
      
      const layer = stack[idx++]
      
      if (!layer.match(req.path)) {
        return next()
      }
      
      if (layer.methods && !layer.methods.includes(req.method)) {
        return next()
      }
      
      layer.handle_request(req, res, next)
    }
    
    next()
  }
}
```

## Koa 架构

```
┌─────────────────────────────────────────────────────────┐
│                        Koa                            │
├─────────────────────────────────────────────────────────┤
│  req → [Middleware1] → [Middleware2] → Response        │
│        ↓                   ↓                          │
│      await next()       await next()                   │
│        ↓                   ↓                          │
│      修改 ctx         修改 ctx                         │
└─────────────────────────────────────────────────────────┘
```

## Koa 中间件机制

```javascript
// Koa 应用构造函数
class Application extends Emitter {
  constructor(options) {
    super()
    this.proxy = options.proxy || false
    this.middleware = []
    this.subdomainOffset = 2
    this.env = options.env || process.env.NODE_ENV || 'development'
  }
  
  use(fn) {
    if (typeof fn !== 'function') throw new TypeError('middleware must be a function!')
    this.middleware.push(fn)
    return this
  }
  
  compose(middleware) {
    return function(context, next) {
      let index = -1
      
      function dispatch(i) {
        if (i <= index) return Promise.reject(new Error('next() called multiple times'))
        index = i
        
        let fn = middleware[i]
        if (i === middleware.length) fn = next
        
        if (!fn) return Promise.resolve()
        
        try {
          return Promise.resolve(fn(context, dispatch.bind(null, i + 1)))
        } catch (err) {
          return Promise.reject(err)
        }
      }
      
      return dispatch(0)
    }
  }
  
  listen(...args) {
    const server = http.createServer(this.callback())
    return server.listen(...args)
  }
  
  callback() {
    const fn = this.compose(this.middleware)
    
    if (!this.listenerCount('error')) {
      this.on('error', this.onerror)
    }
    
    return (req, res) => {
      const ctx = this.createContext(req, res)
      return this.handleRequest(ctx, fn)
    }
  }
  
  createContext(req, res) {
    const context = Object.create(this.context)
    const request = context.request = Object.create(this.request)
    const response = context.response = Object.create(this.response)
    
    context.app = request.app = response.app = this
    context.req = request.req = response.req = req
    context.res = request.res = response.res = res
    
    request.ctx = response.ctx = context
    request.response = response
    response.request = request
    
    context.originalUrl = request.originalUrl = req.url
    context.state = {}
    
    return context
  }
}
```

## Koa Context

```javascript
// Context 原型
const context = {
  get request() {
    return this._request
  },
  
  get response() {
    return this._response
  },
  
  get query() {
    return this.request.query
  },
  
  get body() {
    return this.response.body
  },
  
  set body(val) {
    this.response.body = val
  },
  
  get status() {
    return this.response.status
  },
  
  set status(val) {
    this.response.status = val
  }
}

// Request 原型
const request = {
  get query() {
    const str = this.querystring
    const c = this._querycache = this._querycache || {}
    
    return c[str] || (c[str] = qs.parse(str))
  },
  
  get path() {
    return parseUrl(this.req).pathname
  }
}

// Response 原型
const response = {
  _body: undefined,
  
  get body() {
    return this._body
  },
  
  set body(val) {
    this._body = val
    
    // 根据内容类型设置 Content-Type
    if (!this.header['content-type']) {
      if (typeof val === 'object') {
        this.set('Content-Type', 'application/json')
      }
    }
  },
  
  get status() {
    return this.res.statusCode
  },
  
  set status(code) {
    if (this._body && statuses.empty[code]) {
      this._body = null
    }
    this.res.statusCode = code
  }
}
```

## Express vs Koa

| 特性 | Express | Koa |
|------|---------|-----|
| 中间件模型 | 回调函数 | Async/Await |
| 内置功能 | 路由、静态文件、模板引擎 | 仅核心功能 |
| 上下文 | req/res 分离 | ctx 统一 |
| 错误处理 | try/catch + next(err) | try/catch + ctx.throw |
| 社区生态 | 成熟 | 现代 |

## 错误处理

```javascript
// Express 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

// Koa 错误处理
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.status = err.status || 500
    ctx.body = err.message
    ctx.app.emit('error', err, ctx)
  }
})
```

## 路由对比

```javascript
// Express 路由
app.get('/users/:id', (req, res) => {
  const userId = req.params.id
  res.send(`User: ${userId}`)
})

// Koa 路由（使用 koa-router）
const Router = require('koa-router')
const router = new Router()

router.get('/users/:id', async (ctx) => {
  const userId = ctx.params.id
  ctx.body = `User: ${userId}`
})

app.use(router.routes())
```

## 总结

| 维度 | Express | Koa |
|------|---------|-----|
| 适合项目 | 传统项目、需要大量中间件 | 新项目、追求简洁 |
| 学习曲线 | 低 | 中（需要理解 async/await） |
| 灵活性 | 中等 | 高 |
| 性能 | 略高 | 略低（async/await 开销） |
