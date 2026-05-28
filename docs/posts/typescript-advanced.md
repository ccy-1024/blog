---
title: TypeScript 高级类型实战
date: 2024-04-10
---

# TypeScript 高级类型实战

## 泛型

### 基础泛型

```typescript
// 泛型函数
function identity<T>(arg: T): T {
  return arg
}

// 使用
const num = identity<number>(42)
const str = identity<string>('hello')
const arr = identity<number[]>([1, 2, 3])
```

### 泛型接口

```typescript
interface Container<T> {
  value: T
  getValue(): T
}

class Box<T> implements Container<T> {
  constructor(public value: T) {}
  
  getValue(): T {
    return this.value
  }
}

const numberBox = new Box<number>(42)
const stringBox = new Box<string>('hello')
```

### 泛型约束

```typescript
interface Lengthwise {
  length: number
}

function logLength<T extends Lengthwise>(arg: T): T {
  console.log(arg.length)
  return arg
}

logLength('hello')    // ✅
logLength([1, 2, 3])  // ✅
logLength({ length: 10 })  // ✅
logLength(42)         // ❌ 数字没有 length 属性
```

## 条件类型

### 基础条件类型

```typescript
type IsString<T> = T extends string ? true : false

type A = IsString<string>  // true
type B = IsString<number>  // false
type C = IsString<any>     // boolean
```

### 推断类型

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never

function fn() {
  return 'hello'
}

type FnReturn = ReturnType<typeof fn>  // string
```

### 分布式条件类型

```typescript
type Flatten<T> = T extends any[] ? T[number] : T

type A = Flatten<string[]>      // string
type B = Flatten<number>        // number
type C = Flatten<string[] | number>  // string | number
```

## 映射类型

### 只读映射

```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}

interface Person {
  name: string
  age: number
}

type ReadonlyPerson = Readonly<Person>
// { readonly name: string; readonly age: number }
```

### 可选映射

```typescript
type Partial<T> = {
  [P in keyof T]?: T[P]
}

type PartialPerson = Partial<Person>
// { name?: string; age?: number }
```

### 自定义映射

```typescript
type Nullable<T> = {
  [P in keyof T]: T[P] | null
}

type NullablePerson = Nullable<Person>
// { name: string | null; age: number | null }
```

## 模板字面量类型

### 基础用法

```typescript
type Color = 'red' | 'green' | 'blue'
type Size = 'small' | 'medium' | 'large'

type ColorSize = `${Color}-${Size}`
// 'red-small' | 'red-medium' | 'red-large' | ...
```

### 内置字符串操作类型

```typescript
type Uppercase<T extends string> = T extends `${infer F}${infer R}` 
  ? `${Uppercase<F>}${R}` 
  : T

type Lowercase<T extends string> = T extends `${infer F}${infer R}` 
  ? `${Lowercase<F>}${R}` 
  : T

type Capitalize<T extends string> = T extends `${infer F}${infer R}` 
  ? `${Uppercase<F>}${R}` 
  : T

type Uncapitalize<T extends string> = T extends `${infer F}${infer R}` 
  ? `${Lowercase<F>}${R}` 
  : T

type A = Uppercase<'hello'>     // 'HELLO'
type B = Capitalize<'hello'>    // 'Hello'
type C = Lowercase<'HELLO'>     // 'hello'
```

## 类型体操

### 深度只读

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object 
    ? DeepReadonly<T[P]> 
    : T[P]
}

interface Nested {
  user: {
    name: string
    address: {
      city: string
    }
  }
}

type ReadonlyNested = DeepReadonly<Nested>
```

### 获取对象的值类型

```typescript
type ValueOf<T> = T[keyof T]

interface Person {
  name: string
  age: number
}

type PersonValues = ValueOf<Person>  // string | number
```

### 排除类型

```typescript
type Exclude<T, U> = T extends U ? never : T

type A = Exclude<string | number | boolean, string>  // number | boolean
```

### 提取类型

```typescript
type Extract<T, U> = T extends U ? T : never

type A = Extract<string | number | boolean, string>  // string
```

## 类型守卫

### typeof 类型守卫

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function processValue(value: unknown) {
  if (isString(value)) {
    console.log(value.length)  // ✅ value 被推断为 string
  }
}
```

### instanceof 类型守卫

```typescript
class Dog {
  bark() { console.log('Woof!') }
}

class Cat {
  meow() { console.log('Meow!') }
}

function speak(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark()  // ✅ animal 被推断为 Dog
  } else {
    animal.meow()  // ✅ animal 被推断为 Cat
  }
}
```

### 自定义类型守卫

```typescript
interface Bird {
  fly(): void
  layEggs(): void
}

interface Fish {
  swim(): void
  layEggs(): void
}

function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined
}

function move(pet: Fish | Bird) {
  if (isFish(pet)) {
    pet.swim()  // ✅ pet 被推断为 Fish
  } else {
    pet.fly()   // ✅ pet 被推断为 Bird
  }
}
```

## 实用类型总结

| 类型 | 作用 |
|------|------|
| `Partial<T>` | 将所有属性变为可选 |
| `Required<T>` | 将所有属性变为必填 |
| `Readonly<T>` | 将所有属性变为只读 |
| `Record<K, T>` | 创建对象类型 |
| `Pick<T, K>` | 选择指定属性 |
| `Omit<T, K>` | 排除指定属性 |
| `Exclude<T, U>` | 排除类型 |
| `Extract<T, U>` | 提取类型 |
| `ReturnType<T>` | 获取函数返回类型 |
| `Parameters<T>` | 获取函数参数类型 |
