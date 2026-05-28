---
title: 从零理解 Vue3 响应式原理
date: 2024-01-20
---

# 从零理解 Vue3 响应式原理

大家好，我是芝麻粒。最近在复习 Vue3 的源码，想把响应式原理这块整理一下，顺便也加深自己的理解。

## 为什么要理解响应式

说实话，之前用 Vue 的时候，我一直觉得响应式是个黑盒。数据变了视图就更新，感觉很神奇但也没深究。直到有一次面试被问到「Vue3 的响应式和 Vue2 有什么区别」，我支支吾吾说不出来，才意识到自己对底层原理了解得太浅了。

## 从一个简单的例子开始

先看一个最基础的响应式例子：

```javascript
import { ref, effect } from 'vue'

const count = ref(0)

effect(() => {
  console.log(`count 变了: ${count.value}`)
})

count.value++ // 输出: count 变了: 1
count.value++ // 输出: count 变了: 2
```

这段代码很简单，但背后的逻辑却不简单。为什么 `count.value` 变了，`effect` 里的函数就会自动执行呢？

## 核心原理：Proxy + 依赖收集

Vue3 用 Proxy 代替了 Vue2 的 Object.defineProperty。这两者有什么区别呢？

### Object.defineProperty 的局限性

```javascript
// Vue2 的响应式实现（简化版）
function defineReactive(obj, key, value) {
  Object.defineProperty(obj, key, {
    get() {
      // 依赖收集
      track(obj, key)
      return value
    },
    set(newValue) {
      value = newValue
      // 触发更新
      trigger(obj, key)
    }
  })
}
```

这种方式有个问题：只能监听已有的属性，新增或删除属性是监听不到的。

### Proxy 的优势

```javascript
// Vue3 的响应式实现（简化版）
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      // 依赖收集
      track(target, key)
      const result = Reflect.get(target, key, receiver)
      // 递归处理嵌套对象
      if (isObject(result)) {
        return reactive(result)
      }
      return result
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver)
      // 触发更新
      trigger(target, key)
      return result
    },
    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key)
      trigger(target, key)
      return result
    }
  })
}
```

Proxy 可以监听对象的所有操作，包括新增、删除属性，这是它最大的优势。

## 依赖收集的过程

依赖收集是响应式的核心，我画了个流程图来理解：

```
┌─────────────────────────────────────────────────────┐
│                   effect 执行                       │
└──────────────────┬──────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────┐
│              读取响应式数据 (get)                    │
└──────────────────┬──────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────┐
│              track 函数收集依赖                     │
│  将 effect 存入 target -> key -> effects Map        │
└──────────────────┬──────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────┐
│              数据变化 (set)                         │
└──────────────────┬──────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────┐
│              trigger 函数触发更新                   │
│  遍历 effects 执行所有依赖的 effect                  │
└─────────────────────────────────────────────────────┘
```

## 手写一个简单的响应式系统

理解了原理之后，我试着自己写了一个简化版：

```javascript
// 存储当前正在执行的 effect
let activeEffect = null

// 依赖映射表: target -> key -> effects
const targetMap = new WeakMap()

function track(target, key) {
  if (!activeEffect) return
  
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  
  let deps = depsMap.get(key)
  if (!deps) {
    deps = new Set()
    depsMap.set(key, deps)
  }
  
  deps.add(activeEffect)
}

function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  
  const deps = depsMap.get(key)
  if (deps) {
    deps.forEach(effect => effect())
  }
}

function effect(fn) {
  activeEffect = fn
  fn() // 立即执行一次，触发依赖收集
  activeEffect = null
}

// 使用示例
const state = reactive({ count: 0 })

effect(() => {
  console.log(`count: ${state.count}`)
})

state.count++ // 输出: count: 1
```

写这段代码的时候，我发现了几个关键点：

1. **WeakMap 的作用**：防止内存泄漏，当 target 对象被 GC 时，对应的依赖也会被清理
2. **Set 去重**：同一个 effect 可能多次依赖同一个属性，需要去重
3. **activeEffect 的时机**：只有在 effect 执行期间才收集依赖

## 调度执行与优化

Vue3 还做了很多优化，比如调度执行：

```javascript
// 简化的调度器
const scheduler = queueMicrotask

function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  
  const deps = depsMap.get(key)
  if (deps) {
    deps.forEach(effect => {
      scheduler(effect) // 放到微任务队列，避免同步多次执行
    })
  }
}
```

这样可以避免同一个 effect 在同一事件循环中被多次触发。

## 总结

理解响应式原理之后，我对 Vue3 的使用更加得心应手了。比如知道了为什么要用 `ref` 包裹基本类型，为什么 `reactive` 不需要 `.value`。

如果你也想深入理解，建议去看看 Vue3 的源码，特别是 `@vue/reactivity` 包。源码虽然有点复杂，但跟着调试一遍，收获会很大。

---

感谢阅读！如果有不对的地方，欢迎留言指正。🎉
