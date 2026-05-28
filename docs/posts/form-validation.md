---
title: 表单验证与数据处理
date: 2024-10-25
---

# 表单验证与数据处理

## 表单验证体系

```
┌─────────────────────────────────────────────────────────┐
│                    表单验证体系                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   客户端验证 │  │   服务端验证 │  │   数据处理   │ │
│  │  Client-side │  │  Server-side │  │  Data Process│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ 实时验证     │  │ 参数校验    │  │ 数据转换    │ │
│  │ 自定义规则   │  │ 权限验证    │  │ 数据格式化  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 表单验证基础

### HTML5 原生验证

```html
<!-- HTML5 原生验证属性 -->
<form>
  <!-- 必填字段 -->
  <input type="text" required>
  
  <!-- 最小长度 -->
  <input type="text" minlength="3" maxlength="20">
  
  <!-- 数字范围 -->
  <input type="number" min="1" max="100">
  
  <!-- 邮箱验证 -->
  <input type="email">
  
  <!-- URL 验证 -->
  <input type="url">
  
  <!-- 正则表达式 -->
  <input type="text" pattern="[A-Za-z]+">
  
  <!-- 自定义验证消息 -->
  <input 
    type="text" 
    required 
    oninvalid="this.setCustomValidity('请填写此字段')"
    oninput="this.setCustomValidity('')"
  >
  
  <button type="submit">提交</button>
</form>
```

### 自定义验证规则

```javascript
// 自定义验证规则集合
const validationRules = {
  required: {
    validate: (value) => value !== undefined && value !== null && value !== '',
    message: '此字段为必填项'
  },
  
  minLength: {
    validate: (value, param) => String(value).length >= param,
    message: '最少需要 {param} 个字符'
  },
  
  maxLength: {
    validate: (value, param) => String(value).length <= param,
    message: '最多允许 {param} 个字符'
  },
  
  email: {
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: '请输入有效的邮箱地址'
  },
  
  phone: {
    validate: (value) => /^1[3-9]\d{9}$/.test(value),
    message: '请输入有效的手机号码'
  },
  
  password: {
    validate: (value) => {
      const hasNumber = /\d/.test(value)
      const hasLetter = /[a-zA-Z]/.test(value)
      return value.length >= 8 && hasNumber && hasLetter
    },
    message: '密码至少需要8位，包含数字和字母'
  },
  
  confirmPassword: {
    validate: (value, param, formData) => value === formData[param],
    message: '两次输入的密码不一致'
  },
  
  pattern: {
    validate: (value, param) => new RegExp(param).test(value),
    message: '格式不正确'
  }
}
```

## 表单验证器实现

```javascript
// 表单验证器类
class FormValidator {
  constructor(form, rules) {
    this.form = form
    this.rules = rules
    this.errors = {}
    this.formData = {}
  }
  
  // 验证单个字段
  validateField(fieldName) {
    const fieldRules = this.rules[fieldName]
    const value = this.formData[fieldName]
    const fieldErrors = []
    
    if (!fieldRules) return []
    
    for (const [ruleName, param] of Object.entries(fieldRules)) {
      const rule = validationRules[ruleName]
      
      if (!rule) continue
      
      const isValid = rule.validate(value, param, this.formData)
      
      if (!isValid) {
        let message = rule.message
        if (message.includes('{param}')) {
          message = message.replace('{param}', param)
        }
        fieldErrors.push(message)
      }
    }
    
    this.errors[fieldName] = fieldErrors
    return fieldErrors
  }
  
  // 验证整个表单
  validate(formData) {
    this.formData = formData
    this.errors = {}
    
    for (const fieldName of Object.keys(this.rules)) {
      this.validateField(fieldName)
    }
    
    return Object.keys(this.errors).length === 0
  }
  
  // 获取错误信息
  getErrors() {
    return this.errors
  }
  
  // 获取单个字段错误
  getFieldErrors(fieldName) {
    return this.errors[fieldName] || []
  }
}

// 使用示例
const validator = new FormValidator(null, {
  username: {
    required: true,
    minLength: 3,
    maxLength: 20
  },
  email: {
    required: true,
    email: true
  },
  password: {
    required: true,
    password: true
  },
  confirmPassword: {
    required: true,
    confirmPassword: 'password'
  }
})

const formData = {
  username: 'john',
  email: 'john@example.com',
  password: 'Password123',
  confirmPassword: 'Password123'
}

const isValid = validator.validate(formData)
console.log(validator.getErrors())
```

## 异步验证

```javascript
// 异步验证器
class AsyncFormValidator extends FormValidator {
  constructor(form, rules) {
    super(form, rules)
    this.asyncRules = {
      uniqueUsername: this.checkUniqueUsername,
      uniqueEmail: this.checkUniqueEmail
    }
  }
  
  // 检查用户名是否唯一
  async checkUniqueUsername(value) {
    const response = await fetch(`/api/check-username?username=${value}`)
    const data = await response.json()
    return data.isUnique
  }
  
  // 检查邮箱是否唯一
  async checkUniqueEmail(value) {
    const response = await fetch(`/api/check-email?email=${value}`)
    const data = await response.json()
    return data.isUnique
  }
  
