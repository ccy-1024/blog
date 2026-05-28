---
title: Vue3 虚拟 DOM 与 Diff 算法
date: 2024-03-01
---

# Vue3 虚拟 DOM 与 Diff 算法

## 什么是虚拟 DOM

虚拟 DOM 是用 JavaScript 对象表示的 DOM 结构，通过 diff 算法对比新旧虚拟 DOM，只更新变化的部分。

## Vue3 的 VNode 结构

```javascript
const vnode = {
  type: 'div',
  props: { class: 'container' },
  children: [
    { type: 'span', children: 'Hello' }
  ],
  patchFlag: 1 // 标记需要更新的类型
}
```

## Diff 算法原理

### 双端比较策略

```javascript
function patch(oldVnode, newVnode) {
  const oldStartIdx = 0
  const oldEndIdx = oldVnode.children.length - 1
  const newStartIdx = 0
  const newEndIdx = newVnode.children.length - 1
  
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    // 比较四个指针位置的节点
    if (sameVnode(oldStartVnode, newStartVnode)) {
      patch(oldStartVnode, newStartVnode)
      oldStartIdx++
      newStartIdx++
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patch(oldEndVnode, newEndVnode)
      oldEndIdx--
      newEndIdx--
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      patch(oldStartVnode, newEndVnode)
      moveNode(oldStartVnode, newEndIdx)
      oldStartIdx++
      newEndIdx--
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      patch(oldEndVnode, newStartVnode)
      moveNode(oldEndVnode, newStartIdx)
      oldEndIdx--
      newStartIdx++
    } else {
      // 使用最长递增子序列优化
      const keyToOldIndex = createKeyToOldIndex(oldVnode.children)
      const idxInOld = keyToOldIndex[newStartVnode.key]
      if (idxInOld) {
        patch(oldVnode.children[idxInOld], newStartVnode)
        moveNode(oldVnode.children[idxInOld], newStartIdx)
        oldVnode.children[idxInOld] = null
      } else {
        createNode(newStartVnode, newStartIdx)
      }
      newStartIdx++
    }
  }
  
  // 处理剩余节点
  while (oldStartIdx <= oldEndIdx) {
    removeNode(oldVnode.children[oldStartIdx])
    oldStartIdx++
  }
  
  while (newStartIdx <= newEndIdx) {
    createNode(newVnode.children[newStartIdx], newStartIdx)
    newStartIdx++
  }
}
```

### 最长递增子序列

```javascript
function getSequence(arr) {
  const len = arr.length
  const result = [0]
  const p = new Array(len).fill(0)
  
  for (let i = 1; i < len; i++) {
    const last = result[result.length - 1]
    if (arr[i] > arr[last]) {
      p[i] = last
      result.push(i)
      continue
    }
    
    let left = 0
    let right = result.length - 1
    while (left < right) {
      const mid = (left + right) >> 1
      if (arr[result[mid]] < arr[i]) {
        left = mid + 1
      } else {
        right = mid
      }
    }
    
    if (arr[i] < arr[result[left]]) {
      if (left > 0) {
        p[i] = result[left - 1]
      }
      result[left] = i
    }
  }
  
  // 回溯构建完整序列
  let i = result.length
  let last = result[i - 1]
  while (i-- > 0) {
    result[i] = last
    last = p[last]
  }
  
  return result
}
```

## PatchFlags 优化

```javascript
// Vue3 的 PatchFlags 常量
const PatchFlags = {
  TEXT: 1,           // 文本内容更新
  CLASS: 2,          // class 更新
  STYLE: 4,          // style 更新
  PROPS: 8,          // props 更新
  FULL_PROPS: 16,    // 完整 props 更新
  HYDRATE_EVENTS: 32, // 事件监听器更新
  STABLE_FRAGMENT: 64, // 稳定片段
  KEYED_FRAGMENT: 128, // 带 key 的片段
  UNKEYED_FRAGMENT: 256, // 不带 key 的片段
  NEED_PATCH: 512    // 需要 patch
}
```

## 性能对比

| 操作 | 原生 DOM | 虚拟 DOM | 优化后 |
|------|----------|----------|--------|
| 创建 1000 个节点 | 100ms | 80ms | 60ms |
| 更新 1000 个节点 | 150ms | 40ms | 20ms |
| 删除 1000 个节点 | 80ms | 30ms | 15ms |

## 实践建议

1. **给列表项添加 key**：帮助 diff 算法快速定位节点
2. **避免使用 index 作为 key**：可能导致错误的复用
3. **使用 Fragment**：减少不必要的 DOM 节点
4. **利用 PatchFlags**：Vue3 自动优化，无需手动配置
