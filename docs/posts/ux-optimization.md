---
title: 用户体验优化实战
date: 2024-10-20
---

# 用户体验优化实战

## UX 优化体系

```
┌─────────────────────────────────────────────────────────┐
│                    用户体验优化                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   交互设计   │  │   视觉设计   │  │   性能优化   │ │
│  │  Interaction │  │   Visual    │  │ Performance │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   无障碍     │  │   响应式     │  │   加载状态   │ │
│  │   Accessibility│ │ Responsive │  │   Loading   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 加载状态优化

### 骨架屏实现

```vue
<!-- Skeleton.vue -->
<template>
  <div class="skeleton">
    <div class="skeleton-header">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-info">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line medium"></div>
      </div>
    </div>
    <div class="skeleton-content">
      <div class="skeleton-line long"></div>
      <div class="skeleton-line long"></div>
      <div class="skeleton-line medium"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton {
  padding: 16px;
}

.skeleton-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-info {
  flex: 1;
  margin-left: 12px;
}

.skeleton-line {
  height: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  margin-bottom: 8px;
}

.skeleton-line.short { width: 60%; }
.skeleton-line.medium { width: 80%; }
.skeleton-line.long { width: 100%; }

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
```

### 渐进式加载

```javascript
// 图片渐进式加载
class ProgressiveImage {
  constructor(element) {
    this.element = element
    this.lowResSrc = element.dataset.srcLow
    this.highResSrc = element.dataset.src
    
    this.init()
  }
  
  init() {
    this.loadLowRes()
  }
  
  async loadLowRes() {
    const img = new Image()
    img.onload = () => {
      this.element.src = this.lowResSrc
      this.element.style.filter = 'blur(8px)'
      this.loadHighRes()
    }
    img.src = this.lowResSrc
  }
  
  async loadHighRes() {
    const img = new Image()
    img.onload = () => {
      this.element.src = this.highResSrc
      this.element.style.filter = 'blur(0)'
      this.element.style.transition = 'filter 0.3s ease'
    }
    img.src = this.highResSrc
  }
}

// 使用
document.querySelectorAll('img.progressive').forEach(img => {
  new ProgressiveImage(img)
})
```

## 交互体验优化

### 平滑滚动

```javascript
function smoothScrollTo(element, duration = 500) {
  const targetPosition = element.getBoundingClientRect().top
  const startPosition = window.pageYOffset
  const startTime = performance.now()
  
  function scroll(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    
    window.scrollTo({
      top: startPosition + targetPosition * easeProgress,
      behavior: 'smooth'
    })
    
    if (progress < 1) {
      requestAnimationFrame(scroll)
    }
  }
  
  requestAnimationFrame(scroll)
}

// 监听导航点击
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault()
    const target = document.querySelector(anchor.getAttribute('href'))
    if (target) {
      smoothScrollTo(target)
    }
  })
})
```

### 点击反馈

```css
/* 按钮点击反馈 */
.btn {
  position: relative;
  overflow: hidden;
  transition: transform 0.1s ease;
}

.btn:active {
  transform: scale(0.95);
}

.btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.btn:active::after {
  width: 200px;
  height: 200px;
}
```

### 拖拽排序

```javascript
// 拖拽排序实现
class DragSort {
  constructor(container) {
    this.container = container
    this.items = Array.from(container.children)
    this.draggedItem = null
    this.dragOverItem = null
    
    this.init()
  }
  
  init() {
    this.items.forEach(item => {
      item.draggable = true
      item.addEventListener('dragstart', this.handleDragStart.bind(this))
      item.addEventListener('dragover', this.handleDragOver.bind(this))
      item.addEventListener('drop', this.handleDrop.bind(this))
    })
  }
  
  handleDragStart(e) {
    this.draggedItem = e.target
    e.dataTransfer.effectAllowed = 'move'
    this.draggedItem.classList.add('dragging')
  }
  
  handleDragOver(e) {
    e.preventDefault()
    this.dragOverItem = e.target
    this.dragOverItem.classList.add('drag-over')
  }
  
  handleDrop(e) {
    e.preventDefault()
    
    if (this.draggedItem !== this.dragOverItem) {
      const items = Array.from(this.container.children)
      const draggedIndex = items.indexOf(this.draggedItem)
      const dropIndex = items.indexOf(this.dragOverItem)
      
      if (draggedIndex < dropIndex) {
        this.container.insertBefore(this.draggedItem, this.dragOverItem.nextSibling)
      } else {
        this.container.insertBefore(this.draggedItem, this.dragOverItem)
      }
    }
    
    this.draggedItem.classList.remove('dragging')
    this.dragOverItem.classList.remove('drag-over')
  }
}

