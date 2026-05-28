---
title: 微前端架构原理与实践
date: 2024-02-01
---

# 微前端架构原理与实践

## 什么是微前端

微前端是一种将单体前端应用拆分成多个独立、可独立开发、测试和部署的小型前端应用的架构模式。

## 微前端的核心优势

- **技术栈无关**：每个微应用可以使用不同的技术栈
- **独立部署**：各微应用可以独立发布，互不影响
- **团队自治**：不同团队可以独立开发各自的模块
- **渐进式升级**：可以逐步迁移旧系统，不需要一次性重构

## qiankun 框架原理

### 沙箱机制

```javascript
// qiankun 的沙箱实现原理
function createSandbox() {
  const proxy = new Proxy(window, {
    get(target, key) {
      // 优先从应用沙箱中获取
      if (key in appSandbox) {
        return appSandbox[key]
      }
      return target[key]
    },
    set(target, key, value) {
      // 写入应用沙箱
      appSandbox[key] = value
      return true
    }
  })
  return proxy
}
```

### 样式隔离

```javascript
// 样式隔离方案
function scopedCSS(appName) {
  const styleSheets = document.styleSheets
  for (let i = 0; i < styleSheets.length; i++) {
    const sheet = styleSheets[i]
    // 为每个样式规则添加应用前缀
    const rules = sheet.cssRules || sheet.rules
    for (let j = 0; j < rules.length; j++) {
      const rule = rules[j]
      if (rule.selectorText) {
        rule.selectorText = `.${appName} ${rule.selectorText}`
      }
    }
  }
}
```

## 微前端通信方案

### 父子通信

```javascript
// 父应用
function registerMicroApp(appName, appConfig) {
  window.__MICRO_APP_MESSAGE__ = {
    onMessage: (callback) => {
      window.addEventListener(`micro-app-${appName}`, (e) => {
        callback(e.detail)
      })
    },
    sendMessage: (data) => {
      window.dispatchEvent(new CustomEvent(`parent-to-${appName}`, { detail: data }))
    }
  }
}

// 子应用
function connectParent() {
  window.addEventListener(`parent-to-${appName}`, (e) => {
    console.log('收到父应用消息:', e.detail)
  })
  
  function sendToParent(data) {
    window.dispatchEvent(new CustomEvent(`micro-app-${appName}`, { detail: data }))
  }
}
```

## 实践建议

1. **合理划分微应用边界**：按业务域划分，避免过细或过粗
2. **统一技术规范**：制定统一的代码规范、设计规范
3. **共享公共依赖**：将公共依赖抽离成共享模块
4. **完善监控体系**：建立统一的日志、监控、告警系统
