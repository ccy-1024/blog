---
title: NestJS 架构设计
date: 2024-07-01
---

# NestJS 架构设计

## NestJS 架构

```
┌─────────────────────────────────────────────────────────┐
│                    NestJS 架构                         │
├─────────────────────────────────────────────────────────┤
│                    Controller                          │
│                         │                              │
│                         ▼                              │
│                    Service                             │
│                         │                              │
│                         ▼                              │
│                    Repository                          │
│                         │                              │
│                         ▼                              │
│                       Database                         │
└─────────────────────────────────────────────────────────┘
```

## 模块系统

```typescript
// app.module.ts
import { Module } from '@nestjs/common'
import { UserModule } from './user/user.module'
import { AuthModule } from './auth/auth.module'

@Module({
  imports: [UserModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

// user.module.ts
import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
```

## Controller

```typescript
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto)
  }

  @Get()
  findAll() {
    return this.userService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id)
  }
}
```

## Service

```typescript
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './user.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto) {
    const user = this.userRepository.create(createUserDto)
    return this.userRepository.save(user)
  }

  findAll() {
    return this.userRepository.find()
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOneBy({ id })
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }
    
    return user
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id)
    Object.assign(user, updateUserDto)
    return this.userRepository.save(user)
  }

  async remove(id: number) {
    const user = await this.findOne(id)
    return this.userRepository.remove(user)
  }
}
```

## Provider

```typescript
import { Injectable } from '@nestjs/common'

@Injectable()
export class LoggerService {
  log(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`)
  }

  error(message: string, trace: string) {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, trace)
  }

  warn(message: string) {
    console.warn(`[${new Date().toISOString()}] WARN: ${message}`)
  }
}
```

## 依赖注入

```typescript
// 构造函数注入
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
}

// 属性注入
@Controller()
export class AppController {
  @Inject(AppService)
  private readonly appService: AppService
}

// 自定义提供者
const connectionProvider = {
  provide: 'DATABASE_CONNECTION',
  useFactory: async () => {
    const connection = await createConnection({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'example'
    })
    return connection
  }
}

@Module({
  providers: [connectionProvider],
})
export class DatabaseModule {}
```

## 中间件

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`Request... ${req.method} ${req.path}`)
    next()
  }
}

// 应用中间件
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('users')
  }
}
```

## 守卫

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Observable } from 'rxjs'

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest()
    return this.validateRequest(request)
  }

  private validateRequest(request: any): boolean {
    // 验证逻辑
    return !!request.user
  }
}

// 使用守卫
@Controller('users')
@UseGuards(AuthGuard)
export class UserController {}
```

## 拦截器

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('Before...')

    const now = Date.now()
    return next
      .handle()
      .pipe(
        tap(() => console.log(`After... ${Date.now() - now}ms`)),
      )
  }
}

// 使用拦截器
@Controller('users')
@UseInterceptors(LoggingInterceptor)
export class UserController {}
```

## 管道

```typescript
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common'

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10)
    
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed')
    }
    
    return val
  }
}

// 使用管道
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.userService.findOne(id)
}
```

## 异常过滤器

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common'
import { Request, Response } from 'express'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const status = exception.getStatus()

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      })
  }
}

// 使用过滤器
@Controller('users')
@UseFilters(HttpExceptionFilter)
export class UserController {}
```

## 总结

| 组件 | 作用 |
|------|------|
| Module | 组织代码，管理依赖 |
| Controller | 处理 HTTP 请求 |
| Service | 业务逻辑处理 |
| Provider | 可注入的服务 |
| Middleware | 请求预处理 |
| Guard | 权限控制 |
| Interceptor | 请求/响应拦截 |
| Pipe | 参数验证和转换 |
| Filter | 异常处理 |
