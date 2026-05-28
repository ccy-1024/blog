---
title: Vue3 响应式系统源码剖析
date: 2024-05-01
---

# Vue3 响应式系统源码剖析

## 响应式系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    响应式系统                            │
├─────────────────────────────────────────────────────────┤
│  target (目标对象)                                      │
│      │                                                 │
│      ▼                                                 │
│  createReactiveObject → Proxy 代理                      │
│      │                                                 │
│      ▼                                                 │
│  track (依赖收集) ←→ trigger (触发更新)                  │
│      │              │                                  │
│      ▼              ▼                                  │
│  Dep (依赖)      effect (副作用)                        │
│      │              │                                  │
│      ▼              ▼                                  │
│  Set<effect>   scheduler (调度器)                      │
└─────────────────────────────────────────────────────────┘
```

## Proxy 代理实现

```javascript
const proxyMap = new WeakMap()

function createReactiveObject(target, isReadonly = false) {
  // 检查是否已被代理
  if (proxyMap.has(target)) {
    return proxyMap.get(target)
  }
  
  const handler = {
    get(target, key, receiver) {
      // 依赖收集
      if (!isReadonly) {
        track(target, key)
      }
      
      const result = Reflect.get(target, key, receiver)
      
      // 递归代理嵌套对象
      if (isObject(result)) {
        return isReadonly ? readonly(result) : reactive(result)
      }
      
      return result
    },
    
    set(target, key, value, receiver) {
      const oldValue = target[key]
      const result = Reflect.set(target, key, value, receiver)
      
      // 触发更新
      if (hasChanged(value, oldValue)) {
        trigger(target, key, value, oldValue)
      }
      
      return result
    },
    
    deleteProperty(target, key) {
      const existed = hasOwn(target, key)
      const result = Reflect.deleteProperty(target, key)
      
      if (existed) {
        trigger(target, key, undefined, undefined)
      }
      
      return result
    }
  }
  
  const proxy = new Proxy(target, handler)
  proxyMap.set(target, proxy)
  
  return proxy
}
```

## 依赖收集机制

```javascript
// 当前活跃的 effect
let activeEffect = null

function track(target, key) {
  if (!activeEffect) return
  
  // 获取 target 的依赖映射
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  
  // 获取 key 的依赖集合
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }
  
  // 将当前 effect 添加到依赖集合
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}
```

## effect 副作用函数

```javascript
class ReactiveEffect {
  constructor(fn, scheduler) {
    this.fn = fn
    this.scheduler = scheduler
    this.deps = []
  }
  
  run() {
    // 设置当前活跃 effect
    activeEffect = this
    
    try {
      return this.fn()
    } finally {
      // 清理依赖
      this.cleanup()
      activeEffect = null
    }
  }
  
  cleanup() {
    // 从所有依赖中移除自己
    for (let i = 0; i < this.deps.length; i++) {
      this.deps[i].delete(this)
    }
    this.deps.length = 0
  }
}

function effect(fn, options = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler)
  
  if (options.lazy) {
    return _effect.run.bind(_effect)
  }
  
  _effect.run()
  
  return () => {
    _effect.stop()
  }
}
```

## 触发更新机制

```javascript
function trigger(target, key, value, oldValue) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  
  const dep = depsMap.get(key)
  if (!dep) return
  
  // 收集需要执行的 effects
  const effects = new Set()
  
  dep.forEach(effect => {
    if (effect !== activeEffect) {
      effects.add(effect)
    }
  })
  
  // 执行 effects
  effects.forEach(effect => {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  })
}
```

## computed 实现原理

```javascript
function computed(getter, options = {}) {
  let dirty = true
  let value
  
  const runner = effect(getter, {
    lazy: true,
    scheduler: () => {
      dirty = true
      // 触发依赖 computed 的 effects
      triggerRefValue(ref)
    }
  })
  
  const ref = {
    _isRef: true,
    get value() {
      if (dirty) {
        value = runner()
        dirty = false
      }
      // 收集依赖
      trackRefValue(ref)
      return value
    },
    set value(newValue) {
      // computed 默认只读
    }
  }
  
  return ref
}
```

## ref 实现原理

```javascript
class RefImpl {
  constructor(value) {
    this._value = convert(value)
    this._rawValue = value
    this.dep = new Set()
  }
  
  get value() {
    trackRefValue(this)
    return this._value
  }
  
  set value(newValue) {
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue
      this._value = convert(newValue)
      triggerRefValue(this)
    }
  }
}

function ref(value) {
  return new RefImpl(value)
}

function convert(value) {
  return isObject(value) ? reactive(value) : value
}
```

## 调度器机制

```javascript
let queue = []
let isFlushing = false

function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job)
    if (!isFlushing) {
      isFlushing = true
      Promise.resolve().then(flushJobs)
    }
  }
}

function flushJobs() {
  // 排序，确保父组件先于子组件更新
  queue.sort((a, b) => a.id - b.id)
  
  while (queue.length) {
    const job = queue.shift()
    job()
  }
  
  isFlushing = false
}
```

## 总结

| 核心组件 | 作用 |
|----------|------|
| Proxy | 代理对象，拦截读写操作 |
| track | 依赖收集，建立响应式依赖关系 |
| trigger | 触发更新，通知依赖的 effects |
| effect | 副作用函数，封装响应式逻辑 |
| scheduler | 调度器，控制更新顺序和时机 |
| computed | 计算属性，支持惰性求值和缓存 |
| ref | 基本类型响应式包装 |
