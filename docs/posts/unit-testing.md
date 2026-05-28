---
title: 前端单元测试实战
date: 2024-09-30
---

# 前端单元测试实战

## 测试体系架构

```
┌─────────────────────────────────────────────────────────┐
│                    测试体系架构                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  单元测试    │  │  集成测试    │  │  E2E测试     │ │
│  │  Unit Test  │  │ Integration  │  │ End-to-End  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Jest       │  │  Cypress     │  │  Playwright  │ │
│  │  Vitest     │  │  Testing     │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Jest 基础配置

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts'],
  coverageThreshold: {
    global: {
      lines: 80,
      statements: 80,
      functions: 80,
      branches: 80
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}
```

## 单元测试基础

### 函数测试

```javascript
// utils.ts
export function add(a: number, b: number): number {
  return a + b
}

export function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

// utils.spec.ts
import { add, fibonacci } from './utils'

describe('Utils', () => {
  describe('add', () => {
    it('should return the sum of two numbers', () => {
      expect(add(1, 2)).toBe(3)
      expect(add(-1, 1)).toBe(0)
      expect(add(0, 0)).toBe(0)
    })
  })

  describe('fibonacci', () => {
    it('should return the nth fibonacci number', () => {
      expect(fibonacci(0)).toBe(0)
      expect(fibonacci(1)).toBe(1)
      expect(fibonacci(5)).toBe(5)
      expect(fibonacci(10)).toBe(55)
    })
  })
})
```

### 异步测试

```javascript
// api.ts
export async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
}

// api.spec.ts
import { fetchUser } from './api'

describe('API', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  describe('fetchUser', () => {
    it('should fetch user data', async () => {
      const mockUser = { id: 1, name: 'John' }
      
      (global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockUser)
      })

      const user = await fetchUser(1)

      expect(fetch).toHaveBeenCalledWith('/api/users/1')
      expect(user).toEqual(mockUser)
    })

    it('should handle errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(fetchUser(1)).rejects.toThrow('Network error')
    })
  })
})
```

## Vue 组件测试

```vue
<!-- Button.vue -->
<template>
  <button 
    :class="['btn', { 'btn-primary': primary }]"
    @click="handleClick"
  >
    <slot>{{ text }}</slot>
  </button>
</template>

<script>
export default {
  name: 'Button',
  props: {
    text: {
      type: String,
      default: 'Click me'
    },
    primary: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  methods: {
    handleClick() {
      this.$emit('click')
    }
  }
}
</script>

<!-- Button.spec.ts -->
import { mount } from '@vue/test-utils'
import Button from './Button.vue'

describe('Button', () => {
  it('should render correctly', () => {
    const wrapper = mount(Button)
    
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.classes()).toContain('btn')
    expect(wrapper.classes()).not.toContain('btn-primary')
  })

  it('should render with primary class', () => {
    const wrapper = mount(Button, {
      props: { primary: true }
    })
    
    expect(wrapper.classes()).toContain('btn-primary')
  })

  it('should emit click event', () => {
    const wrapper = mount(Button)
    
    wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('should render slot content', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Custom text'
      }
    })
    
    expect(wrapper.text()).toBe('Custom text')
  })
})
```

## React 组件测试

```jsx
// Button.jsx
function Button({ children, onClick, variant = 'primary' }) {
  const baseStyles = 'px-4 py-2 rounded font-medium'
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300'
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import Button from './Button'

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>)
    
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should apply primary styles by default', () => {
    render(<Button>Primary</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-500')
  })

  it('should apply secondary styles', () => {
    render(<Button variant="secondary">Secondary</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gray-200')
  })

  it('should call onClick when clicked', () => {
    const mockOnClick = jest.fn()
    render(<Button onClick={mockOnClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })
})
```

## Mock 技巧

```javascript
// Mock 模块
jest.mock('./api', () => ({
  fetchUser: jest.fn().mockResolvedValue({ id: 1, name: 'Mocked' })
}))

// Mock 定时器
jest.useFakeTimers()

describe('Timer', () => {
  it('should execute after delay', () => {
    const callback = jest.fn()
    setTimeout(callback, 1000)

    jest.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalledTimes(1)
  })
})

// Mock Date
const mockDate = new Date('2024-01-01')
jest.spyOn(global, 'Date').mockImplementation(() => mockDate)

// 清理 Mock
afterEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})
```

## 测试覆盖率

```javascript
// 运行测试并生成覆盖率报告
// npm test -- --coverage

// 覆盖率配置
module.exports = {
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

## 集成测试

```javascript
// 集成测试示例
describe('User Flow', () => {
  it('should login and navigate to dashboard', async () => {
    // Setup
    const { page } = await browser.newPage()
    
    // Test
    await page.goto('/login')
    await page.type('#email', 'test@example.com')
    await page.type('#password', 'password')
    await page.click('#submit')
    
    // Assert
    await page.waitForNavigation()
    expect(page.url()).toBe('http://localhost:3000/dashboard')
  })
})
```

## 总结

| 测试类型 | 工具 | 适用场景 |
|----------|------|----------|
| 单元测试 | Jest/Vitest | 函数、组件、工具类 |
| 集成测试 | Jest + Testing Library | 组件交互、API 集成 |
| E2E 测试 | Cypress/Playwright | 完整用户流程 |
| 快照测试 | Jest | UI 一致性检查 |
| 覆盖率 | Istanbul | 测试覆盖分析 |
