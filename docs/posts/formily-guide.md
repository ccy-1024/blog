---
title: Formily 表单框架实战
date: 2024-12-25
---

# Formily 表单框架实战

## Formily 架构

```
┌─────────────────────────────────────────────────────────┐
│                   Formily 架构                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Form Core  │  │   Schema     │  │   Components │ │
│  │   表单核心   │  │   协议引擎   │  │   组件库     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                    │                    │    │
│         ▼                    ▼                    ▼    │
│  ──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   React/Vue  │  │   Validator  │  │   Effects    │ │
│  │   框架适配   │  │   验证引擎   │  │   副作用逻辑 │ │
│  └──────────────┘  └──────────────  └──────────────┘ │
─────────────────────────────────────────────────────────┘
```

## 核心概念

### 1. Form 实例

```typescript
import { createForm } from '@formily/core'

const form = createForm({
  values: {
    username: 'admin',
    email: 'admin@example.com'
  },
  effects: (form) => {
    // 副作用逻辑
    form.onFieldChange('username', (field) => {
      console.log('username changed:', field.value)
    })
  }
})
```

### 2. Field 模型

```typescript
// 普通字段
const field = form.createField({
  name: 'username',
  title: '用户名',
  dataSource: [],
  decorator: [FormItem],
  component: [Input, { placeholder: '请输入用户名' }]
})

// 对象字段
const objectField = form.createObjectField({
  name: 'user',
  properties: {
    username: {
      type: 'string',
      title: '用户名'
    },
    age: {
      type: 'number',
      title: '年龄'
    }
  }
})

// 数组字段
const arrayField = form.createArrayField({
  name: 'tags',
  dataSource: ['tag1', 'tag2']
})
```

### 3. Schema 协议

```typescript
import { Schema } from '@formily/json-schema'

const schema = new Schema({
  type: 'object',
  properties: {
    username: {
      type: 'string',
      title: '用户名',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      required: true
    },
    age: {
      type: 'number',
      title: '年龄',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      minimum: 0,
      maximum: 150
    },
    gender: {
      type: 'string',
      title: '性别',
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: [
        { label: '男', value: 'male' },
        { label: '女', value: 'female' }
      ]
    }
  }
})
```

## React 集成

### 基础表单

```tsx
import React from 'react'
import { createForm } from '@formily/core'
import { FormProvider, createSchemaField } from '@formily/react'
import { FormItem, Input, Select, Radio } from '@formily/antd'
import { Form } from 'antd'

const SchemaField = createSchemaField({
  components: {
    FormItem,
    Input,
    Select,
    Radio
  }
})

const form = createForm()

const BasicForm = () => {
  return (
    <FormProvider form={form}>
      <Form layout="vertical">
        <SchemaField schema={{
          type: 'object',
          properties: {
            username: {
              type: 'string',
              title: '用户名',
              required: true,
              'x-decorator': 'FormItem',
              'x-component': 'Input'
            },
            email: {
              type: 'string',
              title: '邮箱',
              required: true,
              'x-decorator': 'FormItem',
              'x-component': 'Input'
            },
            role: {
              type: 'string',
              title: '角色',
              'x-decorator': 'FormItem',
              'x-component': 'Select',
              enum: [
                { label: '管理员', value: 'admin' },
                { label: '普通用户', value: 'user' }
              ]
            }
          }
        }} />
      </Form>
    </FormProvider>
  )
}
```

### 复杂表单

