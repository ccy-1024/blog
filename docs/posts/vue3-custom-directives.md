---
title: Vue3 自定义指令开发
date: 2024-03-10
---

# Vue3 自定义指令开发

## 指令钩子函数

```javascript
const myDirective = {
  // 在绑定元素的父组件挂载之前调用
  beforeMount(el, binding, vnode, prevVnode) {},
  
  // 在绑定元素的父组件挂载之后调用
  mounted(el, binding, vnode, prevVnode) {},
  
  // 在包含组件的 VNode 更新之前调用
  beforeUpdate(el, binding, vnode, prevVnode) {},
  
  // 在包含组件的 VNode 及其子 VNode 全部更新之后调用
  updated(el, binding, vnode, prevVnode) {},
  
  // 在绑定元素的父组件卸载之前调用
  beforeUnmount(el, binding, vnode, prevVnode) {},
  
  // 在绑定元素的父组件卸载之后调用
  unmounted(el, binding, vnode, prevVnode) {}
}
```

## 钩子参数说明

```javascript
// el: 绑定指令的 DOM 元素
// binding: 包含指令信息的对象
//   - name: 指令名（不含 v-）
//   - value: 指令绑定的值
//   - oldValue: 之前绑定的值
//   - arg: 指令参数（如 v-my:arg）
//   - modifiers: 修饰符对象（如 v-my.modifier）
// vnode: 虚拟节点
// prevVnode: 上一个虚拟节点（仅 beforeUpdate/updated 有）
```

## 实用指令示例

### 示例1：防抖指令

```javascript
// v-debounce
const debounce = {
  mounted(el, binding) {
    const { value, arg = 'click' } = binding
    let timer = null
    
    el.addEventListener(arg, (e) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        value(e)
      }, 500)
    })
  }
}

// 使用
// <button v-debounce="handleClick">提交</button>
// <button v-debounce:input="handleInput">输入</button>
```

### 示例2：滚动加载指令

```javascript
// v-infinite-scroll
const infiniteScroll = {
  mounted(el, binding) {
    const { value } = binding
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          value()
        }
      })
    }, {
      rootMargin: '100px'
    })
    
    observer.observe(el)
    el.__observer__ = observer
  },
  
  unmounted(el) {
    el.__observer__?.disconnect()
  }
}

// 使用
// <div v-infinite-scroll="loadMore">加载更多</div>
```

### 示例3：权限指令

```javascript
// v-permission
const permission = {
  mounted(el, binding) {
    const { value } = binding
    const userPermissions = getUserPermissions()
    
    if (!userPermissions.includes(value)) {
      el.style.display = 'none'
      // 或移除元素
      // el.remove()
    }
  }
}

// 使用
// <button v-permission="'admin'">管理后台</button>
// <button v-permission="'edit'">编辑</button>
```

### 示例4：拖拽指令

```javascript
// v-draggable
const draggable = {
  mounted(el) {
    let startX = 0
    let startY = 0
    let offsetX = 0
    let offsetY = 0
    
    const onMouseDown = (e) => {
      startX = e.clientX
      startY = e.clientY
      offsetX = el.offsetLeft
      offsetY = el.offsetTop
      
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }
    
    const onMouseMove = (e) => {
      const x = e.clientX - startX + offsetX
      const y = e.clientY - startY + offsetY
      el.style.left = `${x}px`
      el.style.top = `${y}px`
    }
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    
    el.style.position = 'absolute'
    el.addEventListener('mousedown', onMouseDown)
  }
}

// 使用
// <div v-draggable>可拖拽元素</div>
```

## 注册指令

```javascript
// 全局注册
const app = createApp(App)
app.directive('debounce', debounce)
app.directive('permission', permission)

// 局部注册
export default {
  directives: {
    debounce,
    permission
  }
}
```

## 指令修饰符

```javascript
// v-my-directive.modifier1.modifier2
const myDirective = {
  mounted(el, binding) {
    if (binding.modifiers.modifier1) {
      // 处理 modifier1
    }
    if (binding.modifiers.modifier2) {
      // 处理 modifier2
    }
  }
}

// 使用
// <div v-my-directive.stop.prevent>点击</div>
```

## 最佳实践

1. **保持指令职责单一**：一个指令只做一件事
2. **清理资源**：在 unmounted 钩子中清理事件监听等
3. **提供默认值**：为参数和修饰符提供合理默认值
4. **类型安全**：使用 TypeScript 定义指令类型
