---
title: 前端代码规范与最佳实践
date: 2024-10-05
---

# 前端代码规范与最佳实践

## 代码规范体系

```
┌─────────────────────────────────────────────────────────┐
│                    代码规范体系                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  JavaScript  │  │   TypeScript │  │   CSS/SCSS   │ │
│  │    规范      │  │    规范      │  │    规范      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   ESLint     │  │  Prettier    │  │   Stylelint  │ │
│  │  代码检查    │  │  代码格式化  │  │  样式检查    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## JavaScript 规范

### 变量与函数

```javascript
// ✅ 好的命名
const userName = 'John'
const getUserInfo = () => {}

// ❌ 不好的命名
const u = 'John'
const getInfo = () => {}

// ✅ 使用 const 优先
const PI = 3.14
const users = []

// ✅ 解构赋值
const { name, age } = user
const [first, second] = array

// ✅ 默认参数
function greet(name = 'Guest') {
  return `Hello, ${name}`
}

// ✅ 箭头函数
const add = (a, b) => a + b

// ❌ 避免不必要的闭包
// ❌ const self = this
// ✅ 使用箭头函数或 bind
```

### 条件语句

```javascript
// ✅ 提前返回
function processUser(user) {
  if (!user) return null
  
  // 处理逻辑
}

// ✅ 使用 switch 或对象映射
const actions = {
  add: handleAdd,
  delete: handleDelete,
  update: handleUpdate
}

function handleAction(action) {
  const handler = actions[action]
  if (handler) {
    return handler()
  }
  throw new Error('Unknown action')
}

// ✅ 使用 === 而不是 ==
if (value === 'string') {}

// ✅ 避免嵌套三元
// ❌ const result = a ? b ? c : d : e
const result = a ? b : c
```

### 异步编程

```javascript
// ✅ 使用 async/await
async function fetchData() {
  try {
    const response = await fetch('/api/data')
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

// ✅ Promise.all 并行执行
async function fetchAll() {
  const [users, posts] = await Promise.all([
    fetchUsers(),
    fetchPosts()
  ])
  return { users, posts }
}

// ✅ Promise.race 超时控制
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, { signal: controller.signal })
    return response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}
```

## TypeScript 规范

### 类型定义

```typescript
// ✅ 使用 interface 定义对象类型
interface User {
  id: number
  name: string
  email: string
}

// ✅ 使用 type 定义联合类型
type Status = 'active' | 'inactive' | 'pending'

// ✅ 泛型函数
function map<T, U>(array: T[], fn: (item: T) => U): U[] {
  return array.map(fn)
}

// ✅ 类型守卫
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

// ✅ 使用 readonly
interface Config {
  readonly apiUrl: string
}
```

### 最佳实践

```typescript
// ✅ 避免 any
// ❌ function process(data: any) {}
// ✅ function process(data: User) {}

// ✅ 使用类型断言谨慎
const user = response.data as User

// ✅ 类型缩小
function handleValue(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase()
  }
  return value.toFixed(2)
}

// ✅ 使用 Partial、Pick、Omit
type UserUpdate = Partial<User>
type UserPreview = Pick<User, 'id' | 'name'>
type UserWithoutPassword = Omit<User, 'password'>
```

## CSS/SCSS 规范

### 命名规范

```scss
// ✅ BEM 命名
.block {}
.block__element {}
.block--modifier {}

// ✅ 使用语义化命名
// ❌ .red-text {}
// ✅ .error-message {}

// ✅ 使用 CSS 变量
:root {
  --primary-color: #07c160;
  --text-color: #333;
}

// ✅ 组织样式
.component {
  // 布局
  display: flex;
  flex-direction: column;
  
  // 间距
  margin: 16px;
  padding: 8px;
  
  // 颜色
  background: var(--primary-color);
  color: white;
}
```

### SCSS 最佳实践

```scss
// ✅ 使用 mixins
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  @include flex-center;
}

// ✅ 使用 extends
%button-base {
  padding: 8px 16px;
  border-radius: 4px;
}

.btn-primary {
  @extend %button-base;
  background: var(--primary-color);
}

// ✅ 避免嵌套过深
// 不超过 3 层嵌套
.component {
  .header {
    .title {
      // 停止嵌套
    }
  }
}

// ✅ 使用 @use 代替 @import
@use './variables' as *;
```

## ESLint 配置

```javascript
// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser'
  },
  plugins: ['@typescript-eslint', 'vue'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    'vue/multi-word-component-names': 'off'
  }
}
```

## Prettier 配置

```javascript
// .prettierrc.js
module.exports = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  jsxSingleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'lf'
}
```

## Git 提交规范

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'revert']
    ],
    'subject-case': [2, 'always', 'sentence-case']
  }
}

// 提交信息格式
// <type>(<scope>): <subject>
//
// <body>
//
// <footer>

// 示例
// feat(auth): add JWT authentication
// fix(api): handle network errors
// docs(readme): update installation guide
```

## 代码审查清单

```javascript
// PR 审查要点
const reviewChecklist = [
  // 功能正确性
  '代码是否实现了预期功能？',
  '是否有边界情况未处理？',
  
  // 代码质量
  '变量和函数命名是否清晰？',
  '是否有重复代码？',
  '是否符合代码规范？',
  
  // 类型安全
  'TypeScript 类型是否正确？',
  '是否避免了 any 类型？',
  
  // 测试覆盖
  '是否有单元测试？',
  '测试覆盖率是否达标？',
  
  // 性能考虑
  '是否有潜在的性能问题？',
  '是否进行了不必要的重新渲染？',
  
  // 安全性
  '是否有 XSS 风险？',
  '是否正确处理了用户输入？',
  
  // 文档
  '是否有必要的注释？',
  'API 文档是否更新？'
]
```

## 总结

| 规范类别 | 工具 | 要点 |
|----------|------|------|
| JavaScript | ESLint | 变量命名、条件语句、异步编程 |
| TypeScript | TypeScript ESLint | 类型安全、泛型、类型守卫 |
| CSS/SCSS | Stylelint | BEM 命名、CSS 变量、嵌套深度 |
| 格式化 | Prettier | 统一代码格式 |
| Git | Commitlint | 规范提交信息 |
| 审查 | PR Checklist | 代码质量保障 |