```tsx
const ComplexForm = () => {
  return (
    <FormProvider form={form}>
      <Form layout="vertical">
        <SchemaField schema={{
          type: 'object',
          properties: {
            // 基础信息
            baseInfo: {
              type: 'void',
              title: '基础信息',
              'x-component': 'Card',
              properties: {
                username: {
                  type: 'string',
                  title: '用户名',
                  required: true,
                  'x-decorator': 'FormItem',
                  'x-component': 'Input'
                },
                password: {
                  type: 'string',
                  title: '密码',
                  required: true,
                  'x-decorator': 'FormItem',
                  'x-component': 'Input.Password'
                }
              }
            },

            // 扩展信息
            extendInfo: {
              type: 'void',
              title: '扩展信息',
              'x-component': 'Card',
              properties: {
                // 联动字段
                hasPhone: {
                  type: 'boolean',
                  title: '是否填写手机号',
                  'x-decorator': 'FormItem',
                  'x-component': 'Radio.Group',
                  enum: [
                    { label: '是', value: true },
                    { label: '否', value: false }
                  ],
                  default: false
                },
                phone: {
                  type: 'string',
                  title: '手机号',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-reactions': {
                    dependencies: ['hasPhone'],
                    when: '{{$deps[0] === true}}',
                    fulfill: {
                      schema: {
                        visible: true,
                        required: true
                      }
                    },
                    otherwise: {
                      schema: {
                        visible: false,
                        required: false
                      }
                    }
                  }
                },

                // 数组字段
                skills: {
                  type: 'array',
                  title: '技能列表',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayCards',
                  items: {
                    type: 'void',
                    'x-component': 'ArrayCards.Item',
                    properties: {
                      index: {
                        type: 'void',
                        'x-component': 'ArrayCards.Index'
                      },
                      skillName: {
                        type: 'string',
                        title: '技能名称',
                        'x-decorator': 'FormItem',
                        'x-component': 'Input'
                      },
                      level: {
                        type: 'number',
                        title: '熟练度',
                        'x-decorator': 'FormItem',
                        'x-component': 'Slider',
                        minimum: 1,
                        maximum: 5
                      },
                      remove: {
                        type: 'void',
                        'x-component': 'ArrayCards.Remove'
                      }
                    }
                  },
                  properties: {
                    add: {
                      type: 'void',
                      'x-component': 'ArrayCards.Addition',
                      title: '添加技能'
                    }
                  }
                }
              }
            }
          }
        }} />
      </Form>
    </FormProvider>
  )
}
```

## Vue 集成

### 基础表单

```vue
<template>
  <FormProvider :form="form">
    <ElForm label-width="100px">
      <SchemaField :schema="schema" />
    </ElForm>
  </FormProvider>
</template>

<script>
import { createForm } from '@formily/core'
import { createSchemaField } from '@formily/vue'
import { FormProvider } from '@formily/vue'
import { FormItem, Input, Select } from '@formily/element'

const SchemaField = createSchemaField({
  components: {
    FormItem,
    Input,
    Select
  }
})

export default {
  components: { FormProvider, SchemaField },
  data() {
    return {
      form: createForm(),
      schema: {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            title: '用户名',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input'
          },
          role: {
            type: 'string',
            title: '角色',
            'x-decorator': 'FormItem',
            'x-component': 'Select',
            enum: [
              { label: '管理员', value: 'admin' },
              { label: '用户', value: 'user' }
            ]
          }
        }
      }
    }
  }
}
</script>
```

## 表单联动

### 条件显示

```typescript
const schema = {
  type: 'object',
  properties: {
    userType: {
      type: 'string',
      title: '用户类型',
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: [
        { label: '个人', value: 'personal' },
        { label: '企业', value: 'company' }
      ],
      default: 'personal'
    },
    // 根据 userType 显示不同字段
    companyName: {
      type: 'string',
      title: '公司名称',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-reactions': {
        dependencies: ['userType'],
        when: '{{$deps[0] === "company"}}',
        fulfill: {
          schema: {
            visible: true,
            required: true
          }
        },
        otherwise: {
          schema: {
            visible: false,
            required: false
          }
        }
      }
    }
  }
}
```

### 值联动

