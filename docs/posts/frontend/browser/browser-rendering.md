---
title: 浏览器渲染原理详解
date: 2024-05-05
---

# 浏览器渲染原理详解

## 渲染流程概览

```
┌─────────────────────────────────────────────────────────────────┐
│                    浏览器渲染流程                               │
├─────────────────────────────────────────────────────────────────┤
│  HTML → 解析 → DOM Tree                                         │
│                    ↓                                            │
│  CSS  → 解析 → CSSOM Tree                                       │
│                    ↓                                            │
│          合并 → Render Tree                                     │
│                    ↓                                            │
│              Layout (布局)                                       │
│                    ↓                                            │
│              Paint (绘制)                                        │
│                    ↓                                            │
│              Composite (合成)                                    │
│                    ↓                                            │
│              显示到屏幕                                          │
└─────────────────────────────────────────────────────────────────┘
```

## 1. HTML 解析

### 解析过程

```javascript
// 简化的 HTML 解析流程
function parseHTML(html) {
  const tokens = tokenize(html)
  const domTree = buildDOM(tokens)
  return domTree
}

function tokenize(html) {
  const tokens = []
  let i = 0
  
  while (i < html.length) {
    if (html[i] === '<') {
      // 标签开始
      if (html[i + 1] === '/') {
        // 结束标签
        const end = html.indexOf('>', i)
        tokens.push({ type: 'end', tag: html.slice(i + 2, end) })
        i = end + 1
      } else {
        // 开始标签
        const end = html.indexOf('>', i)
        tokens.push({ type: 'start', tag: html.slice(i + 1, end) })
        i = end + 1
      }
    } else {
      // 文本节点
      const end = html.indexOf('<', i)
      tokens.push({ type: 'text', content: html.slice(i, end) })
      i = end
    }
  }
  
  return tokens
}
```

### DOM Tree 构建

```javascript
function buildDOM(tokens) {
  const stack = []
  const root = { tag: 'html', children: [] }
  stack.push(root)
  
  for (const token of tokens) {
    if (token.type === 'start') {
      const node = { tag: token.tag, children: [], parent: stack[stack.length - 1] }
      stack[stack.length - 1].children.push(node)
      stack.push(node)
    } else if (token.type === 'end') {
      stack.pop()
    } else if (token.type === 'text') {
      stack[stack.length - 1].children.push({ type: 'text', content: token.content })
    }
  }
  
  return root
}
```

## 2. CSS 解析

### CSSOM Tree

```javascript
// CSS 解析结果结构
const cssom = {
  rules: [
    {
      selectors: ['.container', '#main'],
      declarations: [
        { property: 'width', value: '100%' },
        { property: 'height', value: '200px' }
      ]
    }
  ]
}
```

### 样式计算顺序

```
1. 用户代理样式 (User Agent Styles)
2. 用户样式 (User Styles)  
3. 作者样式 (Author Styles)
   - 外部样式表
   - 内部样式表
   - 内联样式

优先级:
!important > 内联 > ID > 类/伪类/属性 > 元素/伪元素
```

## 3. Render Tree 构建

### Render Tree vs DOM Tree

| 特性 | DOM Tree | Render Tree |
|------|----------|-------------|
| 包含内容 | 所有节点 | 仅渲染节点 |
| 隐藏元素 | 包含 | 不包含 |
| 样式信息 | 无 | 有 |
| 目的 | 结构表示 | 渲染计算 |

### 附加样式

```javascript
function attachStyles(domTree, cssom) {
  // 遍历 DOM 树
  function traverse(node) {
    // 计算匹配的 CSS 规则
    const matchedRules = matchRules(node, cssom.rules)
    
    // 合并样式
    node.computedStyle = mergeStyles(matchedRules)
    
    // 递归子节点
    if (node.children) {
      node.children.forEach(traverse)
    }
  }
  
  traverse(domTree)
}

function matchRules(node, rules) {
  return rules.filter(rule => {
    return rule.selectors.some(selector => matches(node, selector))
  })
}
```