// 使用
new DragSort(document.querySelector('.drag-container'))
```

## 表单体验优化

### 实时验证

```javascript
// 表单实时验证
class FormValidator {
  constructor(form) {
    this.form = form
    this.fields = form.querySelectorAll('[data-validate]')
    
    this.init()
  }
  
  init() {
    this.fields.forEach(field => {
      field.addEventListener('input', this.validateField.bind(this))
      field.addEventListener('blur', this.validateField.bind(this))
    })
    
    this.form.addEventListener('submit', this.handleSubmit.bind(this))
  }
  
  validateField(e) {
    const field = e.target
    const rules = field.dataset.validate.split(',')
    let isValid = true
    
    rules.forEach(rule => {
      const result = this.validateRule(field, rule.trim())
      if (!result.valid) {
        this.showError(field, result.message)
        isValid = false
      } else {
        this.clearError(field)
      }
    })
    
    return isValid
  }
  
  validateRule(field, rule) {
    const value = field.value
    
    switch (rule) {
      case 'required':
        return {
          valid: value.trim() !== '',
          message: '此字段不能为空'
        }
      case 'email':
        return {
          valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
          message: '请输入有效的邮箱地址'
        }
      case 'phone':
        return {
          valid: /^1[3-9]\d{9}$/.test(value),
          message: '请输入有效的手机号码'
        }
      default:
        return { valid: true }
    }
  }
  
  showError(field, message) {
    const errorElement = field.parentElement.querySelector('.error-message')
    if (errorElement) {
      errorElement.textContent = message
    }
    field.classList.add('error')
  }
  
  clearError(field) {
    const errorElement = field.parentElement.querySelector('.error-message')
    if (errorElement) {
      errorElement.textContent = ''
    }
    field.classList.remove('error')
  }
  
  handleSubmit(e) {
    let isValid = true
    
    this.fields.forEach(field => {
      if (!this.validateField({ target: field })) {
        isValid = false
      }
    })
    
    if (!isValid) {
      e.preventDefault()
    }
  }
}

// 使用
new FormValidator(document.querySelector('#my-form'))
```

## 响应式设计优化

### 响应式断点

```css
/* 响应式断点配置 */
:root {
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
}

/* 响应式布局 */
.container {
  width: 100%;
  padding: 0 16px;
}

@media (min-width: 576px) {
  .container {
    max-width: 540px;
    margin: 0 auto;
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 720px;
  }
}

@media (min-width: 992px) {
  .container {
    max-width: 960px;
  }
}

@media (min-width: 1200px) {
  .container {
    max-width: 1140px;
  }
}
```

### 响应式图片

```html
<!-- 响应式图片 -->
<img 
  src="image-small.jpg" 
  srcset="image-small.jpg 400w,
          image-medium.jpg 800w,
          image-large.jpg 1200w"
  sizes="(max-width: 576px) 400px,
         (max-width: 992px) 800px,
         1200px"
  alt="Responsive image"
>

<!-- 使用 picture 元素 -->
<picture>
  <source media="(max-width: 576px)" srcset="image-mobile.webp" type="image/webp">
  <source media="(max-width: 576px)" srcset="image-mobile.jpg" type="image/jpeg">
  <source media="(min-width: 577px)" srcset="image-desktop.webp" type="image/webp">
  <source media="(min-width: 577px)" srcset="image-desktop.jpg" type="image/jpeg">
  <img src="image-desktop.jpg" alt="Image">
</picture>
```

## 无障碍访问优化

### ARIA 属性

```html
<!-- 无障碍表单 -->
<form>
  <label for="username">用户名</label>
  <input 
    type="text" 
    id="username" 
    aria-required="true"
    aria-describedby="username-help"
  >
  <p id="username-help">请输入您的用户名</p>
  
  <!-- 错误提示 -->
  <div role="alert" aria-live="polite" class="error-message"></div>
</form>

<!-- 无障碍导航 -->
<nav aria-label="主导航">
  <ul>
    <li><a href="/" aria-current="page">首页</a></li>
    <li><a href="/about">关于</a></li>
    <li><a href="/contact">联系</a></li>
  </ul>
</nav>

<!-- 无障碍按钮 -->
<button aria-expanded="false" aria-controls="menu">
  菜单
</button>
<ul id="menu" hidden>
  <!-- 菜单项 -->
</ul>
```

## 总结

| 优化维度 | 具体措施 |
|----------|----------|
| 加载状态 | 骨架屏、渐进式加载、加载动画 |
| 交互体验 | 平滑滚动、点击反馈、拖拽排序 |
| 表单体验 | 实时验证、错误提示、自动完成 |
| 响应式 | 断点配置、响应式图片、弹性布局 |
| 无障碍 | ARIA 属性、语义化标签、键盘导航 |