  // 异步验证单个字段
  async validateFieldAsync(fieldName) {
    const fieldRules = this.rules[fieldName]
    const value = this.formData[fieldName]
    const fieldErrors = [...this.validateField(fieldName)]
    
    for (const [ruleName, param] of Object.entries(fieldRules)) {
      if (this.asyncRules[ruleName]) {
        const isValid = await this.asyncRules[ruleName](value, param)
        
        if (!isValid) {
          const messages = {
            uniqueUsername: '该用户名已被使用',
            uniqueEmail: '该邮箱已被注册'
          }
          fieldErrors.push(messages[ruleName])
        }
      }
    }
    
    this.errors[fieldName] = fieldErrors
    return fieldErrors
  }
  
  // 异步验证整个表单
  async validateAsync(formData) {
    this.formData = formData
    this.errors = {}
    
    for (const fieldName of Object.keys(this.rules)) {
      await this.validateFieldAsync(fieldName)
    }
    
    return Object.keys(this.errors).length === 0
  }
}

// 使用示例
const asyncValidator = new AsyncFormValidator(null, {
  username: {
    required: true,
    uniqueUsername: true
  },
  email: {
    required: true,
    email: true,
    uniqueEmail: true
  }
})

async function handleSubmit(formData) {
  const isValid = await asyncValidator.validateAsync(formData)
  if (isValid) {
    // 提交表单
  }
}
```

## 数据处理

### 数据转换

```javascript
// 数据转换工具
const dataTransformers = {
  // 去除首尾空格
  trim: (value) => String(value).trim(),
  
  // 转小写
  toLowerCase: (value) => String(value).toLowerCase(),
  
  // 转大写
  toUpperCase: (value) => String(value).toUpperCase(),
  
  // 移除空格
  removeSpaces: (value) => String(value).replace(/\s/g, ''),
  
  // 格式化日期
  formatDate: (value) => {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]
    }
    return value
  },
  
  // 格式化电话号码
  formatPhone: (value) => {
    const cleaned = String(value).replace(/\D/g, '')
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3')
  },
  
  // 金额格式化
  formatCurrency: (value) => {
    return Number(value).toLocaleString('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    })
  }
}

// 使用示例
const transformer = {
  username: ['trim', 'toLowerCase'],
  email: ['trim', 'toLowerCase'],
  phone: ['removeSpaces'],
  amount: ['formatCurrency']
}

function transformData(formData, transformConfig) {
  const result = { ...formData }
  
  for (const [field, transforms] of Object.entries(transformConfig)) {
    if (result[field] !== undefined) {
      for (const transform of transforms) {
        const fn = dataTransformers[transform]
        if (fn) {
          result[field] = fn(result[field])
        }
      }
    }
  }
  
  return result
}
```

### 数据格式化

```javascript
// 格式化工具
class DataFormatter {
  // 格式化表单数据
  formatFormData(formData) {
    return {
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
  
  // 序列化表单数据
  serialize(formData) {
    return new URLSearchParams(formData).toString()
  }
  
  // 转换为 FormData
  toFormData(formData) {
    const form = new FormData()
    
    for (const [key, value] of Object.entries(formData)) {
      if (value !== undefined && value !== null) {
        form.append(key, value)
      }
    }
    
    return form
  }
  
  // 安全过滤
  sanitize(formData) {
    const sanitized = { ...formData }
    
    // 过滤敏感字段
    const sensitiveFields = ['password', 'token', 'secret']
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***'
      }
    }
    
    return sanitized
  }
}
```

## 错误处理

```javascript
// 错误处理工具
class ErrorHandler {
  constructor() {
    this.errorMessages = {
      network: '网络错误，请稍后重试',
      timeout: '请求超时，请重试',
      server: '服务器错误，请联系管理员',
      validation: '表单验证失败，请检查输入'
    }
  }
  
  // 处理 HTTP 错误
  handleHttpError(response) {
    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error('请求参数错误')
        case 401:
          throw new Error('未授权，请重新登录')
        case 403:
          throw new Error('无权访问')
        case 404:
          throw new Error('资源未找到')
        case 500:
          throw new Error(this.errorMessages.server)
        default:
          throw new Error('请求失败')
      }
    }
    
    return response
  }
  
  // 处理验证错误
  handleValidationError(errors) {
    const messages = []
    
    for (const [field, fieldErrors] of Object.entries(errors)) {
      messages.push(...fieldErrors)
    }
    
    return messages
  }
  
  // 显示错误消息
  showError(message) {
    // 显示错误提示
    console.error(message)
    
    // 可以在这里调用 UI 组件显示错误
    // toast.error(message)
  }
}

// 使用示例
const errorHandler = new ErrorHandler()

async function submitForm(formData) {
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'application/json' }
    })
    
    errorHandler.handleHttpError(response)
    
    const data = await response.json()
    return data
  } catch (error) {
    errorHandler.showError(error.message)
    throw error
  }
}
```

## 总结

| 功能模块 | 说明 |
|----------|------|
| 验证规则 | 必填、长度、格式、自定义规则 |
| 异步验证 | 用户名/邮箱唯一性检查 |
| 数据转换 | 格式化、清洗、转换 |
| 错误处理 | HTTP 错误、验证错误、统一处理 |
| 安全性 | 敏感字段过滤、输入验证 |