## 4. Layout (布局)

### 布局计算

```javascript
function layout(node, parentWidth, parentHeight) {
  // 计算自身尺寸
  const style = node.computedStyle
  const width = calculateWidth(style, parentWidth)
  const height = calculateHeight(style, parentHeight)
  
  node.layout = {
    width,
    height,
    x: 0,
    y: 0
  }
  
  // 计算子节点位置
  let currentY = style.marginTop
  
  if (node.children) {
    node.children.forEach(child => {
      layout(child, width - style.paddingLeft - style.paddingRight, parentHeight)
      
      child.layout.x = style.paddingLeft + style.marginLeft
      child.layout.y = currentY + style.paddingTop
      
      currentY += child.layout.height + style.marginBottom
    })
  }
}
```

### 重排 (Reflow)

```javascript
// 触发重排的操作
const reflowTriggers = [
  '改变元素尺寸',      // width, height, padding, margin
  '改变元素位置',      // left, top, position, float
  '添加/删除元素',     // appendChild, removeChild
  '改变内容',          // innerHTML, textContent
  '计算 offsetWidth',  // 强制同步布局
  '计算 offsetHeight'
]
```

## 5. Paint (绘制)

### 绘制顺序

```
1. 背景色
2. 背景图
3. 边框
4. 文本
5. 阴影
```

### 重绘 (Repaint)

```javascript
// 触发重绘的操作
const repaintTriggers = [
  '改变颜色',          // color, background-color
  '改变透明度',        // opacity
  '改变阴影',          // box-shadow, text-shadow
  '改变背景图',        // background-image
]
```

## 6. Composite (合成)

### Layer 树

```javascript
// 合成层创建条件
const layerTriggers = [
  '3D 变换',          // transform: translate3d, rotate3d
  'CSS 动画',         // animation, transition
  'will-change',      // will-change: transform
  'video',            // video 元素
  'canvas',           // canvas 元素
  'opacity < 1',      // 半透明
]
```

### 合成过程

```javascript
function composite(layers) {
  // 按 z-index 排序
  layers.sort((a, b) => a.zIndex - b.zIndex)
  
  // 合并到最终图像
  const finalImage = layers.reduce((result, layer) => {
    return mergeLayers(result, layer)
  }, null)
  
  return finalImage
}
```

## 性能优化策略

### 减少重排重绘

```javascript
// 优化前：多次重排
element.style.width = '100px'
element.style.height = '200px'
element.style.margin = '10px'

// 优化后：单次重排
element.style.cssText = 'width: 100px; height: 200px; margin: 10px;'

// 或者使用 CSSOM
const declaration = document.styleSheets[0].cssRules[0].style
declaration.width = '100px'
declaration.height = '200px'
```

### 使用合成层

```css
/* 使用 will-change 提示浏览器 */
.element {
  will-change: transform, opacity;
}

/* 使用 3D 变换触发合成层 */
.element {
  transform: translateZ(0);
}
```

### 避免强制同步布局

```javascript
// 错误：强制同步布局
elements.forEach(el => {
  el.style.width = `${el.offsetWidth + 10}px` // 触发重排
})

// 正确：先读取再写入
const widths = elements.map(el => el.offsetWidth)
elements.forEach((el, i) => {
  el.style.width = `${widths[i] + 10}px`
})
```

## 总结

| 阶段 | 输出 | 触发方式 | 性能影响 |
|------|------|----------|----------|
| 解析 | DOM/CSSOM | HTML/CSS 加载 | 低 |
| 构建 Render Tree | 渲染树 | DOM/CSSOM 更新 | 中 |
| Layout | 布局信息 | 尺寸/位置变化 | 高 |
| Paint | 像素数据 | 颜色/外观变化 | 中 |
| Composite | 最终图像 | 合成层变化 | 低 |