```typescript
const schema = {
  type: 'object',
  properties: {
    province: {
      type: 'string',
      title: '省份',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      enum: [
        { label: '广东', value: 'guangdong' },
        { label: '北京', value: 'beijing' }
      ]
    },
    city: {
      type: 'string',
      title: '城市',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': {
        dependencies: ['province'],
        fulfill: {
          state: {
            dataSource: '{{getCityList($deps[0])}}'
          }
        }
      }
    }
  }
}

// 获取城市列表
function getCityList(province) {
  const cityMap = {
    guangdong: [
      { label: '广州', value: 'guangzhou' },
      { label: '深圳', value: 'shenzhen' }
    ],
    beijing: [
      { label: '北京', value: 'beijing' }
    ]
  }
  return cityMap[province] || []
}
```

### 值计算

```typescript
const schema = {
  type: 'object',
  properties: {
    price: {
      type: 'number',
      title: '单价',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 0
    },
    quantity: {
      type: 'number',
      title: '数量',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 1
    },
    total: {
      type: 'number',
      title: '总价',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-read-pretty': true,
      'x-reactions': {
        dependencies: ['price', 'quantity'],
        fulfill: {
          value: '{{$deps[0] * $deps[1]}}'
        }
      }
    }
  }
}
```

## 表单验证

### 基础验证

```typescript
const schema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      title: '用户名',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      validator: {
        min: 3,
        max: 20,
        pattern: /^[a-zA-Z0-9_]+$/,
        format: 'username'
      },
      'x-validator': [
        {
          validator: (value) => {
            return value.length >= 3 && value.length <= 20
          },
          message: '用户名长度必须在 3-20 之间'
        },
        {
          validator: (value) => {
            return /^[a-zA-Z0-9_]+$/.test(value)
          },
          message: '用户名只能包含字母、数字和下划线'
        }
      ]
    },
    email: {
      type: 'string',
      title: '邮箱',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      format: 'email'
    },
    age: {
      type: 'number',
      title: '年龄',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      minimum: 0,
      maximum: 150
    }
  }
}
```

### 异步验证

```typescript
const schema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      title: '用户名',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-validator': {
        validator: async (value) => {
          const response = await fetch(`/api/check-username?username=${value}`)
          const result = await response.json()
          return result.available
        },
        message: '用户名已被占用'
      }
    }
  }
}
```

## 表单提交

```typescript
import { createForm } from '@formily/core'

const form = createForm({
  validateFirst: true, // 验证通过后才提交
  onSubmit: async (values) => {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      
      if (!response.ok) {
        throw new Error('提交失败')
      }
      
      return await response.json()
    } catch (error) {
      form.setFeedback({
        type: 'error',
        messages: [error.message]
      })
      throw error
    }
  }
})

// 提交表单
const handleSubmit = async () => {
  await form.submit(
    (values) => {
      console.log('提交成功:', values)
    },
    (errors) => {
      console.log('验证失败:', errors)
    }
  )
}
```

## 性能优化

### 字段懒加载

```typescript
const form = createForm({
  effects: (form) => {
    // 懒加载字段
    form.onFieldInit('heavyField', (field) => {
      // 只在需要时初始化
      if (field.value !== undefined) {
        field.dataSource = loadHeavyData()
      }
    })
  }
})
```

### 虚拟滚动

```tsx
const LargeSelect = () => {
  return (
    <SchemaField schema={{
      type: 'string',
      title: '选择项',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        virtual: true, // 启用虚拟滚动
        itemHeight: 32,
        height: 400
      },
      enum: generateLargeList(10000) // 10000 条数据
    }} />
  )
}
```

## 总结

| 特性 | 说明 |
|------|------|
| 协议驱动 | 使用 JSON Schema 定义表单结构 |
| 框架适配 | 支持 React、Vue |
| 组件库 | 支持 Ant Design、Element UI 等 |
| 表单联动 | 条件显示、值联动、值计算 |
| 表单验证 | 基础验证、异步验证、自定义验证 |
| 性能优化 | 虚拟滚动、懒加载、按需渲染 |