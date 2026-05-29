---
title: 前端监控与性能分析
date: 2024-09-10
---

# 前端监控与性能分析

## 监控体系架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端监控体系                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   数据采集   │───>│   数据处理   │───>│   可视化   │ │
│  └──────────────┘    └──────────────┘    └───────────┘ │
│         │                    │                          │
│         ▼                    ▼                          │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   性能指标   │    │   告警系统   │                  │
│  └──────────────┘    └──────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

## 性能指标采集

### Core Web Vitals

```javascript
// LCP (最大内容绘制)
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries()
  const lcpEntry = entries[entries.length - 1]
  console.log('LCP:', lcpEntry.startTime)
}).observe({ type: 'largest-contentful-paint', buffered: true })

// FID (首次输入延迟)
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries()
  const fidEntry = entries[0]
  console.log('FID:', fidEntry.processingStart - fidEntry.startTime)
}).observe({ type: 'first-input', buffered: true })

// CLS (累积布局偏移)
let clsValue = 0
let clsEntries = []

new PerformanceObserver((entryList) => {
  entryList.getEntries().forEach((entry) => {
    if (!entry.hadRecentInput) {
      clsEntries.push(entry)
      clsValue = clsEntries.reduce((acc, entry) => acc + entry.value, 0)
      console.log('CLS:', clsValue)
    }
  })
}).observe({ type: 'layout-shift', buffered: true })
```

### 自定义性能指标

```javascript
// 自定义指标
function measurePerformance(name, fn) {
  const start = performance.now()
  fn()
  const end = performance.now()
  
  performance.mark(`${name}-start`)
  performance.mark(`${name}-end`)
  performance.measure(name, `${name}-start`, `${name}-end`)
  
  const measure = performance.getEntriesByName(name)[0]
  console.log(`${name} duration:`, measure.duration)
  
  return measure.duration
}

// 监控页面加载时间
window.addEventListener('load', () => {
  const loadTime = performance.now()
  console.log('Page load time:', loadTime)
})

// 监控首屏渲染
function monitorFirstPaint() {
  const firstPaint = performance.getEntriesByName('first-paint')[0]
  const firstContentfulPaint = performance.getEntriesByName('first-contentful-paint')[0]
  
  console.log('FP:', firstPaint?.startTime)
  console.log('FCP:', firstContentfulPaint?.startTime)
}
```

## 错误监控

### 全局错误捕获

```javascript
// 捕获同步错误
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  
  // 上报错误
  reportError({
    type: 'global',
    message: event.message,
    filename: event.filename,
    line: event.lineno,
    column: event.colno,
    stack: event.error?.stack
  })
})

// 捕获 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason)
  
  reportError({
    type: 'promise',
    reason: event.reason?.message || event.reason
  })
})

// 捕获 Vue 错误
Vue.config.errorHandler = (err, vm, info) => {
  console.error('Vue error:', err, info)
  
  reportError({
    type: 'vue',
    message: err.message,
    stack: err.stack,
    component: vm.$options.name,
    info
  })
}
```

## 用户行为追踪

```javascript
// 点击事件追踪
function trackClicks() {
  document.addEventListener('click', (event) => {
    const target = event.target
    const elementInfo = {
      tag: target.tagName,
      className: target.className,
      id: target.id,
      text: target.textContent.slice(0, 50)
    }
    
    reportEvent('click', elementInfo)
  }, true)
}

// 页面浏览追踪
function trackPageView() {
  const pageInfo = {
    url: window.location.href,
    referrer: document.referrer,
    timestamp: Date.now()
  }
  
  reportEvent('page_view', pageInfo)
}

// 性能指标追踪
function trackPerformance() {
  const perfData = {
    navigationStart: performance.timing.navigationStart,
    domContentLoaded: performance.timing.domContentLoadedEventEnd,
    loadEventEnd: performance.timing.loadEventEnd,
    firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime
  }
  
  reportEvent('performance', perfData)
}
```

## 数据上报

```javascript
// 上报工具
const Reporter = {
  baseUrl: 'https://api.example.com/report',
  
  async send(data) {
    try {
      const payload = {
        ...data,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem('userId')
      }
      
      // 使用 navigator.sendBeacon 保证页面卸载时也能发送
      if (navigator.sendBeacon) {
        navigator.sendBeacon(this.baseUrl, JSON.stringify(payload))
      } else {
        await fetch(this.baseUrl, {
          method: 'POST',
          body: JSON.stringify(payload),
          keepalive: true
        })
      }
    } catch (err) {
      console.error('Report failed:', err)
    }
  }
}

// 使用示例
Reporter.send({
  type: 'error',
  message: 'Test error',
  stack: 'Error stack'
})
```

## 性能分析工具

```javascript
// 使用 Lighthouse 分析
const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] })
  const options = {
    logLevel: 'info',
    output: 'json',
    port: chrome.port
  }
  
  const runnerResult = await lighthouse(url, options)
  
  console.log('Lighthouse score:', runnerResult.lhr.score)
  
  await chrome.kill()
  return runnerResult
}

// 使用 Web Vitals 库
import { getCLS, getFID, getLCP } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getLCP(console.log)
```

## 告警系统

```javascript
// 告警配置
const alertConfig = {
  lcp: { threshold: 2500, severity: 'error' },
  fid: { threshold: 100, severity: 'warning' },
  cls: { threshold: 0.25, severity: 'error' },
  errorRate: { threshold: 1, severity: 'critical' }
}

// 告警检查
function checkAlerts(metrics) {
  const alerts = []
  
  if (metrics.lcp > alertConfig.lcp.threshold) {
    alerts.push({
      type: 'lcp',
      message: `LCP 超过阈值: ${metrics.lcp}ms`,
      severity: alertConfig.lcp.severity
    })
  }
  
  if (metrics.fid > alertConfig.fid.threshold) {
    alerts.push({
      type: 'fid',
      message: `FID 超过阈值: ${metrics.fid}ms`,
      severity: alertConfig.fid.severity
    })
  }
  
  return alerts
}

// 发送告警
async function sendAlerts(alerts) {
  for (const alert of alerts) {
    await sendSlackAlert(alert)
    await sendEmailAlert(alert)
  }
}
```

## 总结

| 监控维度 | 指标 |
|----------|------|
| 性能 | LCP、FID、CLS、FP、FCP |
| 错误 | 全局错误、Promise 拒绝、Vue 错误 |
| 用户行为 | 点击、页面浏览、交互事件 |
| 资源 | 加载时间、大小、缓存命中率 |
