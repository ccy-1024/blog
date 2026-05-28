---
title: Vue3 组合式 API 最佳实践
date: 2024-03-05
---

# Vue3 组合式 API 最佳实践

## ref vs reactive 选择指南

### 使用 ref 的场景

```javascript
// 基本类型
const count = ref(0)
const name = ref('芝麻粒')

// 需要传递的对象
const user = ref({ name: '芝麻粒', age: 25 })

// 复杂对象但需要替换整个对象
const formData = ref({ username: '', password: '' })
formData.value = { username: 'new', password: '123' }
```

### 使用 reactive 的场景

```javascript
// 复杂状态对象
const state = reactive({
  user: { name: '芝麻粒', age: 25 },
  settings: { theme: 'dark', language: 'zh' }
})

// 嵌套对象的深度响应式
const nested = reactive({
  level1: {
    level2: {
      value: 'deep'
    }
  }
})
```

### 对比总结

| 特性 | ref | reactive |
|------|-----|----------|
| 基本类型 | ✅ 支持 | ❌ 不支持 |
| 对象类型 | ✅ 支持 | ✅ 支持 |
| 访问方式 | `.value` | 直接访问 |
| 重新赋值 | ✅ 支持 | ❌ 不支持 |
| 解构响应式 | ❌ 丢失 | ✅ 保持 |

## computed 使用技巧

```javascript
// 基础用法
const firstName = ref('张')
const lastName = ref('三')
const fullName = computed(() => `${firstName.value}${lastName.value}`)

// 可写的 computed
const count = ref(0)
const double = computed({
  get: () => count.value * 2,
  set: (val) => { count.value = val / 2 }
})

// 缓存优化
const expensive = computed(() => {
  // 复杂计算只在依赖变化时执行
  return heavyComputation()
})
```

## watch 与 watchEffect

```javascript
// watch：明确指定依赖
const count = ref(0)
watch(count, (newVal, oldVal) => {
  console.log(`count changed: ${oldVal} -> ${newVal}`)
})

// 监听多个依赖
watch([count, name], ([newCount, newName]) => {
  console.log(newCount, newName)
})

// watchEffect：自动收集依赖
const input = ref('')
watchEffect(() => {
  console.log(input.value) // 自动追踪 input 的变化
})

// 停止监听
const stop = watchEffect(() => {
  // ...
})
stop() // 停止监听
```

## 组合式函数封装

```javascript
// useCounter.js
export function useCounter(initial = 0) {
  const count = ref(initial)
  
  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => count.value = initial
  
  return {
    count,
    increment,
    decrement,
    reset
  }
}

// 使用
const { count, increment, reset } = useCounter(10)
```

## 生命周期钩子

```javascript
import { onMounted, onUnmounted, onUpdated } from 'vue'

export function useMousePosition() {
  const x = ref(0)
  const y = ref(0)
  
  const updatePosition = (e) => {
    x.value = e.clientX
    y.value = e.clientY
  }
  
  onMounted(() => {
    window.addEventListener('mousemove', updatePosition)
  })
  
  onUnmounted(() => {
    window.removeEventListener('mousemove', updatePosition)
  })
  
  return { x, y }
}
```

## 代码组织建议

```
src/
├── composables/          # 组合式函数
│   ├── useCounter.js
│   ├── useMouse.js
│   └── useApi.js
├── utils/               # 工具函数
├── components/          # 组件
└── views/               # 页面
```

## 避坑指南

1. **不要解构 reactive 对象**：会丢失响应式
2. **ref 对象传递时保持 .value**：确保响应式传递
3. **异步操作使用 nextTick**：等待 DOM 更新完成
4. **watch 深层对象使用 deep**：或使用 watchEffect
