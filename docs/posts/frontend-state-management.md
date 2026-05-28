---
title: 前端状态管理架构
date: 2024-05-10
---

# 前端状态管理架构

## 状态管理模式对比

### 模式对比表

| 模式 | 适用场景 | 复杂度 | 代表方案 |
|------|----------|--------|----------|
| 单一数据源 | 中小项目 | 低 | Vuex, Redux |
| 分片状态 | 大型项目 | 中 | Pinia, Zustand |
| 原子状态 | 复杂交互 | 高 | Jotai, Recoil |
| 服务端状态 | 数据驱动 | 中 | React Query, SWR |

## 单一数据源模式

### Vuex 架构

```javascript
// store/index.js
import { createStore } from 'vuex'

export default createStore({
  state: {
    count: 0,
    user: null
  },
  
  getters: {
    doubleCount: state => state.count * 2,
    isLoggedIn: state => !!state.user
  },
  
  mutations: {
    SET_COUNT(state, payload) {
      state.count = payload
    },
    
    SET_USER(state, payload) {
      state.user = payload
    }
  },
  
  actions: {
    async fetchUser({ commit }) {
      const user = await api.getUser()
      commit('SET_USER', user)
    },
    
    increment({ commit }) {
      commit('SET_COUNT', state.count + 1)
    }
  },
  
  modules: {
    cart: cartModule,
    products: productsModule
  }
})
```

### Redux 架构

```javascript
// store/index.js
import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

const counterReducer = (state = 0, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1
    case 'DECREMENT':
      return state - 1
    default:
      return state
  }
}

const rootReducer = combineReducers({
  counter: counterReducer,
  user: userReducer
})

const store = createStore(rootReducer, applyMiddleware(thunk))

export default store
```

## 分片状态模式

### Pinia 实现

```javascript
// stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null,
    token: null,
    permissions: []
  }),
  
  getters: {
    isLoggedIn: state => !!state.token,
    hasPermission: (state) => (permission) => 
      state.permissions.includes(permission)
  },
  
  actions: {
    async login(credentials) {
      const response = await api.login(credentials)
      this.token = response.token
      this.profile = response.user
      this.permissions = response.permissions
    },
    
    async logout() {
      await api.logout()
      this.$reset()
    }
  },
  
  persist: {
    storage: localStorage,
    paths: ['token', 'profile']
  }
})
```

### Zustand 实现

```javascript
// store/index.js
import { create } from 'zustand'

const useStore = create((set, get) => ({
  count: 0,
  
  increment: () => set(state => ({ count: state.count + 1 })),
  decrement: () => set(state => ({ count: state.count - 1 })),
  
  // 基于状态的计算
  doubleCount: () => get().count * 2,
  
  // 异步操作
  fetchData: async () => {
    const data = await api.fetch()
    set({ data })
  }
}))

export default useStore
```

## 原子状态模式

### Jotai 实现

```javascript
// atoms/index.js
import { atom } from 'jotai'

// 基础原子
const countAtom = atom(0)
const nameAtom = atom('芝麻粒')

// 派生原子
const doubleCountAtom = atom((get) => get(countAtom) * 2)

// 异步原子
const userAtom = atom(async () => {
  const response = await fetch('/api/user')
  return response.json()
})

// 可写原子
const editableNameAtom = atom(
  (get) => get(nameAtom),
  (get, set, newValue) => {
    set(nameAtom, newValue)
    // 同步到服务端
    api.updateName(newValue)
  }
)

export { countAtom, nameAtom, doubleCountAtom, userAtom, editableNameAtom }
```

### 原子组合

```javascript
// 组合原子
const cartItemsAtom = atom([])
const cartTotalAtom = atom((get) => {
  return get(cartItemsAtom).reduce((total, item) => {
    return total + item.price * item.quantity
  }, 0)
})

// 使用
function CartTotal() {
  const total = useAtom(cartTotalAtom)
  return <div>Total: ${total}</div>
}
```

## 服务端状态管理

### React Query 实现

```javascript
// hooks/useUser.js
import { useQuery, useMutation, useQueryClient } from 'react-query'

const fetchUser = async () => {
  const response = await fetch('/api/user')
  return response.json()
}

export function useUser() {
  return useQuery('user', fetchUser, {
    cacheTime: 5 * 60 * 1000, // 5分钟缓存
    staleTime: 60 * 1000,      // 1分钟后过期
    retry: 3,                  // 重试3次
    refetchOnWindowFocus: true
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation(updateUser, {
    onSuccess: () => {
      // 使 user 查询失效
      queryClient.invalidateQueries('user')
    },
    
    onError: (error) => {
      console.error('Update failed:', error)
    }
  })
}
```

### SWR 实现

```javascript
// hooks/useArticles.js
import useSWR from 'swr'

const fetcher = (url) => fetch(url).then(res => res.json())

export function useArticles() {
  const { data, error, mutate } = useSWR('/api/articles', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 30000 // 每30秒刷新
  })
  
  return {
    articles: data,
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}
```

## 状态管理最佳实践

### 状态分类

```javascript
// 状态分类原则
const stateCategories = {
  // 1. 服务端状态 - 从 API 获取的数据
  server: ['user', 'articles', 'products'],
  
  // 2. UI 状态 - 组件交互状态
  ui: ['isModalOpen', 'activeTab', 'scrollPosition'],
  
  // 3. 应用状态 - 全局配置
  app: ['theme', 'locale', 'isOnline'],
  
  // 4. 路由状态 - URL 参数
  route: ['params', 'query']
}
```

### 性能优化

```javascript
// 选择器优化
const selectors = {
  // 避免不必要的重新计算
  selectUser: createSelector(
    state => state.user,
    user => ({
      name: user.name,
      email: user.email
    })
  ),
  
  // 记忆化计算
  selectFilteredItems: createSelector(
    state => state.items,
    state => state.filter,
    (items, filter) => items.filter(item => item.category === filter)
  )
}
```

### 持久化策略

```javascript
// 持久化配置
const persistConfig = {
  key: 'app-state',
  storage: localStorage,
  
  // 白名单
  whitelist: ['user', 'theme'],
  
  // 序列化/反序列化
  serialize: (state) => JSON.stringify(state),
  deserialize: (state) => JSON.parse(state),
  
  // 加密敏感数据
  encrypt: (data) => encryptData(data, secretKey),
  decrypt: (data) => decryptData(data, secretKey)
}
```

## 架构选择指南

```
项目规模 → 推荐方案
─────────────────────
小型项目   → 组件状态 + Context
中型项目   → Pinia/Zustand
大型项目   → Redux + 分片
数据密集   → React Query/SWR
复杂交互   → Jotai/Recoil
```

## 总结

| 维度 | 单一数据源 | 分片状态 | 原子状态 | 服务端状态 |
|------|----------|----------|----------|------------|
| 复杂度 | 低 | 中 | 高 | 中 |
| 可扩展性 | 中 | 高 | 高 | 高 |
| 学习曲线 | 低 | 中 | 高 | 中 |
| 适用场景 | 中小项目 | 大型项目 | 复杂交互 | 数据驱动 |
